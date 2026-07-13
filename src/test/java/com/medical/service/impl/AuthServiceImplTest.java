package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.medical.auth.session.AuthSessionService;
import com.medical.common.exception.BusinessException;
import com.medical.common.utils.AccountSecurityValidator;
import com.medical.common.utils.JwtUtils;
import com.medical.common.utils.RedisUtils;
import com.medical.entity.SysUser;
import com.medical.mapper.SysOperationLogMapper;
import com.medical.mapper.SysUserMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceImplTest {

    @Test
    void loginReplacesPreviousSessionAndReturnsNewTokenId() {
        Dependencies dependencies = dependencies();
        SysUser user = user(7L, 1, "Oldpass1");
        when(dependencies.userMapper.selectOne(any(Wrapper.class))).thenReturn(user);
        when(dependencies.userMapper.selectById(7L)).thenReturn(user);
        when(dependencies.jwtUtils.generateToken(7L, "doctor01", 2)).thenReturn("jwt-value");
        when(dependencies.sessionService.replaceSession(
                7L, "doctor01", "jwt-value", "127.0.0.1")).thenReturn("new-token-id");

        Map<String, Object> result = dependencies.service.login(
                "doctor01", "Oldpass1", "127.0.0.1");

        assertEquals("jwt-value", result.get("token"));
        assertEquals("new-token-id", result.get("tokenId"));
        verify(dependencies.sessionService).replaceSession(
                7L, "doctor01", "jwt-value", "127.0.0.1");
    }

    @Test
    void pendingAccountCannotLogin() {
        Dependencies dependencies = dependencies();
        when(dependencies.userMapper.selectOne(any(Wrapper.class)))
                .thenReturn(user(7L, 2, "Oldpass1"));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> dependencies.service.login("doctor01", "Oldpass1", "127.0.0.1"));

        assertEquals(403, exception.getCode());
        assertTrue(exception.getMessage().contains("待管理员审核"));
    }

    @Test
    void loginRevokesJustCreatedSessionWhenPasswordChangesConcurrently() {
        Dependencies dependencies = dependencies();
        SysUser original = user(7L, 1, "Oldpass1");
        SysUser changed = user(7L, 1, "Changed9");
        when(dependencies.userMapper.selectOne(any(Wrapper.class))).thenReturn(original);
        when(dependencies.userMapper.selectById(7L)).thenReturn(changed);
        when(dependencies.jwtUtils.generateToken(7L, "doctor01", 2)).thenReturn("jwt-value");
        when(dependencies.sessionService.replaceSession(
                7L, "doctor01", "jwt-value", "127.0.0.1")).thenReturn("new-token-id");

        assertThrows(BusinessException.class,
                () -> dependencies.service.login("doctor01", "Oldpass1", "127.0.0.1"));

        verify(dependencies.sessionService).revokeSession(7L, "new-token-id");
    }

    @Test
    void publicRegistrationCreatesPendingUser() {
        Dependencies dependencies = dependencies();
        when(dependencies.userMapper.selectCount(any(Wrapper.class))).thenReturn(0L);
        when(dependencies.userMapper.insert(any(SysUser.class))).thenReturn(1);

        dependencies.service.register(
                "doctor02", "Strong123", "张医生", "13800138000", 2);

        ArgumentCaptor<SysUser> userCaptor = ArgumentCaptor.forClass(SysUser.class);
        verify(dependencies.userMapper).insert(userCaptor.capture());
        SysUser created = userCaptor.getValue();
        assertEquals(2, created.getStatus());
        assertTrue(AccountSecurityValidator.matchesStoredPassword("Strong123", created.getPassword()));
    }

    @Test
    void passwordChangeAndLogoutRevokeSessions() {
        Dependencies dependencies = dependencies();
        SysUser user = user(7L, 1, "Oldpass1");
        when(dependencies.userMapper.selectById(7L)).thenReturn(user);
        when(dependencies.userMapper.updateById(user)).thenReturn(1);

        dependencies.service.changePassword(7L, "Oldpass1", "Newpass2");
        dependencies.service.logout(7L, "token-id");

        verify(dependencies.sessionService).revokeAllSessions(7L);
        verify(dependencies.sessionService).revokeSession(7L, "token-id");
    }

    @Test
    void publicPasswordResetRevokesExistingSession() {
        Dependencies dependencies = dependencies();
        SysUser user = user(7L, 1, "Oldpass1");
        user.setPhone("13800138000");
        when(dependencies.userMapper.selectOne(any(Wrapper.class))).thenReturn(user);
        when(dependencies.userMapper.updateById(user)).thenReturn(1);

        dependencies.service.resetPassword(
                "doctor01", "13800138000", "Newpass2", "Newpass2");

        verify(dependencies.sessionService).revokeAllSessions(7L);
        assertTrue(AccountSecurityValidator.matchesStoredPassword("Newpass2", user.getPassword()));
    }

    private Dependencies dependencies() {
        Dependencies dependencies = new Dependencies();
        dependencies.service = new AuthServiceImpl();
        dependencies.userMapper = mock(SysUserMapper.class);
        dependencies.operationLogMapper = mock(SysOperationLogMapper.class);
        dependencies.jwtUtils = mock(JwtUtils.class);
        dependencies.redisUtils = mock(RedisUtils.class);
        dependencies.sessionService = mock(AuthSessionService.class);
        ReflectionTestUtils.setField(dependencies.service, "sysUserMapper", dependencies.userMapper);
        ReflectionTestUtils.setField(
                dependencies.service, "operationLogMapper", dependencies.operationLogMapper);
        ReflectionTestUtils.setField(dependencies.service, "jwtUtils", dependencies.jwtUtils);
        ReflectionTestUtils.setField(dependencies.service, "redisUtils", dependencies.redisUtils);
        ReflectionTestUtils.setField(
                dependencies.service, "authSessionService", dependencies.sessionService);
        return dependencies;
    }

    private SysUser user(Long id, Integer status, String password) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setUsername("doctor01");
        user.setRealName("医生一");
        user.setUserType(2);
        user.setStatus(status);
        user.setPassword(password);
        return user;
    }

    private static class Dependencies {
        private AuthServiceImpl service;
        private SysUserMapper userMapper;
        private SysOperationLogMapper operationLogMapper;
        private JwtUtils jwtUtils;
        private RedisUtils redisUtils;
        private AuthSessionService sessionService;
    }
}
