package com.medical.service;

import java.util.Map;

/**
 * 认证服务接口
 */
public interface AuthService {

    /**
     * 用户登录
     */
    Map<String, Object> login(String username, String password, String ip);

    /**
     * 获取当前用户信息
     */
    Object getUserInfo(Long userId);

    /**
     * 修改密码
     */
    void changePassword(Long userId, String oldPassword, String newPassword);

    /**
     * 密码重置
     */
    void resetPassword(String username, String newPassword);

    /**
     * 用户注册
     */
    void register(String username, String password, String realName, String phone, Integer userType);

    /**
     * 登出（从Redis移除Token）
     */
    void logout(String tokenId);
}
