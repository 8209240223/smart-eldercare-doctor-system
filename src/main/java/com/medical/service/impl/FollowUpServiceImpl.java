package com.medical.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.FollowPlan;
import com.medical.entity.FollowRecord;
import com.medical.mapper.FollowPlanMapper;
import com.medical.mapper.FollowRecordMapper;
import com.medical.service.FollowUpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class FollowUpServiceImpl implements FollowUpService {

    @Autowired
    private FollowPlanMapper followPlanMapper;

    @Autowired
    private FollowRecordMapper followRecordMapper;

    @Override
    public Page<FollowPlan> listPlans(Integer pageNum, Integer pageSize, Integer status, Integer diseaseType, Long elderId) {
        Page<FollowPlan> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<FollowPlan> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(status != null, FollowPlan::getStatus, status)
               .eq(diseaseType != null, FollowPlan::getDiseaseType, diseaseType)
               .eq(elderId != null, FollowPlan::getElderId, elderId)
               .orderByAsc(FollowPlan::getNextFollowDate)
               .orderByDesc(FollowPlan::getCreateTime);
        return followPlanMapper.selectPage(page, wrapper);
    }

    @Override
    public Long createPlan(FollowPlan plan) {
        if (!StringUtils.hasText(plan.getPlanName())) {
            throw new BusinessException(400, "计划名称不能为空");
        }
        if (plan.getStartDate() == null) {
            plan.setStartDate(LocalDate.now());
        }
        if (plan.getTotalCount() == null || plan.getTotalCount() < 1) {
            plan.setTotalCount(12);
        }
        plan.setStatus(1);
        plan.setCompletedCount(0);
        if (plan.getNextFollowDate() == null) {
            plan.setNextFollowDate(calculateNextDate(plan.getStartDate(), plan.getFrequencyType()));
        }
        if (plan.getEndDate() == null) {
            plan.setEndDate(calculateEndDate(plan.getStartDate(), plan.getFrequencyType(), plan.getTotalCount()));
        }
        followPlanMapper.insert(plan);
        return plan.getId();
    }

    @Override
    public void updatePlan(Long id, FollowPlan plan) {
        FollowPlan existing = followPlanMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(404, "计划不存在");
        }
        BeanUtil.copyProperties(plan, existing, CopyOptions.create()
                .ignoreNullValue()
                .setIgnoreProperties("id", "createTime", "updateTime", "completedCount", "status"));
        followPlanMapper.updateById(existing);
    }

    @Override
    public void changePlanStatus(Long id, Integer status) {
        FollowPlan plan = followPlanMapper.selectById(id);
        if (plan == null) {
            throw new BusinessException(404, "计划不存在");
        }
        plan.setStatus(status);
        followPlanMapper.updateById(plan);
    }

    @Override
    public Page<FollowRecord> listRecords(Integer pageNum, Integer pageSize, Long planId, Long elderId) {
        Page<FollowRecord> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<FollowRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(planId != null, FollowRecord::getPlanId, planId)
               .eq(elderId != null, FollowRecord::getElderId, elderId)
               .orderByDesc(FollowRecord::getFollowDate)
               .orderByDesc(FollowRecord::getCreateTime);
        return followRecordMapper.selectPage(page, wrapper);
    }

    @Override
    public Long createRecord(FollowRecord record) {
        FollowPlan plan = followPlanMapper.selectById(record.getPlanId());
        if (plan == null) {
            throw new BusinessException(404, "随访计划不存在");
        }

        if (record.getFollowDate() == null) {
            record.setFollowDate(LocalDateTime.now());
        }
        if (record.getNextFollowDate() == null) {
            record.setNextFollowDate(calculateNextDate(record.getFollowDate().toLocalDate(), plan.getFrequencyType()));
        }
        if (plan.getNextFollowDate() != null) {
            record.setIsOverdue(record.getFollowDate().toLocalDate().isAfter(plan.getNextFollowDate()) ? 1 : 0);
        } else {
            record.setIsOverdue(0);
        }

        followRecordMapper.insert(record);

        plan.setCompletedCount((plan.getCompletedCount() == null ? 0 : plan.getCompletedCount()) + 1);
        plan.setNextFollowDate(record.getNextFollowDate());
        if (plan.getCompletedCount() >= (plan.getTotalCount() == null ? 0 : plan.getTotalCount())) {
            plan.setStatus(2);
        }
        followPlanMapper.updateById(plan);
        return record.getId();
    }

    @Override
    public FollowRecord getRecordDetail(Long id) {
        return followRecordMapper.selectById(id);
    }

    @Override
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        long activePlans = followPlanMapper.selectCount(
                new LambdaQueryWrapper<FollowPlan>().eq(FollowPlan::getStatus, 1));
        long overdueCount = followPlanMapper.selectCount(
                new LambdaQueryWrapper<FollowPlan>()
                        .eq(FollowPlan::getStatus, 1)
                        .lt(FollowPlan::getNextFollowDate, LocalDate.now()));
        long dueToday = followPlanMapper.selectCount(
                new LambdaQueryWrapper<FollowPlan>()
                        .eq(FollowPlan::getStatus, 1)
                        .eq(FollowPlan::getNextFollowDate, LocalDate.now()));
        long totalPlans = followPlanMapper.selectCount(null);
        long totalRecords = followRecordMapper.selectCount(null);

        stats.put("totalPlans", totalPlans);
        stats.put("activePlans", activePlans);
        stats.put("totalRecords", totalRecords);
        stats.put("overdueCount", overdueCount);
        stats.put("dueTodayCount", dueToday);
        stats.put("completionRate", totalPlans == 0 ? 0 : Math.round(activePlans * 100.0 / totalPlans));
        return stats;
    }

    private LocalDate calculateNextDate(LocalDate baseDate, Integer frequencyType) {
        if (baseDate == null) {
            baseDate = LocalDate.now();
        }
        switch (frequencyType == null ? 3 : frequencyType) {
            case 1:
                return baseDate.plusWeeks(1);
            case 2:
                return baseDate.plusMonths(1);
            case 3:
                return baseDate.plusMonths(3);
            case 4:
                return baseDate.plusMonths(6);
            case 5:
                return baseDate.plusYears(1);
            default:
                return baseDate.plusMonths(3);
        }
    }

    private LocalDate calculateEndDate(LocalDate startDate, Integer frequencyType, Integer totalCount) {
        if (startDate == null) {
            startDate = LocalDate.now();
        }
        LocalDate endDate = startDate;
        int count = totalCount == null ? 1 : Math.max(totalCount, 1);
        for (int i = 1; i < count; i++) {
            endDate = calculateNextDate(endDate, frequencyType);
        }
        return endDate;
    }
}
