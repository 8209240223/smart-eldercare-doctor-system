package com.medical.common.utils;

import cn.hutool.crypto.digest.BCrypt;
import com.medical.common.exception.BusinessException;
import org.springframework.util.StringUtils;

import java.util.regex.Pattern;

/**
 * 账号安全相关的统一校验规则。
 */
public final class AccountSecurityValidator {

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[\\p{IsHan}A-Za-z0-9_]{4,20}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&._-]{8,20}$");

    private AccountSecurityValidator() {
    }

    public static String requireUsername(String username) {
        String value = trim(username);
        if (!StringUtils.hasText(value) || !USERNAME_PATTERN.matcher(value).matches()) {
            throw new BusinessException(400, "用户名必须为4-20位中文、字母、数字或下划线");
        }
        return value;
    }

    public static String requirePhone(String phone) {
        String value = trim(phone);
        if (!StringUtils.hasText(value) || !PHONE_PATTERN.matcher(value).matches()) {
            throw new BusinessException(400, "手机号必须为11位中国大陆手机号");
        }
        return value;
    }

    public static String optionalPhone(String phone) {
        String value = trim(phone);
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return requirePhone(value);
    }

    public static void requireStrongPassword(String password) {
        if (!StringUtils.hasText(password) || !PASSWORD_PATTERN.matcher(password).matches()) {
            throw new BusinessException(400, "密码必须为8-20位，至少包含字母和数字，可使用@$!%*#?&._-");
        }
    }

    public static void requirePasswordConfirmed(String password, String confirmPassword) {
        if (!StringUtils.hasText(confirmPassword)) {
            throw new BusinessException(400, "请确认密码");
        }
        if (!password.equals(confirmPassword)) {
            throw new BusinessException(400, "两次输入的密码不一致");
        }
    }

    public static void requireDifferentFromStoredPassword(String newPassword, String storedPassword) {
        if (matchesStoredPassword(newPassword, storedPassword)) {
            throw new BusinessException(400, "新密码不能与当前密码相同");
        }
    }

    public static boolean matchesStoredPassword(String rawPassword, String storedPassword) {
        if (rawPassword == null || storedPassword == null) {
            return false;
        }
        if (isBcryptPassword(storedPassword)) {
            try {
                return BCrypt.checkpw(rawPassword, storedPassword);
            } catch (Exception e) {
                return false;
            }
        }
        return rawPassword.equals(storedPassword);
    }

    public static boolean isBcryptPassword(String storedPassword) {
        return storedPassword != null
                && (storedPassword.startsWith("$2a$")
                || storedPassword.startsWith("$2b$")
                || storedPassword.startsWith("$2y$"));
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }
}
