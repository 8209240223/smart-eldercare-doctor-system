package com.medical.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
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
        if (!existsInInformationSchema("STATISTICS", "INDEX_NAME", "idx_plan_id")) {
            jdbcTemplate.execute("ALTER TABLE followup_task ADD INDEX idx_plan_id (plan_id)");
            log.info("已为 followup_task 补充 idx_plan_id 索引");
        }
    }

    private boolean existsInInformationSchema(String table, String field, String value) {
        String sql = "SELECT COUNT(*) FROM information_schema." + table
                + " WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'followup_task' AND " + field + " = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, value);
        return count != null && count > 0;
    }
}
