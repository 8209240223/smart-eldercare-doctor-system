package com.medical.common.config;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SystemDataIsolationTest {

    @Test
    void automaticStartupDataDoesNotInsertEldersOrElderBusinessRecords() throws Exception {
        ClassPathResource resource = new ClassPathResource("db/system-data.sql");
        String sql;
        try (var input = resource.getInputStream()) {
            sql = new String(input.readAllBytes(), StandardCharsets.UTF_8).toLowerCase();
        }

        assertTrue(sql.contains("insert ignore into sys_user"));
        assertTrue(sql.contains("insert ignore into assessment_rule"));
        for (String table : new String[]{
                "elder_info",
                "health_record",
                "medical_history",
                "follow_plan",
                "follow_record",
                "ai_health_report",
                "nursing_plan",
                "nursing_record"
        }) {
            assertFalse(sql.contains("insert ignore into " + table),
                    "startup system data must not insert into " + table);
        }
    }
}
