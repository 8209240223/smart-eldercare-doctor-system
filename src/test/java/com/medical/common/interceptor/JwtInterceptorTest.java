package com.medical.common.interceptor;

import com.medical.auth.session.AuthSessionService;
import com.medical.common.utils.JwtUtils;
import com.medical.entity.SysUser;
import com.medical.mapper.SysUserMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

import javax.servlet.DispatcherType;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtInterceptorTest {

    @Test
    void allowsAsyncRedispatchWithoutWritingAnotherAuthenticationResponse() throws Exception {
        AuthSessionService sessionService = mock(AuthSessionService.class);
        JwtInterceptor interceptor = interceptor(
                mock(JwtUtils.class), sessionService, mock(SysUserMapper.class));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setDispatcherType(DispatcherType.ASYNC);

        assertTrue(interceptor.preHandle(request, new MockHttpServletResponse(), new Object()));
        verify(sessionService, never()).validateSession(7L, "token-id", "jwt-value");
    }

    @Test
    void rejectsProtectedRequestWithoutTokenId() throws Exception {
        JwtUtils jwtUtils = mock(JwtUtils.class);
        AuthSessionService sessionService = mock(AuthSessionService.class);
        JwtInterceptor interceptor = interceptor(jwtUtils, sessionService, mock(SysUserMapper.class));
        MockHttpServletRequest request = request("jwt-value", null);
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertFalse(interceptor.preHandle(request, response, new Object()));
        assertTrue(response.getContentAsString().contains("缺少会话标识"));
        verify(sessionService, never()).validateSession(7L, "token-id", "jwt-value");
    }

    @Test
    void validatesAllSessionBindingsAndUsesCurrentDatabaseRole() throws Exception {
        JwtUtils jwtUtils = mock(JwtUtils.class);
        AuthSessionService sessionService = mock(AuthSessionService.class);
        SysUserMapper userMapper = mock(SysUserMapper.class);
        when(jwtUtils.validateToken("jwt-value")).thenReturn(true);
        when(jwtUtils.getUserIdFromToken("jwt-value")).thenReturn(7L);
        when(sessionService.validateSession(7L, "token-id", "jwt-value")).thenReturn(true);
        SysUser user = user(7L, 1, 1);
        user.setUsername("current-admin");
        when(userMapper.selectById(7L)).thenReturn(user);
        JwtInterceptor interceptor = interceptor(jwtUtils, sessionService, userMapper);
        MockHttpServletRequest request = request("jwt-value", "token-id");

        assertTrue(interceptor.preHandle(request, new MockHttpServletResponse(), new Object()));
        assertEquals(7L, request.getAttribute("currentUserId"));
        assertEquals("current-admin", request.getAttribute("currentUsername"));
        assertEquals(1, request.getAttribute("currentUserType"));
        verify(sessionService).refreshSession(7L, "token-id");
    }

    @Test
    void returnsDedicatedErrorWhenAnotherLoginReplacesTheSession() throws Exception {
        JwtUtils jwtUtils = mock(JwtUtils.class);
        AuthSessionService sessionService = mock(AuthSessionService.class);
        when(jwtUtils.validateToken("jwt-value")).thenReturn(true);
        when(jwtUtils.getUserIdFromToken("jwt-value")).thenReturn(7L);
        when(sessionService.validateSession(7L, "old-token-id", "jwt-value")).thenReturn(false);
        when(sessionService.isSessionReplaced(7L, "old-token-id")).thenReturn(true);
        JwtInterceptor interceptor = interceptor(jwtUtils, sessionService, mock(SysUserMapper.class));
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertFalse(interceptor.preHandle(
                request("jwt-value", "old-token-id"), response, new Object()));
        assertTrue(response.getContentAsString().contains("40101"));
        assertTrue(response.getContentAsString().contains("账号已在其他设备登录"));
    }

    @Test
    void rejectsPendingAccountEvenWhenJwtAndRedisSessionAreValid() throws Exception {
        JwtUtils jwtUtils = mock(JwtUtils.class);
        AuthSessionService sessionService = mock(AuthSessionService.class);
        SysUserMapper userMapper = mock(SysUserMapper.class);
        when(jwtUtils.validateToken("jwt-value")).thenReturn(true);
        when(jwtUtils.getUserIdFromToken("jwt-value")).thenReturn(7L);
        when(sessionService.validateSession(7L, "token-id", "jwt-value")).thenReturn(true);
        when(userMapper.selectById(7L)).thenReturn(user(7L, 2, 2));
        JwtInterceptor interceptor = interceptor(jwtUtils, sessionService, userMapper);

        assertFalse(interceptor.preHandle(
                request("jwt-value", "token-id"), new MockHttpServletResponse(), new Object()));
        verify(sessionService).revokeAllSessions(7L);
        verify(sessionService, never()).refreshSession(7L, "token-id");
    }

    private JwtInterceptor interceptor(JwtUtils jwtUtils,
                                       AuthSessionService sessionService,
                                       SysUserMapper userMapper) {
        JwtInterceptor interceptor = new JwtInterceptor();
        ReflectionTestUtils.setField(interceptor, "jwtUtils", jwtUtils);
        ReflectionTestUtils.setField(interceptor, "authSessionService", sessionService);
        ReflectionTestUtils.setField(interceptor, "sysUserMapper", userMapper);
        return interceptor;
    }

    private MockHttpServletRequest request(String token, String tokenId) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        if (tokenId != null) {
            request.addHeader("X-Token-Id", tokenId);
        }
        return request;
    }

    private SysUser user(Long id, Integer status, Integer userType) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setStatus(status);
        user.setUserType(userType);
        user.setDeleted(0);
        return user;
    }
}
