package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.entity.*;
import com.medical.mapper.*;
import com.medical.service.NurseDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class NurseDashboardServiceImpl implements NurseDashboardService {

    @Autowired
    private NursingRecordMapper nursingRecordMapper;

    @Autowired
    private NursingPlanMapper nursingPlanMapper;

    @Autowired
    private FollowPlanMapper followPlanMapper;

    @Autowired
    private HealthWarningMapper healthWarningMapper;

    @Autowired
    private ElderInfoMapper elderInfoMapper;

    @Override
    public Map<String, Object> getStats(Long nurseId) {
        Map<String, Object> stats = new HashMap<>();

        // 今日护理记录数
        LambdaQueryWrapper<NursingRecord> todayRecordQ = new LambdaQueryWrapper<NursingRecord>()
                .eq(NursingRecord::getNurseId, nurseId)
                .eq(NursingRecord::getDeleted, 0)
                .ge(NursingRecord::getCreateTime, LocalDateTime.of(LocalDate.now(), LocalTime.MIN))
                .le(NursingRecord::getCreateTime, LocalDateTime.of(LocalDate.now(), LocalTime.MAX));
        stats.put("todayRecords", nursingRecordMapper.selectCount(todayRecordQ));

        // 进行中护理计划数
        LambdaQueryWrapper<NursingPlan> activePlanQ = new LambdaQueryWrapper<NursingPlan>()
                .eq(NursingPlan::getNurseId, nurseId)
                .eq(NursingPlan::getStatus, 1)
                .eq(NursingPlan::getDeleted, 0);
        stats.put("activePlans", nursingPlanMapper.selectCount(activePlanQ));

        // 待处理的异常上报数
        LambdaQueryWrapper<NursingRecord> pendingReportQ = new LambdaQueryWrapper<NursingRecord>()
                .eq(NursingRecord::getNurseId, nurseId)
                .eq(NursingRecord::getReportStatus, 1)
                .eq(NursingRecord::getDeleted, 0);
        stats.put("pendingReports", nursingRecordMapper.selectCount(pendingReportQ));

        // 待处理预警数
        LambdaQueryWrapper<HealthWarning> warningQ = new LambdaQueryWrapper<HealthWarning>()
                .eq(HealthWarning::getStatus, 0);
        stats.put("pendingWarnings", healthWarningMapper.selectCount(warningQ));

        // 护士管理的老人总数（通过elder_info的doctor_id关联，后续可扩展）
        long totalElders = elderInfoMapper.selectCount(new LambdaQueryWrapper<ElderInfo>()
                .eq(ElderInfo::getDeleted, 0));
        stats.put("totalElders", totalElders);

        // 我的随访任务数（如果有分配给护士的随访计划）
        long myFollowTasks = followPlanMapper.selectCount(new LambdaQueryWrapper<FollowPlan>()
                .eq(FollowPlan::getStatus, 1));
        stats.put("myFollowTasks", myFollowTasks);

        return stats;
    }

    @Override
    public Map<String, Object> getTodayTasks(Long nurseId) {
        Map<String, Object> result = new HashMap<>();
        result.put("stats", getStats(nurseId));

        // 今日护理记录
        LambdaQueryWrapper<NursingRecord> todayRecordsQ = new LambdaQueryWrapper<NursingRecord>()
                .eq(NursingRecord::getNurseId, nurseId)
                .eq(NursingRecord::getDeleted, 0)
                .ge(NursingRecord::getCreateTime, LocalDateTime.of(LocalDate.now(), LocalTime.MIN))
                .le(NursingRecord::getCreateTime, LocalDateTime.of(LocalDate.now(), LocalTime.MAX))
                .orderByDesc(NursingRecord::getCreateTime)
                .last("LIMIT 5");
        result.put("todayRecords", nursingRecordMapper.selectList(todayRecordsQ));

        // 进行中的护理计划
        LambdaQueryWrapper<NursingPlan> activePlanQ = new LambdaQueryWrapper<NursingPlan>()
                .eq(NursingPlan::getNurseId, nurseId)
                .eq(NursingPlan::getStatus, 1)
                .eq(NursingPlan::getDeleted, 0)
                .orderByDesc(NursingPlan::getUpdateTime)
                .last("LIMIT 5");
        result.put("activePlans", nursingPlanMapper.selectList(activePlanQ));

        return result;
    }
}
