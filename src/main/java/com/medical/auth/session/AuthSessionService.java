package com.medical.auth.session;

/**
 * 账号单会话管理服务。
 */
public interface AuthSessionService {

    String replaceSession(Long userId, String username, String token, String loginIp);

    boolean validateSession(Long userId, String tokenId, String token);

    default boolean isSessionReplaced(Long userId, String tokenId) {
        return false;
    }

    void refreshSession(Long userId, String tokenId);

    void revokeSession(Long userId, String tokenId);

    void revokeAllSessions(Long userId);
}
