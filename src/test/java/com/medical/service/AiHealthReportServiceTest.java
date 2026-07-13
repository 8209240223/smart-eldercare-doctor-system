package com.medical.service;

import cn.hutool.json.JSONUtil;
import com.medical.assistant.service.KimiClient;
import com.medical.common.exception.BusinessException;
import com.medical.entity.AiHealthReport;
import com.medical.entity.ElderInfo;
import com.medical.mapper.AiHealthReportMapper;
import com.medical.mapper.ElderInfoMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiHealthReportServiceTest {

    @Test
    void generationUsesKimiButKeepsRuleScoreAndUpdatesExistingDraft() {
        AiHealthReportMapper mapper = mock(AiHealthReportMapper.class);
        ElderInfoMapper elderMapper = mock(ElderInfoMapper.class);
        ContextAggregator aggregator = mock(ContextAggregator.class);
        RuleEngineService ruleEngine = mock(RuleEngineService.class);
        ReportComposer composer = mock(ReportComposer.class);
        KimiClient kimiClient = mock(KimiClient.class);
        AiHealthReportService service = new AiHealthReportService();
        ReflectionTestUtils.setField(service, "reportMapper", mapper);
        ReflectionTestUtils.setField(service, "elderInfoMapper", elderMapper);
        ReflectionTestUtils.setField(service, "aggregator", aggregator);
        ReflectionTestUtils.setField(service, "ruleEngine", ruleEngine);
        ReflectionTestUtils.setField(service, "composer", composer);
        ReflectionTestUtils.setField(service, "kimiClient", kimiClient);

        ElderInfo elder = new ElderInfo();
        elder.setId(9L);
        elder.setDoctorId(2L);
        elder.setDeleted(0);
        elder.setName("Elder A");
        AiHealthReport draft = new AiHealthReport();
        draft.setId(70L);
        draft.setElderId(9L);
        draft.setStatus(0);
        when(elderMapper.selectById(9L)).thenReturn(elder);
        when(aggregator.gather(9L)).thenReturn(Map.of("elderId", 9L));
        when(ruleEngine.evaluate(any())).thenReturn(Collections.emptyList());
        when(composer.compose(any(), any())).thenReturn(
                """
                {"riskScore":32,"riskLevel":"MEDIUM","sections":[]}
                """);
        when(kimiClient.generateJson(any(), any(), anyInt())).thenReturn(
                """
                {"riskScore":99,"riskLevel":"CRITICAL","aiAnalysis":"structured analysis","aiSuggestions":["follow up"]}
                """);
        when(kimiClient.modelName()).thenReturn("kimi-for-coding");
        when(mapper.selectOne(any())).thenReturn(draft);

        AiHealthReport result = service.generateOrRefreshByRule(9L, 2L);

        assertThat(result.getId()).isEqualTo(70L);
        assertThat(result.getSource()).isEqualTo(2);
        assertThat(result.getRiskScore()).isEqualTo(32);
        assertThat(result.getRiskLevel()).isEqualTo("MEDIUM");
        assertThat(JSONUtil.parseObj(result.getReportJson()).getInt("riskScore")).isEqualTo(32);
        assertThat(JSONUtil.parseObj(result.getReportJson()).getStr("riskLevel")).isEqualTo("MEDIUM");
        assertThat(JSONUtil.parseObj(result.getReportJson()).getStr("aiAnalysis"))
                .isEqualTo("structured analysis");
        verify(mapper).updateById(draft);
        verify(mapper, never()).insert(any(AiHealthReport.class));
    }

    @Test
    void confirmRejectsInvalidEditedJsonAsBadRequest() {
        AiHealthReportMapper mapper = mock(AiHealthReportMapper.class);
        ElderInfoMapper elderMapper = mock(ElderInfoMapper.class);
        AiHealthReportService service = new AiHealthReportService();
        ReflectionTestUtils.setField(service, "reportMapper", mapper);
        ReflectionTestUtils.setField(service, "elderInfoMapper", elderMapper);
        AiHealthReport report = draftReport();
        ElderInfo elder = new ElderInfo();
        elder.setId(9L);
        elder.setDoctorId(2L);
        elder.setDeleted(0);
        when(mapper.selectById(80L)).thenReturn(report);
        when(elderMapper.selectById(9L)).thenReturn(elder);

        assertThatThrownBy(() -> service.confirm(80L, 2L, "{invalid"))
                .isInstanceOf(BusinessException.class)
                .extracting("code")
                .isEqualTo(400);
        assertThat(report.getStatus()).isZero();
        verify(mapper, never()).updateById(any(AiHealthReport.class));
    }

    @Test
    void removesMarkdownFenceFromKimiJson() {
        String cleaned = AiHealthReportService.cleanAiJsonPayload("""
                ```json
                {"aiAnalysis":"ok"}
                ```
                """);

        assertThat(JSONUtil.parseObj(cleaned).getStr("aiAnalysis")).isEqualTo("ok");
    }

    private AiHealthReport draftReport() {
        AiHealthReport report = new AiHealthReport();
        report.setId(80L);
        report.setElderId(9L);
        report.setDoctorId(2L);
        report.setSource(2);
        report.setStatus(0);
        report.setRiskScore(20);
        report.setRiskLevel("MEDIUM");
        report.setReportJson("""
                {"riskScore":20,"riskLevel":"MEDIUM"}
                """);
        return report;
    }
}
