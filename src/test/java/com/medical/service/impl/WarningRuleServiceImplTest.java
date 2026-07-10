package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.medical.common.exception.BusinessException;
import com.medical.entity.WarningRule;
import com.medical.mapper.WarningRuleMapper;
import com.medical.service.TimelineService;
import com.medical.service.WarningService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WarningRuleServiceImplTest {

    @Test
    void evaluatesLegacyBloodOxygenRuleWithSpo2Input() {
        WarningRuleMapper mapper = mock(WarningRuleMapper.class);
        WarningService warningService = mock(WarningService.class);
        TimelineService timelineService = mock(TimelineService.class);
        WarningRuleServiceImpl service = createService(mapper, warningService, timelineService);

        WarningRule rule = validRule();
        rule.setMetricCode("bloodOxygen");
        rule.setConditionExpr("bloodOxygen <= 90");
        when(mapper.selectList(any(Wrapper.class))).thenReturn(List.of(rule));
        when(warningService.create(any())).thenReturn(100L);

        int count = service.evaluateVitalSigns(1L, Map.of("spo2", BigDecimal.valueOf(88)));

        assertEquals(1, count);
        verify(warningService).create(any());
        verify(timelineService).addEvent(any());
    }

    @Test
    void rejectsUnsupportedMetric() {
        WarningRuleServiceImpl service = createService(mock(WarningRuleMapper.class), mock(WarningService.class), mock(TimelineService.class));
        WarningRule rule = validRule();
        rule.setMetricCode("unknownMetric");
        rule.setConditionExpr("unknownMetric > 1");

        assertThrows(BusinessException.class, () -> service.createRule(rule));
    }

    @Test
    void rejectsConditionForDifferentMetric() {
        WarningRuleServiceImpl service = createService(mock(WarningRuleMapper.class), mock(WarningService.class), mock(TimelineService.class));
        WarningRule rule = validRule();
        rule.setMetricCode("systolic");
        rule.setConditionExpr("heartRate > 120");

        assertThrows(BusinessException.class, () -> service.createRule(rule));
    }

    @Test
    void acceptsValidRule() {
        WarningRuleMapper mapper = mock(WarningRuleMapper.class);
        WarningRuleServiceImpl service = createService(mapper, mock(WarningService.class), mock(TimelineService.class));
        WarningRule rule = validRule();

        service.createRule(rule);

        verify(mapper).insert(rule);
    }

    private WarningRuleServiceImpl createService(WarningRuleMapper mapper, WarningService warningService,
                                                 TimelineService timelineService) {
        WarningRuleServiceImpl service = new WarningRuleServiceImpl();
        ReflectionTestUtils.setField(service, "warningRuleMapper", mapper);
        ReflectionTestUtils.setField(service, "warningService", warningService);
        ReflectionTestUtils.setField(service, "timelineService", timelineService);
        return service;
    }

    private WarningRule validRule() {
        WarningRule rule = new WarningRule();
        rule.setRuleName("收缩压偏高");
        rule.setRuleType(1);
        rule.setMetricCode("systolic");
        rule.setConditionExpr("systolic >= 160");
        rule.setWarningLevel(2);
        rule.setWarningTemplate("请关注收缩压");
        rule.setEnabled(1);
        return rule;
    }
}
