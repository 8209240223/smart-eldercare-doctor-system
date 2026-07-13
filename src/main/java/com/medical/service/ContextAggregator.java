package com.medical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.common.utils.DisabilityStatusSupport;
import com.medical.entity.*;
import com.medical.mapper.*;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 上下文聚合器 — 从 17 张表拉取老人全量健康数据，统一输出给规则引擎消费
 */
@Service
public class ContextAggregator {

    @Autowired private HealthRecordMapper healthRecordMapper;
    @Autowired private PhysicalExamMapper physicalExamMapper;
    @Autowired private VitalSignDataMapper vitalSignDataMapper;
    @Autowired private MedicalHistoryMapper medicalHistoryMapper;
    @Autowired private MedicationRecordMapper medicationRecordMapper;
    @Autowired private AllergyRecordMapper allergyRecordMapper;
    @Autowired private FamilyHistoryMapper familyHistoryMapper;
    @Autowired private HealthWarningMapper healthWarningMapper;
    @Autowired private FollowPlanMapper followPlanMapper;
    @Autowired private FollowRecordMapper followRecordMapper;
    @Autowired private InterventionRecordMapper interventionRecordMapper;
    @Autowired private AssessmentRecordMapper assessmentRecordMapper;
    @Autowired private NursingRecordMapper nursingRecordMapper;
    @Autowired private NursingPlanMapper nursingPlanMapper;
    @Autowired private ReferralOrderMapper referralOrderMapper;
    @Autowired private WearableDeviceMapper wearableDeviceMapper;
    @Autowired private ElderReferenceService elderReferenceService;

