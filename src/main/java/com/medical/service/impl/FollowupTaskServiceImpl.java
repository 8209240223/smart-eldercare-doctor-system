package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.dto.FollowupTaskGenerationResult;
import com.medical.entity.*;
import com.medical.mapper.*;
import com.medical.service.FollowupTaskService;
import com.medical.service.ElderReferenceService;
import com.medical.service.DoctorNurseRelationService;
import com.medical.service.RiskProfileService;
import com.medical.service.TimelineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * 随访任务服务实现
 */
@Service
public class FollowupTaskServiceImpl implements FollowupTaskService {

    private static final Logger logger = LoggerFactory.getLogger(FollowupTaskServiceImpl.class);

    @Autowired
    private FollowupTaskMapper followupTaskMapper;

    @Autowired
    private ElderRiskProfileMapper elderRiskProfileMapper;

    @Autowired
    private ElderInfoMapper elderInfoMapper;

    @Autowired
    private FollowPlanMapper followPlanMapper;

    @Autowired
    private RiskProfileService riskProfileService;

    @Autowired
    private TimelineService timelineService;

    @Autowired
    private ElderReferenceService elderReferenceService;

    @Autowired
    private FollowRecordMapper followRecordMapper;

    @Autowired
    private DoctorNurseRelationService doctorNurseRelationService;

    @Override
    @Transactional
    public int generateAutoTasks(Long doctorId, Long elderId, Long nurseId) {
        if (doctorId != null) {
            requireLinkedNurse(doctorId, nurseId);
        }
        int taskCount = 0;
        LocalDate today = LocalDate.now();
        QueryWrapper<FollowPlan> planWrapper = new QueryWrapper<>();
        planWrapper.eq("status", 1);
        planWrapper.eq("deleted", 0);
        planWrapper.le("start_date", today);
        planWrapper.and(wrapper -> wrapper.isNull("end_date").or().ge("end_date", today));
        planWrapper.eq(doctorId != null, "doctor_id", doctorId);
        planWrapper.eq(elderId != null, "elder_id", elderId);
        List<FollowPlan> activePlans = followPlanMapper.selectList(planWrapper);

        for (FollowPlan plan : activePlans) {
            if (!isPlanExecutable(plan, today)) {
                continue;
            }
            ElderInfo elder = elderInfoMapper.selectById(plan.getElderId());
            if (elder == null || Integer.valueOf(1).equals(elder.getDeleted())) {
                continue;
            }
            Long responsibleDoctorId = elder.getDoctorId();
            if (responsibleDoctorId == null
                    || !Objects.equals(responsibleDoctorId, plan.getDoctorId())
                    || (doctorId != null && !Objects.equals(responsibleDoctorId, doctorId))) {
                continue;
            }
            Long assignedNurseId = resolveAssignedNurse(responsibleDoctorId, elder, nurseId);
            if (assignedNurseId == null) {
                logger.warn("随访计划 {} 没有可分配的协作护士，已跳过任务生成", plan.getId());
                continue;
            }
            ElderRiskProfile profile = elderRiskProfileMapper.selectOne(
                    new QueryWrapper<ElderRiskProfile>().eq("elder_id", plan.getElderId()));
            int riskLevel = profile == null || profile.getRiskLevel() == null ? 1 : profile.getRiskLevel();
            int riskScore = profile == null || profile.getRiskScore() == null ? 0 : profile.getRiskScore();
            LocalDate nextFollowDate = plan.getNextFollowDate() == null ? today : plan.getNextFollowDate();
            int overdueDays = nextFollowDate.isBefore(today)
                    ? (int) ChronoUnit.DAYS.between(nextFollowDate, today)
                    : 0;

            FollowupTask task = new FollowupTask();
            task.setElderId(plan.getElderId());
            task.setPlanId(plan.getId());
            elderReferenceService.requireActiveDoctor(responsibleDoctorId);
            task.setDoctorId(responsibleDoctorId);
            task.setNurseId(assignedNurseId);
            task.setTaskType(overdueDays > 7 ? 2 : 1);
            task.setPriority(Math.max(priorityForRiskLevel(riskLevel), overdueDays >= 14 ? 3 : 1));
            task.setDueDate(nextFollowDate.isBefore(today) ? today : nextFollowDate);
            task.setStatus(0);
            task.setSource(overdueDays > 7 ? "OVERDUE_AUTO" : "PLAN_AUTO");
            task.setTaskReason(overdueDays > 7
                    ? String.format("随访逾期%d天，关联计划:%s", overdueDays, plan.getPlanName())
                    : String.format("%s风险老人随访，评分:%d分，关联计划:%s",
                    getRiskLevelText(riskLevel), riskScore, plan.getPlanName()));

            followupTaskMapper.insert(task);
            taskCount++;
            logger.info("为随访计划 {} 创建任务", plan.getId());
        }

        return taskCount;
    }

