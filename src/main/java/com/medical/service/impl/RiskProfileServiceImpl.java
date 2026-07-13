package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.entity.*;
import com.medical.mapper.*;
import com.medical.service.RiskProfileService;
import com.medical.service.TimelineService;
import com.medical.service.risk.RiskContext;
import com.medical.service.risk.RiskRule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 风险分层服务实现
 */
@Service
public class RiskProfileServiceImpl implements RiskProfileService {

    private static final Logger logger = LoggerFactory.getLogger(RiskProfileServiceImpl.class);

    @Autowired
    private ElderInfoMapper elderInfoMapper;

    @Autowired
    private ElderRiskProfileMapper elderRiskProfileMapper;

    @Autowired
    private HealthWarningMapper healthWarningMapper;

    @Autowired
    private FollowPlanMapper followPlanMapper;

    @Autowired
    private FollowRecordMapper followRecordMapper;

    @Autowired
    private MedicalHistoryMapper medicalHistoryMapper;

    @Autowired
    private NursingRecordMapper nursingRecordMapper;

    @Autowired
    private VitalSignDataMapper vitalSignDataMapper;

    @Autowired
    private TimelineService timelineService;

    @Autowired
    private List<RiskRule> riskRules;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 风险等级阈值:
     * 0-29: 普通(1)
     * 30-59: 关注(2)
     * 60-79: 重点(3)
     * 80+: 高危(4)
     */
    private int calculateRiskLevel(int score) {
        if (score >= 80) return 4;
        if (score >= 60) return 3;
        if (score >= 30) return 2;
        return 1;
    }

    @Override
    @Transactional
    public int calculateAllRisk() {
        QueryWrapper<ElderInfo> wrapper = new QueryWrapper<>();
        wrapper.eq("deleted", 0);
        List<ElderInfo> elders = elderInfoMapper.selectList(wrapper);

        int count = 0;
        for (ElderInfo elder : elders) {
            try {
                calculateRisk(elder.getId());
                count++;
            } catch (Exception e) {
                logger.error("计算老人 {} 风险评分失败: {}", elder.getId(), e.getMessage());
            }
        }

        logger.info("完成 {} 位老人的风险评分计算", count);
        return count;
    }

    @Override
    @Transactional
    public ElderRiskProfile calculateRisk(Long elderId) {
        ElderInfo elder = elderInfoMapper.selectById(elderId);
        if (elder == null || elder.getDeleted() == 1) {
            throw new RuntimeException("老人不存在");
        }

        // 构建评分上下文
        RiskContext context = buildRiskContext(elder);

        // 应用所有规则计算总分
        int totalScore = 0;
        List<Map<String, Object>> scoreDetails = new ArrayList<>();
        List<String> riskTags = new ArrayList<>();

        for (RiskRule rule : riskRules) {
            int score = rule.calculate(elder, context);
            if (score > 0) {
                totalScore += score;
                Map<String, Object> detail = new HashMap<>();
                detail.put("ruleCode", rule.getRuleCode());
                detail.put("ruleName", rule.getRuleName());
                detail.put("score", score);
                scoreDetails.add(detail);
                riskTags.add(rule.getRuleName());
            }
        }

        // 确定风险等级
        int riskLevel = calculateRiskLevel(totalScore);

        // 构建评分原因JSON
        Map<String, Object> reasonMap = new HashMap<>();
        reasonMap.put("totalScore", totalScore);
        reasonMap.put("riskLevel", riskLevel);
        reasonMap.put("scoreDetails", scoreDetails);
        reasonMap.put("contextData", context);
        String reasonJson;
        try {
            reasonJson = objectMapper.writeValueAsString(reasonMap);
        } catch (JsonProcessingException e) {
            reasonJson = "{}";
        }

        // 保存或更新风险档案
        QueryWrapper<ElderRiskProfile> wrapper = new QueryWrapper<>();
        wrapper.eq("elder_id", elderId);
        ElderRiskProfile existing = elderRiskProfileMapper.selectOne(wrapper);

        ElderRiskProfile profile = new ElderRiskProfile();
        profile.setElderId(elderId);
        profile.setRiskScore(totalScore);
        profile.setRiskLevel(riskLevel);
        profile.setRiskTags(riskTags.stream().collect(Collectors.joining(",")));
        profile.setReasonJson(reasonJson);
        profile.setLastCalculateTime(LocalDateTime.now());

        if (existing != null) {
            profile.setId(existing.getId());
            elderRiskProfileMapper.updateById(profile);

            // 风险等级变化时记录时间线
            if (existing.getRiskLevel() != riskLevel) {
                String eventContent = String.format("风险等级从%s变为%s，总分%d",
                        getRiskLevelText(existing.getRiskLevel()),
                        getRiskLevelText(riskLevel),
                        totalScore);
                TimelineEvent event = new TimelineEvent();
                event.setElderId(elderId);
                event.setEventType(10);
                event.setEventTitle("风险等级变化");
                event.setEventContent(eventContent);
                event.setSourceType("RISK_PROFILE");
                event.setSourceId(existing.getId());
                event.setEventTime(LocalDateTime.now());
                timelineService.addEvent(event);
            }
        } else {
            elderRiskProfileMapper.insert(profile);
        }

        logger.info("老人 {} 风险评分: {}分, 等级: {}", elderId, totalScore, getRiskLevelText(riskLevel));
        return profile;
    }

