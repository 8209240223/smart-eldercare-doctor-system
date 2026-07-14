package com.medical.auth.session;

import com.medical.common.constant.RedisKeyConstant;
import com.medical.common.exception.BusinessException;
import com.medical.common.utils.RedisUtils;
import com.medical.service.SseService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class RedisAuthSessionService implements AuthSessionService {

    private static final long SESSION_LOCK_TTL_SECONDS = 5L;

    private final RedisUtils redisUtils;
    private final SseService sseService;

    public RedisAuthSessionService(RedisUtils redisUtils, SseService sseService) {
        this.redisUtils = redisUtils;
        this.sseService = sseService;
    }

    @Override
    public String replaceSession(Long userId, String username, String token, String loginIp) {
        if (userId == null || !StringUtils.hasText(token)) {
            throw new BusinessException(400, "会话信息不完整");
        }

        String lockKey = RedisKeyConstant.buildUserSessionLockKey(userId);
        String lockId = UUID.randomUUID().toString();
        if (!redisUtils.tryLock(lockKey, lockId, SESSION_LOCK_TTL_SECONDS)) {
            throw new BusinessException(503, "账号正在登录，请稍后重试");
        }

        try {
            sseService.notifySessionReplaced(userId);
            revokeAllSessionsWithoutLock(userId);

            String tokenId = UUID.randomUUID().toString().replace("-", "");
            Map<String, Object> tokenInfo = new HashMap<>();
            tokenInfo.put("userId", userId);
            tokenInfo.put("username", username);
            tokenInfo.put("token", token);
            tokenInfo.put("tokenId", tokenId);
            tokenInfo.put("loginTime", LocalDateTime.now().toString());
            tokenInfo.put("loginIp", loginIp);

            redisUtils.setWithSeconds(
                    RedisKeyConstant.buildTokenKey(tokenId), tokenInfo, RedisKeyConstant.TOKEN_TTL);
            redisUtils.setWithSeconds(
                    RedisKeyConstant.buildUserSessionKey(userId), tokenId, RedisKeyConstant.TOKEN_TTL);
            return tokenId;
        } finally {
            redisUtils.unlock(lockKey, lockId);
        }
    }

    @Override
    public boolean validateSession(Long userId, String tokenId, String token) {
        if (userId == null || !StringUtils.hasText(tokenId) || !StringUtils.hasText(token)) {
            return false;
        }

        String currentTokenId = redisUtils.get(
                RedisKeyConstant.buildUserSessionKey(userId), String.class);
        if (!tokenId.equals(currentTokenId)) {
            return false;
        }

        Object stored = redisUtils.get(RedisKeyConstant.buildTokenKey(tokenId));
        if (!(stored instanceof Map)) {
            return false;
        }

        Map<?, ?> tokenInfo = (Map<?, ?>) stored;
        Long storedUserId = toLong(tokenInfo.get("userId"));
        Object storedToken = tokenInfo.get("token");
        return userId.equals(storedUserId)
                && storedToken != null
                && token.equals(storedToken.toString());
    }

    @Override
    public boolean isSessionReplaced(Long userId, String tokenId) {
        if (userId == null || !StringUtils.hasText(tokenId)) {
            return false;
        }
        String currentTokenId = redisUtils.get(
                RedisKeyConstant.buildUserSessionKey(userId), String.class);
        return StringUtils.hasText(currentTokenId) && !tokenId.equals(currentTokenId);
    }

    @Override
    public void refreshSession(Long userId, String tokenId) {
        if (userId == null || !StringUtils.hasText(tokenId)) {
            return;
        }
        redisUtils.expire(
                RedisKeyConstant.buildTokenKey(tokenId), RedisKeyConstant.TOKEN_TTL, TimeUnit.SECONDS);
        redisUtils.expire(
                RedisKeyConstant.buildUserSessionKey(userId), RedisKeyConstant.TOKEN_TTL, TimeUnit.SECONDS);
    }

    @Override
    public void revokeSession(Long userId, String tokenId) {
        if (userId == null || !StringUtils.hasText(tokenId)) {
            return;
        }

        Object stored = redisUtils.get(RedisKeyConstant.buildTokenKey(tokenId));
        if (stored instanceof Map) {
            Long storedUserId = toLong(((Map<?, ?>) stored).get("userId"));
            if (!userId.equals(storedUserId)) {
                return;
            }
        }
        redisUtils.delete(RedisKeyConstant.buildTokenKey(tokenId));

        String currentTokenId = redisUtils.get(
                RedisKeyConstant.buildUserSessionKey(userId), String.class);
        if (tokenId.equals(currentTokenId)) {
            redisUtils.delete(RedisKeyConstant.buildUserSessionKey(userId));
            sseService.removeConnection(userId);
        }
    }

    @Override
    public void revokeAllSessions(Long userId) {
        if (userId == null) {
            return;
        }
        String lockKey = RedisKeyConstant.buildUserSessionLockKey(userId);
        String lockId = UUID.randomUUID().toString();
        boolean locked = false;
        for (int attempt = 0; attempt < 20 && !locked; attempt++) {
            locked = redisUtils.tryLock(lockKey, lockId, SESSION_LOCK_TTL_SECONDS);
            if (!locked) {
                try {
                    Thread.sleep(25L);
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    throw new BusinessException(503, "会话撤销被中断，请重试");
                }
            }
        }
        if (!locked) {
            throw new BusinessException(503, "账号会话正在切换，请稍后重试");
        }
        try {
            revokeAllSessionsWithoutLock(userId);
        } finally {
            redisUtils.unlock(lockKey, lockId);
        }
    }

    private void revokeAllSessionsWithoutLock(Long userId) {
        String userSessionKey = RedisKeyConstant.buildUserSessionKey(userId);
        String currentTokenId = redisUtils.get(userSessionKey, String.class);
        if (StringUtils.hasText(currentTokenId)) {
            redisUtils.delete(RedisKeyConstant.buildTokenKey(currentTokenId));
        }
        redisUtils.delete(userSessionKey);
        sseService.removeConnection(userId);
    }

    private Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.valueOf(value.toString());
        } catch (NumberFormatException exception) {
            return null;
        }
    }
}
