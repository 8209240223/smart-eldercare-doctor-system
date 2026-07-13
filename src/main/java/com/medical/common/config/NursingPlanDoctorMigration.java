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

        jdbcTemplate.update("UPDATE elder_info e "
                + "LEFT JOIN sys_user assigned_doctor ON assigned_doctor.id = e.doctor_id "
                + "LEFT JOIN doctor_info legacy_doctor ON legacy_doctor.id = e.doctor_id "
                + "LEFT JOIN sys_user legacy_user ON legacy_user.id = legacy_doctor.user_id "
                + "SET e.doctor_id = CASE WHEN legacy_user.id IS NOT NULL "
                + "AND legacy_user.user_type = 2 AND legacy_user.status = 1 AND legacy_user.deleted = 0 "
                + "THEN legacy_user.id ELSE NULL END "
                + "WHERE e.deleted = 0 AND (e.doctor_id IS NULL OR assigned_doctor.id IS NULL "
                + "OR assigned_doctor.user_type <> 2 OR assigned_doctor.status <> 1 "
                + "OR assigned_doctor.deleted = 1)");

        jdbcTemplate.update("UPDATE nursing_plan np "
                + "JOIN elder_info e ON e.id = np.elder_id AND e.deleted = 0 "
                + "JOIN sys_user elder_doctor ON elder_doctor.id = e.doctor_id "
                + "LEFT JOIN sys_user assigned_doctor ON assigned_doctor.id = np.doctor_id "
                + "SET np.doctor_id = e.doctor_id WHERE np.deleted = 0 "
                + "AND elder_doctor.user_type = 2 AND elder_doctor.status = 1 AND elder_doctor.deleted = 0 "
                + "AND (np.doctor_id IS NULL OR assigned_doctor.id IS NULL "
                + "OR assigned_doctor.user_type <> 2 OR assigned_doctor.status <> 1 "
                + "OR assigned_doctor.deleted = 1)");

        Integer recordDoctorColumnCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'nursing_record' AND COLUMN_NAME = 'doctor_id'",
                Integer.class);
        if (recordDoctorColumnCount == null || recordDoctorColumnCount == 0) {
            jdbcTemplate.execute("ALTER TABLE nursing_record ADD COLUMN doctor_id BIGINT DEFAULT NULL COMMENT '目标责任医生ID' AFTER nurse_id");
        }

        Integer recordDoctorIndexCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.STATISTICS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'nursing_record' AND INDEX_NAME = 'idx_doctor_id'",
                Integer.class);
        if (recordDoctorIndexCount == null || recordDoctorIndexCount == 0) {
            jdbcTemplate.execute("ALTER TABLE nursing_record ADD INDEX idx_doctor_id (doctor_id)");
        }

        jdbcTemplate.update("UPDATE nursing_record nr "
                + "LEFT JOIN elder_info e ON e.id = nr.elder_id AND e.deleted = 0 "
                + "LEFT JOIN sys_user assigned_doctor ON assigned_doctor.id = nr.doctor_id "
                + "LEFT JOIN sys_user review_doctor ON review_doctor.id = nr.review_doctor_id "
                + "LEFT JOIN sys_user elder_doctor ON elder_doctor.id = e.doctor_id "
                + "SET nr.doctor_id = CASE "
                + "WHEN review_doctor.id IS NOT NULL AND review_doctor.user_type = 2 "
                + "AND review_doctor.status = 1 AND review_doctor.deleted = 0 THEN nr.review_doctor_id "
                + "WHEN elder_doctor.id IS NOT NULL AND elder_doctor.user_type = 2 "
                + "AND elder_doctor.status = 1 AND elder_doctor.deleted = 0 THEN e.doctor_id "
                + "ELSE NULL END WHERE nr.deleted = 0 "
                + "AND (nr.doctor_id IS NULL OR assigned_doctor.id IS NULL "
                + "OR assigned_doctor.user_type <> 2 OR assigned_doctor.status <> 1 "
                + "OR assigned_doctor.deleted = 1)");
    }
}
