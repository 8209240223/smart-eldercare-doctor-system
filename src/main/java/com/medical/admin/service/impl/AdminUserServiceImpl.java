package com.medical.admin.service.impl;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.admin.dto.AdminCreateUserRequest;
import com.medical.admin.dto.AdminResetPasswordRequest;
import com.medical.admin.dto.AdminReviewRequest;
import com.medical.admin.dto.AdminUserQuery;
import com.medical.admin.dto.AdminUserStatistics;
import com.medical.admin.dto.AdminUserView;
import com.medical.admin.service.AdminUserService;
import com.medical.auth.session.AuthSessionService;
import com.medical.common.constant.RedisKeyConstant;
import com.medical.common.exception.BusinessException;
import com.medical.common.utils.AccountSecurityValidator;
import com.medical.common.utils.RedisUtils;
import com.medical.entity.SysUser;
import com.medical.mapper.SysUserMapper;
import com.medical.message.service.MessageService;
import com.medical.service.UserDemoDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class AdminUserServiceImpl implements AdminUserService {

    static final int STATUS_BANNED = 0;
    static final int STATUS_NORMAL = 1;
    static final int STATUS_PENDING = 2;
    static final int USER_TYPE_ADMIN = 1;

    private final SysUserMapper sysUserMapper;
    private final AuthSessionService authSessionService;
    private final RedisUtils redisUtils;

    @Autowired(required = false)
    private MessageService messageService;

    @Autowired(required = false)
    private UserDemoDataService userDemoDataService;

    public AdminUserServiceImpl(SysUserMapper sysUserMapper,
                                AuthSessionService authSessionService,
                                RedisUtils redisUtils) {
        this.sysUserMapper = sysUserMapper;
        this.authSessionService = authSessionService;
        this.redisUtils = redisUtils;
    }

    @Override
    public Page<AdminUserView> listUsers(AdminUserQuery query) {
        AdminUserQuery actual = query == null ? new AdminUserQuery() : query;
        long pageNum = normalizePage(actual.getPageNum(), 1, Integer.MAX_VALUE);
        long pageSize = normalizePage(actual.getPageSize(), 10, 100);
        validateOptionalUserType(actual.getUserType());
        validateOptionalStatus(actual.getStatus());

        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(actual.getKeyword())) {
            String keyword = actual.getKeyword().trim();
            wrapper.and(item -> item.like(SysUser::getUsername, keyword)
                    .or().like(SysUser::getRealName, keyword)
                    .or().like(SysUser::getPhone, keyword));
        }
        wrapper.eq(actual.getUserType() != null, SysUser::getUserType, actual.getUserType())
                .eq(actual.getStatus() != null, SysUser::getStatus, actual.getStatus())
                .orderByDesc(SysUser::getCreateTime)
                .orderByDesc(SysUser::getId);

        Page<SysUser> storedPage = sysUserMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
        Page<AdminUserView> result = new Page<>(pageNum, pageSize, storedPage.getTotal());
        result.setRecords(storedPage.getRecords().stream()
                .map(this::toView)
                .collect(Collectors.toList()));
        return result;
    }

    @Override
    @Transactional
    public Long createUser(AdminCreateUserRequest request) {
        if (request == null) {
            throw new BusinessException(400, "创建参数不能为空");
        }
        String username = AccountSecurityValidator.requireUsername(request.getUsername());
        String phone = AccountSecurityValidator.requirePhone(request.getPhone());
        AccountSecurityValidator.requireStrongPassword(request.getPassword());
        AccountSecurityValidator.requirePasswordConfirmed(
                request.getPassword(), request.getConfirmPassword());
        validateRequiredUserType(request.getUserType());

        if (sysUserMapper.selectCount(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, username)) > 0) {
            throw new BusinessException(400, "用户名已存在，请更换");
        }
        if (sysUserMapper.selectCount(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getPhone, phone)) > 0) {
            throw new BusinessException(400, "该手机号已被使用");
        }

        SysUser user = new SysUser();
        user.setUsername(username);
        user.setPassword(BCrypt.hashpw(request.getPassword()));
        user.setRealName(StringUtils.hasText(request.getRealName())
                ? request.getRealName().trim() : username);
        user.setPhone(phone);
        user.setEmail(trimToNull(request.getEmail()));
        user.setUserType(request.getUserType());
        user.setStatus(STATUS_NORMAL);
        user.setDeleted(0);
        if (sysUserMapper.insert(user) <= 0) {
            throw new BusinessException(500, "创建用户失败");
        }
        ensureDemoData(user);
        notifyUser(user.getId(), "工作账号已创建", "管理员已为你创建工作账号，现在可以登录智慧医养系统。", 1);
        return user.getId();
    }

    @Override
    @Transactional
    public void reviewUser(Long userId, AdminReviewRequest request) {
        if (request == null || !StringUtils.hasText(request.getAction())) {
            throw new BusinessException(400, "审核动作不能为空");
        }
        String action = request.getAction().trim().toLowerCase(Locale.ROOT);
        if ("approve".equals(action) || "approved".equals(action)
                || "1".equals(action) || "通过".equals(action)) {
            approveUser(userId);
            return;
        }
        if ("reject".equals(action) || "rejected".equals(action)
                || "0".equals(action) || "拒绝".equals(action)) {
            rejectUser(userId);
            return;
        }
        throw new BusinessException(400, "审核动作仅支持 approve 或 reject");
    }

    @Override
    @Transactional
    public void approveUser(Long userId) {
        SysUser user = requireUser(userId);
        requirePending(user);
        user.setStatus(STATUS_NORMAL);
        updateUser(user, "审核通过失败");
        ensureDemoData(user);
        invalidateUserCache(userId);
        notifyUser(userId, "账号审核已通过", "你的账号申请已通过管理员审核，现在可以登录系统。", 2);
    }

    @Override
    @Transactional
    public void rejectUser(Long userId) {
        SysUser user = requireUser(userId);
        requirePending(user);
        user.setStatus(STATUS_BANNED);
        updateUser(user, "驳回用户失败");
        invalidateUserAndSession(userId);
        notifyUser(userId, "账号审核未通过", "你的账号申请未通过审核，请联系管理员核对注册信息。", 3);
    }

    @Override
    @Transactional
    public void banUser(Long userId, Long operatorId) {
        if (userId == null || userId.equals(operatorId)) {
            throw new BusinessException(400, "管理员不能封禁自己");
        }
        SysUser user = requireUser(userId);
        if (!Integer.valueOf(STATUS_NORMAL).equals(user.getStatus())) {
            throw new BusinessException(400, "只有正常账号可以被封禁");
        }

        if (Integer.valueOf(USER_TYPE_ADMIN).equals(user.getUserType())) {
            List<SysUser> activeAdmins = sysUserMapper.selectList(
                    new LambdaQueryWrapper<SysUser>()
                            .eq(SysUser::getUserType, USER_TYPE_ADMIN)
                            .eq(SysUser::getStatus, STATUS_NORMAL)
                            .last("FOR UPDATE"));
            boolean targetStillActive = activeAdmins.stream()
                    .anyMatch(admin -> userId.equals(admin.getId()));
            if (!targetStillActive) {
                throw new BusinessException(400, "该管理员已不是正常状态");
            }
            if (activeAdmins.size() <= 1) {
                throw new BusinessException(400, "不能封禁最后一个正常管理员");
            }
        }

        user.setStatus(STATUS_BANNED);
        updateUser(user, "封禁用户失败");
        invalidateUserAndSession(userId);
        notifyUser(userId, "账号已被封禁", "管理员已封禁你的账号，当前会话已失效。如有疑问，请联系系统管理员。", 3);
    }

    @Override
    @Transactional
    public void unbanUser(Long userId) {
        SysUser user = requireUser(userId);
        if (!Integer.valueOf(STATUS_BANNED).equals(user.getStatus())) {
            throw new BusinessException(400, "只有封禁账号可以解封");
        }
        user.setStatus(STATUS_NORMAL);
        updateUser(user, "解封用户失败");
        invalidateUserCache(userId);
        notifyUser(userId, "账号已解封", "管理员已恢复你的账号，现在可以重新登录系统。", 2);
    }

    @Override
    @Transactional
    public void resetPassword(Long userId, AdminResetPasswordRequest request) {
        if (request == null) {
            throw new BusinessException(400, "密码参数不能为空");
        }
        AccountSecurityValidator.requireStrongPassword(request.getNewPassword());
        AccountSecurityValidator.requirePasswordConfirmed(
                request.getNewPassword(), request.getConfirmPassword());
        SysUser user = requireUser(userId);
        AccountSecurityValidator.requireDifferentFromStoredPassword(
                request.getNewPassword(), user.getPassword());
        user.setPassword(BCrypt.hashpw(request.getNewPassword()));
        updateUser(user, "重置密码失败");
        invalidateUserAndSession(userId);
        notifyUser(userId, "登录密码已重置", "管理员已重置你的登录密码，原会话已失效，请使用新密码重新登录。", 3);
    }

    @Override
    public void forceLogout(Long userId) {
        requireUser(userId);
        authSessionService.revokeAllSessions(userId);
        notifyUser(userId, "账号已被强制下线", "管理员已撤销你的当前登录会话，请重新登录系统。", 2);
    }

    @Override
    public AdminUserStatistics getStatistics() {
        AdminUserStatistics statistics = new AdminUserStatistics();
        statistics.setTotal(count(null, null));
        statistics.setNormal(count(null, STATUS_NORMAL));
        statistics.setBanned(count(null, STATUS_BANNED));
        statistics.setPending(count(null, STATUS_PENDING));
        statistics.setAdministrators(count(1, null));
        statistics.setDoctors(count(2, null));
        statistics.setNurses(count(3, null));
        return statistics;
    }

    private long count(Integer userType, Integer status) {
        return sysUserMapper.selectCount(new LambdaQueryWrapper<SysUser>()
                .eq(userType != null, SysUser::getUserType, userType)
                .eq(status != null, SysUser::getStatus, status));
    }

    private SysUser requireUser(Long userId) {
        if (userId == null) {
            throw new BusinessException(400, "用户ID不能为空");
        }
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(404, "用户不存在");
        }
        return user;
    }

    private void requirePending(SysUser user) {
        if (!Integer.valueOf(STATUS_PENDING).equals(user.getStatus())) {
            throw new BusinessException(400, "只有待审核账号可以执行审核");
        }
    }

    private void updateUser(SysUser user, String failureMessage) {
        user.setUpdateTime(LocalDateTime.now());
        if (sysUserMapper.updateById(user) <= 0) {
            throw new BusinessException(500, failureMessage);
        }
    }

    private void invalidateUserCache(Long userId) {
        redisUtils.delete(RedisKeyConstant.buildUserKey(userId));
    }

    private void invalidateUserAndSession(Long userId) {
        invalidateUserCache(userId);
        authSessionService.revokeAllSessions(userId);
    }

    private void ensureDemoData(SysUser user) {
        if (userDemoDataService != null) {
            userDemoDataService.ensureFor(user);
        }
    }

    private void validateRequiredUserType(Integer userType) {
        if (userType == null || userType < 1 || userType > 3) {
            throw new BusinessException(400, "用户角色仅支持管理员、医生或护士");
        }
    }

    private void validateOptionalUserType(Integer userType) {
        if (userType != null) {
            validateRequiredUserType(userType);
        }
    }

    private void validateOptionalStatus(Integer status) {
        if (status != null && status != STATUS_BANNED
                && status != STATUS_NORMAL && status != STATUS_PENDING) {
            throw new BusinessException(400, "用户状态仅支持0、1、2");
        }
    }

    private long normalizePage(Integer value, int defaultValue, int maximum) {
        if (value == null) {
            return defaultValue;
        }
        if (value < 1) {
            throw new BusinessException(400, "分页参数必须大于0");
        }
        return Math.min(value, maximum);
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private void notifyUser(Long userId, String title, String content, int priority) {
        if (messageService == null || userId == null) {
            return;
        }
        try {
            messageService.sendSystemNotification(userId, title, content, 5, priority, "/messages");
        } catch (Exception ignored) {
            // 通知失败不能回滚账号治理操作。
        }
    }

    private AdminUserView toView(SysUser user) {
        AdminUserView view = new AdminUserView();
        view.setId(user.getId());
        view.setUsername(user.getUsername());
        view.setRealName(user.getRealName());
        view.setAvatar(user.getAvatar());
        view.setPhone(user.getPhone());
        view.setEmail(user.getEmail());
        view.setUserType(user.getUserType());
        view.setStatus(user.getStatus());
        view.setLastLoginTime(user.getLastLoginTime());
        view.setLastLoginIp(user.getLastLoginIp());
        view.setCreateTime(user.getCreateTime());
        view.setUpdateTime(user.getUpdateTime());
        return view;
    }
}
