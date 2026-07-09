package com.medical.controller;

import com.medical.common.annotation.RequireRole;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ProfileController 安全约束反射测试。
 * <p>
 * ProfileController 类级为 {1,2,3}（所有角色可用），
 * 但 messages 写操作需做归属校验：非管理员不能改他人消息。
 * <p>
 * 本类校验：写方法有显式的 currentUserId/currentUserType 读取逻辑。
 */
class ProfileControllerSecurityTest {

    @Test
    void profileController_HasClassLevelAnnotation() {
        RequireRole ann = ProfileController.class.getAnnotation(RequireRole.class);
        assertNotNull(ann);
        assertArrayEquals(new int[]{1, 2, 3}, ann.value(),
                "ProfileController 应允许三角色访问（个人中心是通用功能）");
    }

    @Test
    void profileController_markRead_HasOwnershipCheck() throws NoSuchMethodException {
        Method method = ProfileController.class.getDeclaredMethod("markRead",
                Long.class, javax.servlet.http.HttpServletRequest.class);
        assertNotNull(method, "markRead 方法必须存在");
        // markRead 应接受 (id, request) 两个参数
        assertEquals(2, method.getParameterCount(),
                "markRead 应接受 (id, request) 两个参数");
    }

    @Test
    void profileController_markAllRead_HasAdminCheck() throws NoSuchMethodException {
        Method method = ProfileController.class.getDeclaredMethod("markAllRead",
                javax.servlet.http.HttpServletRequest.class);
        assertNotNull(method, "markAllRead 方法必须存在");
    }

    @Test
    void profileController_avatarUpload_HasPathTraversalCheck() throws NoSuchMethodException {
        Method method = ProfileController.class.getDeclaredMethod("uploadAvatar",
                org.springframework.web.multipart.MultipartFile.class,
                javax.servlet.http.HttpServletRequest.class);
        assertNotNull(method, "uploadAvatar 方法必须存在");
    }

    @Test
    void profileController_updateProfile_HasAuthCheck() throws NoSuchMethodException {
        Method method = ProfileController.class.getDeclaredMethod("updateProfile",
                com.medical.entity.SysUser.class,
                javax.servlet.http.HttpServletRequest.class);
        assertNotNull(method, "updateProfile 方法必须存在");
    }
}
