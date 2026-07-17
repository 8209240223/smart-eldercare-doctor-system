package com.medical.service.impl;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.NursingPlan;
import com.medical.entity.NursingRecord;
import com.medical.mapper.NursingPlanMapper;
import com.medical.mapper.NursingRecordMapper;
import org.junit.jupiter.api.Test;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReviewServiceImplTest {

    @Test
    void statsIncludeBothApprovedAndRejectedHistoryForRecordsAndPlans() {
        initializeNursingRecordTableInfo();
        NursingRecordMapper recordMapper = mock(NursingRecordMapper.class);
        NursingPlanMapper planMapper = mock(NursingPlanMapper.class);
        ReviewServiceImpl service = createService(recordMapper, planMapper);

        when(recordMapper.selectCount(any(Wrapper.class))).thenReturn(7L, 4L);
        when(planMapper.selectCount(any(Wrapper.class))).thenReturn(3L, 9L, 5L);

        Map<String, Object> stats = service.getReviewStats(2L);

        assertEquals(7L, stats.get("pendingRecords"));
        assertEquals(3L, stats.get("pendingPlans"));
        assertEquals(4L, stats.get("reviewedRecords"));
        assertEquals(9L, stats.get("reviewedPlans"));
        assertEquals(5L, stats.get("approvedPlans"));

        ArgumentCaptor<Wrapper<NursingRecord>> recordCaptor = ArgumentCaptor.forClass(Wrapper.class);
        verify(recordMapper, org.mockito.Mockito.times(2)).selectCount(recordCaptor.capture());
        assertTrue(recordCaptor.getAllValues().get(0).getSqlSegment().contains("doctor_id"));
        assertTrue(recordCaptor.getAllValues().get(1).getSqlSegment().contains("doctor_id"));
    }

    @Test
    void reviewedHistoryQueriesReturnMapperPages() {
        NursingRecordMapper recordMapper = mock(NursingRecordMapper.class);
        NursingPlanMapper planMapper = mock(NursingPlanMapper.class);
        ReviewServiceImpl service = createService(recordMapper, planMapper);
        Page<NursingRecord> recordPage = new Page<>(1, 20);
        Page<NursingPlan> planPage = new Page<>(2, 15);

        when(recordMapper.selectPage(any(Page.class), any(Wrapper.class))).thenReturn(recordPage);
        when(planMapper.selectPage(any(Page.class), any(Wrapper.class))).thenReturn(planPage);

        assertSame(recordPage, service.listReviewedRecords(1, 20, 2L));
        assertSame(planPage, service.listReviewedPlans(2, 15, 2L));
        verify(recordMapper).selectPage(any(Page.class), any(Wrapper.class));
        verify(planMapper).selectPage(any(Page.class), any(Wrapper.class));
    }

    @Test
    void pendingAndReviewedRecordQueriesFilterByTargetDoctor() {
        initializeNursingRecordTableInfo();
        NursingRecordMapper recordMapper = mock(NursingRecordMapper.class);
        NursingPlanMapper planMapper = mock(NursingPlanMapper.class);
        ReviewServiceImpl service = createService(recordMapper, planMapper);
        when(recordMapper.selectPage(any(Page.class), any(Wrapper.class)))
                .thenReturn(new Page<>(1, 20));

        service.listPendingRecords(1, 20, 6L);
        service.listReviewedRecords(1, 20, 6L);
        service.listPendingRecords(2, 20, null);

        ArgumentCaptor<Wrapper<NursingRecord>> captor = ArgumentCaptor.forClass(Wrapper.class);
        verify(recordMapper, org.mockito.Mockito.times(3))
                .selectPage(any(Page.class), captor.capture());
        String pendingSql = captor.getAllValues().get(0).getSqlSegment();
        String historySql = captor.getAllValues().get(1).getSqlSegment();
        assertTrue(pendingSql.contains("doctor_id"));
        assertTrue(historySql.contains("doctor_id"));
        assertFalse(historySql.contains("review_doctor_id"));
        assertFalse(captor.getAllValues().get(2).getSqlSegment().contains("doctor_id"));
    }

    @Test
    void pendingRecordQueriesUseDoctorReviewStateForNormalRecords() {
        initializeNursingRecordTableInfo();
        NursingRecordMapper recordMapper = mock(NursingRecordMapper.class);
        ReviewServiceImpl service = createService(recordMapper, mock(NursingPlanMapper.class));
        when(recordMapper.selectPage(any(Page.class), any(Wrapper.class)))
                .thenReturn(new Page<>(1, 20));

        service.listPendingRecords(1, 20, 6L);

        ArgumentCaptor<Wrapper<NursingRecord>> captor = ArgumentCaptor.forClass(Wrapper.class);
        verify(recordMapper).selectPage(any(Page.class), captor.capture());
        String sql = captor.getValue().getSqlSegment();
        assertTrue(sql.contains("doctor_review"));
        assertFalse(sql.contains("report_status"));
    }

    @Test
    void doctorCannotReviewRecordAssignedToAnotherDoctor() {
        NursingRecordMapper recordMapper = mock(NursingRecordMapper.class);
        ReviewServiceImpl service = createService(recordMapper, mock(NursingPlanMapper.class));
        NursingRecord record = new NursingRecord();
        record.setId(50L);
        record.setDoctorId(9L);
        record.setReportStatus(1);
        record.setDeleted(0);
        when(recordMapper.selectById(50L)).thenReturn(record);

        BusinessException error = assertThrows(BusinessException.class,
                () -> service.reviewRecord(50L, 6L, "", 1));

        assertEquals(403, error.getCode());
        verify(recordMapper, never()).updateById(any(NursingRecord.class));
    }

    @Test
    void assignedDoctorCanReviewRecord() {
        NursingRecordMapper recordMapper = mock(NursingRecordMapper.class);
        ReviewServiceImpl service = createService(recordMapper, mock(NursingPlanMapper.class));
        NursingRecord record = new NursingRecord();
        record.setId(51L);
        record.setDoctorId(6L);
        record.setReportStatus(1);
        record.setDoctorReview(0);
        record.setDeleted(0);
        when(recordMapper.selectById(51L)).thenReturn(record);

        service.reviewRecord(51L, 6L, "已复核", 1);

        assertEquals(2, record.getReportStatus());
        assertEquals(2, record.getDoctorReview());
        assertEquals(6L, record.getReviewDoctorId());
        verify(recordMapper).updateById(record);
    }

    @Test
    void assignedDoctorCanReviewNormalRecordWithoutAbnormalReport() {
        NursingRecordMapper recordMapper = mock(NursingRecordMapper.class);
        ReviewServiceImpl service = createService(recordMapper, mock(NursingPlanMapper.class));
        NursingRecord record = new NursingRecord();
        record.setId(52L);
        record.setDoctorId(6L);
        record.setReportStatus(0);
        record.setDoctorReview(0);
        record.setDeleted(0);
        when(recordMapper.selectById(52L)).thenReturn(record);

        service.reviewRecord(52L, 6L, "", 1);

        assertEquals(0, record.getReportStatus());
        assertEquals(2, record.getDoctorReview());
        verify(recordMapper).updateById(record);
    }

    @Test
    void doctorCannotReviewPlanWithoutTargetDoctor() {
        NursingPlanMapper planMapper = mock(NursingPlanMapper.class);
        ReviewServiceImpl service = createService(mock(NursingRecordMapper.class), planMapper);
        NursingPlan plan = new NursingPlan();
        plan.setId(61L);
        plan.setDoctorApproval(0);
        plan.setDeleted(0);
        when(planMapper.selectById(61L)).thenReturn(plan);

        BusinessException error = assertThrows(BusinessException.class,
                () -> service.reviewPlan(61L, 6L, 1));

        assertEquals(400, error.getCode());
        verify(planMapper, never()).updateById(any(NursingPlan.class));
    }

    @Test
    void assignedDoctorApprovesTheSameNursingPlanAndStartsIt() {
        NursingPlanMapper planMapper = mock(NursingPlanMapper.class);
        ReviewServiceImpl service = createService(mock(NursingRecordMapper.class), planMapper);
        NursingPlan plan = new NursingPlan();
        plan.setId(62L);
        plan.setDoctorId(6L);
        plan.setNurseId(3L);
        plan.setDoctorApproval(0);
        plan.setStatus(0);
        plan.setDeleted(0);
        when(planMapper.selectById(62L)).thenReturn(plan);

        service.reviewPlan(62L, 6L, 1);

        assertEquals(1, plan.getDoctorApproval());
        assertEquals(1, plan.getStatus());
        verify(planMapper).updateById(plan);
    }

    @Test
    void assignedDoctorRejectsTheSameNursingPlanAndTerminatesIt() {
        NursingPlanMapper planMapper = mock(NursingPlanMapper.class);
        ReviewServiceImpl service = createService(mock(NursingRecordMapper.class), planMapper);
        NursingPlan plan = new NursingPlan();
        plan.setId(63L);
        plan.setDoctorId(6L);
        plan.setNurseId(3L);
        plan.setDoctorApproval(0);
        plan.setStatus(0);
        plan.setDeleted(0);
        when(planMapper.selectById(63L)).thenReturn(plan);

        service.reviewPlan(63L, 6L, 2);

        assertEquals(2, plan.getDoctorApproval());
        assertEquals(3, plan.getStatus());
        verify(planMapper).updateById(plan);
    }

    @Test
    void doctorCannotReviewAnotherDoctorsNursingPlan() {
        NursingPlanMapper planMapper = mock(NursingPlanMapper.class);
        ReviewServiceImpl service = createService(mock(NursingRecordMapper.class), planMapper);
        NursingPlan plan = new NursingPlan();
        plan.setId(64L);
        plan.setDoctorId(9L);
        plan.setDoctorApproval(0);
        plan.setDeleted(0);
        when(planMapper.selectById(64L)).thenReturn(plan);

        BusinessException error = assertThrows(BusinessException.class,
                () -> service.reviewPlan(64L, 6L, 1));

        assertEquals(403, error.getCode());
        verify(planMapper, never()).updateById(any(NursingPlan.class));
    }

    private void initializeNursingRecordTableInfo() {
        TableInfoHelper.initTableInfo(
                new MapperBuilderAssistant(new MybatisConfiguration(), "review-test"),
                NursingRecord.class);
    }

    private ReviewServiceImpl createService(NursingRecordMapper recordMapper,
                                            NursingPlanMapper planMapper) {
        ReviewServiceImpl service = new ReviewServiceImpl();
        ReflectionTestUtils.setField(service, "nursingRecordMapper", recordMapper);
        ReflectionTestUtils.setField(service, "nursingPlanMapper", planMapper);
        return service;
    }
}
