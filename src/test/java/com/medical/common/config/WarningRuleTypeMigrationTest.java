package com.medical.common.config;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class WarningRuleTypeMigrationTest {

    @Test
    void normalizesHistoricalRuleTypesFromMetricCodes() throws Exception {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        WarningRuleTypeMigration migration = new WarningRuleTypeMigration(jdbcTemplate);

        migration.run(null);

        verify(jdbcTemplate).update(contains("WHEN metric_code = 'heartRate' THEN 3"));
    }
}
