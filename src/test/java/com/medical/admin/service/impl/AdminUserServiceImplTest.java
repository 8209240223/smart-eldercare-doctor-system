package com.medical.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.admin.dto.AdminCreateUserRequest;
import com.medical.admin.dto.AdminResetPasswordRequest;
import com.medical.admin.dto.AdminUserQuery;
import com.medical.admin.dto.AdminUserStatistics;
import com.medical.admin.dto.AdminUserView;
import com.medical.auth.session.AuthSessionService;
import com.medical.common.constant.RedisKeyConstant;
import com.medical.common.exception.BusinessException;
import com.medical.common.utils.AccountSecurityValidator;
import com.medical.common.utils.RedisUtils;
import com.medical.entity.SysUser;
import com.medical.mapper.SysUserMapper;
import com.medical.service.UserDemoDataService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminUserServiceImplTest {

    @Test
    void administratorCreatedUserIsImmediatelyNormal() {
        Dependencies dependencies = dependencies();
        when(dependencies.userMapper.selectCount(any(Wrapper.class))).thenReturn(0L);
        when(dependencies.userMapper.insert(any(SysUser.class))).thenAnswer(invocation -> {
            SysUser user = invocation.getArgument(0);
            user.setId(9L);
            return 1;
        });
        AdminCreateUserRequest request = new AdminCreateUserRequest();
        request.setUsername("doctor09");
        request.setPassword("Strong123");
        request.setConfirmPassword("Strong123");
        request.setRealName("医生九");
        request.setPhone("13800138009");
        request.setUserType(2);

        assertEquals(9L, dependencies.service.createUser(request));

        ArgumentCaptor<SysUser> userCaptor = ArgumentCaptor.forClass(SysUser.class);
        verify(dependencies.userMapper).insert(userCaptor.capture());
        SysUser created = userCaptor.getValue();
        assertEquals(1, created.getStatus());
        assertEquals(0, created.getDeleted());
        assertTrue(AccountSecurityValidator.matchesStoredPassword("Strong123", created.getPassword()));
        verify(dependencies.demoDataService).ensureFor(created);
    }

    @Test
    void administratorCannotBanSelf() {
        Dependencies dependencies = dependencies();

        BusinessException exception = assertThrows(BusinessException.class,
                () -> dependencies.service.banUser(7L, 7L));

        assertTrue(exception.getMessage().contains("不能封禁自己"));
        verify(dependencies.userMapper, never()).selectById(7L);
    }

    @Test
    void lastNormalAdministratorCannotBeBanned() {
        Dependencies dependencies = dependencies();
        SysUser target = user(8L, 1, 1);
        when(dependencies.userMapper.selectById(8L)).thenReturn(target);
        when(dependencies.userMapper.selectList(any(Wrapper.class))).thenReturn(List.of(target));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> dependencies.service.banUser(8L, 7L));

        assertTrue(exception.getMessage().contains("最后一个正常管理员"));
        verify(dependencies.userMapper, never()).updateById(target);
        verify(dependencies.sessionService, never()).revokeAllSessions(8L);
    }

    @Test
    void banningNormalUserRevokesSessionAndClearsCache() {
        Dependencies dependencies = dependencies();
        SysUser target = user(8L, 1, 2);
        when(dependencies.userMapper.selectById(8L)).thenReturn(target);
        when(dependencies.userMapper.updateById(target)).thenReturn(1);

        dependencies.service.banUser(8L, 7L);

        assertEquals(0, target.getStatus());
        verify(dependencies.redisUtils).delete(RedisKeyConstant.buildUserKey(8L));
        verify(dependencies.sessionService).revokeAllSessions(8L);
    }

    @Test
    void rejectingPendingUserRevokesAnyResidualSession() {
        Dependencies dependencies = dependencies();
        SysUser target = user(8L, 2, 2);
        when(dependencies.userMapper.selectById(8L)).thenReturn(target);
        when(dependencies.userMapper.updateById(target)).thenReturn(1);

        dependencies.service.rejectUser(8L);

        assertEquals(0, target.getStatus());
        verify(dependencies.sessionService).revokeAllSessions(8L);
    }

    @Test
    void approvingPendingUserMakesAccountNormalAndClearsCache() {
        Dependencies dependencies = dependencies();
        SysUser target = user(8L, 2, 2);
        when(dependencies.userMapper.selectById(8L)).thenReturn(target);
        when(dependencies.userMapper.updateById(target)).thenReturn(1);

        dependencies.service.approveUser(8L);

        assertEquals(1, target.getStatus());
        verify(dependencies.demoDataService).ensureFor(target);
        verify(dependencies.redisUtils).delete(RedisKeyConstant.buildUserKey(8L));
        verify(dependencies.sessionService, never()).revokeAllSessions(8L);
    }

    @Test
    void unbanningUserMakesAccountNormal() {
        Dependencies dependencies = dependencies();
        SysUser target = user(8L, 0, 2);
        when(dependencies.userMapper.selectById(8L)).thenReturn(target);
        when(dependencies.userMapper.updateById(target)).thenReturn(1);

        dependencies.service.unbanUser(8L);

        assertEquals(1, target.getStatus());
        verify(dependencies.redisUtils).delete(RedisKeyConstant.buildUserKey(8L));
    }

    @Test
    void administratorPasswordResetHashesPasswordAndRevokesSession() {
        Dependencies dependencies = dependencies();
        SysUser target = user(8L, 1, 2);
        target.setPassword("Oldpass1");
        when(dependencies.userMapper.selectById(8L)).thenReturn(target);
        when(dependencies.userMapper.updateById(target)).thenReturn(1);
        AdminResetPasswordRequest request = new AdminResetPasswordRequest();
        request.setNewPassword("Newpass2");
        request.setConfirmPassword("Newpass2");

        dependencies.service.resetPassword(8L, request);

        assertTrue(AccountSecurityValidator.matchesStoredPassword("Newpass2", target.getPassword()));
        verify(dependencies.sessionService).revokeAllSessions(8L);
    }

    @Test
    void forceLogoutRequiresExistingUserAndRevokesSession() {
        Dependencies dependencies = dependencies();
        when(dependencies.userMapper.selectById(8L)).thenReturn(user(8L, 1, 2));

        dependencies.service.forceLogout(8L);

        verify(dependencies.sessionService).revokeAllSessions(8L);
    }

    @Test
    void statisticsReturnsAllStatusAndRoleCounts() {
        Dependencies dependencies = dependencies();
        when(dependencies.userMapper.selectCount(any(Wrapper.class)))
                .thenReturn(7L, 4L, 1L, 2L, 1L, 4L, 2L);

        AdminUserStatistics result = dependencies.service.getStatistics();

        assertEquals(7L, result.getTotal());
        assertEquals(4L, result.getNormal());
        assertEquals(1L, result.getBanned());
        assertEquals(2L, result.getPending());
        assertEquals(1L, result.getAdministrators());
        assertEquals(4L, result.getDoctors());
        assertEquals(2L, result.getNurses());
    }

    @Test
    void userListNeverReturnsPasswordField() {
        Dependencies dependencies = dependencies();
        SysUser stored = user(8L, 1, 2);
        stored.setPassword("stored-secret");
        Page<SysUser> storedPage = new Page<>(1, 10, 1);
        storedPage.setRecords(List.of(stored));
        when(dependencies.userMapper.selectPage(any(Page.class), any(Wrapper.class)))
                .thenReturn(storedPage);

        Page<AdminUserView> result = dependencies.service.listUsers(new AdminUserQuery());

        assertEquals(1, result.getRecords().size());
        assertTrue(List.of(AdminUserView.class.getDeclaredFields()).stream()
                .noneMatch(field -> "password".equals(field.getName())));
    }

    private Dependencies dependencies() {
        Dependencies dependencies = new Dependencies();
        dependencies.userMapper = mock(SysUserMapper.class);
        dependencies.sessionService = mock(AuthSessionService.class);
        dependencies.redisUtils = mock(RedisUtils.class);
        dependencies.service = new AdminUserServiceImpl(
                dependencies.userMapper, dependencies.sessionService, dependencies.redisUtils);
        dependencies.demoDataService = mock(UserDemoDataService.class);
        ReflectionTestUtils.setField(dependencies.service, "userDemoDataService", dependencies.demoDataService);
        return dependencies;
    }

    private SysUser user(Long id, Integer status, Integer userType) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setUsername("user" + id);
        user.setStatus(status);
        user.setUserType(userType);
        user.setDeleted(0);
        return user;
    }

    private static class Dependencies {
        private AdminUserServiceImpl service;
        private SysUserMapper userMapper;
        private AuthSessionService sessionService;
        private RedisUtils redisUtils;
        private UserDemoDataService demoDataService;
    }
}
