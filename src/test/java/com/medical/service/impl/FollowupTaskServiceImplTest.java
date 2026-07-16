package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.medical.common.exception.BusinessException;
import com.medical.dto.FollowupTaskGenerationResult;
import com.medical.entity.ElderInfo;
import com.medical.entity.ElderRiskProfile;
import com.medical.entity.FollowPlan;
import com.medical.entity.FollowRecord;
import com.medical.entity.FollowupTask;
import com.medical.mapper.ElderInfoMapper;
import com.medical.mapper.ElderRiskProfileMapper;
import com.medical.mapper.FollowPlanMapper;
import com.medical.mapper.FollowRecordMapper;
import com.medical.mapper.FollowupTaskMapper;
import com.medical.service.ElderReferenceService;
import com.medical.service.DoctorNurseRelationService;
import com.medical.service.TimelineService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;

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

        int count = fixture.service.generateAutoTasks(2L, 12L, 5L);

        assertEquals(1, count);
        ArgumentCaptor<QueryWrapper<FollowPlan>> planQuery = ArgumentCaptor.forClass(QueryWrapper.class);
        verify(fixture.followPlanMapper).selectList(planQuery.capture());
        assertTrue(planQuery.getValue().getSqlSegment().contains("start_date <="));
        assertTrue(planQuery.getValue().getSqlSegment().contains("end_date IS NULL"));
        assertTrue(planQuery.getValue().getSqlSegment().contains("end_date >="));
        verify(fixture.elderReferenceService).requireActiveDoctor(2L);
        verify(fixture.followupTaskMapper).insert(org.mockito.ArgumentMatchers.argThat(task ->
                Long.valueOf(40L).equals(task.getPlanId())
                        && Long.valueOf(12L).equals(task.getElderId())
                        && Long.valueOf(2L).equals(task.getDoctorId())
                        && Long.valueOf(5L).equals(task.getNurseId())
                        && "PLAN_AUTO".equals(task.getSource())
                        && task.getTaskReason() != null
                        && task.getTaskReason().contains("健康随访计划")));
    }

    @Test
    void autoGenerationSkipsElderWithoutResponsibleDoctor() {
        Fixture fixture = fixture();
        FollowPlan plan = plan(41L, 13L);
        ElderInfo elder = elder(13L);
        elder.setDoctorId(null);

        when(fixture.followPlanMapper.selectList(any())).thenReturn(java.util.List.of(plan));
        when(fixture.elderInfoMapper.selectById(13L)).thenReturn(elder);

        int count = fixture.service.generateAutoTasks(2L, 13L, 5L);

        assertEquals(0, count);
        verify(fixture.followupTaskMapper, never()).insert(any(FollowupTask.class));
    }

    @Test
    void autoGenerationSkipsPlansOutsideExecutionWindow() {
        Fixture fixture = fixture();
        FollowPlan futurePlan = plan(42L, 14L);
        futurePlan.setStartDate(LocalDate.now().plusDays(1));
        futurePlan.setEndDate(LocalDate.now().plusDays(30));
        FollowPlan expiredPlan = plan(43L, 15L);
        expiredPlan.setStartDate(LocalDate.now().minusDays(30));
        expiredPlan.setEndDate(LocalDate.now().minusDays(1));

        when(fixture.followPlanMapper.selectList(any())).thenReturn(java.util.List.of(futurePlan, expiredPlan));
        when(fixture.elderInfoMapper.selectById(14L)).thenReturn(elder(14L));
        when(fixture.elderInfoMapper.selectById(15L)).thenReturn(elder(15L));

        int count = fixture.service.generateAutoTasks(2L, null, 5L);

        assertEquals(0, count);
        verify(fixture.followupTaskMapper, never()).insert(any(FollowupTask.class));
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
    void doctorCannotFinishUnassignedTask() {
        Fixture fixture = fixture();
        FollowupTask task = task(72L, 10L, 30L, null);
        when(fixture.followupTaskMapper.selectById(72L)).thenReturn(task);

        BusinessException error = assertThrows(BusinessException.class,
                () -> fixture.service.finishTask(72L, 82L, 2L));

        assertEquals(403, error.getCode());
        verify(fixture.followRecordMapper, never()).selectById(any());
        verify(fixture.followupTaskMapper, never()).updateById(any(FollowupTask.class));
    }

    @Test
    void doctorCannotFinishTaskWithFollowRecordOwnedByAnotherDoctor() {
        Fixture fixture = fixture();
        FollowupTask task = task(70L, 10L, 30L, 2L);
        FollowRecord followRecord = followRecord(80L, 10L, 30L, 3L);
        when(fixture.followupTaskMapper.selectById(70L)).thenReturn(task);
        when(fixture.followRecordMapper.selectById(80L)).thenReturn(followRecord);

        BusinessException error = assertThrows(BusinessException.class,
                () -> fixture.service.finishTask(70L, 80L, 2L));

        assertEquals(403, error.getCode());
        verify(fixture.followupTaskMapper, never()).updateById(any(FollowupTask.class));
    }

    @Test
    void doctorCannotFinishTaskWithUnownedFollowRecord() {
        Fixture fixture = fixture();
        FollowupTask task = task(71L, 10L, 30L, 2L);
        FollowRecord followRecord = followRecord(81L, 10L, 30L, null);
        when(fixture.followupTaskMapper.selectById(71L)).thenReturn(task);
        when(fixture.followRecordMapper.selectById(81L)).thenReturn(followRecord);

        BusinessException error = assertThrows(BusinessException.class,
                () -> fixture.service.finishTask(71L, 81L, 2L));

        assertEquals(403, error.getCode());
        verify(fixture.followupTaskMapper, never()).updateById(any(FollowupTask.class));
    }

    @Test
    void generateForElderCreatesTaskLinkedToPlanId() {
        Fixture fixture = fixture();
        ElderInfo elder = elder(10L);
        FollowPlan plan = plan(30L, 10L);
        plan.setStartDate(LocalDate.now());
        plan.setEndDate(LocalDate.now());
        plan.setNextFollowDate(LocalDate.now());
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
        assertEquals(5L, result.getTask().getNurseId());
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

    @Test
    void generateForElderRejectsElderWithoutResponsibleDoctor() {
        Fixture fixture = fixture();
        ElderInfo elder = elder(10L);
        elder.setDoctorId(null);
        when(fixture.elderReferenceService.requireActive(10L)).thenReturn(elder);
        when(fixture.followPlanMapper.selectByIdForUpdate(30L)).thenReturn(plan(30L, 10L));

        BusinessException error = assertThrows(BusinessException.class,
                () -> fixture.service.generateForElder(10L, 2L, 30L));

        assertEquals(403, error.getCode());
        verify(fixture.followupTaskMapper, never()).insert(any(FollowupTask.class));
    }

    @Test
    void generateForElderRejectsPausedPlan() {
        Fixture fixture = fixture();
        FollowPlan plan = plan(30L, 10L);
        plan.setStatus(0);
        when(fixture.elderReferenceService.requireActive(10L)).thenReturn(elder(10L));
        when(fixture.followPlanMapper.selectByIdForUpdate(30L)).thenReturn(plan);

        BusinessException error = assertThrows(BusinessException.class,
                () -> fixture.service.generateForElder(10L, 2L, 30L));

        assertEquals(400, error.getCode());
        verify(fixture.followupTaskMapper, never()).insert(any(FollowupTask.class));
    }

    @Test
    void generateForElderRejectsPlanThatHasNotStarted() {
        Fixture fixture = fixture();
        FollowPlan plan = plan(30L, 10L);
        plan.setStartDate(LocalDate.now().plusDays(1));
        when(fixture.elderReferenceService.requireActive(10L)).thenReturn(elder(10L));
        when(fixture.followPlanMapper.selectByIdForUpdate(30L)).thenReturn(plan);

        BusinessException error = assertThrows(BusinessException.class,
                () -> fixture.service.generateForElder(10L, 2L, 30L));

        assertEquals(400, error.getCode());
        verify(fixture.followupTaskMapper, never()).insert(any(FollowupTask.class));
    }

    @Test
    void generateForElderRejectsPlanWithoutStartDate() {
        Fixture fixture = fixture();
        FollowPlan plan = plan(30L, 10L);
        plan.setStartDate(null);
        when(fixture.elderReferenceService.requireActive(10L)).thenReturn(elder(10L));
        when(fixture.followPlanMapper.selectByIdForUpdate(30L)).thenReturn(plan);

        BusinessException error = assertThrows(BusinessException.class,
                () -> fixture.service.generateForElder(10L, 2L, 30L));

        assertEquals(400, error.getCode());
        verify(fixture.followupTaskMapper, never()).insert(any(FollowupTask.class));
    }

    @Test
    void generateForElderRejectsExpiredPlan() {
        Fixture fixture = fixture();
        FollowPlan plan = plan(30L, 10L);
        plan.setEndDate(LocalDate.now().minusDays(1));
        when(fixture.elderReferenceService.requireActive(10L)).thenReturn(elder(10L));
        when(fixture.followPlanMapper.selectByIdForUpdate(30L)).thenReturn(plan);

        BusinessException error = assertThrows(BusinessException.class,
                () -> fixture.service.generateForElder(10L, 2L, 30L));

        assertEquals(400, error.getCode());
        verify(fixture.followupTaskMapper, never()).insert(any(FollowupTask.class));
    }

    @Test
    void doctorCannotQueryAnotherDoctorsTasks() {
        Fixture fixture = fixture();

        BusinessException error = assertThrows(BusinessException.class,
                () -> fixture.service.getTaskList(1, 10, 3L, null, null, 2L, 2));

        assertEquals(403, error.getCode());
        verify(fixture.followupTaskMapper, never()).selectTasks(any(), any(), any(), any(), any());
    }

    @Test
    void doctorTaskListAlwaysUsesCurrentDoctorScope() {
        Fixture fixture = fixture();
        when(fixture.followupTaskMapper.selectTasks(2L, null, 0, 2L, 2)).thenReturn(List.of());

        var page = fixture.service.getTaskList(1, 10, null, null, 0, 2L, 2);

        assertEquals(0L, page.getTotal());
        verify(fixture.followupTaskMapper).selectTasks(2L, null, 0, 2L, 2);
    }

    @Test
    void nurseTaskSummaryUsesExactNurseAssignmentScope() {
        Fixture fixture = fixture();
        when(fixture.followupTaskMapper.countPendingTasks(5L, 3)).thenReturn(4);
        when(fixture.followupTaskMapper.countTodayTasks(any(LocalDate.class), any(), any())).thenReturn(2);

        assertEquals(4, fixture.service.countPendingTasks(5L, 3));
        assertEquals(2, fixture.service.countTodayTasks(5L, 3));
        verify(fixture.followupTaskMapper).countPendingTasks(5L, 3);
        verify(fixture.followupTaskMapper).countTodayTasks(any(LocalDate.class), any(), any());
    }

    private Fixture fixture() {
        Fixture fixture = new Fixture();
        fixture.service = new FollowupTaskServiceImpl();
        fixture.followupTaskMapper = mock(FollowupTaskMapper.class);
        fixture.elderInfoMapper = mock(ElderInfoMapper.class);
        fixture.followPlanMapper = mock(FollowPlanMapper.class);
        fixture.followRecordMapper = mock(FollowRecordMapper.class);
        fixture.riskProfileMapper = mock(ElderRiskProfileMapper.class);
        fixture.elderReferenceService = mock(ElderReferenceService.class);
        fixture.timelineService = mock(TimelineService.class);
        fixture.doctorNurseRelationService = mock(DoctorNurseRelationService.class);
        ReflectionTestUtils.setField(fixture.service, "followupTaskMapper", fixture.followupTaskMapper);
        ReflectionTestUtils.setField(fixture.service, "elderInfoMapper", fixture.elderInfoMapper);
        ReflectionTestUtils.setField(fixture.service, "followPlanMapper", fixture.followPlanMapper);
        ReflectionTestUtils.setField(fixture.service, "followRecordMapper", fixture.followRecordMapper);
        ReflectionTestUtils.setField(fixture.service, "elderRiskProfileMapper", fixture.riskProfileMapper);
        ReflectionTestUtils.setField(fixture.service, "elderReferenceService", fixture.elderReferenceService);
        ReflectionTestUtils.setField(fixture.service, "timelineService", fixture.timelineService);
        ReflectionTestUtils.setField(fixture.service, "doctorNurseRelationService", fixture.doctorNurseRelationService);
        when(fixture.doctorNurseRelationService.isLinked(any(), any())).thenReturn(true);
        when(fixture.doctorNurseRelationService.chooseNurseForDoctor(any(), any(), any()))
                .thenAnswer(invocation -> {
                    Long preferred = invocation.getArgument(2);
                    return preferred == null ? 5L : preferred;
                });
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
        plan.setStartDate(LocalDate.now().minusDays(1));
        plan.setEndDate(LocalDate.now().plusDays(30));
        plan.setNextFollowDate(LocalDate.now().plusDays(7));
        return plan;
    }

    private FollowupTask task(Long id, Long elderId, Long planId, Long doctorId) {
        FollowupTask task = new FollowupTask();
        task.setId(id);
        task.setElderId(elderId);
        task.setPlanId(planId);
        task.setDoctorId(doctorId);
        task.setStatus(0);
        return task;
    }

    private FollowRecord followRecord(Long id, Long elderId, Long planId, Long doctorId) {
        FollowRecord record = new FollowRecord();
        record.setId(id);
        record.setElderId(elderId);
        record.setPlanId(planId);
        record.setDoctorId(doctorId);
        return record;
    }

    private static class Fixture {
        FollowupTaskServiceImpl service;
        FollowupTaskMapper followupTaskMapper;
        ElderInfoMapper elderInfoMapper;
        FollowPlanMapper followPlanMapper;
        FollowRecordMapper followRecordMapper;
        ElderRiskProfileMapper riskProfileMapper;
        ElderReferenceService elderReferenceService;
        TimelineService timelineService;
        DoctorNurseRelationService doctorNurseRelationService;
    }

    @Test
    void doctorCanAssignPendingTaskToLinkedNurse() {
        Fixture fixture = fixture();
        FollowupTask task = task(73L, 10L, 30L, 2L);
        when(fixture.followupTaskMapper.selectById(73L)).thenReturn(task);

        fixture.service.assignTask(73L, 6L, 2L);

        assertEquals(6L, task.getNurseId());
        verify(fixture.doctorNurseRelationService).isLinked(2L, 6L);
        verify(fixture.followupTaskMapper).updateById(task);
    }

    @Test
    void doctorCannotAssignTaskToUnlinkedNurse() {
        Fixture fixture = fixture();
        FollowupTask task = task(74L, 10L, 30L, 2L);
        when(fixture.followupTaskMapper.selectById(74L)).thenReturn(task);
        when(fixture.doctorNurseRelationService.isLinked(2L, 99L)).thenReturn(false);

        BusinessException error = assertThrows(BusinessException.class,
                () -> fixture.service.assignTask(74L, 99L, 2L));

        assertEquals(400, error.getCode());
        verify(fixture.followupTaskMapper, never()).updateById(task);
    }
}
