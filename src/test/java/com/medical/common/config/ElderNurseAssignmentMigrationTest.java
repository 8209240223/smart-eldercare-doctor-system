package com.medical.common.config;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ElderNurseAssignmentMigrationTest {
    @Test
    void addsMissingSchemaAndBackfillsWithoutDeletingElders() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(0, 0);
        when(jdbcTemplate.queryForList(contains("FROM sys_user"), eq(Long.class))).thenReturn(List.of(10L, 11L));
        when(jdbcTemplate.queryForList(contains("FROM elder_info"), eq(Long.class))).thenReturn(List.of(1L, 2L, 3L));

        new ElderNurseAssignmentMigration(jdbcTemplate).run(null);

        verify(jdbcTemplate).execute(contains("ADD COLUMN nurse_id"));
        verify(jdbcTemplate).execute(contains("ADD INDEX idx_nurse_id"));
        verify(jdbcTemplate).update(contains("UPDATE elder_info e JOIN"));
        verify(jdbcTemplate, times(3)).update(contains("SET nurse_id = ?"), anyLong(), anyLong());
        verify(jdbcTemplate, never()).execute(org.mockito.ArgumentMatchers.<String>argThat(
                sql -> sql.toUpperCase().contains("DELETE")));
    }

    @Test
    void existingAssignmentsAreNotOverwritten() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(1, 1);
        when(jdbcTemplate.queryForList(contains("FROM sys_user"), eq(Long.class))).thenReturn(List.of(10L));
        when(jdbcTemplate.queryForList(contains("FROM elder_info"), eq(Long.class))).thenReturn(List.of());

        new ElderNurseAssignmentMigration(jdbcTemplate).run(null);

        verify(jdbcTemplate, never()).execute(anyString());
        verify(jdbcTemplate, never()).update(contains("SET nurse_id = ?"), anyLong(), anyLong());
    }
}
