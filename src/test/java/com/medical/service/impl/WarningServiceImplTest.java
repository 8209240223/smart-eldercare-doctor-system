package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.HealthWarning;
import com.medical.mapper.HealthWarningMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class WarningServiceImplTest {

    @Test
    void realtimeTrendContainsTwentyFourAlignedBucketsEndingAtCurrentHour() {
        HealthWarningMapper mapper = mock(HealthWarningMapper.class);
        when(mapper.selectCount(any(Wrapper.class))).thenReturn(0L);
        when(mapper.selectPage(any(Page.class), any(Wrapper.class))).thenReturn(new Page<>());
        WarningServiceImpl service = new WarningServiceImpl();
        ReflectionTestUtils.setField(service, "healthWarningMapper", mapper);

        Map<String, Object> stats = service.getRealtimeStats();
        List<Map<String, Object>> trend = (List<Map<String, Object>>) stats.get("hourlyTrend");
        String expectedCurrentHour = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:00"));

        assertEquals(24, trend.size());
        assertEquals(expectedCurrentHour, trend.get(23).get("hour"));
        assertTrue(String.valueOf(trend.get(0).get("hour")).endsWith(":00"));
    }
}
