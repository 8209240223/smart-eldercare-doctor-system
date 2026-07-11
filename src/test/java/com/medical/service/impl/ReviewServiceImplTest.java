package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.NursingPlan;
import com.medical.entity.NursingRecord;
import com.medical.mapper.NursingPlanMapper;
import com.medical.mapper.NursingRecordMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReviewServiceImplTest {

    @Test
    void statsIncludeBothApprovedAndRejectedHistoryForRecordsAndPlans() {
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

    private ReviewServiceImpl createService(NursingRecordMapper recordMapper,
                                            NursingPlanMapper planMapper) {
        ReviewServiceImpl service = new ReviewServiceImpl();
        ReflectionTestUtils.setField(service, "nursingRecordMapper", recordMapper);
        ReflectionTestUtils.setField(service, "nursingPlanMapper", planMapper);
        return service;
    }
}
