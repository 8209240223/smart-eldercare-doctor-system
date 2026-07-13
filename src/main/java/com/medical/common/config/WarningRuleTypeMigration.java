package com.medical.common.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class WarningRuleTypeMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public WarningRuleTypeMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.update("UPDATE warning_rule SET rule_type = CASE "
                + "WHEN metric_code IN ('systolic', 'diastolic') THEN 1 "
                + "WHEN metric_code IN ('bloodSugarFasting', 'bloodSugarPostprandial') THEN 2 "
                + "WHEN metric_code = 'heartRate' THEN 3 "
                + "WHEN metric_code = 'temperature' THEN 4 "
                + "WHEN metric_code = 'bmi' THEN 5 "
                + "WHEN metric_code IN ('spo2', 'bloodOxygen', 'steps', 'sleep') THEN 6 "
                + "ELSE rule_type END");
    }
}
