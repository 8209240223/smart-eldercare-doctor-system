package com.medical.controller;

import com.medical.common.annotation.RequireRole;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.annotation.OperationLog;
import com.medical.common.utils.AccountSecurityValidator;
import com.medical.common.utils.ProfileInputValidator;
import com.medical.common.result.R;
import com.medical.entity.SysMessage;
import com.medical.entity.SysOperationLog;
import com.medical.entity.SysUser;
import com.medical.mapper.SysMessageMapper;
import com.medical.mapper.SysOperationLogMapper;
import com.medical.mapper.SysUserMapper;
import com.medical.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * 个人账户管理控制器
 */
@RestController
@RequestMapping("/api/profile")
@RequireRole({1, 2, 3})
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

    @Value("${file.upload-path:./upload}")
    private String uploadPath;

    private static final long MAX_AVATAR_SIZE = 2L * 1024 * 1024;

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
        if (user.getRealName() != null) existing.setRealName(ProfileInputValidator.optionalRealName(user.getRealName()));
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
        if (user.getEmail() != null) existing.setEmail(ProfileInputValidator.optionalEmail(user.getEmail()));
        if (user.getAvatar() != null) existing.setAvatar(ProfileInputValidator.optionalAvatar(user.getAvatar()));
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

    @PostMapping("/avatar")
    @OperationLog(module = "个人中心", type = "上传", desc = "上传个人头像")
    public R<?> uploadAvatar(@RequestParam("file") MultipartFile file, HttpServletRequest request) throws IOException {
        Long uid = (Long) request.getAttribute("currentUserId");
        if (uid == null) {
            return R.fail(401, "未登录或Token无效");
        }
        SysUser existing = sysUserMapper.selectById(uid);
        if (existing == null) {
            return R.fail(404, "用户不存在");
        }
        if (file == null || file.isEmpty()) {
            return R.fail(400, "请选择头像图片");
        }
        if (file.getSize() > MAX_AVATAR_SIZE) {
            return R.fail(400, "头像图片不能超过2MB");
        }

        String extension = resolveAvatarExtension(file);
        String fileName = uid + "_" + UUID.randomUUID().toString().replace("-", "") + "." + extension;
        Path avatarDir = Paths.get(uploadPath).toAbsolutePath().normalize().resolve("avatar");
        Files.createDirectories(avatarDir);
        Path target = avatarDir.resolve(fileName).normalize();
        if (!target.startsWith(avatarDir)) {
            return R.fail(400, "头像文件名不合法");
        }
        file.transferTo(target.toFile());

        String avatarUrl = "/upload/avatar/" + fileName;
        existing.setAvatar(avatarUrl);
        sysUserMapper.updateById(existing);
        try {
            redisUtils.delete(com.medical.common.constant.RedisKeyConstant.buildUserKey(uid));
        } catch (Exception ignored) {
        }

        Map<String, String> data = new HashMap<>();
        data.put("avatar", avatarUrl);
        return R.ok("头像上传成功", data);
    }

    @GetMapping("/logs")
    public R<?> operationLogs(@RequestParam(defaultValue = "1") Integer pageNum,
                              @RequestParam(defaultValue = "20") Integer pageSize,
                              HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("currentUserId");
        if (userId == null) return R.fail(401, "未登录或Token无效");
        Page<SysOperationLog> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<SysOperationLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysOperationLog::getUserId, userId);
        wrapper.orderByDesc(SysOperationLog::getCreateTime);
        return R.ok(sysOperationLogMapper.selectPage(page, wrapper));
    }

    @GetMapping("/messages")
    public R<?> messages(@RequestParam(defaultValue = "1") Integer pageNum,
                         @RequestParam(defaultValue = "20") Integer pageSize,
                         @RequestParam(required = false) Integer isRead,
                         HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("currentUserId");
        if (userId == null) return R.fail(401, "未登录或Token无效");
        Page<SysMessage> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<SysMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysMessage::getUserId, userId);
        if (isRead != null) wrapper.eq(SysMessage::getIsRead, isRead);
        wrapper.orderByDesc(SysMessage::getCreateTime);
        return R.ok(sysMessageMapper.selectPage(page, wrapper));
    }

    @GetMapping("/messages/unread-count")
    public R<?> unreadCount(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("currentUserId");
        if (userId == null) return R.fail(401, "未登录或Token无效");
        LambdaQueryWrapper<SysMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysMessage::getUserId, userId);
        wrapper.eq(SysMessage::getIsRead, 0);
        return R.ok(sysMessageMapper.selectCount(wrapper));
    }

    @PutMapping("/messages/{id}/read")
    public R<?> markRead(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("currentUserId");
        if (userId == null) return R.fail(401, "未登录或Token无效");
        SysMessage msg = sysMessageMapper.selectById(id);
        if (msg == null || !userId.equals(msg.getUserId())) return R.fail(404, "消息不存在");
        msg.setIsRead(1);
        sysMessageMapper.updateById(msg);
        return R.ok("已读");
    }

    @PutMapping("/messages/read-all")
    public R<?> markAllRead(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("currentUserId");
        if (userId == null) return R.fail(401, "未登录或Token无效");
        LambdaQueryWrapper<SysMessage> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysMessage::getUserId, userId);
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

    private String resolveAvatarExtension(MultipartFile file) {
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        return switch (contentType) {
            case "image/jpeg", "image/jpg" -> "jpg";
            case "image/png" -> "png";
            case "image/gif" -> "gif";
            case "image/webp" -> "webp";
            default -> throw new com.medical.common.exception.BusinessException(400, "头像只支持jpg、png、gif或webp图片");
        };
    }
}
