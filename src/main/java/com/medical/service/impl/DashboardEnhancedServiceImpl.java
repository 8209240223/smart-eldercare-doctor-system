package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.entity.*;
import com.medical.mapper.*;
import com.medical.service.DashboardEnhancedService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Service
public class DashboardEnhancedServiceImpl implements DashboardEnhancedService {

    @Autowired
    private HealthWarningMapper healthWarningMapper;

    @Autowired
    private FollowPlanMapper followPlanMapper;

    @Autowired
    private FollowRecordMapper followRecordMapper;

    @Autowired
    private NursingRecordMapper nursingRecordMapper;

    @Autowired
    private NursingPlanMapper nursingPlanMapper;

    @Autowired
    private ElderInfoMapper elderInfoMapper;

    @Autowired
    private MedicalHistoryMapper medicalHistoryMapper;

    @Override
    public Map<String, Object> getTodoList(Long doctorId) {
        Map<String, Object> todo = new HashMap<>();

        // 待处理预警数
        long pendingWarnings = healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().eq(HealthWarning::getStatus, 0));
        todo.put("pendingWarnings", pendingWarnings);

        // 今日需要随访的任务数
        long todayFollowups = followPlanMapper.selectCount(
                new LambdaQueryWrapper<FollowPlan>()
                        .eq(FollowPlan::getStatus, 1)
                        .eq(FollowPlan::getNextFollowDate, LocalDate.now()));
        todo.put("todayFollowups", todayFollowups);

        // 今日已完成的随访记录数
        long todayRecords = followRecordMapper.selectCount(
                new LambdaQueryWrapper<FollowRecord>()
                        .ge(FollowRecord::getCreateTime, LocalDate.now().atStartOfDay()));
        todo.put("todayRecords", todayRecords);

        // 待审核的异常护理记录数（护士上报的）
        long pendingNurseRecords = nursingRecordMapper.selectCount(
                new LambdaQueryWrapper<NursingRecord>()
                        .eq(NursingRecord::getReportStatus, 1)
                        .eq(NursingRecord::getDeleted, 0));
        todo.put("pendingNurseRecords", pendingNurseRecords);

        // 待审核的护理计划数
        long pendingNursePlans = nursingPlanMapper.selectCount(
                new LambdaQueryWrapper<NursingPlan>()
                        .eq(NursingPlan::getDoctorApproval, 0)
                        .in(NursingPlan::getStatus, 0, 1)
                        .eq(NursingPlan::getDeleted, 0));
        todo.put("pendingNursePlans", pendingNursePlans);

        // 今日待办总数
        long totalTodo = pendingWarnings + todayFollowups + pendingNurseRecords + pendingNursePlans;
        todo.put("totalTodo", totalTodo);

        // 过期随访计划数（逾期未随访）
        long overdueFollowups = followPlanMapper.selectCount(
                new LambdaQueryWrapper<FollowPlan>()
                        .eq(FollowPlan::getStatus, 1)
                        .lt(FollowPlan::getNextFollowDate, LocalDate.now()));
        todo.put("overdueFollowups", overdueFollowups);

        return todo;
    }

    @Override
    public Map<String, Object> getReviewCounts() {
        Map<String, Object> counts = new HashMap<>();

        // 待审核的异常护理记录
        long pendingNurseRecords = nursingRecordMapper.selectCount(
                new LambdaQueryWrapper<NursingRecord>()
                        .eq(NursingRecord::getReportStatus, 1)
                        .eq(NursingRecord::getDeleted, 0));
        counts.put("pendingNurseRecords", pendingNurseRecords);

        // 待审核的护理计划
        long pendingNursePlans = nursingPlanMapper.selectCount(
                new LambdaQueryWrapper<NursingPlan>()
                        .eq(NursingPlan::getDoctorApproval, 0)
                        .in(NursingPlan::getStatus, 0, 1)
                        .eq(NursingPlan::getDeleted, 0));
        counts.put("pendingNursePlans", pendingNursePlans);

        counts.put("total", pendingNurseRecords + pendingNursePlans);
        return counts;
    }

    @Override
    public Map<String, Object> getChronicOverview() {
        Map<String, Object> overview = new HashMap<>();

        // 老人总数
        long totalElders = elderInfoMapper.selectCount(new LambdaQueryWrapper<ElderInfo>()
                .eq(ElderInfo::getDeleted, 0));
        overview.put("totalElders", totalElders);

        // 按疾病名称统计慢病类型人数（从medical_history表）
        long hypertension = medicalHistoryMapper.selectCount(
                new LambdaQueryWrapper<MedicalHistory>()
                        .like(MedicalHistory::getDiseaseName, "高血压")
                        .eq(MedicalHistory::getIsCured, 0));
        overview.put("hypertension", hypertension);

        long diabetes = medicalHistoryMapper.selectCount(
                new LambdaQueryWrapper<MedicalHistory>()
                        .like(MedicalHistory::getDiseaseName, "糖尿病")
                        .eq(MedicalHistory::getIsCured, 0));
        overview.put("diabetes", diabetes);

        long coronary = medicalHistoryMapper.selectCount(
                new LambdaQueryWrapper<MedicalHistory>()
                        .like(MedicalHistory::getDiseaseName, "冠心病")
                        .eq(MedicalHistory::getIsCured, 0));
        overview.put("coronaryHeartDisease", coronary);

        long stroke = medicalHistoryMapper.selectCount(
                new LambdaQueryWrapper<MedicalHistory>()
                        .like(MedicalHistory::getDiseaseName, "脑卒中")
                        .eq(MedicalHistory::getIsCured, 0));
        overview.put("stroke", stroke);

        long copd = medicalHistoryMapper.selectCount(
                new LambdaQueryWrapper<MedicalHistory>()
                        .like(MedicalHistory::getDiseaseName, "慢阻肺")
                        .eq(MedicalHistory::getIsCured, 0));
        overview.put("copd", copd);

        // 高风险预警数
        long highRisk = healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>()
                        .eq(HealthWarning::getWarningLevel, 3)
                        .eq(HealthWarning::getStatus, 0));
        overview.put("highRiskCount", highRisk);

        // 随访完成率计算
        long totalPlans = followPlanMapper.selectCount(
                new LambdaQueryWrapper<FollowPlan>());
        long completedPlans = followPlanMapper.selectCount(
                new LambdaQueryWrapper<FollowPlan>()
                        .eq(FollowPlan::getStatus, 2));
        long activePlans = followPlanMapper.selectCount(
                new LambdaQueryWrapper<FollowPlan>()
                        .eq(FollowPlan::getStatus, 1));
        long completionRate = totalPlans > 0 ? Math.round((double) completedPlans / totalPlans * 100) : 0;
        overview.put("followupRate", completionRate);
        overview.put("totalPlans", totalPlans);
        overview.put("completedPlans", completedPlans);
        overview.put("activePlans", activePlans);

        return overview;
    }
}
