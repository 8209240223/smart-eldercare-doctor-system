package com.medical.common.config;

import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NursingPlanDoctorMigrationTest {

    @Test
    void repairsOnlyInvalidDoctorAssignmentsAcrossNursingWorkflow() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.queryForObject(contains("TABLE_NAME = 'nursing_plan'"),
                org.mockito.ArgumentMatchers.eq(Integer.class))).thenReturn(1, 1);
        when(jdbcTemplate.queryForObject(contains("TABLE_NAME = 'nursing_record'"),
                org.mockito.ArgumentMatchers.eq(Integer.class))).thenReturn(1, 1);

        new NursingPlanDoctorMigration(jdbcTemplate).run(null);

        verify(jdbcTemplate).update(contains("UPDATE elder_info e"));
        verify(jdbcTemplate).update(contains("legacy_doctor.user_id"));
        verify(jdbcTemplate).update(contains("UPDATE nursing_plan np"));
        verify(jdbcTemplate).update(contains("UPDATE nursing_record nr"));
        verify(jdbcTemplate).update(argThat((String sql) -> sql.contains("UPDATE nursing_record nr")
                && sql.contains("review_doctor.user_type = 2")
                && sql.contains("elder_doctor.user_type = 2")));
    }

    @Test
    void addsMissingRecordDoctorColumnAndIndexBeforeBackfill() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.queryForObject(contains("TABLE_NAME = 'nursing_plan'"),
                org.mockito.ArgumentMatchers.eq(Integer.class))).thenReturn(1, 1);
        when(jdbcTemplate.queryForObject(contains("TABLE_NAME = 'nursing_record'"),
                org.mockito.ArgumentMatchers.eq(Integer.class))).thenReturn(0, 0);

        new NursingPlanDoctorMigration(jdbcTemplate).run(null);

        InOrder migrationOrder = inOrder(jdbcTemplate);
        migrationOrder.verify(jdbcTemplate).execute(contains("ADD COLUMN doctor_id"));
        migrationOrder.verify(jdbcTemplate).execute(contains("ADD INDEX idx_doctor_id"));
        migrationOrder.verify(jdbcTemplate).update(contains("UPDATE nursing_record nr"));
    }
}
