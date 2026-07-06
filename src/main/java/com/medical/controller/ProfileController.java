package com.medical.controller;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.entity.SysMessage;
import com.medical.entity.SysOperationLog;
import com.medical.entity.SysUser;
import com.medical.mapper.SysMessageMapper;
import com.medical.mapper.SysOperationLogMapper;
import com.medical.mapper.SysUserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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

    @PutMapping("/info")
    @OperationLog(module = "个人中心", type = "修改", desc = "修改个人信息")
    public R<?> updateProfile(@RequestBody SysUser user, @RequestAttribute(required = false) Long userId) {
        Long uid = userId != null ? userId : user.getId();
        SysUser existing = sysUserMapper.selectById(uid);
        if (existing == null) {
            return R.fail("用户不存在");
        }
        if (user.getRealName() != null) existing.setRealName(user.getRealName());
        if (user.getPhone() != null) existing.setPhone(user.getPhone());
        if (user.getEmail() != null) existing.setEmail(user.getEmail());
        sysUserMapper.updateById(existing);
        return R.ok("修改成功");
    }

    @PutMapping("/password")
    public R<?> changePassword(@RequestBody Map<String, String> params, @RequestAttribute(required = false) Long userId) {
        String oldPassword = params.get("oldPassword");
        String newPassword = params.get("newPassword");
        if (oldPassword == null || newPassword == null) {
            return R.fail("参数不完整");
        }

        Long uid = userId != null ? userId : Long.parseLong(params.getOrDefault("userId", "0"));
        SysUser user = sysUserMapper.selectById(uid);
        if (user == null) {
            return R.fail("用户不存在");
        }

        boolean passwordMatch;
        String storedPassword = user.getPassword();
        if (storedPassword != null && (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$"))) {
            try {
                passwordMatch = BCrypt.checkpw(oldPassword, storedPassword);
            } catch (Exception e) {
                passwordMatch = false;
            }
        } else {
            passwordMatch = oldPassword.equals(storedPassword);
        }

        if (!passwordMatch) {
            return R.fail("原密码错误");
        }

        user.setPassword(BCrypt.hashpw(newPassword));
        sysUserMapper.updateById(user);
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
}