    /**
     * 聚合老人全量评估数据
     * @return context map，包含所有指标和元数据
     */
    public Map<String, Object> gather(Long elderId) {
        Map<String, Object> ctx = new LinkedHashMap<>();
        List<String> missingData = new ArrayList<>();
        ctx.put("elderId", elderId);

        // ===== 1. 老人基本信息 =====
        ElderInfo elder = elderReferenceService.requireActive(elderId);
        ctx.put("elder", elder);
        ctx.put("gender", elder.getGender());        // 1男 2女
        if (elder.getBirthDate() != null) {
            ctx.put("age", Period.between(elder.getBirthDate(), LocalDate.now()).getYears());
        } else {
            missingData.add("出生日期");
        }

        // ===== 2. 健康档案 =====
        HealthRecord record = healthRecordMapper.selectOne(
                new LambdaQueryWrapper<HealthRecord>().eq(HealthRecord::getElderId, elderId));
        ctx.put("healthRecord", toReportSafeHealthRecord(record));
        if (record != null) {
            ctx.put("hasHealthRecord", 1);
            ctx.put("smokingStatus", record.getSmokingStatus());      // 0不吸烟 1吸烟 2已戒烟
            ctx.put("drinkingStatus", record.getDrinkingStatus());    // 0不饮酒 1偶尔 2经常
            ctx.put("exerciseFrequency", record.getExerciseFrequency());// 0无 1偶尔 2规律
            ctx.put("livingAbility", record.getLivingAbility());      // 数值越大，生活依赖程度越重
            ctx.put("hasDisability", DisabilityStatusSupport.hasConfirmedDisability(
                    record.getDisabilityStatus()) ? 1 : 0);

            // 身高体重从 health_record 或 physical_exam 取
            if (record.getHeight() != null) ctx.put("height", record.getHeight());
            if (record.getWeight() != null) ctx.put("weight", record.getWeight());
        } else {
            ctx.put("hasHealthRecord", 0);
            missingData.add("健康档案");
        }

        // ===== 3. 最近一次体检 =====
        PhysicalExam exam = physicalExamMapper.selectOne(
                new LambdaQueryWrapper<PhysicalExam>()
                        .eq(PhysicalExam::getElderId, elderId)
                        .orderByDesc(PhysicalExam::getExamDate)
                        .last("LIMIT 1"));
        ctx.put("latestExam", exam);
        if (exam != null) {
            if (exam.getSystolicPressure() != null)
                ctx.put("systolic", new BigDecimal(exam.getSystolicPressure()));
            if (exam.getDiastolicPressure() != null)
                ctx.put("diastolic", new BigDecimal(exam.getDiastolicPressure()));
            if (exam.getHeartRate() != null)
                ctx.put("heartRate", new BigDecimal(exam.getHeartRate()));
            if (exam.getBloodSugarFasting() != null)
                ctx.put("bloodSugarFasting", exam.getBloodSugarFasting());
            if (exam.getBloodSugarRandom() != null)
                ctx.put("bloodSugarRandom", exam.getBloodSugarRandom());
            if (exam.getTemperature() != null)
                ctx.put("temperature", exam.getTemperature());
            if (exam.getBloodOxygen() != null)
                ctx.put("bloodOxygen", exam.getBloodOxygen());
            if (exam.getWaistline() != null)
                ctx.put("waistline", exam.getWaistline());
            if (exam.getBmi() != null)
                ctx.put("bmi", exam.getBmi());
            if (exam.getHeight() != null) ctx.put("height", exam.getHeight());
            if (exam.getWeight() != null) ctx.put("weight", exam.getWeight());
        }

        // ===== 4. 设备体征数据（取每种类型的最新值，共9种类型） =====
        List<VitalSignData> latestVitals = new ArrayList<>();
        for (int dt = 1; dt <= 9; dt++) {
            List<VitalSignData> list = vitalSignDataMapper.selectList(
                    new LambdaQueryWrapper<VitalSignData>()
                            .eq(VitalSignData::getElderId, elderId)
                            .eq(VitalSignData::getDataType, dt)
                            .orderByDesc(VitalSignData::getMeasureTime)
                            .last("LIMIT 1"));
            if (!list.isEmpty()) {
                latestVitals.add(list.get(0));
                VitalSignData v = list.get(0);
                String key = "vital_" + dt;   // vital_1 收缩压, vital_2 舒张压, vital_3 心率, etc.
                ctx.put(key, v.getDataValue());
                // 如果体检没数据，用设备数据补充
                switch (dt) {
                    case 1: ctx.putIfAbsent("systolic", v.getDataValue()); break;
                    case 2: ctx.putIfAbsent("diastolic", v.getDataValue()); break;
                    case 3: ctx.putIfAbsent("heartRate", v.getDataValue()); break;
                    case 4: ctx.putIfAbsent("bloodSugarFasting", v.getDataValue()); break;
                    case 5: ctx.put("bloodSugarPostprandial", v.getDataValue()); break;
                    case 6: ctx.putIfAbsent("bloodOxygen", v.getDataValue()); break;
                    case 7: ctx.putIfAbsent("temperature", v.getDataValue()); break;
                }
            }
        }
        ctx.put("vitalSigns", latestVitals);
        if (exam == null && latestVitals.isEmpty()) {
            missingData.add("体检或生命体征");
        }
        // 最近设备异常数量
        long abnormalVitalCount = latestVitals.stream().filter(v -> v.getIsAbnormal() != null && v.getIsAbnormal() == 1).count();
        ctx.put("abnormalVitalCount", (int) abnormalVitalCount);

        // ===== 5. 病史 =====
        List<MedicalHistory> medicalHistories = medicalHistoryMapper.selectList(
                new LambdaQueryWrapper<MedicalHistory>().eq(MedicalHistory::getElderId, elderId));
        ctx.put("medicalHistories", medicalHistories);
        long uncuredCount = medicalHistories.stream().filter(m -> m.getIsCured() == null || m.getIsCured() == 0).count();
        ctx.put("diseaseCount", (int) uncuredCount);
        // 特定病种判断
        boolean hasCVD = medicalHistories.stream().anyMatch(m ->
                (m.getDiseaseName() != null && (m.getDiseaseName().contains("高血压") || m.getDiseaseName().contains("冠心病")
                        || m.getDiseaseName().contains("脑卒中") || m.getDiseaseName().contains("心梗")
                        || m.getDiseaseName().contains("心衰"))));
        ctx.put("hasCVD", hasCVD ? 1 : 0);
        boolean hasDiabetes = medicalHistories.stream().anyMatch(m ->
                m.getDiseaseName() != null && m.getDiseaseName().contains("糖尿病"));
        ctx.put("hasDiabetes", hasDiabetes ? 1 : 0);

        // ===== 6. 用药记录 =====
        List<MedicationRecord> medications = medicationRecordMapper.selectList(
                new LambdaQueryWrapper<MedicationRecord>()
                        .eq(MedicationRecord::getElderId, elderId)
                        .eq(MedicationRecord::getStatus, 1));  // 使用中的
        ctx.put("medications", medications);
        ctx.put("medicationCount", medications.size());
        // 是否有超过1年的长期用药
        boolean hasLongTerm = medications.stream().anyMatch(m -> {
            if (m.getStartDate() == null) return false;
            return ChronoUnit.DAYS.between(m.getStartDate(), LocalDate.now()) > 365;
        });
        ctx.put("hasLongTermMed", hasLongTerm ? 1 : 0);

        // ===== 7. 过敏记录 =====
        List<AllergyRecord> allergies = allergyRecordMapper.selectList(
                new LambdaQueryWrapper<AllergyRecord>().eq(AllergyRecord::getElderId, elderId));
        ctx.put("allergies", allergies);
        boolean hasDrugAllergy = allergies.stream().anyMatch(a -> a.getAllergyType() != null && a.getAllergyType() == 1);
        boolean hasDrugAllergySevere = allergies.stream().anyMatch(a ->
                a.getAllergyType() != null && a.getAllergyType() == 1 && a.getSeverity() != null && a.getSeverity() >= 2);
        boolean hasOtherAllergy = allergies.stream().anyMatch(a -> a.getAllergyType() != null && a.getAllergyType() != 1);
        ctx.put("hasDrugAllergy", hasDrugAllergy ? 1 : 0);
        ctx.put("hasDrugAllergySevere", hasDrugAllergySevere ? 1 : 0);
        ctx.put("hasOtherAllergy", hasOtherAllergy ? 1 : 0);
        // 过敏原列表
        ctx.put("allergens", allergies.stream()
                .map(AllergyRecord::getAllergen)
                .filter(Objects::nonNull)
                .collect(Collectors.joining("、")));

        // ===== 8. 家族病史 =====
        List<FamilyHistory> familyHistories = familyHistoryMapper.selectList(
                new LambdaQueryWrapper<FamilyHistory>().eq(FamilyHistory::getElderId, elderId));
        ctx.put("familyHistories", familyHistories);
        boolean hasFamilyCancer = familyHistories.stream().anyMatch(f ->
                f.getDiseaseName() != null && (f.getDiseaseName().contains("癌") || f.getDiseaseName().contains("肿瘤")));
        boolean hasFamilyCVD = familyHistories.stream().anyMatch(f ->
                f.getDiseaseName() != null && (f.getDiseaseName().contains("高血压") || f.getDiseaseName().contains("糖尿病")
                        || f.getDiseaseName().contains("冠心病") || f.getDiseaseName().contains("脑卒中")));
        ctx.put("hasFamilyCancer", hasFamilyCancer ? 1 : 0);
        ctx.put("hasFamilyCVD", hasFamilyCVD ? 1 : 0);
        ctx.put("familyDiseases", familyHistories.stream()
                .map(f -> f.getDiseaseName())
                .filter(Objects::nonNull)
                .collect(Collectors.joining("、")));

        // ===== 9. 健康预警（近30天） =====
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<HealthWarning> warnings30d = healthWarningMapper.selectList(
                new LambdaQueryWrapper<HealthWarning>()
                        .eq(HealthWarning::getElderId, elderId)
                        .ge(HealthWarning::getCreateTime, thirtyDaysAgo));
        ctx.put("warnings30d", warnings30d);
        ctx.put("warningCount30d", warnings30d.size());
        // 待处理
        long unhandled = warnings30d.stream().filter(w -> w.getStatus() != null && w.getStatus() == 0).count();
        ctx.put("warningUnhandled", (int) unhandled);
        boolean hasRed = warnings30d.stream().anyMatch(w -> w.getWarningLevel() != null && w.getWarningLevel() == 3);
        ctx.put("hasRedWarning", hasRed ? 1 : 0);

        // ===== 10. 随访计划（进行中的） =====
        List<FollowPlan> activePlans = followPlanMapper.selectList(
                new LambdaQueryWrapper<FollowPlan>()
                        .eq(FollowPlan::getElderId, elderId)
                        .eq(FollowPlan::getStatus, 1));  // 进行中
        ctx.put("activeFollowPlans", activePlans);
        // 最近的随访逾期检查
        int overdueDays = activePlans.stream()
                .map(FollowPlan::getNextFollowDate)
                .filter(Objects::nonNull)
                .filter(date -> date.isBefore(LocalDate.now()))
                .mapToInt(date -> (int) ChronoUnit.DAYS.between(date, LocalDate.now()))
                .max()
                .orElse(0);
        ctx.put("followupOverdue", overdueDays > 0 ? 1 : 0);
        ctx.put("followupOverdueDays", overdueDays);
        ctx.put("days", overdueDays);
        // 最近一次随访日期
        Optional<LocalDate> latestFollowDate = activePlans.stream()
                .map(FollowPlan::getNextFollowDate)
                .filter(Objects::nonNull)
                .min(LocalDate::compareTo);
        if (latestFollowDate.isPresent()) {
            long daysToFollow = ChronoUnit.DAYS.between(LocalDate.now(), latestFollowDate.get());
            ctx.put("followupDays", (int) daysToFollow);
            ctx.put("nextFollowDate", latestFollowDate.get().toString());
        }

        // ===== 11. 最近一次随访记录 =====
        List<FollowRecord> recentFollowRecords = followRecordMapper.selectList(
                new LambdaQueryWrapper<FollowRecord>()
                        .eq(FollowRecord::getElderId, elderId)
                        .orderByDesc(FollowRecord::getFollowDate)
                        .last("LIMIT 1"));
        ctx.put("latestFollowRecord", recentFollowRecords.isEmpty() ? null : recentFollowRecords.get(0));
        if (!recentFollowRecords.isEmpty()) {
            FollowRecord fr = recentFollowRecords.get(0);
            if (fr.getMedicationCompliance() != null) {
                ctx.put("medCompliance", fr.getMedicationCompliance());
            } else {
                missingData.add("随访用药依从性");
            }
        } else {
            missingData.add("随访记录");
        }

        // ===== 12. 最近干预记录 =====
        List<InterventionRecord> interventions = interventionRecordMapper.selectList(
                new LambdaQueryWrapper<InterventionRecord>()
                        .eq(InterventionRecord::getElderId, elderId)
                        .orderByDesc(InterventionRecord::getInterventionDate)
                        .last("LIMIT 3"));
        ctx.put("recentInterventions", interventions);
        ctx.put("hasRecentIntervention", interventions.isEmpty() ? 0 : 1);
        if (!interventions.isEmpty()) {
            InterventionRecord latest = interventions.get(0);
            ctx.put("interventionTitle", latest.getInterventionTitle());
            // 效果: 1显著 2有效 3一般 4无效 → 映射为 4好 3中 2差 1差
            int effect = latest.getEffectEvaluation() != null ? latest.getEffectEvaluation() : 0;
            ctx.put("interventionEffect", effect >= 3 ? 2 : (effect >= 1 ? 4 : 0));
        }

        // ===== 13. 最近评估记录 =====
        List<AssessmentRecord> assessments = assessmentRecordMapper.selectList(
                new LambdaQueryWrapper<AssessmentRecord>()
                        .eq(AssessmentRecord::getElderId, elderId)
                        .orderByDesc(AssessmentRecord::getCreateTime)
                        .last("LIMIT 1"));
        ctx.put("latestAssessment", assessments.isEmpty() ? null : assessments.get(0));
        if (!assessments.isEmpty()) {
            long daysSince = ChronoUnit.DAYS.between(assessments.get(0).getCreateTime().toLocalDate(), LocalDate.now());
            ctx.put("daysSinceAssessment", (int) daysSince);
        } else {
            ctx.put("daysSinceAssessment", 999);   // 从未评估
            missingData.add("健康评估");
        }

        // ===== 14. 护理异常记录 =====
        List<NursingRecord> nursingRecords = new ArrayList<>();
        try {
            nursingRecords = nursingRecordMapper.selectList(
                    new LambdaQueryWrapper<NursingRecord>()
                            .eq(NursingRecord::getElderId, elderId)
                            .eq(NursingRecord::getIsAbnormal, 1)
                            .orderByDesc(NursingRecord::getRecordDate)
                            .last("LIMIT 3"));
        } catch (Exception e) {
            // nursing_record 表可能缺少 doctor_review 等新增字段，跳过
            System.err.println("[AI评估] 护理记录查询失败（表结构不匹配），已跳过: " + e.getMessage());
        }
        ctx.put("abnormalNursingRecords", nursingRecords);
        ctx.put("hasNursingAbnormal", nursingRecords.isEmpty() ? 0 : 1);
        if (!nursingRecords.isEmpty()) {
            ctx.put("nursingAbnormalDesc", nursingRecords.get(0).getAbnormalDesc());
        }

        // ===== 15. 护理计划（进行中的） =====
        List<NursingPlan> activeNursingPlans = new ArrayList<>();
        try {
            activeNursingPlans = nursingPlanMapper.selectList(
                    new LambdaQueryWrapper<NursingPlan>()
                            .eq(NursingPlan::getElderId, elderId)
                            .in(NursingPlan::getStatus, 0, 1));  // 待执行或进行中
        } catch (Exception e) {
            System.err.println("[AI评估] 护理计划查询失败（表结构不匹配），已跳过: " + e.getMessage());
        }
        ctx.put("activeNursingPlans", activeNursingPlans);
        // 生活能力下降但无护理计划
        Integer livingAbility = (Integer) ctx.get("livingAbility");
        if (livingAbility != null) {
            ctx.put("nursingGap", (livingAbility >= 3 && activeNursingPlans.isEmpty()) ? 1 : 0);
        }

        // ===== 16. 转诊（进行中的） =====
        List<ReferralOrder> activeReferrals = referralOrderMapper.selectList(
                new LambdaQueryWrapper<ReferralOrder>()
                        .eq(ReferralOrder::getElderId, elderId)
                        .in(ReferralOrder::getStatus, 0, 1, 2));  // 待接收/已接收/处理中
        ctx.put("activeReferrals", activeReferrals);
        ctx.put("hasActiveReferral", activeReferrals.isEmpty() ? 0 : 1);
        if (!activeReferrals.isEmpty()) {
            ctx.put("referralOrg", activeReferrals.get(0).getToOrg());
        }

        // ===== 17. 可穿戴设备 =====
        List<WearableDevice> devices = wearableDeviceMapper.selectList(
                new LambdaQueryWrapper<WearableDevice>()
                        .eq(WearableDevice::getElderId, elderId)
                        .eq(WearableDevice::getBindStatus, 1));  // 已绑定
        ctx.put("devices", devices);
        ctx.put("hasDevice", devices.isEmpty() ? 0 : 1);
        ctx.put("deviceNames", devices.stream()
                .map(WearableDevice::getDeviceName)
                .filter(Objects::nonNull)
                .collect(Collectors.joining("、")));
        // 有异常但无设备
        long abnormalCount = (int) ctx.getOrDefault("abnormalVitalCount", 0);
        ctx.put("deviceGap", (abnormalCount > 0 && devices.isEmpty()) ? 1 : 0);

        // ===== 18. 计算跌倒风险 =====
        Integer age = ctx.get("age") instanceof Number ? ((Number) ctx.get("age")).intValue() : null;
        Object livingObj = ctx.get("livingAbility");
        Integer living = livingObj instanceof Number ? ((Number) livingObj).intValue() : null;
        if (age != null && living != null) {
            ctx.put("fallRisk", (age >= 75 && living >= 3) ? 1 : 0);
        }

        LinkedHashSet<String> uniqueMissingData = new LinkedHashSet<>(missingData);
        int totalSections = 5;
        int completedSections = 0;
        if (elder.getBirthDate() != null) completedSections++;
        if (record != null) completedSections++;
        if (exam != null || !latestVitals.isEmpty()) completedSections++;
        if (!recentFollowRecords.isEmpty()) completedSections++;
        if (!assessments.isEmpty()) completedSections++;
        int completenessScore = completedSections * 100 / totalSections;
        Map<String, Object> completeness = new LinkedHashMap<>();
        completeness.put("score", completenessScore);
        completeness.put("completedSections", completedSections);
        completeness.put("totalSections", totalSections);
        ctx.put("dataCompleteness", completeness);
        ctx.put("dataCompletenessScore", completenessScore);
        ctx.put("missingData", new ArrayList<>(uniqueMissingData));

        return ctx;
    }

    private HealthRecord toReportSafeHealthRecord(HealthRecord record) {
        if (record == null) {
            return null;
        }
        HealthRecord safeRecord = new HealthRecord();
        BeanUtils.copyProperties(record, safeRecord);
        String disabilityStatus = record.getDisabilityStatus();
        safeRecord.setDisabilityStatus(DisabilityStatusSupport.isValid(disabilityStatus)
                ? DisabilityStatusSupport.normalize(disabilityStatus)
                : null);
        return safeRecord;
    }
}
