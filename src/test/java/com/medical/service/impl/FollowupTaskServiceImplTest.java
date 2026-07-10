package com.medical.service.impl;

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
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FollowupTaskServiceImplTest {

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
