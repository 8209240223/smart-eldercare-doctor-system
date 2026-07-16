package com.medical.assistant.agent;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.assistant.config.KimiAssistantProperties;
import com.medical.assistant.dto.AssistantHistoryMessage;
import com.medical.common.exception.BusinessException;
import com.medical.common.utils.RedisUtils;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.UserMessage;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
public class AssistantConversationMemoryService {

    private static final int MAX_MESSAGES = 12;
    private static final int MAX_MESSAGE_CHARS = 2000;
    private static final Pattern CONVERSATION_ID_PATTERN = Pattern.compile("[A-Za-z0-9_-]{8,64}");
    private static final String KEY_PREFIX = "assistant:memory:";

    private final RedisUtils redisUtils;
    private final ObjectMapper objectMapper;
    private final int ttlSeconds;
    private final Map<String, List<StoredMessage>> fallback = new ConcurrentHashMap<>();

    public AssistantConversationMemoryService(RedisUtils redisUtils,
                                              ObjectMapper objectMapper,
                                              KimiAssistantProperties properties) {
        this.redisUtils = redisUtils;
        this.objectMapper = objectMapper;
        this.ttlSeconds = Math.max(300, properties.getMemoryTtlSeconds());
    }

    public String resolveConversationId(String requestedId) {
        if (!StringUtils.hasText(requestedId)) {
            return UUID.randomUUID().toString();
        }
        String normalized = requestedId.trim();
        if (!CONVERSATION_ID_PATTERN.matcher(normalized).matches()) {
            throw new BusinessException(400, "会话ID格式不正确");
        }
        return normalized;
    }

    public List<ChatMessage> load(Long userId,
                                  String conversationId,
                                  List<AssistantHistoryMessage> clientHistory) {
        List<StoredMessage> stored = read(key(userId, conversationId));
        if (stored.isEmpty() && clientHistory != null && !clientHistory.isEmpty()) {
            stored = fromClientHistory(clientHistory);
        }
        List<ChatMessage> result = new ArrayList<>();
        for (StoredMessage message : stored) {
            if ("user".equals(message.role)) {
                result.add(UserMessage.from(message.content));
            } else if ("assistant".equals(message.role)) {
                result.add(AiMessage.from(message.content));
            }
        }
        return result;
    }

    public void appendExchange(Long userId, String conversationId, String userText, String assistantText) {
        String key = key(userId, conversationId);
        List<StoredMessage> messages = read(key);
        messages.add(new StoredMessage("user", bound(userText)));
        messages.add(new StoredMessage("assistant", bound(assistantText)));
        if (messages.size() > MAX_MESSAGES) {
            messages = new ArrayList<>(messages.subList(messages.size() - MAX_MESSAGES, messages.size()));
        }
        write(key, messages);
    }

    private List<StoredMessage> fromClientHistory(List<AssistantHistoryMessage> history) {
        List<StoredMessage> result = new ArrayList<>();
        int start = Math.max(0, history.size() - MAX_MESSAGES);
        for (int index = start; index < history.size(); index++) {
            AssistantHistoryMessage item = history.get(index);
            if (item == null || !StringUtils.hasText(item.getRole()) || !StringUtils.hasText(item.getContent())) {
                continue;
            }
            String role = item.getRole().trim();
            if (!"user".equals(role) && !"assistant".equals(role)) {
                continue;
            }
            result.add(new StoredMessage(role, bound(item.getContent())));
        }
        return result;
    }

    private List<StoredMessage> read(String key) {
        try {
            Object raw = redisUtils.get(key);
            if (raw instanceof String json && StringUtils.hasText(json)) {
                return objectMapper.readValue(json, new TypeReference<List<StoredMessage>>() { });
            }
        } catch (Exception ignored) {
        }
        List<StoredMessage> local = fallback.get(key);
        return local == null ? new ArrayList<>() : new ArrayList<>(local);
    }

    private void write(String key, List<StoredMessage> messages) {
        fallback.put(key, new ArrayList<>(messages));
        try {
            redisUtils.setWithSeconds(key, objectMapper.writeValueAsString(messages), ttlSeconds);
        } catch (Exception ignored) {
        }
    }

    private String key(Long userId, String conversationId) {
        return KEY_PREFIX + userId + ":" + conversationId;
    }

    private String bound(String content) {
        String normalized = content == null ? "" : content.trim();
        return normalized.length() <= MAX_MESSAGE_CHARS
                ? normalized
                : normalized.substring(0, MAX_MESSAGE_CHARS);
    }

    public static class StoredMessage {
        public String role;
        public String content;

        public StoredMessage() {
        }

        public StoredMessage(String role, String content) {
            this.role = role;
            this.content = content;
        }
    }
}
