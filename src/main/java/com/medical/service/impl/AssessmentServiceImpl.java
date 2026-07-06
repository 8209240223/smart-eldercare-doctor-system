package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.*;
import com.medical.mapper.*;
import com.medical.service.AssessmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AssessmentServiceImpl implements AssessmentService {

    @Autowired
    private AssessmentRecordMapper assessmentRecordMapper;

    @Autowired
    private ElderInfoMapper elderInfoMapper;

    @Autowired
    private HealthRecordMapper healthRecordMapper;

    @Autowired
    private MedicalHistoryMapper medicalHistoryMapper;

    @Autowired
    private VitalSignDataMapper vitalSignDataMapper;

    @Autowired
    private HealthWarningMapper healthWarningMapper;


    @Override
    public Page<AssessmentRecord> list(Integer pageNum, Integer pageSize, Long elderId, Integer assessType) {
        Page<AssessmentRecord> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<AssessmentRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(elderId != null, AssessmentRecord::getElderId, elderId)
               .eq(assessType != null, AssessmentRecord::getAssessType, assessType)
               .orderByDesc(AssessmentRecord::getAssessDate);
        return assessmentRecordMapper.selectPage(page, wrapper);
    }

    @Override
    public AssessmentRecord getDetail(Long id) {
        AssessmentRecord record = assessmentRecordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException(404, "评估记录不存在");
        }
        return record;
    }

    @Override
    public Long create(AssessmentRecord record) {
        // 自动评级
        autoGrade(record);
        assessmentRecordMapper.insert(record);
        return record.getId();
    }

    @Override
    public void update(Long id, AssessmentRecord record) {
        record.setId(id);
        autoGrade(record);
        assessmentRecordMapper.updateById(record);
    }

    @Override
    public void delete(Long id) {
        assessmentRecordMapper.deleteById(id);
    }

    @Override
    public Map<String, Object> getStats(Long elderId) {
        Map<String, Object> stats = new HashMap<>();
        LambdaQueryWrapper<AssessmentRecord> wrapper = new LambdaQueryWrapper<>();
        if (elderId != null) {
            wrapper.eq(AssessmentRecord::getElderId, elderId);
        }
        stats.put("total", assessmentRecordMapper.selectCount(wrapper));

        // 各类型统计
        for (int i = 1; i <= 6; i++) {
            LambdaQueryWrapper<AssessmentRecord> typeWrapper = new LambdaQueryWrapper<>();
            typeWrapper.eq(AssessmentRecord::getAssessType, i);
            if (elderId != null) typeWrapper.eq(AssessmentRecord::getElderId, elderId);
            stats.put("type" + i, assessmentRecordMapper.selectCount(typeWrapper));
        }
        return stats;
    }

    @Override
    public Map<String, Object> getReport(Long elderId, Long doctorId) {
        Map<String, Object> report = new LinkedHashMap<>();

        // 1. 老人基本信息
        ElderInfo elder = elderInfoMapper.selectById(elderId);
        if (elder == null) {
            throw new BusinessException(404, "老人信息不存在");
        }
        Map<String, Object> basicInfo = new LinkedHashMap<>();
        basicInfo.put("name", elder.getName());
        basicInfo.put("gender", elder.getGender() != null && elder.getGender() == 1 ? "男" : "女");
        basicInfo.put("age", elder.getBirthDate() != null ? ChronoUnit.YEARS.between(elder.getBirthDate(), LocalDate.now()) : null);
        basicInfo.put("birthDate", elder.getBirthDate());
        basicInfo.put("idCard", elder.getIdCard());
        basicInfo.put("phone", elder.getPhone());
        basicInfo.put("community", elder.getCommunity());
        basicInfo.put("address", elder.getAddress());
        basicInfo.put("emergencyContact", elder.getEmergencyContact());
        basicInfo.put("emergencyPhone", elder.getEmergencyPhone());
        report.put("basicInfo", basicInfo);

        // 2. 健康档案
        LambdaQueryWrapper<HealthRecord> hrWrapper = new LambdaQueryWrapper<>();
        hrWrapper.eq(HealthRecord::getElderId, elderId);
        HealthRecord hr = healthRecordMapper.selectOne(hrWrapper);
        if (hr != null) {
            Map<String, Object> healthInfo = new LinkedHashMap<>();
            healthInfo.put("bloodType", hr.getBloodType());
            healthInfo.put("height", hr.getHeight());
            healthInfo.put("weight", hr.getWeight());
            if (hr.getHeight() != null && hr.getWeight() != null) {
                double bmi = hr.getWeight().doubleValue() / Math.pow(hr.getHeight().doubleValue() / 100, 2);
                healthInfo.put("bmi", String.format("%.1f", bmi));
                if (bmi < 18.5) healthInfo.put("bmiDesc", "偏瘦");
                else if (bmi < 24) healthInfo.put("bmiDesc", "正常");
                else if (bmi < 28) healthInfo.put("bmiDesc", "超重");
                else healthInfo.put("bmiDesc", "肥胖");
            }
            healthInfo.put("medicalHistory", hr.getMedicalHistory());
            healthInfo.put("allergyHistory", hr.getAllergyHistory());
            healthInfo.put("currentMedication", hr.getCurrentMedication());
            healthInfo.put("disabilityStatus", hr.getDisabilityStatus());
            report.put("healthRecord", healthInfo);
        }

        // 3. 全部评估记录
        LambdaQueryWrapper<AssessmentRecord> awWrapper = new LambdaQueryWrapper<>();
        awWrapper.eq(AssessmentRecord::getElderId, elderId)
                 .orderByDesc(AssessmentRecord::getAssessDate);
        List<AssessmentRecord> assessments = assessmentRecordMapper.selectList(awWrapper);
        report.put("assessments", assessments);
        report.put("assessmentCount", assessments.size());

        // 评估综合评分（取最近一次综合评估）
        AssessmentRecord latestComprehensive = assessments.stream()
                .filter(a -> a.getAssessType() != null && a.getAssessType() == 6)
                .findFirst().orElse(null);
        if (latestComprehensive != null) {
            report.put("overallScore", latestComprehensive.getScore());
            report.put("overallLevel", latestComprehensive.getLevel());
        }

        // 4. 病史记录
        LambdaQueryWrapper<MedicalHistory> mhWrapper = new LambdaQueryWrapper<>();
        mhWrapper.eq(MedicalHistory::getElderId, elderId);
        List<MedicalHistory> medicalHistories = medicalHistoryMapper.selectList(mhWrapper);
        report.put("medicalHistories", medicalHistories);

        // 5. 最新体征数据（每种类型取最近一条）
        List<Map<String, Object>> vitalsList = new ArrayList<>();
        int[] vitalTypes = {1, 2, 3, 4, 6, 7};
        String[] vitalNames = {"收缩压", "舒张压", "心率", "空腹血糖", "血氧", "体温"};
        String[] vitalUnits = {"mmHg", "mmHg", "bpm", "mmol/L", "%", "°C"};
        for (int i = 0; i < vitalTypes.length; i++) {
            LambdaQueryWrapper<VitalSignData> vw = new LambdaQueryWrapper<>();
            vw.eq(VitalSignData::getElderId, elderId)
               .eq(VitalSignData::getDataType, vitalTypes[i])
               .orderByDesc(VitalSignData::getMeasureTime)
               .last("LIMIT 1");
            VitalSignData vsd = vitalSignDataMapper.selectOne(vw);
            if (vsd != null) {
                Map<String, Object> vm = new LinkedHashMap<>();
                vm.put("name", vitalNames[i]);
                vm.put("value", vsd.getDataValue());
                vm.put("unit", vitalUnits[i]);
                vm.put("time", vsd.getMeasureTime());
                vm.put("isAbnormal", vsd.getIsAbnormal());
                vitalsList.add(vm);
            }
        }
        report.put("recentVitals", vitalsList);

        // 6. 最近预警（最近5条）
        LambdaQueryWrapper<HealthWarning> hwWrapper = new LambdaQueryWrapper<>();
        hwWrapper.eq(HealthWarning::getElderId, elderId)
                 .orderByDesc(HealthWarning::getCreateTime)
                 .last("LIMIT 5");
        report.put("recentWarnings", healthWarningMapper.selectList(hwWrapper));

        // 7. 报告元信息
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("reportNo", "RP" + System.currentTimeMillis());
        meta.put("generatedAt", LocalDateTime.now());
        meta.put("doctorId", doctorId);
        report.put("meta", meta);

        return report;
    }

    /**
     * 自动评级 - 根据分数和评估类型生成等级和建议
     */
    private void autoGrade(AssessmentRecord record) {
        if (record.getScore() == null) return;
        double score = record.getScore().doubleValue();
        Integer type = record.getAssessType();

        if (type == null) return;

        switch (type) {
            case 1: // ADL日常生活能力 (满分100)
                if (score >= 80) { record.setLevel("自理"); record.setSuggestion("老人生活能力良好，建议保持规律运动。"); }
                else if (score >= 60) { record.setLevel("轻度依赖"); record.setSuggestion("建议提供部分生活辅助，加强锻炼。"); }
                else if (score >= 40) { record.setLevel("中度依赖"); record.setSuggestion("需要日常照护，建议安排护理人员定期上门。"); }
                else { record.setLevel("重度依赖"); record.setSuggestion("需要全面照护支持，建议入住养老机构或安排24小时护理。"); }
                break;
            case 2: // MMSE认知功能 (满分30)
                if (score >= 27) { record.setLevel("正常"); record.setSuggestion("认知功能正常，建议保持社交和脑力活动。"); }
                else if (score >= 21) { record.setLevel("轻度障碍"); record.setSuggestion("存在轻度认知下降，建议定期复查并增加认知训练。"); }
                else if (score >= 10) { record.setLevel("中度障碍"); record.setSuggestion("认知功能明显下降，建议就医评估并考虑药物干预。"); }
                else { record.setLevel("重度障碍"); record.setSuggestion("认知功能严重受损，需要专业照护和持续治疗。"); }
                break;
            case 3: // GDS情绪/心理 (满分15，分数越高越严重)
                if (score <= 4) { record.setLevel("正常"); record.setSuggestion("情绪状态良好，建议保持积极社交。"); }
                else if (score <= 8) { record.setLevel("轻度抑郁"); record.setSuggestion("存在轻度抑郁倾向，建议增加户外活动和社交。"); }
                else if (score <= 11) { record.setLevel("中度抑郁"); record.setSuggestion("建议心理咨询干预，必要时药物治疗。"); }
                else { record.setLevel("重度抑郁"); record.setSuggestion("需要立即就医，接受专业心理和药物治疗。"); }
                break;
            case 4: // MNA营养评估 (满分30)
                if (score >= 24) { record.setLevel("营养良好"); record.setSuggestion("营养状况良好，保持均衡饮食。"); }
                else if (score >= 17) { record.setLevel("有营养不良风险"); record.setSuggestion("存在营养风险，建议调整饮食结构，增加蛋白质摄入。"); }
                else { record.setLevel("营养不良"); record.setSuggestion("营养状况差，建议营养科就诊，制定个性化营养方案。"); }
                break;
            case 5: // 跌倒风险 (Morse跌倒评估，满分125)
                if (score <= 24) { record.setLevel("低风险"); record.setSuggestion("跌倒风险较低，注意日常安全即可。"); }
                else if (score <= 50) { record.setLevel("中风险"); record.setSuggestion("建议改善居家环境，安装扶手，穿防滑鞋。"); }
                else { record.setLevel("高风险"); record.setSuggestion("跌倒风险高，建议使用助行器，家中消除障碍物，必要时安排陪护。"); }
                break;
            case 6: // 综合评估 (满分100)
                if (score >= 80) { record.setLevel("优"); record.setSuggestion("整体健康状况优良，保持现有生活方式。"); }
                else if (score >= 60) { record.setLevel("良"); record.setSuggestion("健康状况良好，部分指标可改善。"); }
                else if (score >= 40) { record.setLevel("中"); record.setSuggestion("健康状况一般，建议全面体检并制定健康管理方案。"); }
                else { record.setLevel("差"); record.setSuggestion("健康状况较差，建议加强医疗干预和日常照护。"); }
                break;
        }
    }
}
