package com.medical.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SensitiveDataSanitizerTest {

    private final SensitiveDataSanitizer sanitizer =
            new SensitiveDataSanitizer(new ObjectMapper());

    @Test
    void recursivelyMasksSensitiveFieldsInNestedObjectsAndArrays() {
        Map<String, Object> value = Map.of(
                "username", "doctor01",
                "password", "Plain123",
                "nested", List.of(Map.of(
                        "accessToken", "jwt-secret",
                        "captchaCode", "1234")));

        String sanitized = sanitizer.serialize(value, 1000);

        assertTrue(sanitized.contains("doctor01"));
        assertTrue(sanitized.contains("***"));
        assertFalse(sanitized.contains("Plain123"));
        assertFalse(sanitized.contains("jwt-secret"));
        assertFalse(sanitized.contains("1234"));
    }
}
