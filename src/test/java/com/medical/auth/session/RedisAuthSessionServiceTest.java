package com.medical.auth.session;

import com.medical.common.constant.RedisKeyConstant;
import com.medical.common.utils.RedisUtils;
import com.medical.service.SseService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RedisAuthSessionServiceTest {

    @Test
    void replaceSessionRevokesCurrentTokenAndStoresBothBindings() {
        RedisUtils redisUtils = mock(RedisUtils.class);
        when(redisUtils.tryLock(anyString(), anyString(), anyLong())).thenReturn(true);
        when(redisUtils.get(RedisKeyConstant.buildUserSessionKey(7L), String.class))
                .thenReturn("old-token-id");
        RedisAuthSessionService service = service(redisUtils);

        String tokenId = service.replaceSession(7L, "doctor01", "jwt-value", "127.0.0.1");

        assertNotNull(tokenId);
        verify(redisUtils).delete(RedisKeyConstant.buildTokenKey("old-token-id"));
        verify(redisUtils).delete(RedisKeyConstant.buildUserSessionKey(7L));
        verify(redisUtils).setWithSeconds(
                eq(RedisKeyConstant.buildUserSessionKey(7L)),
                eq(tokenId),
                eq(RedisKeyConstant.TOKEN_TTL));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> tokenInfoCaptor = ArgumentCaptor.forClass(Map.class);
        verify(redisUtils).setWithSeconds(
                eq(RedisKeyConstant.buildTokenKey(tokenId)),
                tokenInfoCaptor.capture(),
                eq(RedisKeyConstant.TOKEN_TTL));
        Map<String, Object> tokenInfo = tokenInfoCaptor.getValue();
        assertTrue(7L == ((Number) tokenInfo.get("userId")).longValue());
        assertTrue("jwt-value".equals(tokenInfo.get("token")));
        verify(redisUtils).unlock(
                eq(RedisKeyConstant.buildUserSessionLockKey(7L)), anyString());
    }

    @Test
    void validateSessionRequiresCurrentTokenIdStoredUserAndExactJwt() {
        RedisUtils redisUtils = mock(RedisUtils.class);
        RedisAuthSessionService service = service(redisUtils);
        String tokenId = "current-token-id";
        Map<String, Object> tokenInfo = new HashMap<>();
        tokenInfo.put("userId", 7L);
        tokenInfo.put("token", "jwt-value");

        when(redisUtils.get(RedisKeyConstant.buildUserSessionKey(7L), String.class))
                .thenReturn(tokenId);
        when(redisUtils.get(RedisKeyConstant.buildTokenKey(tokenId))).thenReturn(tokenInfo);

        assertTrue(service.validateSession(7L, tokenId, "jwt-value"));
        assertFalse(service.validateSession(7L, "stale-token-id", "jwt-value"));
        assertFalse(service.validateSession(7L, tokenId, "different-jwt"));
        assertFalse(service.validateSession(8L, tokenId, "jwt-value"));
    }

    @Test
    void revokeSessionDoesNotDeleteAnotherUsersToken() {
        RedisUtils redisUtils = mock(RedisUtils.class);
        RedisAuthSessionService service = service(redisUtils);
        Map<String, Object> tokenInfo = new HashMap<>();
        tokenInfo.put("userId", 8L);
        when(redisUtils.get(RedisKeyConstant.buildTokenKey("token-id"))).thenReturn(tokenInfo);

        service.revokeSession(7L, "token-id");

        verify(redisUtils, never()).delete(RedisKeyConstant.buildTokenKey("token-id"));
        verify(redisUtils, never()).delete(RedisKeyConstant.buildUserSessionKey(7L));
    }

    @Test
    void revokeAllSessionsUsesSamePerUserLockAsLoginReplacement() {
        RedisUtils redisUtils = mock(RedisUtils.class);
        when(redisUtils.tryLock(anyString(), anyString(), anyLong())).thenReturn(true);
        when(redisUtils.get(RedisKeyConstant.buildUserSessionKey(7L), String.class))
                .thenReturn("current-token-id");
        SseService sseService = mock(SseService.class);
        RedisAuthSessionService service = new RedisAuthSessionService(redisUtils, sseService);

        service.revokeAllSessions(7L);

        verify(redisUtils).delete(RedisKeyConstant.buildTokenKey("current-token-id"));
        verify(redisUtils).delete(RedisKeyConstant.buildUserSessionKey(7L));
        verify(redisUtils).unlock(
                eq(RedisKeyConstant.buildUserSessionLockKey(7L)), anyString());
        verify(sseService).removeConnection(7L);
    }

    private RedisAuthSessionService service(RedisUtils redisUtils) {
        return new RedisAuthSessionService(redisUtils, mock(SseService.class));
    }
}
