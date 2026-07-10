package com.medical.service.impl;

import com.medical.common.exception.BusinessException;
import com.medical.entity.FollowPlan;
import com.medical.entity.FollowRecord;
import com.medical.entity.ElderInfo;
import com.medical.entity.ElderRiskProfile;
import com.medical.mapper.ElderInfoMapper;
import com.medical.mapper.ElderRiskProfileMapper;
import com.medical.mapper.FollowPlanMapper;
import com.medical.mapper.FollowRecordMapper;
import com.medical.service.ElderReferenceService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doAnswer;

class FollowUpServiceImplTest {

    @ParameterizedTest
    @ValueSource(ints = {2, 3})
    void createRecordRejectsTerminalPlan(int status) {
        FollowPlanMapper planMapper = mock(FollowPlanMapper.class);
        FollowRecordMapper recordMapper = mock(FollowRecordMapper.class);
        FollowUpServiceImpl service = createService(planMapper, recordMapper);
        FollowPlan plan = plan(10L, status, 1, 3);

        when(planMapper.selectById(10L)).thenReturn(plan);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.createRecord(record(10L)));

        assertEquals("已完成或已终止的随访计划不能新增记录", exception.getMessage());
        verify(recordMapper, never()).insert(any(FollowRecord.class));
        verify(planMapper, never()).updateById(any(FollowPlan.class));
    }

    @Test
    void createRecordRejectsPlanWithoutRemainingVisits() {
        FollowPlanMapper planMapper = mock(FollowPlanMapper.class);
        FollowRecordMapper recordMapper = mock(FollowRecordMapper.class);
        FollowUpServiceImpl service = createService(planMapper, recordMapper);
        FollowPlan plan = plan(11L, 1, 3, 3);

        when(planMapper.selectById(11L)).thenReturn(plan);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.createRecord(record(11L)));

        assertEquals("随访计划次数已完成，不能继续新增记录", exception.getMessage());
        verify(recordMapper, never()).insert(any(FollowRecord.class));
        verify(planMapper, never()).updateById(any(FollowPlan.class));
    }

    @Test
    void createRecordRejectsNextDateThatIsNotAfterFollowDate() {
        FollowPlanMapper planMapper = mock(FollowPlanMapper.class);
        FollowRecordMapper recordMapper = mock(FollowRecordMapper.class);
        FollowUpServiceImpl service = createService(planMapper, recordMapper);
        FollowPlan plan = plan(12L, 1, 1, 3);
        FollowRecord record = record(12L);
        record.setFollowDate(LocalDateTime.of(2026, 7, 10, 9, 0));
        record.setNextFollowDate(LocalDate.of(2026, 7, 10));

        when(planMapper.selectById(12L)).thenReturn(plan);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.createRecord(record));

        assertEquals("下次随访日期必须晚于本次随访日期", exception.getMessage());
        verify(recordMapper, never()).insert(any(FollowRecord.class));
        verify(planMapper, never()).updateById(any(FollowPlan.class));
    }

    @Test
    void createRecordRejectsElderThatDoesNotMatchPlan() {
        FollowPlanMapper planMapper = mock(FollowPlanMapper.class);
        FollowRecordMapper recordMapper = mock(FollowRecordMapper.class);
        FollowUpServiceImpl service = createService(planMapper, recordMapper);
        FollowPlan plan = plan(13L, 1, 0, 3);
        FollowRecord record = record(13L);
        record.setElderId(99L);

        when(planMapper.selectById(13L)).thenReturn(plan);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.createRecord(record));

        assertEquals("随访记录老人必须与随访计划中的老人一致", exception.getMessage());
        verify(recordMapper, never()).insert(any(FollowRecord.class));
    }

    @Test
    void completionRateUsesCompletedPlansInsteadOfActivePlans() {
        FollowPlanMapper planMapper = mock(FollowPlanMapper.class);
        FollowRecordMapper recordMapper = mock(FollowRecordMapper.class);
        FollowUpServiceImpl service = createService(planMapper, recordMapper);

        when(planMapper.selectCount(any())).thenReturn(1L, 2L, 0L, 0L, 4L);
        when(recordMapper.selectCount(any())).thenReturn(8L);

        Map<String, Object> stats = service.getStats();

        assertEquals(1L, stats.get("activePlans"));
        assertEquals(50L, stats.get("completionRate"));
        assertEquals(8L, stats.get("totalRecords"));
    }

    @Test
    void targetedGenerationCreatesPersonalizedPlanForLowRiskElder() {
        FollowPlanMapper planMapper = mock(FollowPlanMapper.class);
        FollowRecordMapper recordMapper = mock(FollowRecordMapper.class);
        ElderRiskProfileMapper riskMapper = mock(ElderRiskProfileMapper.class);
        ElderInfoMapper elderMapper = mock(ElderInfoMapper.class);
        FollowUpServiceImpl service = createService(planMapper, recordMapper);
        ReflectionTestUtils.setField(service, "elderRiskProfileMapper", riskMapper);
        ReflectionTestUtils.setField(service, "elderInfoMapper", elderMapper);

        ElderRiskProfile profile = new ElderRiskProfile();
        profile.setElderId(21L);
        profile.setRiskLevel(1);
        profile.setRiskScore(8);
        ElderInfo elder = new ElderInfo();
        elder.setId(21L);
        elder.setName("低风险老人");
        elder.setDoctorId(2L);
        elder.setDeleted(0);

        when(riskMapper.selectList(any())).thenReturn(List.of(profile));
        when(elderMapper.selectById(21L)).thenReturn(elder);
        when(planMapper.selectLatestActiveByElderForUpdate(21L)).thenReturn(null);
        doAnswer(invocation -> {
            FollowPlan inserted = invocation.getArgument(0);
            inserted.setId(88L);
            return 1;
        }).when(planMapper).insert(any(FollowPlan.class));

        Map<String, Object> result = service.generateRiskFollowPlans(2L, 21L);

        assertEquals(1, result.get("createdCount"));
        verify(planMapper).insert(org.mockito.ArgumentMatchers.argThat(plan ->
                plan.getElderId().equals(21L)
                        && plan.getFrequencyType() == 4
                        && plan.getTotalCount() == 2
                        && plan.getStatus() == 1));
    }

    @Test
    void targetedGenerationReusesExistingActivePlan() {
        FollowPlanMapper planMapper = mock(FollowPlanMapper.class);
        FollowRecordMapper recordMapper = mock(FollowRecordMapper.class);
        ElderRiskProfileMapper riskMapper = mock(ElderRiskProfileMapper.class);
        ElderInfoMapper elderMapper = mock(ElderInfoMapper.class);
        FollowUpServiceImpl service = createService(planMapper, recordMapper);
        ReflectionTestUtils.setField(service, "elderRiskProfileMapper", riskMapper);
        ReflectionTestUtils.setField(service, "elderInfoMapper", elderMapper);

        ElderRiskProfile profile = new ElderRiskProfile();
        profile.setElderId(22L);
        profile.setRiskLevel(2);
        profile.setRiskScore(35);
        ElderInfo elder = new ElderInfo();
        elder.setId(22L);
        elder.setName("关注老人");
        elder.setDoctorId(2L);
        elder.setDeleted(0);
        FollowPlan existing = plan(99L, 1, 0, 4);
        existing.setElderId(22L);
        existing.setPlanName("已有活动计划");

        when(riskMapper.selectList(any())).thenReturn(List.of(profile));
        when(elderMapper.selectById(22L)).thenReturn(elder);
        when(planMapper.selectLatestActiveByElderForUpdate(22L)).thenReturn(existing);

        Map<String, Object> result = service.generateRiskFollowPlans(2L, 22L);

        assertEquals(0, result.get("createdCount"));
        assertEquals(1, result.get("reusedCount"));
        verify(planMapper, never()).insert(any(FollowPlan.class));
    }

    private FollowUpServiceImpl createService(FollowPlanMapper planMapper, FollowRecordMapper recordMapper) {
        FollowUpServiceImpl service = new FollowUpServiceImpl();
        ElderReferenceService elderReferenceService = mock(ElderReferenceService.class);
        ElderInfo elder = new ElderInfo();
        elder.setId(1L);
        elder.setDoctorId(2L);
        when(elderReferenceService.requireActive(1L)).thenReturn(elder);
        ReflectionTestUtils.setField(service, "followPlanMapper", planMapper);
        ReflectionTestUtils.setField(service, "followRecordMapper", recordMapper);
        ReflectionTestUtils.setField(service, "elderReferenceService", elderReferenceService);
        return service;
    }

    private FollowPlan plan(Long id, int status, int completedCount, int totalCount) {
        FollowPlan plan = new FollowPlan();
        plan.setId(id);
        plan.setElderId(1L);
        plan.setDoctorId(2L);
        plan.setStatus(status);
        plan.setCompletedCount(completedCount);
        plan.setTotalCount(totalCount);
        plan.setFrequencyType(2);
        return plan;
    }

    private FollowRecord record(Long planId) {
        FollowRecord record = new FollowRecord();
        record.setPlanId(planId);
        record.setElderId(1L);
        record.setFollowType(2);
        record.setFollowResult("状态稳定");
        return record;
    }
}
