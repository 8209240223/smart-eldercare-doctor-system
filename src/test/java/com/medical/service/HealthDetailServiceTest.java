package com.medical.service;

import com.medical.common.exception.BusinessException;
import com.medical.entity.MedicalHistory;
import com.medical.mapper.AllergyRecordMapper;
import com.medical.mapper.FamilyHistoryMapper;
import com.medical.mapper.MedicalHistoryMapper;
import com.medical.mapper.MedicationRecordMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HealthDetailServiceTest {

    @Test
    void doesNotInsertHealthDetailWhenElderIsInvalid() {
        MedicalHistoryMapper medicalHistoryMapper = mock(MedicalHistoryMapper.class);
        ElderReferenceService elderReferenceService = mock(ElderReferenceService.class);
        HealthDetailService service = new HealthDetailService();
        ReflectionTestUtils.setField(service, "medicalHistoryMapper", medicalHistoryMapper);
        ReflectionTestUtils.setField(service, "medicationRecordMapper", mock(MedicationRecordMapper.class));
        ReflectionTestUtils.setField(service, "allergyRecordMapper", mock(AllergyRecordMapper.class));
        ReflectionTestUtils.setField(service, "familyHistoryMapper", mock(FamilyHistoryMapper.class));
        ReflectionTestUtils.setField(service, "elderReferenceService", elderReferenceService);

        MedicalHistory record = new MedicalHistory();
        record.setElderId(99L);
        when(elderReferenceService.requireActive(99L))
                .thenThrow(new BusinessException(404, "老人不存在或已删除"));

        assertThrows(BusinessException.class, () -> service.addMedicalHistory(record));
        verify(medicalHistoryMapper, never()).insert(any(MedicalHistory.class));
    }
}
