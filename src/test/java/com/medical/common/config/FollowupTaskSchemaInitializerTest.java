package com.medical.common.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FollowupTaskSchemaInitializerTest {

    @Test
    void addsMissingColumnAndIndex() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        FollowupTaskSchemaInitializer initializer = new FollowupTaskSchemaInitializer(jdbcTemplate);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), anyString()))
                .thenReturn(0, 0, 0, 0);

        initializer.run(new DefaultApplicationArguments(new String[0]));

        verify(jdbcTemplate).execute(org.mockito.ArgumentMatchers.contains("ADD COLUMN plan_id"));
        verify(jdbcTemplate).execute(org.mockito.ArgumentMatchers.contains("ADD COLUMN nurse_id"));
        verify(jdbcTemplate).execute(org.mockito.ArgumentMatchers.contains("ADD INDEX idx_plan_id"));
        verify(jdbcTemplate).execute(org.mockito.ArgumentMatchers.contains("ADD INDEX idx_nurse_id"));
        verify(jdbcTemplate).update(org.mockito.ArgumentMatchers.contains("UPDATE followup_task"));
    }

    @Test
    void reusesExistingColumnAndIndexWithoutAlter() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        FollowupTaskSchemaInitializer initializer = new FollowupTaskSchemaInitializer(jdbcTemplate);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), anyString()))
                .thenReturn(1, 1, 1, 1);

        initializer.run(new DefaultApplicationArguments(new String[0]));

        verify(jdbcTemplate, never()).execute(anyString());
    }
}
