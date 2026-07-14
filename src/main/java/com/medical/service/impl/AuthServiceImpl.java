package com.medical.service.impl;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.auth.session.AuthSessionService;
import com.medical.common.constant.RedisKeyConstant;
import com.medical.common.exception.BusinessException;
import com.medical.common.utils.AccountSecurityValidator;
import com.medical.common.utils.JwtUtils;
import com.medical.common.utils.RedisUtils;
import com.medical.entity.SysUser;
import com.medical.entity.SysOperationLog;
import com.medical.mapper.SysOperationLogMapper;
import com.medical.mapper.SysUserMapper;
import com.medical.service.AuthService;
import com.medical.service.UserDemoDataService;
import com.medical.service.DoctorNurseRelationService;
import com.medical.service.DoctorProfileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

@Service
public class AuthServiceImpl implements AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private SysOperationLogMapper operationLogMapper;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private RedisUtils redisUtils;

    @Autowired
    private AuthSessionService authSessionService;

    @Autowired(required = false)
    private UserDemoDataService userDemoDataService;

    @Autowired(required = false)
    private DoctorNurseRelationService relationService;

    @Autowired(required = false)
    private DoctorProfileService doctorProfileService;

    @Override
    public Map<String, Object> login(String username, String password, String ip) {
        // 1. 检查登录锁定
        String loginErrorKey = RedisKeyConstant.buildLoginErrorKey(username);
        Integer errorCount = redisUtils.get(loginErrorKey, Integer.class);
        if (errorCount != null && errorCount >= RedisKeyConstant.LOGIN_MAX_ATTEMPTS) {
            long remainTtl = redisUtils.getExpire(loginErrorKey);
            throw new BusinessException(429, "账号已被锁定，请 " + remainTtl + " 秒后再试");
        }

        // 2. 查询用户
        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username));

        if (user == null) {
            // 记录错误次数（用户名不存在也计数，防止暴力枚举）
            incrementLoginError(loginErrorKey);
            throw new BusinessException(400, "用户名或密码错误");
        }

        if (Integer.valueOf(2).equals(user.getStatus())) {
            throw new BusinessException(403, "账号待管理员审核");
        }
        if (!Integer.valueOf(1).equals(user.getStatus())) {
            throw new BusinessException(403, "账号已被封禁，请联系管理员");
        }

        // 3. 验证密码（支持明文和BCrypt）
        String storedPassword = user.getPassword();
        boolean passwordMatch = AccountSecurityValidator.matchesStoredPassword(password, storedPassword);

        if (!passwordMatch) {
            // 记录错误次数
            incrementLoginError(loginErrorKey);
            throw new BusinessException(400, "用户名或密码错误");
        }

        // 4. 登录成功，清除错误计数
        redisUtils.delete(loginErrorKey);
        ensureWorkforceWithoutBlockingLogin(user);
        ensureDemoDataWithoutBlockingLogin(user);

        // 5. 生成 Token，并原子替换该账号的旧会话
        String token = jwtUtils.generateToken(user.getId(), user.getUsername(), user.getUserType());
        String tokenId = authSessionService.replaceSession(
                user.getId(), user.getUsername(), token, ip);

        SysUser currentUser = sysUserMapper.selectById(user.getId());
        if (currentUser == null || !Integer.valueOf(1).equals(currentUser.getStatus())
                || !Objects.equals(storedPassword, currentUser.getPassword())
                || !Objects.equals(user.getUserType(), currentUser.getUserType())) {
            authSessionService.revokeSession(user.getId(), tokenId);
            throw new BusinessException(401, "账号信息已变化，请重新登录");
        }
        user = currentUser;

        // 6. 更新登录信息
        SysUser loginUpdate = new SysUser();
        loginUpdate.setId(user.getId());
        loginUpdate.setLastLoginTime(LocalDateTime.now());
        loginUpdate.setLastLoginIp(ip);
        sysUserMapper.updateById(loginUpdate);

        // 7. 记录登录日志
        saveLoginLog(user.getId(), user.getUsername(), ip, "登录成功", 1);

        // 8. 组装返回数据
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("tokenId", tokenId);
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        result.put("realName", user.getRealName());
        result.put("userType", user.getUserType());
        result.put("avatar", user.getAvatar());
        if (doctorProfileService != null && Integer.valueOf(2).equals(user.getUserType())) {
            result.put("department", doctorProfileService.departmentOf(user.getId()));
        }
        return result;
    }

    private void ensureWorkforceWithoutBlockingLogin(SysUser user) {
        try {
            if (doctorProfileService != null && Integer.valueOf(2).equals(user.getUserType())) {
                doctorProfileService.ensureProfile(user, null);
            }
            if (relationService != null) {
                relationService.ensureFor(user);
            }
        } catch (RuntimeException exception) {
            log.warn("为账号 {} 补充科室或协作关系失败，登录流程继续", user.getId(), exception);
        }
    }

    private void ensureDemoDataWithoutBlockingLogin(SysUser user) {
        if (userDemoDataService == null) {
            return;
        }
        try {
            userDemoDataService.ensureFor(user);
        } catch (RuntimeException exception) {
            log.warn("为账号 {} 补充默认演示数据失败，登录流程继续", user.getId(), exception);
        }
    }

    @Override
    public Object getUserInfo(Long userId) {
        // 优先从 Redis 缓存获取用户信息
        String userKey = RedisKeyConstant.buildUserKey(userId);
        SysUser cachedUser = redisUtils.get(userKey, SysUser.class);
        if (cachedUser != null) {
            cachedUser.setPassword(null);
            return cachedUser;
        }

        // 缓存未命中，从数据库查询
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(401, "用户不存在");
        }
        // 写入 Redis 缓存
        user.setPassword(null);
        redisUtils.setWithSeconds(userKey, user, RedisKeyConstant.USER_TTL);
        return user;
    }

    @Override
    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(401, "用户不存在");
        }
        AccountSecurityValidator.requireStrongPassword(newPassword);

        // 验证原密码
        String storedPwd = user.getPassword();
        boolean match = AccountSecurityValidator.matchesStoredPassword(oldPassword, storedPwd);
        if (!match) {
            throw new BusinessException(400, "原密码不正确");
        }
        AccountSecurityValidator.requireDifferentFromStoredPassword(newPassword, storedPwd);

        // 更新为BCrypt加密密码
        user.setPassword(BCrypt.hashpw(newPassword));
        sysUserMapper.updateById(user);

        // 修改密码后清除用户缓存并撤销账号会话
        redisUtils.delete(RedisKeyConstant.buildUserKey(userId));
        authSessionService.revokeAllSessions(userId);
    }

    @Override
    @Transactional
    public void resetPassword(String username, String phone, String newPassword, String confirmPassword) {
        String normalizedUsername = AccountSecurityValidator.requireUsername(username);
        String normalizedPhone = AccountSecurityValidator.requirePhone(phone);
        AccountSecurityValidator.requireStrongPassword(newPassword);
        AccountSecurityValidator.requirePasswordConfirmed(newPassword, confirmPassword);

        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, normalizedUsername)
        );
        if (user == null || !Integer.valueOf(1).equals(user.getStatus())
                || user.getPhone() == null || !normalizedPhone.equals(user.getPhone().trim())) {
            throw new BusinessException(400, "用户名或绑定手机号不匹配");
        }
        AccountSecurityValidator.requireDifferentFromStoredPassword(newPassword, user.getPassword());
        user.setPassword(BCrypt.hashpw(newPassword));
        sysUserMapper.updateById(user);

        // 重置密码后清除用户缓存并撤销账号会话
        redisUtils.delete(RedisKeyConstant.buildUserKey(user.getId()));
        authSessionService.revokeAllSessions(user.getId());
    }

    @Override
    public void validateRegistration(String username, String password, String realName, String phone, Integer userType) {
        String normalizedUsername = AccountSecurityValidator.requireUsername(username);
        String normalizedPhone = AccountSecurityValidator.requirePhone(phone);
        AccountSecurityValidator.requireStrongPassword(password);
        if (userType != null && userType != 2 && userType != 3) {
            throw new BusinessException(400, "注册角色不合法");
        }

        // 1. 用户名唯一性校验
        Long count = sysUserMapper.selectCount(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, normalizedUsername));
        if (count > 0) {
            throw new BusinessException(400, "用户名已存在，请更换");
        }

        // 2. 手机号校验
        Long phoneCount = sysUserMapper.selectCount(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getPhone, normalizedPhone));
        if (phoneCount > 0) {
            throw new BusinessException(400, "该手机号已被注册");
        }
    }

    @Override
    @Transactional
    public void register(String username, String password, String realName, String phone, Integer userType) {
        validateRegistration(username, password, realName, phone, userType);
        // 4. 创建用户
        SysUser user = new SysUser();
        user.setUsername(AccountSecurityValidator.requireUsername(username));
        user.setPassword(BCrypt.hashpw(password));
        user.setRealName(realName != null ? realName.trim() : user.getUsername());
        user.setPhone(AccountSecurityValidator.requirePhone(phone));
        user.setUserType(userType != null ? userType : 2); // 默认医生
        user.setStatus(2); // 公开注册统一进入待审核状态
        sysUserMapper.insert(user);
    }

    /**
     * 登出：撤销当前账号会话
     */
    @Override
    public void logout(Long userId, String tokenId) {
        authSessionService.revokeSession(userId, tokenId);
    }

    /**
     * 递增登录错误次数
     */
    private void incrementLoginError(String key) {
        redisUtils.increment(key);
        // 首次设置过期时间
        if (redisUtils.getExpire(key) == -1) {
            redisUtils.expire(key, RedisKeyConstant.LOGIN_ERROR_TTL, TimeUnit.SECONDS);
        }
    }

    private void saveLoginLog(Long userId, String username, String ip, String desc, int status) {
        try {
            SysOperationLog log = new SysOperationLog();
            log.setUserId(userId);
            log.setUsername(username);
            log.setModule("系统登录");
            log.setOperationType("登录");
            log.setDescription(desc);
            log.setRequestIp(ip);
            log.setStatus(status);
            log.setCreateTime(LocalDateTime.now());
            operationLogMapper.insert(log);
        } catch (Exception e) {
            // 日志记录失败不影响主流程
        }
    }
}
