package com.medical.service;

import com.medical.entity.ElderInfo;
import com.medical.entity.FollowPlan;
import com.medical.entity.HealthRecord;
import com.medical.mapper.AllergyRecordMapper;
import com.medical.mapper.AssessmentRecordMapper;
import com.medical.mapper.FamilyHistoryMapper;
import com.medical.mapper.FollowPlanMapper;
import com.medical.mapper.FollowRecordMapper;
import com.medical.mapper.HealthRecordMapper;
import com.medical.mapper.HealthWarningMapper;
import com.medical.mapper.InterventionRecordMapper;
import com.medical.mapper.MedicalHistoryMapper;
import com.medical.mapper.MedicationRecordMapper;
import com.medical.mapper.NursingPlanMapper;
import com.medical.mapper.NursingRecordMapper;
import com.medical.mapper.PhysicalExamMapper;
import com.medical.mapper.ReferralOrderMapper;
import com.medical.mapper.VitalSignDataMapper;
import com.medical.mapper.WearableDeviceMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ContextAggregatorTest {

    @Test
    void missingHealthRecordStaysUnknownAndOverdueDaysAreReal() {
        ContextAggregator aggregator = new ContextAggregator();
        ElderReferenceService elderReferenceService = mock(ElderReferenceService.class);
        ElderInfo elder = new ElderInfo();
        elder.setId(1L);
        elder.setBirthDate(LocalDate.now().minusYears(75));
        when(elderReferenceService.requireActive(1L)).thenReturn(elder);
        ReflectionTestUtils.setField(aggregator, "elderReferenceService", elderReferenceService);

        HealthRecordMapper healthRecordMapper = mock(HealthRecordMapper.class);
        PhysicalExamMapper physicalExamMapper = mock(PhysicalExamMapper.class);
        ReflectionTestUtils.setField(aggregator, "healthRecordMapper", healthRecordMapper);
        ReflectionTestUtils.setField(aggregator, "physicalExamMapper", physicalExamMapper);

        VitalSignDataMapper vitalMapper = mock(VitalSignDataMapper.class);
        when(vitalMapper.selectList(any())).thenReturn(Collections.emptyList());
        ReflectionTestUtils.setField(aggregator, "vitalSignDataMapper", vitalMapper);

        setEmptyListMapper(aggregator, "medicalHistoryMapper", mock(MedicalHistoryMapper.class));
        setEmptyListMapper(aggregator, "medicationRecordMapper", mock(MedicationRecordMapper.class));
        setEmptyListMapper(aggregator, "allergyRecordMapper", mock(AllergyRecordMapper.class));
        setEmptyListMapper(aggregator, "familyHistoryMapper", mock(FamilyHistoryMapper.class));
        setEmptyListMapper(aggregator, "healthWarningMapper", mock(HealthWarningMapper.class));
        setEmptyListMapper(aggregator, "followRecordMapper", mock(FollowRecordMapper.class));
        setEmptyListMapper(aggregator, "interventionRecordMapper", mock(InterventionRecordMapper.class));
        setEmptyListMapper(aggregator, "assessmentRecordMapper", mock(AssessmentRecordMapper.class));
        setEmptyListMapper(aggregator, "nursingRecordMapper", mock(NursingRecordMapper.class));
        setEmptyListMapper(aggregator, "nursingPlanMapper", mock(NursingPlanMapper.class));
        setEmptyListMapper(aggregator, "referralOrderMapper", mock(ReferralOrderMapper.class));
        setEmptyListMapper(aggregator, "wearableDeviceMapper", mock(WearableDeviceMapper.class));

        FollowPlanMapper followPlanMapper = mock(FollowPlanMapper.class);
        FollowPlan overduePlan = new FollowPlan();
        overduePlan.setNextFollowDate(LocalDate.now().minusDays(8));
        when(followPlanMapper.selectList(any())).thenReturn(List.of(overduePlan));
        ReflectionTestUtils.setField(aggregator, "followPlanMapper", followPlanMapper);

        Map<String, Object> context = aggregator.gather(1L);

        assertFalse(context.containsKey("smokingStatus"));
        assertFalse(context.containsKey("drinkingStatus"));
        assertFalse(context.containsKey("livingAbility"));
        assertEquals(8, context.get("days"));
        assertEquals(8, context.get("followupOverdueDays"));
        assertTrue(((List<?>) context.get("missingData")).contains("健康档案"));
        Map<?, ?> completeness = (Map<?, ?>) context.get("dataCompleteness");
        assertEquals(20, completeness.get("score"));
    }

    @Test
    void aiContextHidesLegacyInvalidDisabilityStatusWithoutMutatingStoredRecord() {
        ContextAggregator aggregator = new ContextAggregator();
        ElderReferenceService elderReferenceService = mock(ElderReferenceService.class);
        ElderInfo elder = new ElderInfo();
        elder.setId(1L);
        elder.setBirthDate(LocalDate.now().minusYears(75));
        when(elderReferenceService.requireActive(1L)).thenReturn(elder);
        ReflectionTestUtils.setField(aggregator, "elderReferenceService", elderReferenceService);

        HealthRecord legacyRecord = new HealthRecord();
        legacyRecord.setElderId(1L);
        legacyRecord.setLivingAbility(3);
        legacyRecord.setDisabilityStatus("1");
        HealthRecordMapper healthRecordMapper = mock(HealthRecordMapper.class);
        when(healthRecordMapper.selectOne(any())).thenReturn(legacyRecord);
        ReflectionTestUtils.setField(aggregator, "healthRecordMapper", healthRecordMapper);
        ReflectionTestUtils.setField(aggregator, "physicalExamMapper", mock(PhysicalExamMapper.class));

        VitalSignDataMapper vitalMapper = mock(VitalSignDataMapper.class);
        when(vitalMapper.selectList(any())).thenReturn(Collections.emptyList());
        ReflectionTestUtils.setField(aggregator, "vitalSignDataMapper", vitalMapper);

        setEmptyListMapper(aggregator, "medicalHistoryMapper", mock(MedicalHistoryMapper.class));
        setEmptyListMapper(aggregator, "medicationRecordMapper", mock(MedicationRecordMapper.class));
        setEmptyListMapper(aggregator, "allergyRecordMapper", mock(AllergyRecordMapper.class));
        setEmptyListMapper(aggregator, "familyHistoryMapper", mock(FamilyHistoryMapper.class));
        setEmptyListMapper(aggregator, "healthWarningMapper", mock(HealthWarningMapper.class));
        setEmptyListMapper(aggregator, "followRecordMapper", mock(FollowRecordMapper.class));
        setEmptyListMapper(aggregator, "interventionRecordMapper", mock(InterventionRecordMapper.class));
        setEmptyListMapper(aggregator, "assessmentRecordMapper", mock(AssessmentRecordMapper.class));
        setEmptyListMapper(aggregator, "nursingRecordMapper", mock(NursingRecordMapper.class));
        setEmptyListMapper(aggregator, "nursingPlanMapper", mock(NursingPlanMapper.class));
        setEmptyListMapper(aggregator, "referralOrderMapper", mock(ReferralOrderMapper.class));
        setEmptyListMapper(aggregator, "wearableDeviceMapper", mock(WearableDeviceMapper.class));
        FollowPlanMapper followPlanMapper = mock(FollowPlanMapper.class);
        when(followPlanMapper.selectList(any())).thenReturn(Collections.emptyList());
        ReflectionTestUtils.setField(aggregator, "followPlanMapper", followPlanMapper);

        Map<String, Object> context = aggregator.gather(1L);

        HealthRecord exposedRecord = (HealthRecord) context.get("healthRecord");
        assertNotSame(legacyRecord, exposedRecord);
        assertNull(exposedRecord.getDisabilityStatus());
        assertEquals("1", legacyRecord.getDisabilityStatus());
        assertEquals(0, context.get("hasDisability"));
        assertEquals(3, context.get("livingAbility"));
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private void setEmptyListMapper(ContextAggregator aggregator, String fieldName, Object mapper) {
        if (mapper instanceof MedicalHistoryMapper) {
            when(((MedicalHistoryMapper) mapper).selectList(any())).thenReturn(Collections.emptyList());
        } else if (mapper instanceof MedicationRecordMapper) {
            when(((MedicationRecordMapper) mapper).selectList(any())).thenReturn(Collections.emptyList());
        } else if (mapper instanceof AllergyRecordMapper) {
            when(((AllergyRecordMapper) mapper).selectList(any())).thenReturn(Collections.emptyList());
        } else if (mapper instanceof FamilyHistoryMapper) {
            when(((FamilyHistoryMapper) mapper).selectList(any())).thenReturn(Collections.emptyList());
        } else if (mapper instanceof HealthWarningMapper) {
            when(((HealthWarningMapper) mapper).selectList(any())).thenReturn(Collections.emptyList());
        } else if (mapper instanceof FollowRecordMapper) {
            when(((FollowRecordMapper) mapper).selectList(any())).thenReturn(Collections.emptyList());
        } else if (mapper instanceof InterventionRecordMapper) {
            when(((InterventionRecordMapper) mapper).selectList(any())).thenReturn(Collections.emptyList());
        } else if (mapper instanceof AssessmentRecordMapper) {
            when(((AssessmentRecordMapper) mapper).selectList(any())).thenReturn(Collections.emptyList());
        } else if (mapper instanceof NursingRecordMapper) {
            when(((NursingRecordMapper) mapper).selectList(any())).thenReturn(Collections.emptyList());
        } else if (mapper instanceof NursingPlanMapper) {
            when(((NursingPlanMapper) mapper).selectList(any())).thenReturn(Collections.emptyList());
        } else if (mapper instanceof ReferralOrderMapper) {
            when(((ReferralOrderMapper) mapper).selectList(any())).thenReturn(Collections.emptyList());
        } else if (mapper instanceof WearableDeviceMapper) {
            when(((WearableDeviceMapper) mapper).selectList(any())).thenReturn(Collections.emptyList());
        }
        ReflectionTestUtils.setField(aggregator, fieldName, mapper);
    }
}
