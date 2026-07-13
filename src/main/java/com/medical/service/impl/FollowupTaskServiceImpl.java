package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.dto.FollowupTaskGenerationResult;
import com.medical.entity.*;
import com.medical.mapper.*;
import com.medical.service.FollowupTaskService;
import com.medical.service.ElderReferenceService;
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

    @Override
    @Transactional
    public int generateAutoTasks(Long doctorId, Long elderId) {
        int taskCount = 0;
        QueryWrapper<FollowPlan> planWrapper = new QueryWrapper<>();
        planWrapper.eq("status", 1);
        planWrapper.eq("deleted", 0);
        planWrapper.and(wrapper -> wrapper.isNull("end_date").or().ge("end_date", LocalDate.now()));
        planWrapper.eq(doctorId != null, "doctor_id", doctorId);
        planWrapper.eq(elderId != null, "elder_id", elderId);
        List<FollowPlan> activePlans = followPlanMapper.selectList(planWrapper);

        for (FollowPlan plan : activePlans) {
            ElderInfo elder = elderInfoMapper.selectById(plan.getElderId());
            if (elder == null || Integer.valueOf(1).equals(elder.getDeleted())) {
                continue;
            }
            if (followupTaskMapper.selectPendingByPlanId(plan.getElderId(), plan.getId()) != null) {
                continue;
            }
            ElderRiskProfile profile = elderRiskProfileMapper.selectOne(
                    new QueryWrapper<ElderRiskProfile>().eq("elder_id", plan.getElderId()));
            int riskLevel = profile == null || profile.getRiskLevel() == null ? 1 : profile.getRiskLevel();
            int riskScore = profile == null || profile.getRiskScore() == null ? 0 : profile.getRiskScore();
            LocalDate nextFollowDate = plan.getNextFollowDate() == null ? LocalDate.now() : plan.getNextFollowDate();
            int overdueDays = nextFollowDate.isBefore(LocalDate.now())
                    ? (int) ChronoUnit.DAYS.between(nextFollowDate, LocalDate.now())
                    : 0;

            FollowupTask task = new FollowupTask();
            task.setElderId(plan.getElderId());
            task.setPlanId(plan.getId());
            Long responsibleDoctorId = plan.getDoctorId() != null ? plan.getDoctorId() : elder.getDoctorId();
            elderReferenceService.requireActiveDoctor(responsibleDoctorId);
            task.setDoctorId(responsibleDoctorId);
            task.setTaskType(overdueDays > 7 ? 2 : 1);
            task.setPriority(Math.max(priorityForRiskLevel(riskLevel), overdueDays >= 14 ? 3 : 1));
            task.setDueDate(nextFollowDate.isBefore(LocalDate.now()) ? LocalDate.now() : nextFollowDate);
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

        FollowPlan plan = followPlanMapper.selectByIdForUpdate(planId);
        if (plan == null || !elderId.equals(plan.getElderId())) {
            throw new BusinessException(404, "随访计划不存在或不属于该老人");
        }
        if (plan.getStatus() != null && plan.getStatus() >= 2) {
            throw new BusinessException(400, "已完成或已终止的随访计划不能生成任务");
        }

        FollowupTask existing = followupTaskMapper.selectPendingByPlanId(elderId, planId);
        if (existing != null) {
            return new FollowupTaskGenerationResult(existing, false);
        }

        ElderRiskProfile profile = elderRiskProfileMapper.selectOne(
                new QueryWrapper<ElderRiskProfile>().eq("elder_id", elderId));
        int riskLevel = profile == null || profile.getRiskLevel() == null ? 1 : profile.getRiskLevel();
        int riskScore = profile == null || profile.getRiskScore() == null ? 0 : profile.getRiskScore();

        FollowupTask task = new FollowupTask();
        task.setElderId(elderId);
        task.setPlanId(planId);
        task.setDoctorId(doctorId != null ? doctorId
                : (plan.getDoctorId() != null ? plan.getDoctorId() : elder.getDoctorId()));
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
    public List<Map<String, Object>> getTodayTasks() {
        return followupTaskMapper.selectTodayTasks(LocalDate.now());
    }

    @Override
    public Page<Map<String, Object>> getTaskList(Integer pageNum, Integer pageSize, Long doctorId, Long elderId, Integer status) {
        Page<Map<String, Object>> page = new Page<>(pageNum, pageSize);
        if (elderId != null) {
            elderReferenceService.requireActive(elderId);
        }
        List<Map<String, Object>> allRecords = followupTaskMapper.selectTasks(doctorId, elderId, status);
        
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
    @Transactional
    public boolean finishTask(Long taskId, Long followRecordId, Long doctorId) {
        FollowupTask task = followupTaskMapper.selectById(taskId);
        if (task == null || task.getStatus() != 0) {
            return false;
        }
        if (task.getDoctorId() != null && !task.getDoctorId().equals(doctorId)) {
            throw new BusinessException(403, "只能完成分配给当前医生的随访任务");
        }

        elderReferenceService.requireActive(task.getElderId());
        FollowRecord followRecord = followRecordMapper.selectById(followRecordId);
        if (followRecord == null) {
            throw new BusinessException(404, "关联的随访记录不存在");
        }
        if (!task.getElderId().equals(followRecord.getElderId())) {
            throw new BusinessException(400, "随访任务与随访记录必须属于同一老人");
        }
        if (task.getPlanId() != null && !task.getPlanId().equals(followRecord.getPlanId())) {
            throw new BusinessException(400, "随访任务与随访记录必须属于同一随访计划");
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
    public int countPendingTasks() {
        return followupTaskMapper.countPendingTasks();
    }

    @Override
    public int countTodayTasks() {
        return followupTaskMapper.countTodayTasks(LocalDate.now());
    }

    @Override
    public List<Map<String, Object>> getOverdueTasks() {
        QueryWrapper<FollowupTask> wrapper = new QueryWrapper<>();
        wrapper.eq("status", 0);
        wrapper.lt("due_date", LocalDate.now());
        wrapper.orderByDesc("priority");

        List<FollowupTask> tasks = followupTaskMapper.selectList(wrapper);
        List<Map<String, Object>> result = new ArrayList<>();
        for (FollowupTask task : tasks) {
            Map<String, Object> map = new HashMap<>();
            map.put("task", task);
            ElderInfo elder = elderInfoMapper.selectById(task.getElderId());
            if (elder != null) {
                map.put("elderName", elder.getName());
                map.put("elderPhone", elder.getPhone());
                map.put("community", elder.getCommunity());
            }
            result.add(map);
        }
        return result;
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
}