    /**
     * 构建评分上下文数据
     */
    private RiskContext buildRiskContext(ElderInfo elder) {
        RiskContext context = new RiskContext();

        // 1. 计算年龄
        if (elder.getBirthDate() != null) {
            context.setAge(Period.between(elder.getBirthDate(), LocalDate.now()).getYears());
        }

        // 2. 慢病数量
        QueryWrapper<MedicalHistory> medicalWrapper = new QueryWrapper<>();
        medicalWrapper.eq("elder_id", elder.getId());
        medicalWrapper.eq("is_cured", 0); // 未治愈的疾病
        Integer chronicCount = Math.toIntExact(medicalHistoryMapper.selectCount(medicalWrapper));
        context.setChronicDiseaseCount(chronicCount);

        // 3. 近30天预警次数
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        QueryWrapper<HealthWarning> warningWrapper = new QueryWrapper<>();
        warningWrapper.eq("elder_id", elder.getId());
        warningWrapper.ge("create_time", thirtyDaysAgo);
        warningWrapper.eq("deleted", 0);
        Integer warningCount = Math.toIntExact(healthWarningMapper.selectCount(warningWrapper));
        context.setWarningCountIn30Days(warningCount);

        // 4. 高危预警次数
        QueryWrapper<HealthWarning> highWarningWrapper = new QueryWrapper<>();
        highWarningWrapper.eq("elder_id", elder.getId());
        highWarningWrapper.eq("warning_level", 3); // 红色预警
        highWarningWrapper.eq("deleted", 0);
        Integer highWarningCount = Math.toIntExact(healthWarningMapper.selectCount(highWarningWrapper));
        context.setHighLevelWarningCount(highWarningCount);

        // 5. 随访逾期天数
        QueryWrapper<FollowPlan> planWrapper = new QueryWrapper<>();
        planWrapper.eq("elder_id", elder.getId());
        planWrapper.eq("status", 1); // 进行中
        planWrapper.isNotNull("next_follow_date");
        planWrapper.lt("next_follow_date", LocalDate.now());
        planWrapper.eq("deleted", 0);
        planWrapper.orderByAsc("next_follow_date");
        planWrapper.last("LIMIT 1");
        FollowPlan overduePlan = followPlanMapper.selectOne(planWrapper);
        if (overduePlan != null && overduePlan.getNextFollowDate() != null) {
            int overdueDays = (int) ChronoUnit.DAYS.between(overduePlan.getNextFollowDate(), LocalDate.now());
            context.setFollowupOverdueDays(overdueDays);
        }

        // 6. 最近随访时间
        QueryWrapper<FollowRecord> recordWrapper = new QueryWrapper<>();
        recordWrapper.eq("elder_id", elder.getId());
        recordWrapper.orderByDesc("follow_date");
        recordWrapper.last("LIMIT 1");
        FollowRecord lastRecord = followRecordMapper.selectOne(recordWrapper);
        if (lastRecord != null) {
            context.setLastFollowupTime(lastRecord.getFollowDate());
        }

        // 7. 近30天护理异常上报次数
        QueryWrapper<NursingRecord> nursingWrapper = new QueryWrapper<>();
        nursingWrapper.eq("elder_id", elder.getId());
        nursingWrapper.eq("is_abnormal", 1);
        nursingWrapper.ge("record_date", thirtyDaysAgo);
        nursingWrapper.eq("deleted", 0);
        Integer abnormalCount = Math.toIntExact(nursingRecordMapper.selectCount(nursingWrapper));
        context.setNursingAbnormalCount(abnormalCount);

        // 8. 近30天体征异常次数
        QueryWrapper<VitalSignData> vitalWrapper = new QueryWrapper<>();
        vitalWrapper.eq("elder_id", elder.getId());
        vitalWrapper.eq("is_abnormal", 1);
        vitalWrapper.ge("measure_time", thirtyDaysAgo);
        Integer vitalAbnormalCount = Math.toIntExact(vitalSignDataMapper.selectCount(vitalWrapper));
        context.setVitalSignAbnormalCount(vitalAbnormalCount);

        return context;
    }