    @Override
    @Transactional
    public FollowupTaskGenerationResult generateForElder(Long elderId, Long doctorId, Long planId) {
        if (elderId == null || elderId <= 0) {
            throw new BusinessException(400, "老人ID必须为正整数");
        }
        if (planId == null || planId <= 0) {
            throw new BusinessException(400, "随访计划ID必须为正整数");
        }

        ElderInfo elder = elderReferenceService.requireActive(elderId);
        requireResponsibleDoctor(elder, doctorId);

        FollowPlan plan = followPlanMapper.selectByIdForUpdate(planId);
        if (plan == null || !elderId.equals(plan.getElderId())) {
            throw new BusinessException(404, "随访计划不存在或不属于该老人");
        }
        if (!Objects.equals(plan.getDoctorId(), doctorId)) {
            throw new BusinessException(403, "只能为当前医生负责的随访计划生成任务");
        }
        validateExecutablePlan(plan, LocalDate.now());

        FollowupTask existing = followupTaskMapper.selectPendingByPlanId(elderId, planId);
        if (existing != null) {
            if (existing.getNurseId() == null) {
                existing.setNurseId(resolveRequiredAssignedNurse(doctorId, elder, null));
                followupTaskMapper.updateById(existing);
            }
            return new FollowupTaskGenerationResult(existing, false);
        }

        ElderRiskProfile profile = elderRiskProfileMapper.selectOne(
                new QueryWrapper<ElderRiskProfile>().eq("elder_id", elderId));
        int riskLevel = profile == null || profile.getRiskLevel() == null ? 1 : profile.getRiskLevel();
        int riskScore = profile == null || profile.getRiskScore() == null ? 0 : profile.getRiskScore();

        FollowupTask task = new FollowupTask();
        task.setElderId(elderId);
        task.setPlanId(planId);
        task.setDoctorId(doctorId);
        task.setNurseId(resolveRequiredAssignedNurse(doctorId, elder, null));
        task.setTaskType(1);
        task.setPriority(priorityForRiskLevel(riskLevel));
        LocalDate dueDate = plan.getNextFollowDate() == null ? LocalDate.now() : plan.getNextFollowDate();
        task.setDueDate(dueDate.isBefore(LocalDate.now()) ? LocalDate.now() : dueDate);
        task.setStatus(0);
        task.setSource("CARE_WORKFLOW");
        task.setTaskReason(String.format("%s风险老人随访，评分:%d分，关联计划:%s",
                getRiskLevelText(riskLevel), riskScore, plan.getPlanName()));
        followupTaskMapper.insert(task);
        return new FollowupTaskGenerationResult(task, true);
    }

    @Override
    @Transactional
    public void assignTask(Long taskId, Long nurseId, Long doctorId) {
        FollowupTask task = taskId == null ? null : followupTaskMapper.selectById(taskId);
        if (task == null) {
            throw new BusinessException(404, "随访任务不存在");
        }
        if (!Objects.equals(task.getDoctorId(), doctorId)) {
            throw new BusinessException(403, "只能分配当前医生本人负责的随访任务");
        }
        if (!Integer.valueOf(0).equals(task.getStatus()) && !Integer.valueOf(1).equals(task.getStatus())) {
            throw new BusinessException(400, "已完成或已取消的随访任务不能重新分配");
        }
        requireLinkedNurse(doctorId, nurseId);
        task.setNurseId(nurseId);
        followupTaskMapper.updateById(task);
    }

