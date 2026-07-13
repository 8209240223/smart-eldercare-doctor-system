package com.medical.controller;

import com.medical.auth.session.AuthSessionService;
import com.medical.common.utils.JwtUtils;
import com.medical.entity.SysUser;
import com.medical.mapper.SysUserMapper;
import com.medical.service.SseService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WarningControllerSessionTest {

    @Test
    void sseRequiresTokenIdAndCurrentRedisSession() {
        JwtUtils jwtUtils = mock(JwtUtils.class);
        AuthSessionService sessionService = mock(AuthSessionService.class);
        SysUserMapper userMapper = mock(SysUserMapper.class);
        SseService sseService = mock(SseService.class);
        WarningController controller = controller(jwtUtils, sessionService, userMapper, sseService);

        controller.stream("jwt-value", null, null);

        verify(sseService, never()).connect(7L, "jwt-value");
        verify(sessionService, never()).validateSession(7L, "token-id", "jwt-value");
    }

    @Test
    void sseConnectsOnlyAfterFullSessionAndAccountValidation() {
        JwtUtils jwtUtils = mock(JwtUtils.class);
        AuthSessionService sessionService = mock(AuthSessionService.class);
        SysUserMapper userMapper = mock(SysUserMapper.class);
        SseService sseService = mock(SseService.class);
        when(jwtUtils.validateToken("jwt-value")).thenReturn(true);
        when(jwtUtils.getUserIdFromToken("jwt-value")).thenReturn(7L);
        when(sessionService.validateSession(7L, "token-id", "jwt-value")).thenReturn(true);
        SysUser user = new SysUser();
        user.setId(7L);
        user.setStatus(1);
        user.setDeleted(0);
        when(userMapper.selectById(7L)).thenReturn(user);
        SseEmitter expected = new SseEmitter();
        when(sseService.connect(7L, "jwt-value")).thenReturn(expected);
        WarningController controller = controller(jwtUtils, sessionService, userMapper, sseService);

        SseEmitter actual = controller.stream("jwt-value", "token-id", null);

        assertSame(expected, actual);
        verify(sessionService).refreshSession(7L, "token-id");
    }

    private WarningController controller(JwtUtils jwtUtils,
                                         AuthSessionService sessionService,
                                         SysUserMapper userMapper,
                                         SseService sseService) {
        WarningController controller = new WarningController();
        ReflectionTestUtils.setField(controller, "jwtUtils", jwtUtils);
        ReflectionTestUtils.setField(controller, "authSessionService", sessionService);
        ReflectionTestUtils.setField(controller, "sysUserMapper", userMapper);
        ReflectionTestUtils.setField(controller, "sseService", sseService);
        return controller;
    }
}
