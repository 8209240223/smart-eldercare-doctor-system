package com.medical.controller;

import com.medical.common.result.R;
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

    @PostMapping("/login")
    public R<?> login(@RequestBody LoginDTO loginDTO, HttpServletRequest request) {
        if (!StringUtils.hasText(loginDTO.getUsername()) || !StringUtils.hasText(loginDTO.getPassword())) {
            return R.fail(400, "用户名和密码不能为空");
        }
        // 验证码校验（基于Redis分布式存储）
        if (StringUtils.hasText(loginDTO.getCaptchaKey())) {
            if (!captchaController.verify(loginDTO.getCaptchaKey(), loginDTO.getCaptchaCode())) {
                return R.fail(400, "验证码错误或已过期");
            }
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
    public R<?> changePassword(@RequestBody PasswordDTO dto, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("currentUserId");
        authService.changePassword(userId, dto.getOldPassword(), dto.getNewPassword());
        return R.ok("密码修改成功，请重新登录");
    }

    /**
     * 用户注册
     */
    @PostMapping("/register")
    public R<?> register(@RequestBody RegisterDTO dto) {
        if (!StringUtils.hasText(dto.getUsername()) || !StringUtils.hasText(dto.getPassword())) {
            return R.fail(400, "用户名和密码不能为空");
        }
        if (!StringUtils.hasText(dto.getConfirmPassword())) {
            return R.fail(400, "请确认密码");
        }
        if (!dto.getPassword().equals(dto.getConfirmPassword())) {
            return R.fail(400, "两次输入的密码不一致");
        }
        if (dto.getPassword().length() < 6) {
            return R.fail(400, "密码至少6位");
        }
        // 验证码校验
        if (StringUtils.hasText(dto.getCaptchaKey())) {
            if (!captchaController.verify(dto.getCaptchaKey(), dto.getCaptchaCode())) {
                return R.fail(400, "验证码错误或已过期");
            }
        }
        authService.register(dto.getUsername(), dto.getPassword(),
                dto.getRealName(), dto.getPhone(), dto.getUserType());
        return R.ok("注册成功，请登录");
    }

    /**
     * 密码找回(模拟实现 - 通过手机号验证)
     */
    @PostMapping("/resetPassword")
    public R<?> resetPassword(@RequestBody ResetPasswordDTO dto) {
        if (!StringUtils.hasText(dto.getUsername()) || !StringUtils.hasText(dto.getNewPassword())) {
            return R.fail(400, "参数不完整");
        }
        if (dto.getNewPassword().length() < 6) {
            return R.fail(400, "新密码至少6位");
        }
        authService.resetPassword(dto.getUsername(), dto.getNewPassword());
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
    }

    @Data
    static class ResetPasswordDTO {
        private String username;
        private String phone;
        private String newPassword;
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
}
