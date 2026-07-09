package com.medical.controller;

import com.medical.common.result.R;
import com.medical.common.annotation.OperationLog;
import com.medical.common.utils.AccountSecurityValidator;
import com.medical.entity.SysMessage;
import com.medical.mapper.SysMessageMapper;
import com.medical.service.AuthService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

/**
 * 登录认证控制器
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private CaptchaController captchaController;

    @Autowired
    private SysMessageMapper sysMessageMapper;

    @PostMapping("/login")
    public R<?> login(@RequestBody LoginDTO loginDTO, HttpServletRequest request) {
        if (loginDTO == null || !StringUtils.hasText(loginDTO.getUsername()) || !StringUtils.hasText(loginDTO.getPassword())) {
            return R.fail(400, "用户名和密码不能为空");
        }
        if (!verifyCaptcha(loginDTO.getCaptchaKey(), loginDTO.getCaptchaCode())) {
            return R.fail(400, "验证码错误或已过期");
        }
        String ip = request.getRemoteAddr();
        return R.ok("登录成功", authService.login(loginDTO.getUsername(), loginDTO.getPassword(), ip));
    }

    @GetMapping("/info")
    public R<?> getUserInfo(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("currentUserId");
        return R.ok(authService.getUserInfo(userId));
    }

    @PostMapping("/logout")
    public R<?> logout(HttpServletRequest request) {
        // 从请求中获取 tokenId（前端可在登出时携带 tokenId 参数）
        String tokenId = request.getParameter("tokenId");
        authService.logout(tokenId);
        return R.ok("退出成功");
    }

    @PutMapping("/password")
    @OperationLog(module = "账号安全", type = "修改密码", desc = "个人中心修改登录密码")
    public R<?> changePassword(@RequestBody PasswordDTO dto, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("currentUserId");
        if (dto == null || !StringUtils.hasText(dto.getOldPassword()) || !StringUtils.hasText(dto.getNewPassword())) {
            return R.fail(400, "参数不完整");
        }
        AccountSecurityValidator.requirePasswordConfirmed(dto.getNewPassword(), dto.getConfirmPassword());
        authService.changePassword(userId, dto.getOldPassword(), dto.getNewPassword());
        createSystemMessage(userId, "密码修改成功", "你的登录密码已修改，请妥善保管账号信息。", "profile_password");
        return R.ok("密码修改成功，请重新登录");
    }

    /**
     * 用户注册
     */
    @PostMapping("/register")
    public R<?> register(@RequestBody RegisterDTO dto) {
        if (dto == null || !StringUtils.hasText(dto.getUsername()) || !StringUtils.hasText(dto.getPassword())) {
            return R.fail(400, "用户名和密码不能为空");
        }
        AccountSecurityValidator.requirePasswordConfirmed(dto.getPassword(), dto.getConfirmPassword());
        if (!verifyCaptcha(dto.getCaptchaKey(), dto.getCaptchaCode())) {
            return R.fail(400, "验证码错误或已过期");
        }
        authService.validateRegistration(dto.getUsername(), dto.getPassword(),
                dto.getRealName(), dto.getPhone(), dto.getUserType());
        authService.register(dto.getUsername(), dto.getPassword(),
                dto.getRealName(), dto.getPhone(), dto.getUserType());
        return R.ok("注册成功，请登录");
    }

    /**
     * 密码找回(模拟实现 - 通过手机号验证)
     */
    @PostMapping("/resetPassword")
    @OperationLog(module = "账号安全", type = "重置密码", desc = "登录页找回密码")
    public R<?> resetPassword(@RequestBody ResetPasswordDTO dto) {
        if (dto == null || !StringUtils.hasText(dto.getUsername())
                || !StringUtils.hasText(dto.getPhone())
                || !StringUtils.hasText(dto.getNewPassword())) {
            return R.fail(400, "参数不完整");
        }
        AccountSecurityValidator.requirePasswordConfirmed(dto.getNewPassword(), dto.getConfirmPassword());
        if (!verifyCaptcha(dto.getCaptchaKey(), dto.getCaptchaCode())) {
            return R.fail(400, "验证码错误或已过期");
        }
        authService.resetPassword(dto.getUsername(), dto.getPhone(), dto.getNewPassword(), dto.getConfirmPassword());
        return R.ok("密码重置成功，请使用新密码登录");
    }

    @Data
    static class LoginDTO {
        private String username;
        private String password;
        private String captchaKey;
        private String captchaCode;
    }

    @Data
    static class PasswordDTO {
        private String oldPassword;
        private String newPassword;
        private String confirmPassword;
    }

    @Data
    static class ResetPasswordDTO {
        private String username;
        private String phone;
        private String newPassword;
        private String confirmPassword;
        private String captchaKey;
        private String captchaCode;
    }

    @Data
    static class RegisterDTO {
        private String username;
        private String password;
        private String confirmPassword;
        private String realName;
        private String phone;
        private Integer userType;
        private String captchaKey;
        private String captchaCode;
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

    private boolean verifyCaptcha(String captchaKey, String captchaCode) {
        return StringUtils.hasText(captchaKey)
                && StringUtils.hasText(captchaCode)
                && captchaController.verify(captchaKey, captchaCode);
    }
}
