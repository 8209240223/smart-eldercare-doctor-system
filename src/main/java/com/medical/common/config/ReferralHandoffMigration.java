package com.medical.common.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(50)
public class ReferralHandoffMigration implements ApplicationRunner {
    private final JdbcTemplate jdbcTemplate;

    public ReferralHandoffMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() "
                        + "AND TABLE_NAME = 'referral_order' AND COLUMN_NAME = 'from_dept'", Integer.class);
        if (count == null || count == 0) {
            jdbcTemplate.execute("ALTER TABLE referral_order ADD COLUMN from_dept VARCHAR(100) DEFAULT NULL "
                    + "COMMENT '转出医生科室' AFTER from_doctor_name");
        }
    }
}
