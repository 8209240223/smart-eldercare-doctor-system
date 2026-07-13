package com.medical.service.impl;

import com.medical.common.exception.BusinessException;
import com.medical.entity.FollowRecord;
import com.medical.entity.InterventionRecord;
import com.medical.mapper.FollowRecordMapper;
import com.medical.mapper.InterventionRecordMapper;
import com.medical.service.ElderReferenceService;
import com.medical.service.TimelineService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InterventionServiceImplTest {

    @Test
    void rejectsFollowRecordThatBelongsToAnotherElder() {
        InterventionRecordMapper interventionMapper = mock(InterventionRecordMapper.class);
        FollowRecordMapper followRecordMapper = mock(FollowRecordMapper.class);
        ElderReferenceService elderReferenceService = mock(ElderReferenceService.class);
        InterventionServiceImpl service = new InterventionServiceImpl();
        ReflectionTestUtils.setField(service, "interventionRecordMapper", interventionMapper);
        ReflectionTestUtils.setField(service, "followRecordMapper", followRecordMapper);
        ReflectionTestUtils.setField(service, "elderReferenceService", elderReferenceService);
        ReflectionTestUtils.setField(service, "timelineService", mock(TimelineService.class));

        FollowRecord followRecord = new FollowRecord();
        followRecord.setId(20L);
        followRecord.setElderId(2L);
        when(followRecordMapper.selectById(20L)).thenReturn(followRecord);

        InterventionRecord record = new InterventionRecord();
        record.setElderId(1L);
        record.setFollowRecordId(20L);
        record.setInterventionType(1);
        record.setInterventionTitle("用药调整");
        record.setInterventionContent("调整剂量");

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.create(record));

        assertEquals("干预记录与关联随访记录不属于同一位老人", exception.getMessage());
        verify(interventionMapper, never()).insert(any(InterventionRecord.class));
    }

    @Test
    void rejectsFollowRecordOwnedByAnotherDoctor() {
        InterventionRecordMapper interventionMapper = mock(InterventionRecordMapper.class);
        FollowRecordMapper followRecordMapper = mock(FollowRecordMapper.class);
        InterventionServiceImpl service = new InterventionServiceImpl();
        ReflectionTestUtils.setField(service, "interventionRecordMapper", interventionMapper);
        ReflectionTestUtils.setField(service, "followRecordMapper", followRecordMapper);
        ReflectionTestUtils.setField(service, "elderReferenceService", mock(ElderReferenceService.class));
        ReflectionTestUtils.setField(service, "timelineService", mock(TimelineService.class));

        FollowRecord followRecord = new FollowRecord();
        followRecord.setId(30L);
        followRecord.setElderId(1L);
        followRecord.setDoctorId(3L);
        when(followRecordMapper.selectById(30L)).thenReturn(followRecord);

        InterventionRecord record = new InterventionRecord();
        record.setElderId(1L);
        record.setDoctorId(2L);
        record.setFollowRecordId(30L);
        record.setInterventionType(1);
        record.setInterventionTitle("用药调整");
        record.setInterventionContent("调整剂量");

        BusinessException error = assertThrows(BusinessException.class,
                () -> service.create(record));

        assertEquals(403, error.getCode());
        verify(interventionMapper, never()).insert(any(InterventionRecord.class));
    }

    @Test
    void rejectsFollowRecordWithoutResponsibleDoctor() {
        InterventionRecordMapper interventionMapper = mock(InterventionRecordMapper.class);
        FollowRecordMapper followRecordMapper = mock(FollowRecordMapper.class);
        InterventionServiceImpl service = new InterventionServiceImpl();
        ReflectionTestUtils.setField(service, "interventionRecordMapper", interventionMapper);
        ReflectionTestUtils.setField(service, "followRecordMapper", followRecordMapper);
        ReflectionTestUtils.setField(service, "elderReferenceService", mock(ElderReferenceService.class));
        ReflectionTestUtils.setField(service, "timelineService", mock(TimelineService.class));

        FollowRecord followRecord = new FollowRecord();
        followRecord.setId(31L);
        followRecord.setElderId(1L);
        followRecord.setDoctorId(null);
        when(followRecordMapper.selectById(31L)).thenReturn(followRecord);

        InterventionRecord record = new InterventionRecord();
        record.setElderId(1L);
        record.setDoctorId(2L);
        record.setFollowRecordId(31L);
        record.setInterventionType(1);
        record.setInterventionTitle("用药调整");
        record.setInterventionContent("调整剂量");

        BusinessException error = assertThrows(BusinessException.class,
                () -> service.create(record));

        assertEquals(403, error.getCode());
        verify(interventionMapper, never()).insert(any(InterventionRecord.class));
    }

    @Test
    void acceptsFollowRecordOwnedBySameDoctorAndElder() {
        InterventionRecordMapper interventionMapper = mock(InterventionRecordMapper.class);
        FollowRecordMapper followRecordMapper = mock(FollowRecordMapper.class);
        InterventionServiceImpl service = new InterventionServiceImpl();
        ReflectionTestUtils.setField(service, "interventionRecordMapper", interventionMapper);
        ReflectionTestUtils.setField(service, "followRecordMapper", followRecordMapper);
        ReflectionTestUtils.setField(service, "elderReferenceService", mock(ElderReferenceService.class));
        ReflectionTestUtils.setField(service, "timelineService", mock(TimelineService.class));

        FollowRecord followRecord = new FollowRecord();
        followRecord.setId(32L);
        followRecord.setElderId(1L);
        followRecord.setDoctorId(2L);
        when(followRecordMapper.selectById(32L)).thenReturn(followRecord);

        InterventionRecord record = new InterventionRecord();
        record.setElderId(1L);
        record.setDoctorId(2L);
        record.setFollowRecordId(32L);
        record.setInterventionType(1);
        record.setInterventionTitle("用药调整");
        record.setInterventionContent("调整剂量");

        service.create(record);

        verify(interventionMapper).insert(record);
    }
}
