package com.medical.common.utils;

import com.medical.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProfileInputValidatorTest {

    @Test
    void optionalRealNameAcceptsChineseName() {
        assertEquals("系统管理员", ProfileInputValidator.optionalRealName(" 系统管理员 "));
    }

    @Test
    void optionalRealNameRejectsScriptText() {
        assertThrows(BusinessException.class,
                () -> ProfileInputValidator.optionalRealName("<script>alert(1)</script>"));
    }

    @Test
    void optionalEmailAcceptsValidAddressAndNormalizesCase() {
        assertEquals("doctor@example.com", ProfileInputValidator.optionalEmail(" Doctor@Example.COM "));
    }

    @Test
    void optionalEmailRejectsPlainText() {
        assertThrows(BusinessException.class,
                () -> ProfileInputValidator.optionalEmail("随便写"));
    }

    @Test
    void optionalAvatarAcceptsUploadedImagePath() {
        assertDoesNotThrow(() -> ProfileInputValidator.optionalAvatar("/upload/avatar/1_abcd1234.png"));
    }

    @Test
    void optionalAvatarRejectsLocalDiskPath() {
        assertThrows(BusinessException.class,
                () -> ProfileInputValidator.optionalAvatar("C:\\Users\\admin\\Desktop\\avatar.jpg"));
    }

    @Test
    void optionalAvatarAllowsClearingAvatar() {
        assertNull(ProfileInputValidator.optionalAvatar(" "));
    }
}
