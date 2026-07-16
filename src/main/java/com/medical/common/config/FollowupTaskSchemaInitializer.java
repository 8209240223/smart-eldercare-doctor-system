package com.medical.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(120)
public class FollowupTaskSchemaInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(FollowupTaskSchemaInitializer.class);
    private final JdbcTemplate jdbcTemplate;

    public FollowupTaskSchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!existsInInformationSchema("COLUMNS", "COLUMN_NAME", "plan_id")) {
            jdbcTemplate.execute("ALTER TABLE followup_task ADD COLUMN plan_id BIGINT DEFAULT NULL " +
                    "COMMENT '关联随访计划ID' AFTER elder_id");
            log.info("已为 followup_task 补充 plan_id 字段");
        }
        if (!existsInInformationSchema("COLUMNS", "COLUMN_NAME", "nurse_id")) {
            jdbcTemplate.execute("ALTER TABLE followup_task ADD COLUMN nurse_id BIGINT DEFAULT NULL " +
                    "COMMENT '任务执行护士ID' AFTER doctor_id");
            log.info("已为 followup_task 补充 nurse_id 字段");
        }
        if (!existsInInformationSchema("STATISTICS", "INDEX_NAME", "idx_plan_id")) {
            jdbcTemplate.execute("ALTER TABLE followup_task ADD INDEX idx_plan_id (plan_id)");
            log.info("已为 followup_task 补充 idx_plan_id 索引");
        }
        if (!existsInInformationSchema("STATISTICS", "INDEX_NAME", "idx_nurse_id")) {
            jdbcTemplate.execute("ALTER TABLE followup_task ADD INDEX idx_nurse_id (nurse_id)");
            log.info("已为 followup_task 补充 idx_nurse_id 索引");
        }
        int assigned = jdbcTemplate.update("UPDATE followup_task ft " +
                "LEFT JOIN elder_info ei ON ei.id = ft.elder_id " +
                "LEFT JOIN doctor_nurse_relation preferred ON preferred.doctor_id = ft.doctor_id " +
                "AND preferred.nurse_id = ei.nurse_id AND preferred.status = 1 " +
                "LEFT JOIN (SELECT doctor_id, MIN(nurse_id) AS nurse_id FROM doctor_nurse_relation " +
                "WHERE status = 1 GROUP BY doctor_id) fallback ON fallback.doctor_id = ft.doctor_id " +
                "SET ft.nurse_id = COALESCE(preferred.nurse_id, fallback.nurse_id) " +
                "WHERE ft.nurse_id IS NULL");
        if (assigned > 0) {
            log.info("已为 {} 条历史随访任务补充分配护士", assigned);
        }
    }

    private boolean existsInInformationSchema(String table, String field, String value) {
        String sql = "SELECT COUNT(*) FROM information_schema." + table
                + " WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'followup_task' AND " + field + " = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, value);
        return count != null && count > 0;
    }
}
