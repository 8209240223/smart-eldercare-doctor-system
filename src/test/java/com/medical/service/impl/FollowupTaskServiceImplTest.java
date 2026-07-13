package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.medical.common.exception.BusinessException;
import com.medical.dto.FollowupTaskGenerationResult;
import com.medical.entity.ElderInfo;
import com.medical.entity.ElderRiskProfile;
import com.medical.entity.FollowPlan;
import com.medical.entity.FollowupTask;
import com.medical.mapper.ElderInfoMapper;
import com.medical.mapper.ElderRiskProfileMapper;
import com.medical.mapper.FollowPlanMapper;
import com.medical.mapper.FollowupTaskMapper;
import com.medical.service.ElderReferenceService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FollowupTaskServiceImplTest {

    @Test
    void autoGenerationCreatesTaskForEveryActivePlanWithoutPendingTask() {
        Fixture fixture = fixture();
        FollowPlan plan = plan(40L, 12L);
        ElderInfo elder = elder(12L);
        ElderRiskProfile risk = new ElderRiskProfile();
        risk.setElderId(12L);
        risk.setRiskLevel(1);
        risk.setRiskScore(8);

        when(fixture.followPlanMapper.selectList(any())).thenReturn(java.util.List.of(plan));
        when(fixture.elderInfoMapper.selectById(12L)).thenReturn(elder);
        when(fixture.followupTaskMapper.selectPendingByPlanId(12L, 40L)).thenReturn(null);
        when(fixture.riskProfileMapper.selectOne(any())).thenReturn(risk);

        int count = fixture.service.generateAutoTasks(2L, 12L);

        assertEquals(1, count);
        ArgumentCaptor<QueryWrapper<FollowPlan>> planQuery = ArgumentCaptor.forClass(QueryWrapper.class);
        verify(fixture.followPlanMapper).selectList(planQuery.capture());
        assertTrue(planQuery.getValue().getSqlSegment().contains("end_date IS NULL"));
        assertTrue(planQuery.getValue().getSqlSegment().contains("end_date >="));
        verify(fixture.elderReferenceService).requireActiveDoctor(2L);
        verify(fixture.followupTaskMapper).insert(org.mockito.ArgumentMatchers.argThat(task ->
                Long.valueOf(40L).equals(task.getPlanId())
                        && Long.valueOf(12L).equals(task.getElderId())
                        && Long.valueOf(2L).equals(task.getDoctorId())));
    }

    @Test
    void doctorCannotFinishTaskAssignedToAnotherDoctor() {
        Fixture fixture = fixture();
        FollowupTask task = new FollowupTask();
        task.setId(70L);
        task.setDoctorId(2L);
        task.setStatus(0);
        when(fixture.followupTaskMapper.selectById(70L)).thenReturn(task);

        BusinessException error = assertThrows(BusinessException.class,
                () -> fixture.service.finishTask(70L, 80L, 3L));

        assertEquals(403, error.getCode());
        verify(fixture.followupTaskMapper, never()).updateById(any(FollowupTask.class));
    }

    @Test
    void generateForElderCreatesTaskLinkedToPlanId() {
        Fixture fixture = fixture();
        ElderInfo elder = elder(10L);
        FollowPlan plan = plan(30L, 10L);
        ElderRiskProfile risk = new ElderRiskProfile();
        risk.setElderId(10L);
        risk.setRiskLevel(2);
        risk.setRiskScore(42);

        when(fixture.elderReferenceService.requireActive(10L)).thenReturn(elder);
        when(fixture.followPlanMapper.selectByIdForUpdate(30L)).thenReturn(plan);
        when(fixture.followupTaskMapper.selectPendingByPlanId(10L, 30L)).thenReturn(null);
        when(fixture.riskProfileMapper.selectOne(any())).thenReturn(risk);
        doAnswer(invocation -> {
            FollowupTask task = invocation.getArgument(0);
            task.setId(50L);
            return 1;
        }).when(fixture.followupTaskMapper).insert(any(FollowupTask.class));

        FollowupTaskGenerationResult result = fixture.service.generateForElder(10L, 2L, 30L);

        assertTrue(result.isCreated());
        assertEquals(30L, result.getTask().getPlanId());
        assertEquals(10L, result.getTask().getElderId());
        assertEquals(50L, result.getTask().getId());
    }

    @Test
    void generateForElderReusesPendingTaskForSamePlan() {
        Fixture fixture = fixture();
        FollowupTask existing = new FollowupTask();
        existing.setId(51L);
        existing.setElderId(10L);
        existing.setPlanId(30L);
        existing.setStatus(0);

        when(fixture.elderReferenceService.requireActive(10L)).thenReturn(elder(10L));
        when(fixture.followPlanMapper.selectByIdForUpdate(30L)).thenReturn(plan(30L, 10L));
        when(fixture.followupTaskMapper.selectPendingByPlanId(10L, 30L)).thenReturn(existing);

        FollowupTaskGenerationResult result = fixture.service.generateForElder(10L, 2L, 30L);

        assertFalse(result.isCreated());
        assertEquals(51L, result.getTask().getId());
        verify(fixture.followupTaskMapper, never()).insert(any(FollowupTask.class));
    }

    private Fixture fixture() {
        Fixture fixture = new Fixture();
        fixture.service = new FollowupTaskServiceImpl();
        fixture.followupTaskMapper = mock(FollowupTaskMapper.class);
        fixture.elderInfoMapper = mock(ElderInfoMapper.class);
        fixture.followPlanMapper = mock(FollowPlanMapper.class);
        fixture.riskProfileMapper = mock(ElderRiskProfileMapper.class);
        fixture.elderReferenceService = mock(ElderReferenceService.class);
        ReflectionTestUtils.setField(fixture.service, "followupTaskMapper", fixture.followupTaskMapper);
        ReflectionTestUtils.setField(fixture.service, "elderInfoMapper", fixture.elderInfoMapper);
        ReflectionTestUtils.setField(fixture.service, "followPlanMapper", fixture.followPlanMapper);
        ReflectionTestUtils.setField(fixture.service, "elderRiskProfileMapper", fixture.riskProfileMapper);
        ReflectionTestUtils.setField(fixture.service, "elderReferenceService", fixture.elderReferenceService);
        return fixture;
    }

    private ElderInfo elder(Long id) {
        ElderInfo elder = new ElderInfo();
        elder.setId(id);
        elder.setDoctorId(2L);
        elder.setDeleted(0);
        return elder;
    }

    private FollowPlan plan(Long id, Long elderId) {
        FollowPlan plan = new FollowPlan();
        plan.setId(id);
        plan.setElderId(elderId);
        plan.setDoctorId(2L);
        plan.setPlanName("健康随访计划");
        plan.setStatus(1);
        plan.setNextFollowDate(LocalDate.now().plusDays(7));
        return plan;
    }

    private static class Fixture {
        FollowupTaskServiceImpl service;
        FollowupTaskMapper followupTaskMapper;
        ElderInfoMapper elderInfoMapper;
        FollowPlanMapper followPlanMapper;
        ElderRiskProfileMapper riskProfileMapper;
        ElderReferenceService elderReferenceService;
    }
}
