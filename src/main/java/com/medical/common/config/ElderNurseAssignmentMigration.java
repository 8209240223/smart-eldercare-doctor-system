package com.medical.common.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(100)
public class ElderNurseAssignmentMigration implements ApplicationRunner {
    private final JdbcTemplate jdbcTemplate;

    public ElderNurseAssignmentMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        addNurseColumnIfMissing();
        addNurseIndexIfMissing();
        restoreAssignmentsFromNursingData();
        assignRemainingEldersRoundRobin();
    }

    private void addNurseColumnIfMissing() {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() "
                        + "AND TABLE_NAME = 'elder_info' AND COLUMN_NAME = 'nurse_id'", Integer.class);
        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE elder_info ADD COLUMN nurse_id BIGINT DEFAULT NULL "
                    + "COMMENT '责任护士ID' AFTER doctor_id");
        }
    }

    private void addNurseIndexIfMissing() {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() "
                        + "AND TABLE_NAME = 'elder_info' AND INDEX_NAME = 'idx_nurse_id'", Integer.class);
        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE elder_info ADD INDEX idx_nurse_id (nurse_id)");
        }
    }

    private void restoreAssignmentsFromNursingData() {
        jdbcTemplate.update("UPDATE elder_info e JOIN (SELECT elder_id, MIN(nurse_id) AS nurse_id FROM ("
                + "SELECT elder_id, nurse_id FROM nursing_plan WHERE deleted = 0 AND nurse_id IS NOT NULL "
                + "UNION ALL SELECT elder_id, nurse_id FROM nursing_record WHERE deleted = 0 AND nurse_id IS NOT NULL"
                + ") nursing GROUP BY elder_id) candidate ON candidate.elder_id = e.id "
                + "JOIN sys_user nurse ON nurse.id = candidate.nurse_id SET e.nurse_id = candidate.nurse_id "
                + "WHERE e.deleted = 0 AND e.nurse_id IS NULL AND nurse.user_type = 3 "
                + "AND nurse.status = 1 AND nurse.deleted = 0");
    }

    private void assignRemainingEldersRoundRobin() {
        List<Long> nurseIds = jdbcTemplate.queryForList(
                "SELECT id FROM sys_user WHERE user_type = 3 AND status = 1 AND deleted = 0 ORDER BY id",
                Long.class);
        if (nurseIds.isEmpty()) {
            return;
        }
        List<Long> elderIds = jdbcTemplate.queryForList(
                "SELECT id FROM elder_info WHERE deleted = 0 AND nurse_id IS NULL ORDER BY id",
                Long.class);
        for (int index = 0; index < elderIds.size(); index++) {
            jdbcTemplate.update("UPDATE elder_info SET nurse_id = ? WHERE id = ? AND nurse_id IS NULL",
                    nurseIds.get(index % nurseIds.size()), elderIds.get(index));
        }
    }
}