    @Override
    public List<Map<String, Object>> getTodayTasks(Long currentUserId, Integer currentUserType) {
        requireQueryScope(currentUserId, currentUserType);
        return followupTaskMapper.selectTodayTasks(LocalDate.now(), currentUserId, currentUserType);
    }

    @Override
    public Page<Map<String, Object>> getTaskList(Integer pageNum, Integer pageSize,
                                                 Long doctorId, Long elderId, Integer status,
                                                 Long currentUserId, Integer currentUserType) {
        requireQueryScope(currentUserId, currentUserType);
        Page<Map<String, Object>> page = new Page<>(pageNum, pageSize);
        Long scopedDoctorId = normalizeDoctorFilter(doctorId, currentUserId, currentUserType);
        List<Map<String, Object>> allRecords = followupTaskMapper.selectTasks(
                scopedDoctorId, elderId, status, currentUserId, currentUserType);
        
        // 手动分页处理
        int total = allRecords.size();
        int start = (pageNum - 1) * pageSize;
        int end = Math.min(start + pageSize, total);
        
        List<Map<String, Object>> pageRecords = new ArrayList<>();
        if (start < total) {
            pageRecords = allRecords.subList(start, end);
        }
        
        page.setRecords(pageRecords);
        page.setTotal(total);
        return page;
    }

    @Override
    public List<Map<String, Object>> getTaskElderOptions(Long currentUserId, Integer currentUserType) {
        requireQueryScope(currentUserId, currentUserType);
        return followupTaskMapper.selectTaskElderOptions(currentUserId, currentUserType);
    }

    @Override
    @Transactional
    public boolean finishTask(Long taskId, Long followRecordId, Long doctorId) {
        FollowupTask task = followupTaskMapper.selectById(taskId);
        if (task == null || task.getStatus() != 0) {
            return false;
        }
        if (!Objects.equals(task.getDoctorId(), doctorId)) {
            throw new BusinessException(403, "只能完成分配给当前医生的随访任务");
        }

        elderReferenceService.requireActive(task.getElderId());
        FollowRecord followRecord = followRecordMapper.selectById(followRecordId);
        if (followRecord == null) {
            throw new BusinessException(404, "关联的随访记录不存在");
        }
        if (!Objects.equals(task.getElderId(), followRecord.getElderId())) {
            throw new BusinessException(400, "随访任务与随访记录必须属于同一老人");
        }
        if (!Objects.equals(task.getPlanId(), followRecord.getPlanId())) {
            throw new BusinessException(400, "随访任务与随访记录必须属于同一随访计划");
        }
        if (!Objects.equals(doctorId, followRecord.getDoctorId())) {
            throw new BusinessException(403, "只能使用当前医生本人创建的随访记录完成任务");
        }

        task.setStatus(2); // 已完成
        task.setFinishTime(LocalDateTime.now());
        task.setFollowRecordId(followRecordId);
        followupTaskMapper.updateById(task);

        // 记录时间线
        TimelineEvent event = new TimelineEvent();
        event.setElderId(task.getElderId());
        event.setEventType(5);
        event.setEventTitle("完成随访任务");
        event.setEventContent(String.format("完成任务ID:%d,关联随访记录:%d", taskId, followRecordId));
        event.setSourceType("FOLLOWUP_TASK");
        event.setSourceId(taskId);
        event.setEventTime(LocalDateTime.now());
        timelineService.addEvent(event);

        logger.info("完成随访任务 {}", taskId);
        return true;
    }

    @Override
    @Transactional
    public boolean cancelTask(Long taskId, String reason, Long doctorId) {
        FollowupTask task = followupTaskMapper.selectById(taskId);
        if (task == null || task.getStatus() != 0) {
            return false;
        }
        if (task.getDoctorId() != null && !task.getDoctorId().equals(doctorId)) {
            throw new BusinessException(403, "只能取消分配给当前医生的随访任务");
        }

        task.setStatus(3); // 已取消
        task.setRemark(reason);
        followupTaskMapper.updateById(task);

        logger.info("取消随访任务 {}, 原因: {}", taskId, reason);
        return true;
    }

    @Override
    public int countPendingTasks(Long currentUserId, Integer currentUserType) {
        requireQueryScope(currentUserId, currentUserType);
        return followupTaskMapper.countPendingTasks(currentUserId, currentUserType);
    }

