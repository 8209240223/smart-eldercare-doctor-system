package com.medical.common.utils;

import org.springframework.util.StringUtils;

import java.util.Set;

public final class DisabilityStatusSupport {

    private static final Set<String> NONE_VALUES = Set.of("无", "无残疾", "无失能", "正常");
    private static final Set<String> DISABILITY_VALUES = Set.of(
            "轻度失能", "部分失能", "中度失能", "重度失能", "完全失能",
            "视力残疾", "听力残疾", "言语残疾", "肢体残疾", "智力残疾",
            "精神残疾", "多重残疾", "其他残疾");

    private DisabilityStatusSupport() {
    }

    public static boolean isValid(String value) {
        if (!StringUtils.hasText(value)) {
            return true;
        }
        String normalized = value.trim();
        return NONE_VALUES.contains(normalized) || DISABILITY_VALUES.contains(normalized);
    }

    public static String normalize(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String normalized = value.trim();
        return NONE_VALUES.contains(normalized) ? "无" : normalized;
    }

    public static boolean hasConfirmedDisability(String value) {
        return StringUtils.hasText(value) && DISABILITY_VALUES.contains(value.trim());
    }
}
