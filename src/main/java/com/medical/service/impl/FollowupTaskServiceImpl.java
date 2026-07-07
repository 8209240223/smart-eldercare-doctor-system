package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.*;
import com.medical.mapper.*;
import com.medical.service.FollowupTaskService;
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

    @Override
    @Transactional
    public int generateAutoTasks() {
        int taskCount = 0;

        // 1. 为高危和重点人群自动创建随访任务
        QueryWrapper<ElderRiskProfile> riskWrapper = new QueryWrapper<>();
        riskWrapper.ge("risk_level", 3); // 重点和高危
        List<ElderRiskProfile> profiles = elderRiskProfileMapper.selectList(riskWrapper);

        for (ElderRiskProfile profile : profiles) {
            ElderInfo elder = elderInfoMapper.selectById(profile.getElderId());
            if (elder == null || elder.getDeleted() == 1 || elder.getDoctorId() == null) {
                continue;
            }

            // 检查是否已存在未完成的任务
            int existCount = followupTaskMapper.checkDuplicateTask(profile.getElderId(), 1);
            if (existCount > 0) {
                continue;
            }

            // 创建风险随访任务
            FollowupTask task = new FollowupTask();
            task.setElderId(profile.getElderId());
            task.setDoctorId(elder.getDoctorId());
            task.setTaskType(1); // 风险随访
            task.setPriority(profile.getRiskLevel() == 4 ? 4 : 3); // 高危紧急，重点高
            task.setDueDate(LocalDate.now().plusDays(3)); // 3天内完成
            task.setStatus(0); // 待执行
            task.setSource("RISK_AUTO");
            task.setTaskReason(String.format("风险等级:%s,评分:%d分", 
                    getRiskLevelText(profile.getRiskLevel()), profile.getRiskScore()));

            followupTaskMapper.insert(task);
            taskCount++;

            logger.info("为老人 {} 创建风险随访任务", profile.getElderId());
        }

        // 2. 为逾期随访的老人创建任务
        QueryWrapper<FollowPlan> planWrapper = new QueryWrapper<>();
        planWrapper.eq("status", 1); // 进行中的计划
        planWrapper.lt("next_follow_date", LocalDate.now().minusDays(7)); // 逾期超过7天
        planWrapper.eq("deleted", 0);
        List<FollowPlan> overduePlans = followPlanMapper.selectList(planWrapper);

        for (FollowPlan plan : overduePlans) {
            // 检查是否已存在逾期任务
            int existCount = followupTaskMapper.checkDuplicateTask(plan.getElderId(), 2);
            if (existCount > 0) {
                continue;
            }

            int overdueDays = (int) ChronoUnit.DAYS.between(plan.getNextFollowDate(), LocalDate.now());

            FollowupTask task = new FollowupTask();
            task.setElderId(plan.getElderId());
            task.setDoctorId(plan.getDoctorId());
            task.setTaskType(2); // 逾期随访
            task.setPriority(overdueDays >= 14 ? 3 : 2); // 逾期超过14天为高优先级
            task.setDueDate(LocalDate.now());
            task.setStatus(0);
            task.setSource("OVERDUE_AUTO");
            task.setTaskReason(String.format("随访逾期%d天", overdueDays));

            followupTaskMapper.insert(task);
            taskCount++;

            logger.info("为老人 {} 创建逾期随访任务,逾期{}天", plan.getElderId(), overdueDays);
        }

        return taskCount;
    }

    @Override
    public List<Map<String, Object>> getTodayTasks() {
        return followupTaskMapper.selectTodayTasks(LocalDate.now());
    }

    @Override
    public Page<Map<String, Object>> getTaskList(Integer pageNum, Integer pageSize, Long doctorId, Integer status) {
        Page<Map<String, Object>> page = new Page<>(pageNum, pageSize);
        
        Integer targetStatus = status != null ? status : 0;
        List<Map<String, Object>> allRecords = doctorId == null
                ? followupTaskMapper.selectByStatus(targetStatus)
                : followupTaskMapper.selectByDoctorId(doctorId, targetStatus);
        
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
    public boolean finishTask(Long taskId, Long followRecordId) {
        FollowupTask task = followupTaskMapper.selectById(taskId);
        if (task == null || task.getStatus() != 0) {
            return false;
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
    public boolean cancelTask(Long taskId, String reason) {
        FollowupTask task = followupTaskMapper.selectById(taskId);
        if (task == null || task.getStatus() != 0) {
            return false;
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
}