    @Override
    public int countTodayTasks(Long currentUserId, Integer currentUserType) {
        requireQueryScope(currentUserId, currentUserType);
        return followupTaskMapper.countTodayTasks(LocalDate.now(), currentUserId, currentUserType);
    }

    @Override
    public List<Map<String, Object>> getOverdueTasks(Long currentUserId, Integer currentUserType) {
        requireQueryScope(currentUserId, currentUserType);
        return followupTaskMapper.selectOverdueTasks(LocalDate.now(), currentUserId, currentUserType);
    }

    private void requireQueryScope(Long currentUserId, Integer currentUserType) {
        if (currentUserId == null || currentUserType == null
                || (!Integer.valueOf(1).equals(currentUserType)
                && !Integer.valueOf(2).equals(currentUserType)
                && !Integer.valueOf(3).equals(currentUserType))) {
            throw new BusinessException(403, "当前用户无权查看随访任务");
        }
    }

    private Long normalizeDoctorFilter(Long requestedDoctorId,
                                       Long currentUserId,
                                       Integer currentUserType) {
        if (Integer.valueOf(2).equals(currentUserType)) {
            if (requestedDoctorId != null && !requestedDoctorId.equals(currentUserId)) {
                throw new BusinessException(403, "医生只能查看本人负责的随访任务");
            }
            return currentUserId;
        }
        return requestedDoctorId;
    }

    private String getRiskLevelText(int level) {
        switch (level) {
            case 1: return "普通";
            case 2: return "关注";
            case 3: return "重点";
            case 4: return "高危";
            default: return "未知";
        }
    }

    private int priorityForRiskLevel(int level) {
        switch (level) {
            case 4: return 4;
            case 3: return 3;
            case 2: return 2;
            default: return 1;
        }
    }

    private void requireResponsibleDoctor(ElderInfo elder, Long doctorId) {
        if (doctorId == null || !Objects.equals(elder.getDoctorId(), doctorId)) {
            throw new BusinessException(403, "只能为当前医生明确负责的老人生成随访任务");
        }
    }

    private void requireLinkedNurse(Long doctorId, Long nurseId) {
        if (nurseId == null || nurseId <= 0) {
            throw new BusinessException(400, "请选择负责执行任务的协作护士");
        }
        if (!doctorNurseRelationService.isLinked(doctorId, nurseId)) {
            throw new BusinessException(400, "所选护士不在当前医生的协作护士列表中");
        }
    }

    private Long resolveAssignedNurse(Long doctorId, ElderInfo elder, Long requestedNurseId) {
        Long preferredNurseId = requestedNurseId != null ? requestedNurseId : elder.getNurseId();
        return doctorNurseRelationService.chooseNurseForDoctor(
                doctorId, String.valueOf(elder.getId()), preferredNurseId);
    }

    private Long resolveRequiredAssignedNurse(Long doctorId, ElderInfo elder, Long requestedNurseId) {
        Long nurseId = resolveAssignedNurse(doctorId, elder, requestedNurseId);
        if (nurseId == null) {
            throw new BusinessException(400, "当前医生没有可用的协作护士，无法生成随访任务");
        }
        return nurseId;
    }

    private void validateExecutablePlan(FollowPlan plan, LocalDate today) {
        if (!Integer.valueOf(1).equals(plan.getStatus())) {
            throw new BusinessException(400, "只有进行中的随访计划可以生成任务");
        }
        if (plan.getStartDate() == null) {
            throw new BusinessException(400, "随访计划开始日期不能为空");
        }
        if (plan.getStartDate().isAfter(today)) {
            throw new BusinessException(400, "尚未开始的随访计划不能生成任务");
        }
        if (plan.getEndDate() != null && plan.getEndDate().isBefore(today)) {
            throw new BusinessException(400, "已过期的随访计划不能生成任务");
        }
    }

    private boolean isPlanExecutable(FollowPlan plan, LocalDate today) {
        return Integer.valueOf(1).equals(plan.getStatus())
                && plan.getStartDate() != null
                && !plan.getStartDate().isAfter(today)
                && (plan.getEndDate() == null || !plan.getEndDate().isBefore(today));
    }
}
