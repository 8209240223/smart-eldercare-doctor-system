package com.medical.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.ElderInfo;
import com.medical.entity.ElderRiskProfile;
import com.medical.entity.FollowPlan;
import com.medical.entity.FollowRecord;
import com.medical.entity.TimelineEvent;
import com.medical.mapper.ElderInfoMapper;
import com.medical.mapper.ElderRiskProfileMapper;
import com.medical.mapper.FollowPlanMapper;
import com.medical.mapper.FollowRecordMapper;
import com.medical.service.FollowUpService;
import com.medical.service.ElderReferenceService;
import com.medical.service.TimelineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FollowUpServiceImpl implements FollowUpService {

    private static final String AUTO_RISK_MARK = "[AUTO_RISK_FOLLOWUP]";

    @Autowired
    private FollowPlanMapper followPlanMapper;

    @Autowired
    private FollowRecordMapper followRecordMapper;

    @Autowired
    private ElderRiskProfileMapper elderRiskProfileMapper;

    @Autowired
    private ElderInfoMapper elderInfoMapper;

    @Autowired
    private TimelineService timelineService;

    @Autowired
    private ElderReferenceService elderReferenceService;

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
        ElderInfo elder = elderReferenceService.requireActive(plan.getElderId());
        if (plan.getDoctorId() == null) {
            plan.setDoctorId(elder.getDoctorId());
        }
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
    @Transactional
    public Map<String, Object> generateRiskFollowPlans(Long doctorId, Long elderId) {
        LambdaQueryWrapper<ElderRiskProfile> riskWrapper = new LambdaQueryWrapper<>();
        riskWrapper.eq(elderId != null, ElderRiskProfile::getElderId, elderId)
                .ge(elderId == null, ElderRiskProfile::getRiskLevel, 3)
                .orderByDesc(ElderRiskProfile::getRiskLevel)
                .orderByDesc(ElderRiskProfile::getRiskScore);
        List<ElderRiskProfile> profiles = elderRiskProfileMapper.selectList(riskWrapper);

        List<Map<String, Object>> createdPlans = new ArrayList<>();
        List<Map<String, Object>> reusedPlans = new ArrayList<>();
        List<String> skippedReasons = new ArrayList<>();
        for (ElderRiskProfile profile : profiles) {
            ElderInfo elder = elderInfoMapper.selectById(profile.getElderId());
            if (elder == null || (elder.getDeleted() != null && elder.getDeleted() == 1)) {
                skippedReasons.add("老人ID " + profile.getElderId() + " 不存在或已删除");
                continue;
            }
            if (doctorId != null && elder.getDoctorId() != null && !doctorId.equals(elder.getDoctorId())) {
                skippedReasons.add(elder.getName() + " 不属于当前医生，已跳过");
                continue;
            }
            FollowPlan existing = followPlanMapper.selectLatestActiveByElderForUpdate(profile.getElderId());
            if (existing != null) {
                reusedPlans.add(toGeneratedPlanView(existing, profile, elder));
                continue;
            }

            FollowPlan plan = buildRiskFollowPlan(profile, elder, doctorId);
            followPlanMapper.insert(plan);
            createdPlans.add(toGeneratedPlanView(plan, profile, elder));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("createdCount", createdPlans.size());
        result.put("createdPlans", createdPlans);
        result.put("reusedCount", reusedPlans.size());
        result.put("reusedPlans", reusedPlans);
        result.put("skippedCount", skippedReasons.size());
        result.put("skippedReasons", skippedReasons);
        result.put("message", "已生成 " + createdPlans.size() + " 条随访计划，复用 "
                + reusedPlans.size() + " 条活动计划");
        return result;
    }

    @Override
    public int deleteGeneratedRiskFollowPlans() {
        return followPlanMapper.delete(new LambdaQueryWrapper<FollowPlan>()
                .likeRight(FollowPlan::getRemark, AUTO_RISK_MARK));
    }

    @Override
    public void updatePlan(Long id, FollowPlan plan) {
        FollowPlan existing = followPlanMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(404, "计划不存在");
        }
        validatePlan(plan);
        if (plan.getElderId() != null) {
            elderReferenceService.requireActive(plan.getElderId());
        }
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
    @Transactional(rollbackFor = Exception.class)
    public synchronized Long createRecord(FollowRecord record) {
        validateRecord(record);
        FollowPlan plan = followPlanMapper.selectById(record.getPlanId());
        if (plan == null) {
            throw new BusinessException(404, "随访计划不存在");
        }
        ElderInfo elder = elderReferenceService.requireActive(plan.getElderId());
        if (!plan.getElderId().equals(record.getElderId())) {
            throw new BusinessException(400, "随访记录老人必须与随访计划中的老人一致");
        }
        if (record.getDoctorId() != null && plan.getDoctorId() != null
                && !record.getDoctorId().equals(plan.getDoctorId())) {
            throw new BusinessException(400, "随访记录医生必须与随访计划中的责任医生一致");
        }
        record.setElderId(plan.getElderId());
        record.setDoctorId(plan.getDoctorId() != null ? plan.getDoctorId() : elder.getDoctorId());
        if (plan.getStatus() != null && (plan.getStatus() == 2 || plan.getStatus() == 3)) {
            throw new BusinessException(400, "已完成或已终止的随访计划不能新增记录");
        }

        int completedCount = plan.getCompletedCount() == null ? 0 : plan.getCompletedCount();
        int totalCount = plan.getTotalCount() == null ? 0 : plan.getTotalCount();
        if (totalCount <= 0) {
            throw new BusinessException(400, "随访计划总次数配置无效");
        }
        if (completedCount >= totalCount) {
            throw new BusinessException(400, "随访计划次数已完成，不能继续新增记录");
        }

        if (record.getFollowDate() == null) {
            record.setFollowDate(LocalDateTime.now());
        }
        if (record.getNextFollowDate() == null) {
            record.setNextFollowDate(calculateNextDate(record.getFollowDate().toLocalDate(), plan.getFrequencyType()));
        } else if (!record.getNextFollowDate().isAfter(record.getFollowDate().toLocalDate())) {
            throw new BusinessException(400, "下次随访日期必须晚于本次随访日期");
        }
        if (plan.getNextFollowDate() != null) {
            record.setIsOverdue(record.getFollowDate().toLocalDate().isAfter(plan.getNextFollowDate()) ? 1 : 0);
        } else {
            record.setIsOverdue(0);
        }

        followRecordMapper.insert(record);

        plan.setCompletedCount(completedCount + 1);
        plan.setNextFollowDate(record.getNextFollowDate());
        if (plan.getCompletedCount() >= totalCount) {
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
        long completedPlans = followPlanMapper.selectCount(
                new LambdaQueryWrapper<FollowPlan>().eq(FollowPlan::getStatus, 2));
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
        stats.put("completionRate", totalPlans == 0 ? 0 : Math.round(completedPlans * 100.0 / totalPlans));
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

    private FollowPlan buildRiskFollowPlan(ElderRiskProfile profile, ElderInfo elder, Long requestDoctorId) {
        Integer riskLevel = profile.getRiskLevel() == null ? 1 : profile.getRiskLevel();
        LocalDate startDate = LocalDate.now();
        FollowPlan plan = new FollowPlan();
        plan.setElderId(profile.getElderId());
        plan.setDoctorId(elder.getDoctorId() != null ? elder.getDoctorId() : requestDoctorId);
        plan.setPlanName(getRiskLevelText(riskLevel) + "风险随访计划-" + elder.getName());
        plan.setDiseaseType(inferDiseaseType(profile.getRiskTags()));
        plan.setFrequencyType(frequencyForRiskLevel(riskLevel));
        plan.setStartDate(startDate);
        plan.setNextFollowDate(startDate.plusDays(initialDueDaysForRiskLevel(riskLevel)));
        plan.setTotalCount(totalCountForRiskLevel(riskLevel));
        plan.setCompletedCount(0);
        plan.setStatus(1);
        plan.setEndDate(calculateEndDate(plan.getStartDate(), plan.getFrequencyType(), plan.getTotalCount()));
        plan.setRemark(AUTO_RISK_MARK + " 风险等级:" + getRiskLevelText(riskLevel)
                + ",评分:" + (profile.getRiskScore() == null ? 0 : profile.getRiskScore())
                + ",标签:" + (profile.getRiskTags() == null ? "-" : profile.getRiskTags()));
        return plan;
    }

    private Map<String, Object> toGeneratedPlanView(FollowPlan plan, ElderRiskProfile profile, ElderInfo elder) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", plan.getId());
        item.put("planName", plan.getPlanName());
        item.put("elderId", plan.getElderId());
        item.put("elderName", elder.getName());
        item.put("riskLevel", profile.getRiskLevel());
        item.put("riskLevelText", getRiskLevelText(profile.getRiskLevel()));
        item.put("riskScore", profile.getRiskScore());
        item.put("diseaseType", plan.getDiseaseType());
        item.put("nextFollowDate", plan.getNextFollowDate());
        return item;
    }

    private Integer inferDiseaseType(String riskTags) {
        String tags = riskTags == null ? "" : riskTags;
        if (tags.contains("糖尿病")) return 2;
        if (tags.contains("精神") || tags.contains("抑郁") || tags.contains("认知")) return 3;
        if (tags.contains("冠心病")) return 4;
        if (tags.contains("脑卒中")) return 5;
        if (tags.contains("高血压")) return 1;
        return 6;
    }

    private int frequencyForRiskLevel(int riskLevel) {
        switch (riskLevel) {
            case 4: return 1;
            case 3: return 2;
            case 2: return 3;
            default: return 4;
        }
    }

    private int initialDueDaysForRiskLevel(int riskLevel) {
        switch (riskLevel) {
            case 4: return 3;
            case 3: return 7;
            case 2: return 14;
            default: return 30;
        }
    }

    private int totalCountForRiskLevel(int riskLevel) {
        switch (riskLevel) {
            case 4: return 12;
            case 3: return 12;
            case 2: return 4;
            default: return 2;
        }
    }

    private String getRiskLevelText(Integer riskLevel) {
        if (riskLevel == null) return "未知";
        switch (riskLevel) {
            case 4:
                return "高危";
            case 3:
                return "重点";
            case 2:
                return "关注";
            case 1:
                return "普通";
            default:
                return "未知";
        }
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
