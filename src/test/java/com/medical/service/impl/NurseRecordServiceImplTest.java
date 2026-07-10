package com.medical.service.impl;

import com.medical.entity.NursingRecord;
import com.medical.mapper.NursingRecordMapper;
import com.medical.service.ElderReferenceService;
import com.medical.service.TimelineService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NurseRecordServiceImplTest {

    @Test
    void createResetsDoctorReviewAndReportFields() {
        NursingRecordMapper mapper = mock(NursingRecordMapper.class);
        NurseRecordServiceImpl service = createService(mapper);
        NursingRecord record = validRecord();
        record.setDeleted(1);
        record.setReportStatus(2);
        record.setDoctorReview(2);
        record.setReviewDoctorId(99L);
        record.setReviewComment("伪造审核结果");
        record.setReviewTime(LocalDateTime.now());

        service.create(record);

        assertEquals(0, record.getDeleted());
        assertEquals(0, record.getReportStatus());
        assertEquals(0, record.getDoctorReview());
        assertNull(record.getReviewDoctorId());
        assertNull(record.getReviewComment());
        assertNull(record.getReviewTime());
        verify(mapper).insert(record);
    }

    @Test
    void updateCannotReplaceNurseOrDoctorReviewFields() {
        NursingRecordMapper mapper = mock(NursingRecordMapper.class);
        NurseRecordServiceImpl service = createService(mapper);
        NursingRecord existing = validRecord();
        existing.setId(30L);
        existing.setNurseId(5L);
        existing.setReportStatus(0);
        existing.setDoctorReview(0);
        when(mapper.selectById(30L)).thenReturn(existing);

        NursingRecord update = validRecord();
        update.setNurseId(99L);
        update.setReportStatus(2);
        update.setDoctorReview(2);
        update.setReviewDoctorId(88L);
        update.setReviewComment("伪造审核结果");
        update.setReviewTime(LocalDateTime.now());

        service.update(30L, update);

        assertEquals(5L, existing.getNurseId());
        assertEquals(0, existing.getReportStatus());
        assertEquals(0, existing.getDoctorReview());
        assertNull(existing.getReviewDoctorId());
        assertNull(existing.getReviewComment());
        assertNull(existing.getReviewTime());
        verify(mapper).updateById(existing);
    }

    private NurseRecordServiceImpl createService(NursingRecordMapper mapper) {
        NurseRecordServiceImpl service = new NurseRecordServiceImpl();
        ReflectionTestUtils.setField(service, "nursingRecordMapper", mapper);
        ReflectionTestUtils.setField(service, "elderReferenceService", mock(ElderReferenceService.class));
        ReflectionTestUtils.setField(service, "timelineService", mock(TimelineService.class));
        return service;
    }

    private NursingRecord validRecord() {
        NursingRecord record = new NursingRecord();
        record.setElderId(1L);
        record.setNurseId(3L);
        record.setRecordType(1);
        record.setRecordTitle("晨间基础护理");
        return record;
    }
}
