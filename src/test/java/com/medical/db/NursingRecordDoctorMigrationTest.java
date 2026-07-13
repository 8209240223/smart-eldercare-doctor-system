package com.medical.db;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertTrue;

class NursingRecordDoctorMigrationTest {

    @Test
    void schemaDefinesTargetDoctorColumnAndIndexForNewDatabases() throws IOException {
        ClassPathResource resource = new ClassPathResource("db/schema.sql");
        String schema;
        try (var input = resource.getInputStream()) {
            schema = new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }

        assertTrue(schema.contains("doctor_id BIGINT DEFAULT NULL COMMENT '目标责任医生ID'"));
        assertTrue(schema.contains("KEY idx_doctor_id (doctor_id)"));
        assertTrue(schema.contains("LEFT JOIN doctor_info legacy_doctor"));
        assertTrue(schema.contains("legacy_doctor.user_id"));
        assertTrue(schema.contains("UPDATE elder_info e"));
        assertTrue(schema.contains("UPDATE nursing_plan np"));
    }
}
