package com.medical.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.annotation.OperationLog;
import com.medical.common.utils.AccountSecurityValidator;
import com.medical.common.result.R;
import com.medical.entity.SysMessage;
import com.medical.entity.SysOperationLog;
import com.medical.entity.SysUser;
import com.medical.mapper.SysMessageMapper;
import com.medical.mapper.SysOperationLogMapper;
import com.medical.mapper.SysUserMapper;
import com.medical.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.Map;

/**
 * 个人账户管理控制器
 */
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private SysOperationLogMapper sysOperationLogMapper;

    @Autowired
    private SysMessageMapper sysMessageMapper;

    @Autowired
    private com.medical.common.utils.RedisUtils redisUtils;

    @Autowired
    private AuthService authService;

    @PutMapping("/info")
    @OperationLog(module = "个人中心", type = "修改", desc = "修改个人信息")
    public R<?> updateProfile(@RequestBody SysUser user, javax.servlet.http.HttpServletRequest request) {
        Long uid = (Long) request.getAttribute("currentUserId");
        if (uid == null) {
            return R.fail(401, "未登录或Token无效");
        }
        SysUser existing = sysUserMapper.selectById(uid);
        if (existing == null) {
            return R.fail(404, "用户不存在");
        }
        if (user.getRealName() != null) existing.setRealName(user.getRealName());
        if (user.getPhone() != null) {
            String phone = AccountSecurityValidator.requirePhone(user.getPhone());
            Long phoneCount = sysUserMapper.selectCount(new LambdaQueryWrapper<SysUser>()
                    .eq(SysUser::getPhone, phone)
                    .ne(SysUser::getId, uid));
            if (phoneCount > 0) {
                return R.fail(400, "该手机号已被其他账号绑定");
            }
            existing.setPhone(phone);
        }
        if (user.getEmail() != null) existing.setEmail(user.getEmail());
        if (user.getAvatar() != null) existing.setAvatar(user.getAvatar());
        sysUserMapper.updateById(existing);
        try {
            redisUtils.delete(com.medical.common.constant.RedisKeyConstant.buildUserKey(uid));
        } catch (Exception ignored) {
        }
        createSystemMessage(uid, "个人信息已更新", "你的个人中心资料已保存成功。", "profile_info");
        return R.ok("修改成功");
    }

    @PutMapping("/password")
    public R<?> changePassword(@RequestBody Map<String, String> params, HttpServletRequest request) {
        String oldPassword = params.get("oldPassword");
        String newPassword = params.get("newPassword");
        String confirmPassword = params.get("confirmPassword");
        if (oldPassword == null || newPassword == null || confirmPassword == null) {
            return R.fail("参数不完整");
        }

        AccountSecurityValidator.requirePasswordConfirmed(newPassword, confirmPassword);
        Long uid = (Long) request.getAttribute("currentUserId");
        authService.changePassword(uid, oldPassword, newPassword);
        return R.ok("密码修改成功");
    }

    @GetMapping("/logs")
    public R<?> operationLogs(@RequestParam(defaultValue = "1") Integer pageNum,
                              @RequestParam(defaultValue = "20") Integer pageSize,
                              @RequestParam(required = false) Long userId) {
        Page<SysOperationLog> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<SysOperationLog> wrapper = new LambdaQueryWrapper<>();
        if (userId != null) wrapper.eq(SysOperationLog::getUserId, userId);
        wrapper.orderByDesc(SysOperationLog::getCreateTime);
        return R.ok(sysOperationLogMapper.selectPage(page, wrapper));
    }

    @GetMapping("/messages")
    public R<?> messages(@RequestParam(defaultValue = "1") Integer pageNum,
                         @RequestParam(defaultValue = "20") Integer pageSize,
                         @RequestParam(required = false) Long userId,
                         @RequestParam(required = false) Integer isRead) {
        Page<SysMessage> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<SysMessage> wrapper = new LambdaQueryWrapper<>();
        if (userId != null) wrapper.eq(SysMessage::getUserId, userId);
        if (isRead != null) wrapper.eq(SysMessage::getIsRead, isRead);
        wrapper.orderByDesc(SysMessage::getCreateTime);
        return R.ok(sysMessageMapper.selectPage(page, wrapper));
    }

    @GetMapping("/messages/unread-count")
    public R<?> unreadCount(@RequestParam(required = false) Long userId) {
        LambdaQueryWrapper<SysMessage> wrapper = new LambdaQueryWrapper<>();
        if (userId != null) wrapper.eq(SysMessage::getUserId, userId);
        wrapper.eq(SysMessage::getIsRead, 0);
        return R.ok(sysMessageMapper.selectCount(wrapper));
    }

    @PutMapping("/messages/{id}/read")
    public R<?> markRead(@PathVariable Long id) {
        SysMessage msg = sysMessageMapper.selectById(id);
        if (msg != null) {
            msg.setIsRead(1);
            sysMessageMapper.updateById(msg);
        }
        return R.ok("已读");
    }

    @PutMapping("/messages/read-all")
    public R<?> markAllRead(@RequestParam(required = false) Long userId) {
        LambdaQueryWrapper<SysMessage> wrapper = new LambdaQueryWrapper<>();
        if (userId != null) wrapper.eq(SysMessage::getUserId, userId);
        wrapper.eq(SysMessage::getIsRead, 0);
        SysMessage update = new SysMessage();
        update.setIsRead(1);
        sysMessageMapper.update(update, wrapper);
        return R.ok("全部已读");
    }

    private void createSystemMessage(Long userId, String title, String content, String sourceType) {
        if (userId == null) return;
        SysMessage msg = new SysMessage();
        msg.setUserId(userId);
        msg.setTitle(title);
        msg.setContent(content);
        msg.setMsgType(3);
        msg.setIsRead(0);
        msg.setSourceType(sourceType);
        sysMessageMapper.insert(msg);
    }
}
