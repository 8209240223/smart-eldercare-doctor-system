package com.medical.service.impl;

import com.medical.entity.AiHealthReport;
import com.medical.entity.AllergyRecord;
import com.medical.entity.AssessmentRecord;
import com.medical.entity.ElderInfo;
import com.medical.entity.FamilyHistory;
import com.medical.entity.MedicationRecord;
import com.medical.mapper.AiHealthReportMapper;
import com.medical.mapper.AllergyRecordMapper;
import com.medical.mapper.AssessmentRecordMapper;
import com.medical.mapper.FamilyHistoryMapper;
import com.medical.mapper.HealthRecordMapper;
import com.medical.mapper.HealthWarningMapper;
import com.medical.mapper.MedicalHistoryMapper;
import com.medical.mapper.MedicationRecordMapper;
import com.medical.mapper.VitalSignDataMapper;
import com.medical.service.ElderReferenceService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AssessmentServiceImplTest {

    @Test
    void comprehensiveReportUsesTypeNineAndReturnsAiSummaries() {
        AssessmentRecordMapper assessmentMapper = mock(AssessmentRecordMapper.class);
        AiHealthReportMapper aiMapper = mock(AiHealthReportMapper.class);
        MedicationRecordMapper medicationMapper = mock(MedicationRecordMapper.class);
        AllergyRecordMapper allergyMapper = mock(AllergyRecordMapper.class);
        FamilyHistoryMapper familyHistoryMapper = mock(FamilyHistoryMapper.class);
        ElderReferenceService elderReferenceService = mock(ElderReferenceService.class);
        AssessmentServiceImpl service = new AssessmentServiceImpl();
        ReflectionTestUtils.setField(service, "assessmentRecordMapper", assessmentMapper);
        ReflectionTestUtils.setField(service, "healthRecordMapper", mock(HealthRecordMapper.class));
        ReflectionTestUtils.setField(service, "medicalHistoryMapper", emptyMedicalHistoryMapper());
        ReflectionTestUtils.setField(service, "medicationRecordMapper", medicationMapper);
        ReflectionTestUtils.setField(service, "allergyRecordMapper", allergyMapper);
        ReflectionTestUtils.setField(service, "familyHistoryMapper", familyHistoryMapper);
        ReflectionTestUtils.setField(service, "vitalSignDataMapper", mock(VitalSignDataMapper.class));
        ReflectionTestUtils.setField(service, "healthWarningMapper", emptyWarningMapper());
        ReflectionTestUtils.setField(service, "aiHealthReportMapper", aiMapper);
        ReflectionTestUtils.setField(service, "elderReferenceService", elderReferenceService);

        ElderInfo elder = new ElderInfo();
        elder.setId(1L);
        elder.setName("测试老人");
        elder.setGender(1);
        when(elderReferenceService.requireActive(1L)).thenReturn(elder);

        AssessmentRecord typeSix = assessment(6, "15");
        AssessmentRecord typeNine = assessment(9, "88");
        when(assessmentMapper.selectList(any())).thenReturn(List.of(typeSix, typeNine));

        AiHealthReport valid = report(1L, "{\"reportText\":\"结构化摘要\"}");
        AiHealthReport invalid = report(2L, "not-json");
        when(aiMapper.selectList(any())).thenReturn(List.of(valid, invalid));

        MedicationRecord medication = new MedicationRecord();
        medication.setDrugName("测试药物");
        AllergyRecord allergy = new AllergyRecord();
        allergy.setAllergen("测试过敏原");
        FamilyHistory familyHistory = new FamilyHistory();
        familyHistory.setDiseaseName("测试家族病史");
        when(medicationMapper.selectList(any())).thenReturn(List.of(medication));
        when(allergyMapper.selectList(any())).thenReturn(List.of(allergy));
        when(familyHistoryMapper.selectList(any())).thenReturn(List.of(familyHistory));

        Map<String, Object> result = service.getReport(1L, 2L);

        assertEquals(new BigDecimal("88"), result.get("overallScore"));
        List<?> summaries = (List<?>) result.get("aiReports");
        Map<?, ?> first = (Map<?, ?>) summaries.get(0);
        Map<?, ?> second = (Map<?, ?>) summaries.get(1);
        assertEquals("结构化摘要", first.get("reportText"));
        assertFalse(first.containsKey("reportJson"));
        assertNull(second.get("reportText"));
        assertEquals(1, ((List<?>) result.get("medications")).size());
        assertEquals(1, ((List<?>) result.get("allergies")).size());
        assertEquals(1, ((List<?>) result.get("familyHistories")).size());
    }

    private AssessmentRecord assessment(int type, String score) {
        AssessmentRecord record = new AssessmentRecord();
        record.setAssessType(type);
        record.setScore(new BigDecimal(score));
        return record;
    }

    private AiHealthReport report(Long id, String reportJson) {
        AiHealthReport report = new AiHealthReport();
        report.setId(id);
        report.setRiskScore(30);
        report.setRiskLevel("MEDIUM");
        report.setStatus(0);
        report.setSource(1);
        report.setCreateTime(LocalDateTime.now());
        report.setReportJson(reportJson);
        return report;
    }

    private MedicalHistoryMapper emptyMedicalHistoryMapper() {
        MedicalHistoryMapper mapper = mock(MedicalHistoryMapper.class);
        when(mapper.selectList(any())).thenReturn(Collections.emptyList());
        return mapper;
    }

    private HealthWarningMapper emptyWarningMapper() {
        HealthWarningMapper mapper = mock(HealthWarningMapper.class);
        when(mapper.selectList(any())).thenReturn(Collections.emptyList());
        return mapper;
    }
}
