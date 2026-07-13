package com.medical.assistant.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.assistant.config.KimiAssistantProperties;
import com.medical.assistant.dto.AssistantActionResponse;
import com.medical.common.exception.BusinessException;
import com.medical.common.utils.RedisUtils;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

@Service
public class AssistantApprovalService {

    private static final String TOKEN_PREFIX = "assistant:approval:token:";
    private static final String RESULT_PREFIX = "assistant:approval:result:";
    private static final String LOCK_PREFIX = "assistant:approval:lock:";

    private final RedisUtils redisUtils;
    private final ObjectMapper objectMapper;
    private final AssistantActionAuditService auditService;
    private final int ttlSeconds;
    private final Map<String, String> fallbackTokens = new ConcurrentHashMap<>();
    private final Map<String, String> fallbackResults = new ConcurrentHashMap<>();

    public AssistantApprovalService(RedisUtils redisUtils,
                                    ObjectMapper objectMapper,
                                    AssistantActionAuditService auditService,
                                    KimiAssistantProperties properties) {
        this.redisUtils = redisUtils;
        this.objectMapper = objectMapper;
        this.auditService = auditService;
        this.ttlSeconds = Math.max(60, properties.getApprovalTtlSeconds());
    }

    public ApprovalRequest issue(String tool,
                                 String argumentsJson,
                                 String summary,
                                 AssistantExecutionContext context) {
        String token = UUID.randomUUID().toString();
        PendingAction action = new PendingAction();
        action.actionId = UUID.randomUUID().toString();
        action.tool = tool;
        action.argumentsJson = argumentsJson;
        action.summary = summary;
        action.userId = context.userId();
        action.role = context.role();
        action.conversationId = context.conversationId();
        action.expiresAtEpochSecond = Instant.now().getEpochSecond() + ttlSeconds;
        String json = writeJson(action);
        fallbackTokens.put(token, json);
        try {
            redisUtils.setWithSeconds(TOKEN_PREFIX + token, json, ttlSeconds);
        } catch (Exception ignored) {
        }
        return new ApprovalRequest(token, action.actionId, tool, summary, ttlSeconds);
    }

    public AssistantActionResponse consume(String token,
                                           Long userId,
                                           Integer role,
                                           Function<PendingAction, Object> executor) {
        if (token == null || token.isBlank()) {
            throw new BusinessException(400, "确认令牌不能为空");
        }
        CompletedAction completed = readCompleted(token);
        if (completed != null) {
            requireOwner(completed.userId, completed.role, userId, role);
            return new AssistantActionResponse(completed.actionId, completed.tool, completed.result, true);
        }

        String lockRequestId = UUID.randomUUID().toString();
        boolean locked = tryLock(token, lockRequestId);
        if (!locked) {
            throw new BusinessException(409, "该操作正在确认中，请勿重复提交");
        }
        try {
            completed = readCompleted(token);
            if (completed != null) {
                requireOwner(completed.userId, completed.role, userId, role);
                return new AssistantActionResponse(completed.actionId, completed.tool, completed.result, true);
            }
            PendingAction action = readPending(token);
            if (action == null || action.expiresAtEpochSecond < Instant.now().getEpochSecond()) {
                deletePending(token);
                throw new BusinessException(410, "确认令牌不存在或已过期");
            }
            requireOwner(action.userId, action.role, userId, role);

            deletePending(token);
            long start = System.currentTimeMillis();
            try {
                Object result = executor.apply(action);
                CompletedAction record = new CompletedAction();
                record.actionId = action.actionId;
                record.tool = action.tool;
                record.userId = action.userId;
                record.role = action.role;
                record.result = result;
                storeCompleted(token, record);
                auditService.record(action, result, null, System.currentTimeMillis() - start);
                return new AssistantActionResponse(action.actionId, action.tool, result, false);
            } catch (RuntimeException exception) {
                auditService.record(action, null, exception, System.currentTimeMillis() - start);
                throw exception;
            }
        } finally {
            unlock(token, lockRequestId);
        }
    }

    public void cancel(String token, Long userId, Integer role) {
        PendingAction action = readPending(token);
        if (action == null) {
            throw new BusinessException(410, "确认令牌不存在或已过期");
        }
        requireOwner(action.userId, action.role, userId, role);
        deletePending(token);
    }

    private PendingAction readPending(String token) {
        String json = readString(TOKEN_PREFIX + token, fallbackTokens.get(token));
        return json == null ? null : readJson(json, PendingAction.class);
    }

    private CompletedAction readCompleted(String token) {
        String json = readString(RESULT_PREFIX + token, fallbackResults.get(token));
        return json == null ? null : readJson(json, CompletedAction.class);
    }

    private void storeCompleted(String token, CompletedAction record) {
        String json = writeJson(record);
        fallbackResults.put(token, json);
        try {
            redisUtils.setWithSeconds(RESULT_PREFIX + token, json, 86400);
        } catch (Exception ignored) {
        }
    }

    private String readString(String key, String fallbackValue) {
        try {
            Object value = redisUtils.get(key);
            if (value instanceof String stringValue) {
                return stringValue;
            }
        } catch (Exception ignored) {
        }
        return fallbackValue;
    }

    private void deletePending(String token) {
        fallbackTokens.remove(token);
        try {
            redisUtils.delete(TOKEN_PREFIX + token);
        } catch (Exception ignored) {
        }
    }

    private boolean tryLock(String token, String requestId) {
        try {
            return redisUtils.tryLock(LOCK_PREFIX + token, requestId, 30);
        } catch (Exception ignored) {
            return true;
        }
    }

    private void unlock(String token, String requestId) {
        try {
            redisUtils.unlock(LOCK_PREFIX + token, requestId);
        } catch (Exception ignored) {
        }
    }

    private void requireOwner(Long expectedUserId,
                              Integer expectedRole,
                              Long actualUserId,
                              Integer actualRole) {
        if (actualUserId == null || actualRole == null
                || !actualUserId.equals(expectedUserId)
                || !actualRole.equals(expectedRole)) {
            throw new BusinessException(403, "无权确认其他用户发起的操作");
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            throw new BusinessException(500, "无法保存待确认操作");
        }
    }

    private <T> T readJson(String json, Class<T> type) {
        try {
            return objectMapper.readValue(json, type);
        } catch (Exception exception) {
            throw new BusinessException(500, "待确认操作数据损坏");
        }
    }

    public record ApprovalRequest(String token,
                                  String actionId,
                                  String tool,
                                  String summary,
                                  int expiresInSeconds) {
    }

    public static class PendingAction {
        public String actionId;
        public String tool;
        public String argumentsJson;
        public String summary;
        public Long userId;
        public Integer role;
        public String conversationId;
        public long expiresAtEpochSecond;
    }

    public static class CompletedAction {
        public String actionId;
        public String tool;
        public Long userId;
        public Integer role;
        public Object result;
    }
}
