package com.medical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.common.exception.BusinessException;
import com.medical.dto.CareWorkflowResult;
import com.medical.dto.FollowupTaskGenerationResult;
import com.medical.entity.AiHealthReport;
import com.medical.entity.ElderInfo;
import com.medical.entity.ElderRiskProfile;
import com.medical.entity.FollowPlan;
import com.medical.entity.FollowupTask;
import com.medical.entity.HealthRecord;
import com.medical.entity.NursingPlan;
import com.medical.entity.NursingRecord;
import com.medical.entity.PhysicalExam;
import com.medical.mapper.ElderRiskProfileMapper;
import com.medical.mapper.FollowPlanMapper;
import com.medical.mapper.FollowupTaskMapper;
import com.medical.mapper.HealthRecordMapper;
import com.medical.mapper.NursingPlanMapper;
import com.medical.mapper.NursingRecordMapper;
import com.medical.mapper.PhysicalExamMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class CareWorkflowService {

    @Autowired private ElderReferenceService elderReferenceService;
    @Autowired private ElderRiskProfileMapper riskProfileMapper;
    @Autowired private FollowPlanMapper followPlanMapper;
    @Autowired private FollowupTaskMapper followupTaskMapper;
    @Autowired private HealthRecordMapper healthRecordMapper;
    @Autowired private PhysicalExamMapper physicalExamMapper;
    @Autowired private NursingPlanMapper nursingPlanMapper;
    @Autowired private NursingRecordMapper nursingRecordMapper;
    @Autowired private RiskProfileService riskProfileService;
    @Autowired private FollowUpService followUpService;
    @Autowired private FollowupTaskService followupTaskService;
    @Autowired private AiHealthReportService aiHealthReportService;

    @Transactional
    public CareWorkflowResult generate(Long elderId, Long currentUserId, Integer currentUserType) {
        return generate(elderId, currentUserId, currentUserType, true);
    }

    /**
     * 生成健康管理流程。
     * @param createTask true 时同步生成随访任务(照护全流程按钮);false 时只算风险与随访计划,
     *                   随访任务留待在随访任务页手动点"自动生成任务"再落地(建档默认行为)。
     */
    @Transactional
    public CareWorkflowResult generate(Long elderId, Long currentUserId, Integer currentUserType, boolean createTask) {
        assertGeneratePermission(currentUserId, currentUserType);
        ElderInfo elder = elderReferenceService.requireActive(elderId);
        Long responsibleDoctorId = elder.getDoctorId();
        if (responsibleDoctorId == null) {
            throw new BusinessException(400, "请先为老人分配责任医生，再生成健康管理流程");
        }
        if (!responsibleDoctorId.equals(currentUserId)) {
            throw new BusinessException(403, "只能为当前医生明确负责的老人生成健康管理流程");
        }

        ElderRiskProfile previousRisk = findRisk(elderId);
        ElderRiskProfile risk = riskProfileService.calculateRisk(elderId);

        FollowPlan previousPlan = followPlanMapper.selectLatestActiveByElderForUpdate(elderId);
        followUpService.generateRiskFollowPlans(responsibleDoctorId, elderId);
        FollowPlan plan = followPlanMapper.selectLatestActiveByElder(elderId);
        if (plan == null) {
            throw new BusinessException(500, "未能为老人生成或复用随访计划");
        }

        FollowupTask task;
        CareWorkflowResult.Step<FollowupTask> taskStep;
        if (createTask) {
            FollowupTaskGenerationResult taskResult = followupTaskService.generateForElder(
                    elderId, responsibleDoctorId, plan.getId());
            task = taskResult.getTask();
            taskStep = step(taskResult.isCreated() ? "created" : "reused",
                    taskResult.isCreated(), !taskResult.isCreated(), task);
        } else {
            // 建档默认不落任务:只查是否已有该计划的待办任务,不新建
            task = followupTaskMapper.selectPendingByPlanId(elderId, plan.getId());
            taskStep = step(task == null ? "pending" : "existing", false, task != null, task);
        }

        AiHealthReport report = aiHealthReportService.getLatestByElder(elderId);

        CareWorkflowResult result = new CareWorkflowResult();
        result.setElder(elder);
        result.setRisk(step(previousRisk == null ? "created" : "refreshed",
                previousRisk == null, previousRisk != null, risk));
        result.setPlan(step(previousPlan == null ? "created" : "reused",
                previousPlan == null, previousPlan != null, plan));
        result.setTask(taskStep);
        result.setReport(step(report == null ? "pending" : "reused",
                false, report != null, report));
        populateCounts(result, elderId);
        result.setLinks(buildLinks(elderId, plan.getId(), task == null ? null : task.getId(),
                report == null ? null : report.getId()));
        return result;
    }

    public CareWorkflowResult summary(Long elderId, Long currentUserId, Integer currentUserType) {
        assertSummaryPermission(currentUserId, currentUserType);
        ElderInfo elder = elderReferenceService.requireActive(elderId);
        ElderRiskProfile risk = findRisk(elderId);
        FollowPlan plan = followPlanMapper.selectLatestActiveByElder(elderId);
        if (plan == null) {
            plan = followPlanMapper.selectLatestByElder(elderId);
        }
        FollowupTask task = plan == null ? followupTaskMapper.selectLatestByElder(elderId)
                : followupTaskMapper.selectPendingByPlanId(elderId, plan.getId());
        if (task == null) {
            task = followupTaskMapper.selectLatestByElder(elderId);
        }
        AiHealthReport report = aiHealthReportService.getLatestByElder(elderId);

        CareWorkflowResult result = new CareWorkflowResult();
        result.setElder(elder);
        result.setRisk(summaryStep(risk));
        result.setPlan(summaryStep(plan));
        result.setTask(summaryStep(task));
        result.setReport(summaryStep(report));
        populateCounts(result, elderId);
        result.setLinks(buildLinks(elderId,
                plan == null ? null : plan.getId(),
                task == null ? null : task.getId(),
                report == null ? null : report.getId()));
        return result;
    }

    private ElderRiskProfile findRisk(Long elderId) {
        return riskProfileMapper.selectOne(new LambdaQueryWrapper<ElderRiskProfile>()
                .eq(ElderRiskProfile::getElderId, elderId));
    }

    private void assertGeneratePermission(Long currentUserId, Integer currentUserType) {
        if (currentUserId == null || currentUserType == null) {
            throw new BusinessException(401, "未获取到当前登录用户");
        }
        if (!Integer.valueOf(2).equals(currentUserType)) {
            throw new BusinessException(403, "只有医生可以生成健康管理流程");
        }
    }

    private void assertSummaryPermission(Long currentUserId, Integer currentUserType) {
        if (currentUserId == null || currentUserType == null) {
            throw new BusinessException(401, "未获取到当前登录用户");
        }
        if (currentUserType < 1 || currentUserType > 3) {
            throw new BusinessException(403, "当前用户无权查看健康管理流程");
        }
    }

    private <T> CareWorkflowResult.Step<T> step(String status, boolean created, boolean reused, T data) {
        return new CareWorkflowResult.Step<>(status, created, reused, data);
    }

    private <T> CareWorkflowResult.Step<T> summaryStep(T data) {
        return step(data == null ? "missing" : "existing", false, data != null, data);
    }

    private Map<String, String> buildLinks(Long elderId, Long planId, Long taskId, Long reportId) {
        Map<String, String> links = new LinkedHashMap<>();
        links.put("elder", "/elders?elderId=" + elderId);
        links.put("risk", "/key-population?elderId=" + elderId);
        links.put("plan", "/followup?elderId=" + elderId + optional("planId", planId));
        links.put("task", "/followup-tasks?elderId=" + elderId + optional("taskId", taskId));
        links.put("report", "/ai-reports?elderId=" + elderId + optional("reportId", reportId));
        return links;
    }

    private void populateCounts(CareWorkflowResult result, Long elderId) {
        result.setHealthRecordPresent(healthRecordMapper.selectCount(
                new LambdaQueryWrapper<HealthRecord>().eq(HealthRecord::getElderId, elderId)) > 0);
        result.setExamCount(physicalExamMapper.selectCount(
                new LambdaQueryWrapper<PhysicalExam>().eq(PhysicalExam::getElderId, elderId)));
        result.setNursingPlanCount(nursingPlanMapper.selectCount(
                new LambdaQueryWrapper<NursingPlan>().eq(NursingPlan::getElderId, elderId)));
        result.setNursingRecordCount(nursingRecordMapper.selectCount(
                new LambdaQueryWrapper<NursingRecord>().eq(NursingRecord::getElderId, elderId)));
    }

    private String optional(String name, Long value) {
        return value == null ? "" : "&" + name + "=" + value;
    }
}
