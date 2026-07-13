package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.HealthWarning;
import com.medical.entity.WarningEventLog;
import com.medical.mapper.HealthWarningMapper;
import com.medical.mapper.WarningEventLogMapper;
import com.medical.service.ElderReferenceService;
import org.junit.jupiter.api.Test;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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

    @Test
    void realtimeRecentWarningsIncludeAllStatusesAndSortByNewestFirst() {
        TableInfoHelper.initTableInfo(
                new MapperBuilderAssistant(new MybatisConfiguration(), "WarningServiceImplTest"),
                HealthWarning.class);
        HealthWarningMapper mapper = mock(HealthWarningMapper.class);
        when(mapper.selectCount(any(Wrapper.class))).thenReturn(0L);
        when(mapper.selectPage(any(Page.class), any(Wrapper.class))).thenReturn(new Page<>());
        WarningServiceImpl service = new WarningServiceImpl();
        ReflectionTestUtils.setField(service, "healthWarningMapper", mapper);

        service.getRealtimeStats();

        ArgumentCaptor<Wrapper<HealthWarning>> wrapperCaptor = ArgumentCaptor.forClass(Wrapper.class);
        verify(mapper).selectPage(any(Page.class), wrapperCaptor.capture());
        String sqlSegment = wrapperCaptor.getValue().getSqlSegment().toLowerCase();

        assertFalse(sqlSegment.contains("status"));
        assertFalse(sqlSegment.contains("warning_level"));
        assertTrue(sqlSegment.contains("create_time"));
        assertTrue(sqlSegment.contains("id"));
        assertTrue(sqlSegment.indexOf("create_time") < sqlSegment.indexOf("id"));
    }

    @Test
    void warningListSortsByNewestFirstInsteadOfSeverity() {
        TableInfoHelper.initTableInfo(
                new MapperBuilderAssistant(new MybatisConfiguration(), "WarningListOrderTest"),
                HealthWarning.class);
        HealthWarningMapper mapper = mock(HealthWarningMapper.class);
        when(mapper.selectPage(any(Page.class), any(Wrapper.class))).thenReturn(new Page<>());
        WarningServiceImpl service = new WarningServiceImpl();
        ReflectionTestUtils.setField(service, "healthWarningMapper", mapper);

        service.list(1, 10, null, null, null);

        ArgumentCaptor<Wrapper<HealthWarning>> wrapperCaptor = ArgumentCaptor.forClass(Wrapper.class);
        verify(mapper).selectPage(any(Page.class), wrapperCaptor.capture());
        String sqlSegment = wrapperCaptor.getValue().getSqlSegment().toLowerCase();
        assertFalse(sqlSegment.contains("warning_level"));
        assertTrue(sqlSegment.contains("create_time"));
        assertTrue(sqlSegment.contains("id"));
    }

    @Test
    void listDistinguishesReadLogsFromLegacyProcessingLogs() {
        HealthWarningMapper warningMapper = mock(HealthWarningMapper.class);
        WarningEventLogMapper logMapper = mock(WarningEventLogMapper.class);
        HealthWarning readWarning = warning(1L);
        HealthWarning processingWarning = warning(2L);
        Page<HealthWarning> storedPage = new Page<>();
        storedPage.setRecords(List.of(readWarning, processingWarning));
        when(warningMapper.selectPage(any(Page.class), any(Wrapper.class))).thenReturn(storedPage);

        WarningEventLog readLog = eventLog(1L, "医生查看预警详情");
        WarningEventLog legacyProcessingLog = eventLog(2L, "预警标记为处理中");
        when(logMapper.selectList(any())).thenReturn(List.of(readLog, legacyProcessingLog));

        WarningServiceImpl service = new WarningServiceImpl();
        ReflectionTestUtils.setField(service, "healthWarningMapper", warningMapper);
        ReflectionTestUtils.setField(service, "warningEventLogMapper", logMapper);

        Page<HealthWarning> result = service.list(1, 10, null, null, null);

        assertTrue(result.getRecords().get(0).getRead());
        assertFalse(result.getRecords().get(1).getRead());
    }

    @Test
    void eventLogsLabelLegacyProcessingRecordsByTheirDetail() {
        WarningEventLogMapper logMapper = mock(WarningEventLogMapper.class);
        when(logMapper.selectList(any())).thenReturn(List.of(
                eventLog(1L, "预警标记为处理中"),
                eventLog(1L, "医生查看并标记预警为已读")));

        WarningServiceImpl service = new WarningServiceImpl();
        ReflectionTestUtils.setField(service, "warningEventLogMapper", logMapper);

        List<Map<String, Object>> logs = service.getEventLogs(1L);

        assertEquals("处理中", logs.get(0).get("eventTypeText"));
        assertEquals("已读", logs.get(1).get("eventTypeText"));
    }

    @Test
    void markingAnAlreadyReadWarningDoesNotInsertDuplicateLog() {
        HealthWarningMapper warningMapper = mock(HealthWarningMapper.class);
        WarningEventLogMapper logMapper = mock(WarningEventLogMapper.class);
        ElderReferenceService elderReferenceService = mock(ElderReferenceService.class);
        HealthWarning warning = warning(1L);
        when(warningMapper.selectById(1L)).thenReturn(warning);
        when(logMapper.selectList(any())).thenReturn(List.of(eventLog(1L, "医生查看预警详情")));

        WarningServiceImpl service = new WarningServiceImpl();
        ReflectionTestUtils.setField(service, "healthWarningMapper", warningMapper);
        ReflectionTestUtils.setField(service, "warningEventLogMapper", logMapper);
        ReflectionTestUtils.setField(service, "elderReferenceService", elderReferenceService);

        service.markAsRead(1L, 2L);

        verify(logMapper, never()).insert(any(WarningEventLog.class));
    }

    private HealthWarning warning(Long id) {
        HealthWarning warning = new HealthWarning();
        warning.setId(id);
        warning.setElderId(1L);
        warning.setStatus(0);
        return warning;
    }

    private WarningEventLog eventLog(Long warningId, String detail) {
        WarningEventLog eventLog = new WarningEventLog();
        eventLog.setWarningId(warningId);
        eventLog.setEventType(3);
        eventLog.setEventDetail(detail);
        return eventLog;
    }
}
