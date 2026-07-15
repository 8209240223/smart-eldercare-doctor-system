package com.medical.service;

import com.medical.common.exception.BusinessException;
import com.medical.dto.CareWorkflowResult;
import com.medical.dto.FollowupTaskGenerationResult;
import com.medical.entity.AiHealthReport;
import com.medical.entity.ElderInfo;
import com.medical.entity.ElderRiskProfile;
import com.medical.entity.FollowPlan;
import com.medical.entity.FollowupTask;
import com.medical.mapper.ElderRiskProfileMapper;
import com.medical.mapper.FollowPlanMapper;
import com.medical.mapper.FollowupTaskMapper;
import com.medical.mapper.HealthRecordMapper;
import com.medical.mapper.NursingPlanMapper;
import com.medical.mapper.NursingRecordMapper;
import com.medical.mapper.PhysicalExamMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CareWorkflowServiceTest {

    @Test
    void generateReusesPlanTaskAndExistingReportWithoutCallingKimi() {
        Fixture fixture = fixture();
        ElderInfo elder = elder();
        ElderRiskProfile risk = risk();
        FollowPlan plan = plan();
        FollowupTask task = task();
        AiHealthReport draft = report();

        when(fixture.elderReferenceService.requireActive(8L)).thenReturn(elder);
        when(fixture.riskProfileMapper.selectOne(any())).thenReturn(risk);
        when(fixture.riskProfileService.calculateRisk(8L)).thenReturn(risk);
        when(fixture.followPlanMapper.selectLatestActiveByElderForUpdate(8L)).thenReturn(plan);
        when(fixture.followPlanMapper.selectLatestActiveByElder(8L)).thenReturn(plan);
        when(fixture.followUpService.generateRiskFollowPlans(2L, 8L)).thenReturn(Map.of());
        when(fixture.followupTaskService.generateForElder(8L, 2L, 31L))
                .thenReturn(new FollowupTaskGenerationResult(task, false));
        when(fixture.aiHealthReportService.getLatestByElder(8L)).thenReturn(draft);
        when(fixture.healthRecordMapper.selectCount(any())).thenReturn(1L);
        when(fixture.physicalExamMapper.selectCount(any())).thenReturn(2L);
        when(fixture.nursingPlanMapper.selectCount(any())).thenReturn(3L);
        when(fixture.nursingRecordMapper.selectCount(any())).thenReturn(4L);

        CareWorkflowResult result = fixture.service.generate(8L, 2L, 2);

        assertEquals("reused", result.getPlan().getStatus());
        assertEquals("reused", result.getTask().getStatus());
        assertEquals("reused", result.getReport().getStatus());
        assertFalse(result.getPlan().isCreated());
        assertTrue(result.getPlan().isReused());
        assertTrue(result.isHealthRecordPresent());
        assertEquals(2L, result.getExamCount());
        assertEquals(3L, result.getNursingPlanCount());
        assertEquals(4L, result.getNursingRecordCount());
        verify(fixture.followupTaskService).generateForElder(8L, 2L, 31L);
        verify(fixture.aiHealthReportService, never()).generateOrRefreshByRule(any(), any());
    }

    @Test
    void generateMarksReportPendingWhenDoctorHasNotGeneratedOne() {
        Fixture fixture = fixture();
        ElderInfo elder = elder();
        ElderRiskProfile risk = risk();
        FollowPlan plan = plan();
        FollowupTask task = task();

        when(fixture.elderReferenceService.requireActive(8L)).thenReturn(elder);
        when(fixture.riskProfileMapper.selectOne(any())).thenReturn(risk);
        when(fixture.riskProfileService.calculateRisk(8L)).thenReturn(risk);
        when(fixture.followPlanMapper.selectLatestActiveByElderForUpdate(8L)).thenReturn(null);
        when(fixture.followPlanMapper.selectLatestActiveByElder(8L)).thenReturn(plan);
        when(fixture.followUpService.generateRiskFollowPlans(2L, 8L)).thenReturn(Map.of());
        when(fixture.followupTaskService.generateForElder(8L, 2L, 31L))
                .thenReturn(new FollowupTaskGenerationResult(task, true));
        when(fixture.aiHealthReportService.getLatestByElder(8L)).thenReturn(null);
        when(fixture.healthRecordMapper.selectCount(any())).thenReturn(0L);
        when(fixture.physicalExamMapper.selectCount(any())).thenReturn(0L);
        when(fixture.nursingPlanMapper.selectCount(any())).thenReturn(0L);
        when(fixture.nursingRecordMapper.selectCount(any())).thenReturn(0L);

        CareWorkflowResult result = fixture.service.generate(8L, 2L, 2);

        assertEquals("pending", result.getReport().getStatus());
        assertFalse(result.getReport().isCreated());
        assertFalse(result.getReport().isReused());
        assertNull(result.getReport().getData());
        assertEquals("/ai-reports?elderId=8", result.getLinks().get("report"));
        verify(fixture.aiHealthReportService, never()).generateOrRefreshByRule(any(), any());
    }

    @Test
    void nurseCannotGenerateButCanReadSummary() {
        Fixture fixture = fixture();
        when(fixture.elderReferenceService.requireActive(8L)).thenReturn(elder());
        when(fixture.riskProfileMapper.selectOne(any())).thenReturn(risk());
        when(fixture.followPlanMapper.selectLatestActiveByElder(8L)).thenReturn(plan());
        when(fixture.followupTaskMapper.selectPendingByPlanId(8L, 31L)).thenReturn(task());
        when(fixture.aiHealthReportService.getLatestByElder(8L)).thenReturn(report());
        when(fixture.healthRecordMapper.selectCount(any())).thenReturn(0L);
        when(fixture.physicalExamMapper.selectCount(any())).thenReturn(0L);
        when(fixture.nursingPlanMapper.selectCount(any())).thenReturn(0L);
        when(fixture.nursingRecordMapper.selectCount(any())).thenReturn(0L);

        assertThrows(BusinessException.class, () -> fixture.service.generate(8L, 6L, 3));
        CareWorkflowResult summary = fixture.service.summary(8L, 6L, 3);

        assertEquals(8L, summary.getElder().getId());
        assertEquals("existing", summary.getPlan().getStatus());
    }

    @Test
    void generateRejectsElderWithoutResponsibleDoctor() {
        Fixture fixture = fixture();
        ElderInfo elder = elder();
        elder.setDoctorId(null);
        when(fixture.elderReferenceService.requireActive(8L)).thenReturn(elder);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> fixture.service.generate(8L, 2L, 2));

        assertEquals(400, exception.getCode());
        verify(fixture.riskProfileService, never()).calculateRisk(8L);
    }

    @Test
    void generateRejectsElderOwnedByAnotherDoctor() {
        Fixture fixture = fixture();
        when(fixture.elderReferenceService.requireActive(8L)).thenReturn(elder());

        BusinessException exception = assertThrows(BusinessException.class,
                () -> fixture.service.generate(8L, 3L, 2));

        assertEquals(403, exception.getCode());
        verify(fixture.riskProfileService, never()).calculateRisk(8L);
        verify(fixture.followUpService, never()).generateRiskFollowPlans(any(), any());
    }

    private Fixture fixture() {
        Fixture fixture = new Fixture();
        fixture.service = new CareWorkflowService();
        fixture.elderReferenceService = mock(ElderReferenceService.class);
        fixture.riskProfileMapper = mock(ElderRiskProfileMapper.class);
        fixture.followPlanMapper = mock(FollowPlanMapper.class);
        fixture.followupTaskMapper = mock(FollowupTaskMapper.class);
        fixture.healthRecordMapper = mock(HealthRecordMapper.class);
        fixture.physicalExamMapper = mock(PhysicalExamMapper.class);
        fixture.nursingPlanMapper = mock(NursingPlanMapper.class);
        fixture.nursingRecordMapper = mock(NursingRecordMapper.class);
        fixture.riskProfileService = mock(RiskProfileService.class);
        fixture.followUpService = mock(FollowUpService.class);
        fixture.followupTaskService = mock(FollowupTaskService.class);
        fixture.aiHealthReportService = mock(AiHealthReportService.class);
        ReflectionTestUtils.setField(fixture.service, "elderReferenceService", fixture.elderReferenceService);
        ReflectionTestUtils.setField(fixture.service, "riskProfileMapper", fixture.riskProfileMapper);
        ReflectionTestUtils.setField(fixture.service, "followPlanMapper", fixture.followPlanMapper);
        ReflectionTestUtils.setField(fixture.service, "followupTaskMapper", fixture.followupTaskMapper);
        ReflectionTestUtils.setField(fixture.service, "healthRecordMapper", fixture.healthRecordMapper);
        ReflectionTestUtils.setField(fixture.service, "physicalExamMapper", fixture.physicalExamMapper);
        ReflectionTestUtils.setField(fixture.service, "nursingPlanMapper", fixture.nursingPlanMapper);
        ReflectionTestUtils.setField(fixture.service, "nursingRecordMapper", fixture.nursingRecordMapper);
        ReflectionTestUtils.setField(fixture.service, "riskProfileService", fixture.riskProfileService);
        ReflectionTestUtils.setField(fixture.service, "followUpService", fixture.followUpService);
        ReflectionTestUtils.setField(fixture.service, "followupTaskService", fixture.followupTaskService);
        ReflectionTestUtils.setField(fixture.service, "aiHealthReportService", fixture.aiHealthReportService);
        return fixture;
    }

    private ElderInfo elder() {
        ElderInfo elder = new ElderInfo();
        elder.setId(8L);
        elder.setDoctorId(2L);
        elder.setDeleted(0);
        elder.setAccountStatus(1);
        return elder;
    }

    private ElderRiskProfile risk() {
        ElderRiskProfile risk = new ElderRiskProfile();
        risk.setId(20L);
        risk.setElderId(8L);
        risk.setRiskLevel(2);
        return risk;
    }

    private FollowPlan plan() {
        FollowPlan plan = new FollowPlan();
        plan.setId(31L);
        plan.setElderId(8L);
        plan.setDoctorId(2L);
        plan.setStatus(1);
        return plan;
    }

    private FollowupTask task() {
        FollowupTask task = new FollowupTask();
        task.setId(41L);
        task.setElderId(8L);
        task.setPlanId(31L);
        task.setStatus(0);
        return task;
    }

    private AiHealthReport report() {
        AiHealthReport report = new AiHealthReport();
        report.setId(51L);
        report.setElderId(8L);
        report.setSource(1);
        report.setStatus(0);
        return report;
    }

    private static class Fixture {
        CareWorkflowService service;
        ElderReferenceService elderReferenceService;
        ElderRiskProfileMapper riskProfileMapper;
        FollowPlanMapper followPlanMapper;
        FollowupTaskMapper followupTaskMapper;
        HealthRecordMapper healthRecordMapper;
        PhysicalExamMapper physicalExamMapper;
        NursingPlanMapper nursingPlanMapper;
        NursingRecordMapper nursingRecordMapper;
        RiskProfileService riskProfileService;
        FollowUpService followUpService;
        FollowupTaskService followupTaskService;
        AiHealthReportService aiHealthReportService;
    }
}
