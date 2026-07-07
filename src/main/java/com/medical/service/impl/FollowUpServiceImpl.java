package com.medical.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.FollowPlan;
import com.medical.entity.FollowRecord;
import com.medical.entity.TimelineEvent;
import com.medical.mapper.FollowPlanMapper;
import com.medical.mapper.FollowRecordMapper;
import com.medical.service.FollowUpService;
import com.medical.service.TimelineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
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

    @Autowired
    private TimelineService timelineService;

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
        validatePlan(plan);
        if (!StringUtils.hasText(plan.getPlanName())) {
            throw new BusinessException(400, "计划名称不能为空");
        }
        if (plan.getStartDate() == null) {
            plan.setStartDate(LocalDate.now());
        }
        if (plan.getTotalCount() == null || plan.getTotalCount() < 1) {
            plan.setTotalCount(12);
        }
        if (plan.getStatus() == null) {
            plan.setStatus(1);
        }
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
        validatePlan(plan);
        BeanUtil.copyProperties(plan, existing, CopyOptions.create()
                .ignoreNullValue()
                .setIgnoreProperties("id", "createTime", "updateTime", "completedCount"));
        followPlanMapper.updateById(existing);
    }

    @Override
    public void changePlanStatus(Long id, Integer status) {
        FollowPlan plan = followPlanMapper.selectById(id);
        if (plan == null) {
            throw new BusinessException(404, "计划不存在");
        }
        validateStatus(status);
        plan.setStatus(status);
        followPlanMapper.updateById(plan);
    }

    @Override
    public void deletePlan(Long id) {
        FollowPlan plan = followPlanMapper.selectById(id);
        if (plan == null) {
            throw new BusinessException(404, "计划不存在");
        }
        followPlanMapper.deleteById(id);
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
        validateRecord(record);
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
        addFollowRecordTimeline(record);
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

    private void validatePlan(FollowPlan plan) {
        if (plan == null) {
            throw new BusinessException(400, "随访计划不能为空");
        }
        if (plan.getElderId() != null && plan.getElderId() <= 0) {
            throw new BusinessException(400, "老人ID必须为正整数");
        }
        if (plan.getDoctorId() != null && plan.getDoctorId() <= 0) {
            throw new BusinessException(400, "医生ID必须为正整数");
        }
        if (plan.getTotalCount() != null && plan.getTotalCount() < 1) {
            throw new BusinessException(400, "计划总次数必须大于0");
        }
        if (plan.getStartDate() != null && plan.getEndDate() != null && plan.getEndDate().isBefore(plan.getStartDate())) {
            throw new BusinessException(400, "结束日期不能早于开始日期");
        }
        if (plan.getStartDate() != null && plan.getNextFollowDate() != null && plan.getNextFollowDate().isBefore(plan.getStartDate())) {
            throw new BusinessException(400, "下次随访日期不能早于开始日期");
        }
        if (plan.getStatus() != null) {
            validateStatus(plan.getStatus());
        }
    }

    private void validateStatus(Integer status) {
        if (status == null || status < 0 || status > 3) {
            throw new BusinessException(400, "随访状态必须是待执行、进行中、已完成或已终止");
        }
    }

    private void validateRecord(FollowRecord record) {
        if (record == null) {
            throw new BusinessException(400, "随访记录不能为空");
        }
        if (record.getPlanId() == null || record.getPlanId() <= 0) {
            throw new BusinessException(400, "随访计划ID必须为正整数");
        }
        if (record.getElderId() == null || record.getElderId() <= 0) {
            throw new BusinessException(400, "老人ID必须为正整数");
        }
        if (record.getDoctorId() != null && record.getDoctorId() <= 0) {
            throw new BusinessException(400, "医生ID必须为正整数");
        }
        checkRange(record.getSystolicPressure(), 60, 240, "收缩压");
        checkRange(record.getDiastolicPressure(), 40, 140, "舒张压");
        checkRange(record.getHeartRate(), 30, 180, "心率");
        checkRange(record.getBloodSugarFasting(), BigDecimal.valueOf(2), BigDecimal.valueOf(30), "空腹血糖");
        checkRange(record.getWeight(), BigDecimal.valueOf(20), BigDecimal.valueOf(200), "体重");
    }

    private void checkRange(Integer value, int min, int max, String fieldName) {
        if (value != null && (value < min || value > max)) {
            throw new BusinessException(400, fieldName + "必须在" + min + "到" + max + "之间");
        }
    }

    private void checkRange(BigDecimal value, BigDecimal min, BigDecimal max, String fieldName) {
        if (value != null && (value.compareTo(min) < 0 || value.compareTo(max) > 0)) {
            throw new BusinessException(400, fieldName + "必须在" + min.stripTrailingZeros().toPlainString() + "到" + max.stripTrailingZeros().toPlainString() + "之间");
        }
    }

    private void addFollowRecordTimeline(FollowRecord record) {
        TimelineEvent event = new TimelineEvent();
        event.setElderId(record.getElderId());
        event.setDoctorId(record.getDoctorId());
        event.setEventType(5);
        event.setEventTitle("完成随访记录");
        event.setEventContent(record.getFollowResult());
        event.setSourceType("follow_record");
        event.setSourceId(record.getId());
        event.setEventTime(record.getFollowDate());
        timelineService.addEvent(event);
    }
}
