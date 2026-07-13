package com.medical.message.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MessageSchemaInitializerTest {

    @Test
    void addsOnlyMissingColumnsAndIndexesWithoutDeletingData() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(1);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), anyString())).thenReturn(0);
        MessageSchemaInitializer initializer = new MessageSchemaInitializer(jdbcTemplate);

        initializer.run(new DefaultApplicationArguments(new String[0]));

        verify(jdbcTemplate, atLeastOnce()).execute(org.mockito.ArgumentMatchers.contains("ALTER TABLE sys_message ADD COLUMN"));
        verify(jdbcTemplate, atLeastOnce()).execute(org.mockito.ArgumentMatchers.contains("ALTER TABLE sys_message ADD INDEX"));
        verify(jdbcTemplate, never()).execute(org.mockito.ArgumentMatchers.matches("(?i).*(delete|truncate|drop).*"));
    }

    @Test
    void doesNothingWhenSchemaIsAlreadyCurrent() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(1);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), anyString())).thenReturn(1);
        MessageSchemaInitializer initializer = new MessageSchemaInitializer(jdbcTemplate);

        initializer.run(new DefaultApplicationArguments(new String[0]));

        verify(jdbcTemplate, never()).execute(anyString());
    }
}
