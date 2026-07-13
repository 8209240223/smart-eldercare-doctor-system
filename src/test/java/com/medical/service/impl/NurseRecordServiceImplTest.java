package com.medical.service.impl;

import com.medical.common.exception.BusinessException;
import com.medical.entity.ElderInfo;
import com.medical.entity.NursingRecord;
import com.medical.mapper.NursingRecordMapper;
import com.medical.service.ElderReferenceService;
import com.medical.service.TimelineService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NurseRecordServiceImplTest {

    @Test
    void createResetsDoctorReviewAndReportFields() {
        NursingRecordMapper mapper = mock(NursingRecordMapper.class);
        ElderReferenceService elderReferenceService = mock(ElderReferenceService.class);
        NurseRecordServiceImpl service = createService(mapper, elderReferenceService, 2L);
        NursingRecord record = validRecord();
        record.setDoctorId(99L);
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
        assertEquals(2L, record.getDoctorId());
        assertNull(record.getReviewDoctorId());
        assertNull(record.getReviewComment());
        assertNull(record.getReviewTime());
        verify(elderReferenceService).requireActiveDoctor(2L);
        verify(mapper).insert(record);
    }

    @Test
    void updateCannotReplaceNurseOrDoctorReviewFields() {
        NursingRecordMapper mapper = mock(NursingRecordMapper.class);
        ElderReferenceService elderReferenceService = mock(ElderReferenceService.class);
        NurseRecordServiceImpl service = createService(mapper, elderReferenceService, 8L);
        NursingRecord existing = validRecord();
        existing.setId(30L);
        existing.setNurseId(5L);
        existing.setReportStatus(0);
        existing.setDoctorReview(0);
        existing.setDoctorId(2L);
        when(mapper.selectById(30L)).thenReturn(existing);

        NursingRecord update = validRecord();
        update.setNurseId(99L);
        update.setReportStatus(2);
        update.setDoctorReview(2);
        update.setDoctorId(99L);
        update.setReviewDoctorId(88L);
        update.setReviewComment("伪造审核结果");
        update.setReviewTime(LocalDateTime.now());

        service.update(30L, update);

        assertEquals(5L, existing.getNurseId());
        assertEquals(0, existing.getReportStatus());
        assertEquals(0, existing.getDoctorReview());
        assertEquals(8L, existing.getDoctorId());
        assertNull(existing.getReviewDoctorId());
        assertNull(existing.getReviewComment());
        assertNull(existing.getReviewTime());
        verify(mapper).updateById(existing);
    }

    @Test
    void reportRefreshesTargetDoctorFromElderMaster() {
        NursingRecordMapper mapper = mock(NursingRecordMapper.class);
        ElderReferenceService elderReferenceService = mock(ElderReferenceService.class);
        NurseRecordServiceImpl service = createService(mapper, elderReferenceService, 12L);
        NursingRecord existing = validRecord();
        existing.setId(40L);
        existing.setDoctorId(2L);
        when(mapper.selectById(40L)).thenReturn(existing);

        service.reportAbnormal(40L, "血压异常");

        assertEquals(12L, existing.getDoctorId());
        assertEquals(1, existing.getReportStatus());
        verify(mapper).updateById(existing);
    }

    @Test
    void createRejectsElderWithoutResponsibleDoctor() {
        NursingRecordMapper mapper = mock(NursingRecordMapper.class);
        ElderReferenceService elderReferenceService = mock(ElderReferenceService.class);
        NurseRecordServiceImpl service = createService(mapper, elderReferenceService, null);

        BusinessException error = assertThrows(BusinessException.class,
                () -> service.create(validRecord()));

        assertEquals(400, error.getCode());
        assertEquals("该老人尚未分配责任医生，不能创建护理记录", error.getMessage());
    }

    private NurseRecordServiceImpl createService(NursingRecordMapper mapper,
                                                 ElderReferenceService elderReferenceService,
                                                 Long doctorId) {
        NurseRecordServiceImpl service = new NurseRecordServiceImpl();
        ReflectionTestUtils.setField(service, "nursingRecordMapper", mapper);
        ReflectionTestUtils.setField(service, "elderReferenceService", elderReferenceService);
        ReflectionTestUtils.setField(service, "timelineService", mock(TimelineService.class));
        ElderInfo elder = new ElderInfo();
        elder.setId(1L);
        elder.setDoctorId(doctorId);
        when(elderReferenceService.requireActive(1L)).thenReturn(elder);
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
