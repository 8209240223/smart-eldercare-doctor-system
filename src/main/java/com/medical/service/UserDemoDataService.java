package com.medical.service;

import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.entity.*;
import com.medical.mapper.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class UserDemoDataService {
    private static final String DEMO_PROMPT_VERSION = "account-demo-v1";
    private static final String[] NAMES = {
            "陈秀兰", "周建国", "刘桂芳", "赵文德", "王淑珍", "李志远",
            "孙玉梅", "吴振华", "郑秋云", "冯国强", "何静宜", "高明远"
    };
    private static final String[] COMMUNITIES = {
            "幸福社区", "康宁社区", "阳光社区", "和美社区", "安泰社区", "长乐社区"
    };
    private static final int[] ID_WEIGHTS = {7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2};
    private static final char[] ID_CODES = {'1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'};

    @Autowired private ElderInfoMapper elderInfoMapper;
    @Autowired private SysUserMapper sysUserMapper;
    @Autowired private HealthRecordMapper healthRecordMapper;
    @Autowired private PhysicalExamMapper physicalExamMapper;
    @Autowired private ElderRiskProfileMapper elderRiskProfileMapper;
    @Autowired private FollowPlanMapper followPlanMapper;
    @Autowired private FollowupTaskMapper followupTaskMapper;
    @Autowired private AssessmentRecordMapper assessmentRecordMapper;
    @Autowired private NursingPlanMapper nursingPlanMapper;
    @Autowired private NursingRecordMapper nursingRecordMapper;
    @Autowired private AiHealthReportMapper aiHealthReportMapper;
    @Autowired(required = false) private DoctorNurseRelationService relationService;

    @Transactional
    public void ensureFor(SysUser user) {
        if (user == null || user.getId() == null || !Integer.valueOf(1).equals(user.getStatus())) {
            return;
        }
        Integer userType = user.getUserType();
        if (!Integer.valueOf(2).equals(userType) && !Integer.valueOf(3).equals(userType)) {
            return;
        }
        LambdaQueryWrapper<ElderInfo> owned = new LambdaQueryWrapper<>();
        if (Integer.valueOf(2).equals(userType)) {
            owned.eq(ElderInfo::getDoctorId, user.getId());
        } else {
            owned.eq(ElderInfo::getNurseId, user.getId());
        }
        List<Long> ownedElderIds = elderInfoMapper.selectList(owned).stream()
                .map(ElderInfo::getId)
                .toList();
        if (!ownedElderIds.isEmpty()) {
            Long demoReportCount = aiHealthReportMapper.selectCount(new LambdaQueryWrapper<AiHealthReport>()
                    .in(AiHealthReport::getElderId, ownedElderIds)
                    .eq(AiHealthReport::getPromptVersion, DEMO_PROMPT_VERSION));
            if (demoReportCount != null && demoReportCount > 0) {
                return;
            }
        }

        Long doctorId = Integer.valueOf(2).equals(userType) ? user.getId()
                : chooseDoctorForNurse(user);
        Long nurseId = Integer.valueOf(3).equals(userType) ? user.getId()
                : chooseNurseForDoctor(user);
        for (int index = 0; index < 2; index++) {
            createBundle(user.getId(), index, doctorId, nurseId);
        }
    }

    private Long chooseDoctorForNurse(SysUser nurse) {
        if (relationService != null) {
            Long doctorId = relationService.chooseDoctorForNurse(
                    nurse.getId(), nurse.getUsername() + "-demo-doctor");
            if (doctorId != null) {
                return doctorId;
            }
        }
        return firstActiveUser(2);
    }

    private Long chooseNurseForDoctor(SysUser doctor) {
        if (relationService != null) {
            Long nurseId = relationService.chooseNurseForDoctor(
                    doctor.getId(), doctor.getUsername() + "-demo-nurse", null);
            if (nurseId != null) {
                return nurseId;
            }
        }
        return firstActiveUser(3);
    }

    private Long firstActiveUser(Integer userType) {
        SysUser user = sysUserMapper.selectOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUserType, userType)
                .eq(SysUser::getStatus, 1)
                .eq(SysUser::getDeleted, 0)
                .orderByAsc(SysUser::getId)
                .last("LIMIT 1"));
        return user == null ? null : user.getId();
    }

    private void createBundle(Long ownerId, int index, Long doctorId, Long nurseId) {
        ElderInfo elder = createElder(ownerId, index, doctorId, nurseId);
        elderInfoMapper.insert(elder);
        createHealthRecord(elder, doctorId, index);
        createPhysicalExam(elder, doctorId, index);
        createRiskProfile(elder, index);
        createAssessment(elder, doctorId, index);
        createFollowup(elder, doctorId, nurseId, index);
        createNursing(elder, doctorId, nurseId, index);
        createReport(elder, doctorId, index);
    }

    private ElderInfo createElder(Long ownerId, int index, Long doctorId, Long nurseId) {
        int nameIndex = Math.floorMod((int) (ownerId * 2 + index), NAMES.length);
        int gender = nameIndex % 2 == 0 ? 2 : 1;
        LocalDate birthDate = LocalDate.of(1942 + Math.floorMod(ownerId.intValue() + index * 7, 34),
                1 + Math.floorMod(nameIndex * 3, 12), 5 + Math.floorMod(nameIndex * 2, 20));
        ElderInfo elder = new ElderInfo();
        elder.setName(NAMES[nameIndex]);
        elder.setGender(gender);
        elder.setBirthDate(birthDate);
        elder.setIdCard(createIdCard(ownerId, index, birthDate, gender));
        elder.setPhone(createPhone(ownerId, index, 13));
        elder.setEmergencyContact(NAMES[(nameIndex + 5) % NAMES.length]);
        elder.setEmergencyPhone(createPhone(ownerId, index, 15));
        elder.setNation("汉族");
        elder.setCommunity(COMMUNITIES[nameIndex % COMMUNITIES.length]);
        elder.setAddress("本市" + elder.getCommunity() + "健康服务中心周边");
        elder.setDoctorId(doctorId);
        elder.setNurseId(nurseId);
        elder.setAccountStatus(1);
        elder.setDeleted(0);
        return elder;
    }

    private void createHealthRecord(ElderInfo elder, Long doctorId, int index) {
        HealthRecord record = new HealthRecord();
        record.setElderId(elder.getId());
        record.setRecordNo("DEMO-HR-" + elder.getId());
        record.setBloodType(index == 0 ? "A型" : "O型");
        record.setHeight(BigDecimal.valueOf(index == 0 ? 158 : 166));
        record.setWeight(BigDecimal.valueOf(index == 0 ? 58 : 67));
        record.setMedicalHistory(JSONUtil.toJsonStr(List.of(index == 0 ? "高血压" : "2型糖尿病")));
        record.setFamilyHistory(JSONUtil.toJsonStr(List.of("无明确遗传病史")));
        record.setAllergyHistory(JSONUtil.toJsonStr(List.of("无已知药物过敏")));
        record.setCurrentMedication(JSONUtil.toJsonStr(List.of(index == 0 ? "氨氯地平" : "二甲双胍")));
        record.setDisabilityStatus("无");
        record.setLivingAbility(1);
        record.setSmokingStatus(1);
        record.setDrinkingStatus(1);
        record.setExerciseFrequency(index == 0 ? 2 : 3);
        record.setCreateDoctorId(doctorId);
        healthRecordMapper.insert(record);
    }

    private void createPhysicalExam(ElderInfo elder, Long doctorId, int index) {
        PhysicalExam exam = new PhysicalExam();
        exam.setElderId(elder.getId());
        exam.setDoctorId(doctorId);
        exam.setExamDate(LocalDate.now().minusDays(index + 1L));
        exam.setHeight(BigDecimal.valueOf(index == 0 ? 158 : 166));
        exam.setWeight(BigDecimal.valueOf(index == 0 ? 58 : 67));
        exam.setSystolicPressure(index == 0 ? 146 : 132);
        exam.setDiastolicPressure(index == 0 ? 88 : 82);
        exam.setHeartRate(index == 0 ? 76 : 72);
        exam.setBloodSugarFasting(BigDecimal.valueOf(index == 0 ? 6.2 : 7.1));
        exam.setTemperature(BigDecimal.valueOf(36.5));
        exam.setBloodOxygen(BigDecimal.valueOf(97));
        exam.setExamSummary(index == 0 ? "血压偏高，建议持续监测" : "血糖偏高，建议规范饮食与复查");
        exam.setDoctorAdvice("保持规律作息，按计划完成随访和健康监测");
        exam.setAbnormalFlag(1);
        exam.setDeleted(0);
        physicalExamMapper.insert(exam);
    }

    private void createRiskProfile(ElderInfo elder, int index) {
        ElderRiskProfile risk = new ElderRiskProfile();
        risk.setElderId(elder.getId());
        risk.setRiskScore(index == 0 ? 46 : 62);
        risk.setRiskLevel(index == 0 ? 2 : 3);
        risk.setRiskTags(index == 0 ? "高血压,需关注" : "血糖异常,重点随访");
        risk.setReasonJson(JSONUtil.toJsonStr(Map.of(
                "主要原因", index == 0 ? "近期血压偏高" : "空腹血糖偏高",
                "处置建议", "按随访计划持续监测")));
        risk.setLastCalculateTime(LocalDateTime.now());
        elderRiskProfileMapper.insert(risk);
    }

    private void createAssessment(ElderInfo elder, Long doctorId, int index) {
        if (doctorId == null) {
            return;
        }
        AssessmentRecord assessment = new AssessmentRecord();
        assessment.setElderId(elder.getId());
        assessment.setDoctorId(doctorId);
        assessment.setAssessType(9);
        assessment.setAssessDate(LocalDate.now());
        assessment.setScore(BigDecimal.valueOf(index == 0 ? 78 : 70));
        assessment.setLevel(index == 0 ? "中等风险" : "重点关注");
        assessment.setResult(index == 0 ? "生活能力良好，血压需要持续观察" : "生活能力尚可，血糖管理需要加强");
        assessment.setSuggestion("按计划随访，保持用药依从性并记录每日指标");
        assessment.setDeleted(0);
        assessmentRecordMapper.insert(assessment);
    }

    private void createFollowup(ElderInfo elder, Long doctorId, Long nurseId, int index) {
        if (doctorId == null) {
            return;
        }
        FollowPlan plan = new FollowPlan();
        plan.setElderId(elder.getId());
        plan.setDoctorId(doctorId);
        plan.setPlanName(index == 0 ? "高血压规范随访计划" : "糖尿病健康管理计划");
        plan.setDiseaseType(index == 0 ? 1 : 2);
        plan.setFrequencyType(2);
        plan.setStartDate(LocalDate.now());
        plan.setEndDate(LocalDate.now().plusMonths(6));
        plan.setNextFollowDate(LocalDate.now().plusDays(7 + index));
        plan.setTotalCount(6);
        plan.setCompletedCount(0);
        plan.setStatus(1);
        plan.setRemark("系统为新账号生成的默认演示随访计划");
        followPlanMapper.insert(plan);

        FollowupTask task = new FollowupTask();
        task.setElderId(elder.getId());
        task.setPlanId(plan.getId());
        task.setDoctorId(doctorId);
        task.setNurseId(nurseId);
        task.setTaskType(3);
        task.setPriority(index == 0 ? 2 : 3);
        task.setDueDate(plan.getNextFollowDate());
        task.setStatus(0);
        task.setSource("ACCOUNT_DEMO");
        task.setTaskReason(index == 0 ? "复核近期血压变化" : "评估血糖控制和用药依从性");
        followupTaskMapper.insert(task);
    }

    private void createNursing(ElderInfo elder, Long doctorId, Long nurseId, int index) {
        if (nurseId == null) {
            return;
        }
        NursingPlan plan = new NursingPlan();
        plan.setElderId(elder.getId());
        plan.setDoctorId(doctorId);
        plan.setNurseId(nurseId);
        plan.setPlanName(index == 0 ? "血压监测护理计划" : "血糖管理护理计划");
        plan.setPlanType(index == 0 ? 1 : 3);
        plan.setStartDate(LocalDate.now());
        plan.setEndDate(LocalDate.now().plusMonths(3));
        plan.setFrequency("每周2次");
        plan.setNursingGoal(index == 0 ? "保持血压平稳并改善自我监测习惯" : "提高饮食和用药依从性");
        plan.setNursingContent("指标监测、健康教育、异常情况记录与上报");
        plan.setStatus(1);
        plan.setTotalCount(24);
        plan.setCompletedCount(1);
        plan.setDoctorApproval(1);
        plan.setDeleted(0);
        nursingPlanMapper.insert(plan);

        NursingRecord record = new NursingRecord();
        record.setElderId(elder.getId());
        record.setDoctorId(doctorId);
        record.setNurseId(nurseId);
        record.setRecordType(index == 0 ? 1 : 2);
        record.setRecordTitle(index == 0 ? "首次血压护理随访" : "首次血糖护理随访");
        record.setRecordContent("已完成基础指标测量和健康情况询问");
        record.setNursingMeasures("指导规范测量、记录指标并按时服药");
        record.setObservation("老人配合良好，当前无急性不适");
        record.setEvaluation("护理计划可继续执行");
        record.setRecordDate(LocalDateTime.now());
        record.setIsAbnormal(0);
        record.setReportStatus(0);
        record.setDoctorReview(1);
        record.setDeleted(0);
        nursingRecordMapper.insert(record);
    }

    private void createReport(ElderInfo elder, Long doctorId, int index) {
        if (doctorId == null) {
            return;
        }
        int riskScore = index == 0 ? 46 : 62;
        String riskLevel = index == 0 ? "MEDIUM" : "HIGH";
        Map<String, Object> document = Map.of(
                "schemaVersion", "1.0",
                "elderBrief", Map.of("id", elder.getId(), "name", elder.getName()),
                "riskScore", riskScore,
                "riskLevel", riskLevel,
                "reportText", index == 0 ? "近期血压偏高，需要按计划复测并保持规律用药。" : "空腹血糖偏高，需要加强饮食、用药和复查管理。",
                "riskReasons", List.of(index == 0 ? "血压高于目标范围" : "空腹血糖高于目标范围"),
                "followUpAdvice", List.of("按期完成随访任务", "连续记录家庭监测数据", "异常时及时联系责任医护人员"),
                "generatedAt", LocalDateTime.now().toString());
        AiHealthReport report = new AiHealthReport();
        report.setElderId(elder.getId());
        report.setDoctorId(doctorId);
        report.setSource(1);
        report.setRiskScore(riskScore);
        report.setRiskLevel(riskLevel);
        report.setReportJson(JSONUtil.toJsonStr(document));
        report.setStatus(1);
        report.setModelName("rule-demo");
        report.setPromptVersion(DEMO_PROMPT_VERSION);
        report.setCreateTime(LocalDateTime.now());
        report.setConfirmTime(LocalDateTime.now());
        aiHealthReportMapper.insert(report);
    }

    private String createIdCard(Long ownerId, int index, LocalDate birthDate, int gender) {
        int sequence = 100 + Math.floorMod((int) (ownerId * 37 + index * 53), 899);
        if (sequence % 2 != gender % 2) {
            sequence = sequence == 998 ? sequence - 1 : sequence + 1;
        }
        String prefix = "110101" + birthDate.format(DateTimeFormatter.BASIC_ISO_DATE)
                + String.format("%03d", sequence);
        int sum = 0;
        for (int position = 0; position < ID_WEIGHTS.length; position++) {
            sum += (prefix.charAt(position) - '0') * ID_WEIGHTS[position];
        }
        return prefix + ID_CODES[sum % 11];
    }

    private String createPhone(Long ownerId, int index, int prefix) {
        long suffix = Math.floorMod(ownerId * 1000 + index * 17 + prefix, 1_000_000_000L);
        return prefix + String.format("%09d", suffix);
    }
}
