package com.medical.service;

import com.medical.entity.AiHealthReport;
import com.medical.mapper.AiHealthReportMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import com.medical.common.exception.BusinessException;
import com.medical.mapper.TimelineEventMapper;

class AiHealthReportServiceTest {

    @Test
    void generateOrRefreshByRuleUpdatesExistingDraftInsteadOfCreatingDuplicate() {
        AiHealthReportMapper mapper = mock(AiHealthReportMapper.class);
        ContextAggregator aggregator = mock(ContextAggregator.class);
        RuleEngineService ruleEngine = mock(RuleEngineService.class);
        ReportComposer composer = mock(ReportComposer.class);
        AiHealthReportService service = new AiHealthReportService();
        ReflectionTestUtils.setField(service, "reportMapper", mapper);
        ReflectionTestUtils.setField(service, "aggregator", aggregator);
        ReflectionTestUtils.setField(service, "ruleEngine", ruleEngine);
        ReflectionTestUtils.setField(service, "composer", composer);

        AiHealthReport draft = new AiHealthReport();
        draft.setId(70L);
        draft.setElderId(9L);
        draft.setSource(1);
        draft.setStatus(0);
        when(aggregator.gather(9L)).thenReturn(Map.of("elderId", 9L));
        when(ruleEngine.evaluate(any())).thenReturn(Collections.emptyList());
        when(composer.compose(any(), any())).thenReturn("{\"riskScore\":32,\"riskLevel\":\"MEDIUM\",\"sections\":[]}");
        when(mapper.selectRuleDraftForUpdate(9L)).thenReturn(draft);

        AiHealthReport refreshed = service.generateOrRefreshByRule(9L, 2L);

        assertEquals(70L, refreshed.getId());
        assertEquals(32, refreshed.getRiskScore());
        assertEquals("MEDIUM", refreshed.getRiskLevel());
        verify(mapper).updateById(draft);
        verify(mapper, never()).insert(any(AiHealthReport.class));
    }

    @Test
    void confirmRejectsInvalidEditedJsonWithoutChangingStatus() {
        AiHealthReportMapper mapper = mock(AiHealthReportMapper.class);
        AiHealthReportService service = new AiHealthReportService();
        ReflectionTestUtils.setField(service, "reportMapper", mapper);
        AiHealthReport report = draftReport();
        when(mapper.selectById(80L)).thenReturn(report);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.confirm(80L, 2L, "{invalid"));

        assertEquals(400, exception.getCode());
        assertEquals(0, report.getStatus());
        verify(mapper, never()).updateById(any(AiHealthReport.class));
    }

    @Test
    void confirmSynchronizesEditedRiskColumns() {
        AiHealthReportMapper mapper = mock(AiHealthReportMapper.class);
        AiHealthReportService service = new AiHealthReportService();
        ReflectionTestUtils.setField(service, "reportMapper", mapper);
        ReflectionTestUtils.setField(service, "timelineEventMapper", mock(TimelineEventMapper.class));
        AiHealthReport report = draftReport();
        when(mapper.selectById(80L)).thenReturn(report);

        service.confirm(80L, 2L, "{\"riskScore\":88,\"riskLevel\":\"high\"}");

        assertEquals(1, report.getStatus());
        assertEquals(88, report.getRiskScore());
        assertEquals("HIGH", report.getRiskLevel());
        verify(mapper).updateById(report);
    }

    @Test
    void removesMarkdownFenceFromRealAiJson() {
        assertEquals("{\"riskScore\":66}",
                AiHealthReportService.cleanAiJsonPayload("```json\n{\"riskScore\":66}\n```"));
    }

    private AiHealthReport draftReport() {
        AiHealthReport report = new AiHealthReport();
        report.setId(80L);
        report.setElderId(9L);
        report.setSource(1);
        report.setStatus(0);
        report.setRiskScore(20);
        report.setRiskLevel("MEDIUM");
        report.setReportJson("{\"riskScore\":20,\"riskLevel\":\"MEDIUM\"}");
        return report;
    }
}
