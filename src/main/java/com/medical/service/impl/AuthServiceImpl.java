package com.medical.service.impl;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.common.constant.RedisKeyConstant;
import com.medical.common.exception.BusinessException;
import com.medical.common.utils.JwtUtils;
import com.medical.common.utils.RedisUtils;
import com.medical.entity.SysUser;
import com.medical.entity.SysOperationLog;
import com.medical.mapper.SysOperationLogMapper;
import com.medical.mapper.SysUserMapper;
import com.medical.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private SysOperationLogMapper operationLogMapper;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private RedisUtils redisUtils;

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

        if (user.getStatus() == 0) {
            throw new BusinessException(403, "账号已被禁用，请联系管理员");
        }

        // 3. 验证密码（支持明文和BCrypt）
        boolean passwordMatch = false;
        String storedPassword = user.getPassword();
        if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
            try {
                passwordMatch = BCrypt.checkpw(password, storedPassword);
            } catch (Exception e) {
                passwordMatch = false;
            }
        } else {
            passwordMatch = password.equals(storedPassword);
        }

        if (!passwordMatch) {
            // 记录错误次数
            incrementLoginError(loginErrorKey);
            throw new BusinessException(400, "用户名或密码错误");
        }

        // 4. 登录成功，清除错误计数
        redisUtils.delete(loginErrorKey);

        // 5. 生成Token并存入Redis（分布式会话共享）
        String token = jwtUtils.generateToken(user.getId(), user.getUsername());
        String tokenId = UUID.randomUUID().toString().replace("-", "");
        String redisTokenKey = RedisKeyConstant.buildTokenKey(tokenId);

        // 存储 Token 信息到 Redis（包含用户ID、用户名、Token）
        Map<String, Object> tokenInfo = new HashMap<>();
        tokenInfo.put("userId", user.getId());
        tokenInfo.put("username", user.getUsername());
        tokenInfo.put("token", token);
        tokenInfo.put("tokenId", tokenId);
        tokenInfo.put("loginTime", LocalDateTime.now().toString());
        tokenInfo.put("loginIp", ip);

        redisUtils.setWithSeconds(redisTokenKey, tokenInfo, RedisKeyConstant.TOKEN_TTL);

        // 6. 更新登录信息
        user.setLastLoginTime(LocalDateTime.now());
        user.setLastLoginIp(ip);
        sysUserMapper.updateById(user);

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
        return result;
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
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(401, "用户不存在");
        }

        // 验证原密码
        boolean match = false;
        String storedPwd = user.getPassword();
        if (storedPwd.startsWith("$2a$") || storedPwd.startsWith("$2b$") || storedPwd.startsWith("$2y$")) {
            try {
                match = BCrypt.checkpw(oldPassword, storedPwd);
            } catch (Exception e) {
                match = false;
            }
        } else {
            match = oldPassword.equals(storedPwd);
        }
        if (!match) {
            throw new BusinessException(400, "原密码不正确");
        }

        // 更新为BCrypt加密密码
        user.setPassword(BCrypt.hashpw(newPassword));
        sysUserMapper.updateById(user);

        // 修改密码后清除用户缓存，强制重新登录
        redisUtils.delete(RedisKeyConstant.buildUserKey(userId));
    }

    @Override
    public void resetPassword(String username, String newPassword) {
        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, username)
        );
        if (user == null) {
            throw new BusinessException(400, "用户不存在");
        }
        user.setPassword(BCrypt.hashpw(newPassword));
        sysUserMapper.updateById(user);

        // 重置密码后清除用户缓存
        redisUtils.delete(RedisKeyConstant.buildUserKey(user.getId()));
    }

    /**
     * 登出：从 Redis 中移除 Token
     */
    public void logout(String tokenId) {
        if (tokenId != null) {
            redisUtils.delete(RedisKeyConstant.buildTokenKey(tokenId));
        }
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
