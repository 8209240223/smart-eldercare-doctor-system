package com.medical.common.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class NursingPlanDoctorMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public NursingPlanDoctorMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        Integer columnCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'nursing_plan' AND COLUMN_NAME = 'doctor_id'",
                Integer.class);
        if (columnCount == null || columnCount == 0) {
            jdbcTemplate.execute("ALTER TABLE nursing_plan ADD COLUMN doctor_id BIGINT DEFAULT NULL COMMENT '责任医生ID' AFTER nurse_id");
        }

        Integer indexCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.STATISTICS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'nursing_plan' AND INDEX_NAME = 'idx_doctor_id'",
                Integer.class);
        if (indexCount == null || indexCount == 0) {
            jdbcTemplate.execute("ALTER TABLE nursing_plan ADD INDEX idx_doctor_id (doctor_id)");
        }

        jdbcTemplate.update("UPDATE nursing_plan np JOIN elder_info e ON e.id = np.elder_id "
                + "SET np.doctor_id = e.doctor_id WHERE np.doctor_id IS NULL");
    }
}
