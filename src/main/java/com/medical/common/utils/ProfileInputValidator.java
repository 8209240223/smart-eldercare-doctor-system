package com.medical.common.utils;

import com.medical.common.exception.BusinessException;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.regex.Pattern;

public final class ProfileInputValidator {

    private static final Pattern REAL_NAME_PATTERN = Pattern.compile("^[\\p{IsHan}A-Za-z0-9·.\\s]{2,30}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,253}\\.[A-Za-z]{2,20}$");
    private static final Pattern UPLOADED_AVATAR_PATTERN = Pattern.compile("^/upload/avatar/[A-Za-z0-9._-]+\\.(png|jpe?g|gif|webp)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern HTTP_AVATAR_PATTERN = Pattern.compile("^https?://[^\\s?#]+\\.(png|jpe?g|gif|webp)([?#][^\\s]*)?$", Pattern.CASE_INSENSITIVE);

    private ProfileInputValidator() {
    }

    public static String optionalRealName(String realName) {
        String value = trim(realName);
        if (!StringUtils.hasText(value)) {
            return null;
        }
        if (!REAL_NAME_PATTERN.matcher(value).matches()) {
            throw new BusinessException(400, "姓名必须为2-30位中文、字母、数字、空格、点号或间隔号");
        }
        return value;
    }

    public static String optionalEmail(String email) {
        String value = trim(email);
        if (!StringUtils.hasText(value)) {
            return null;
        }
        if (value.length() > 100 || !EMAIL_PATTERN.matcher(value).matches()) {
            throw new BusinessException(400, "邮箱格式不正确");
        }
        return value.toLowerCase(Locale.ROOT);
    }

    public static String optionalAvatar(String avatar) {
        String value = trim(avatar);
        if (!StringUtils.hasText(value)) {
            return null;
        }
        if (value.length() > 500) {
            throw new BusinessException(400, "头像地址长度不能超过500个字符");
        }
        if (UPLOADED_AVATAR_PATTERN.matcher(value).matches() || HTTP_AVATAR_PATTERN.matcher(value).matches()) {
            return value;
        }
        throw new BusinessException(400, "头像必须通过图片上传生成，或使用有效的http/https图片地址");
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }
}