    @Override
    public Page<Map<String, Object>> getKeyPopulationList(Integer pageNum, Integer pageSize,
            Integer riskLevel, Long doctorId, String community, String keyword) {
        Page<Map<String, Object>> page = new Page<>(pageNum, pageSize);

        List<Map<String, Object>> allRecords;
        ensureRiskProfilesReady();

        if (doctorId != null) {
            // 查询医生管理的重点人群
            allRecords = elderRiskProfileMapper.selectByDoctorId(doctorId, riskLevel != null ? riskLevel : 3);
        } else if (riskLevel != null) {
            // 查询指定风险等级的老人
            allRecords = elderRiskProfileMapper.selectByRiskLevel(riskLevel);
        } else {
            // 查询所有老人风险档案
            allRecords = elderRiskProfileMapper.selectAllWithElder();
        }

        String normalizedKeyword = StringUtils.hasText(keyword)
                ? keyword.trim().toLowerCase()
                : null;
        allRecords = allRecords.stream()
                .map(this::normalizeRiskRecord)
                .filter(record -> !StringUtils.hasText(community) || community.equals(record.get("community")))
                .filter(record -> matchesRiskKeyword(record, normalizedKeyword))
                .collect(Collectors.toList());

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

    private boolean matchesRiskKeyword(Map<String, Object> record, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return true;
        }
        String elderId = String.valueOf(record.getOrDefault("elderId", ""));
        String elderName = String.valueOf(record.getOrDefault("name", "")).toLowerCase();
        return elderId.equals(keyword) || elderName.contains(keyword);
    }

    private void ensureRiskProfilesReady() {
        Long profileCount = elderRiskProfileMapper.selectCount(null);
        if (profileCount == null || profileCount == 0) {
            calculateAllRisk();
        }
    }

    @Override
    public Map<String, Object> getRiskProfileDetail(Long elderId) {
        Map<String, Object> result = new HashMap<>();

        QueryWrapper<ElderRiskProfile> wrapper = new QueryWrapper<>();
        wrapper.eq("elder_id", elderId);
        ElderRiskProfile profile = elderRiskProfileMapper.selectOne(wrapper);

        if (profile == null) {
            // 如果没有风险档案，先计算一次
            profile = calculateRisk(elderId);
        }

        result.put("profile", profile);

        // 解析评分原因
        try {
            Map<String, Object> reasonMap = objectMapper.readValue(profile.getReasonJson(), Map.class);
            result.put("reasonDetails", reasonMap);
        } catch (JsonProcessingException e) {
            result.put("reasonDetails", new HashMap<>());
        }

        // 获取老人基本信息
        ElderInfo elder = elderInfoMapper.selectById(elderId);
        result.put("elder", elder);

        return result;
    }

    @Override
    public Map<String, Object> getRiskLevelStats() {
        Map<String, Object> result = new HashMap<>();

        List<Map<String, Object>> stats = elderRiskProfileMapper.countByRiskLevel();
        int normalCount = 0;
        int attentionCount = 0;
        int keyCount = 0;
        int highRiskCount = 0;

        for (Map<String, Object> stat : stats) {
            Integer level = (Integer) stat.get("risk_level");
            Long count = (Long) stat.get("count");
            if (level != null && count != null) {
                switch (level) {
                    case 1: normalCount = count.intValue(); break;
                    case 2: attentionCount = count.intValue(); break;
                    case 3: keyCount = count.intValue(); break;
                    case 4: highRiskCount = count.intValue(); break;
                }
            }
        }

        result.put("normal", normalCount);
        result.put("attention", attentionCount);
        result.put("key", keyCount);
        result.put("highRisk", highRiskCount);
        result.put("total", normalCount + attentionCount + keyCount + highRiskCount);

        return result;
    }

    @Override
    public int countHighRisk() {
        QueryWrapper<ElderRiskProfile> wrapper = new QueryWrapper<>();
        wrapper.eq("risk_level", 4);
        return Math.toIntExact(elderRiskProfileMapper.selectCount(wrapper));
    }

    @Override
    public int countKeyPopulation() {
        QueryWrapper<ElderRiskProfile> wrapper = new QueryWrapper<>();
        wrapper.ge("risk_level", 3); // 重点和高危
        return Math.toIntExact(elderRiskProfileMapper.selectCount(wrapper));
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

    private Map<String, Object> normalizeRiskRecord(Map<String, Object> record) {
        Map<String, Object> map = new HashMap<>();
        Integer level = toInteger(first(record, "riskLevel", "risk_level"));
        map.put("id", first(record, "id"));
        map.put("elderId", first(record, "elderId", "elder_id"));
        map.put("riskScore", first(record, "riskScore", "risk_score"));
        map.put("riskLevel", level);
        map.put("riskLevelText", level == null ? "未知" : getRiskLevelText(level));
        map.put("riskTags", first(record, "riskTags", "risk_tags"));
        map.put("name", first(record, "name"));
        map.put("gender", first(record, "gender"));
        map.put("birthDate", first(record, "birthDate", "birth_date"));
        map.put("phone", first(record, "phone"));
        map.put("community", first(record, "community"));
        map.put("doctorId", first(record, "doctorId", "doctor_id"));
        map.put("lastCalculateTime", first(record, "lastCalculateTime", "last_calculate_time"));
        return map;
    }

    private Object first(Map<String, Object> record, String... keys) {
        for (String key : keys) {
            if (record.containsKey(key) && record.get(key) != null) {
                return record.get(key);
            }
        }
        return null;
    }

    private Integer toInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).intValue();
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
