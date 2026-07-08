package com.medical.common.utils;

import cn.hutool.crypto.digest.BCrypt;
import com.medical.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AccountSecurityValidatorTest {

    @Test
    void requireStrongPasswordRejectsWeakPassword() {
        assertThrows(BusinessException.class,
                () -> AccountSecurityValidator.requireStrongPassword("123456"));
    }

    @Test
    void requireStrongPasswordAcceptsLetterAndNumberPassword() {
        assertDoesNotThrow(() -> AccountSecurityValidator.requireStrongPassword("Doctor123"));
    }

    @Test
    void requirePhoneRejectsInvalidMobilePrefix() {
        assertThrows(BusinessException.class,
                () -> AccountSecurityValidator.requirePhone("11000000000"));
    }

    @Test
    void requirePhoneAcceptsMainlandMobile() {
        assertDoesNotThrow(() -> AccountSecurityValidator.requirePhone("13800000001"));
    }

    @Test
    void matchesStoredPasswordSupportsBcryptAndPlainText() {
        String hashed = BCrypt.hashpw("Doctor123");

        assertTrue(AccountSecurityValidator.matchesStoredPassword("Doctor123", hashed));
        assertTrue(AccountSecurityValidator.matchesStoredPassword("doctor123", "doctor123"));
        assertFalse(AccountSecurityValidator.matchesStoredPassword("Doctor124", hashed));
    }
}
