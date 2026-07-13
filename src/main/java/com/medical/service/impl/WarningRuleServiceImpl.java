package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.entity.HealthWarning;
import com.medical.entity.TimelineEvent;
import com.medical.entity.WarningRule;
import com.medical.common.exception.BusinessException;
import com.medical.mapper.WarningRuleMapper;
import com.medical.service.TimelineService;
import com.medical.service.WarningRuleService;
import com.medical.service.WarningService;
import com.medical.service.ElderReferenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class WarningRuleServiceImpl implements WarningRuleService {

    private static final Set<String> SUPPORTED_METRICS = Set.of(
            "systolic", "diastolic", "heartRate", "bloodSugarFasting",
            "bloodSugarPostprandial", "spo2", "bloodOxygen", "temperature",
            "bmi", "steps", "sleep");
    private static final Pattern CONDITION_PATTERN = Pattern.compile(
            "^([A-Za-z][A-Za-z0-9]*)\\s*(>=|<=|>|<)\\s*(-?\\d+(?:\\.\\d+)?)$");
    private static final Map<String, MetricRange> METRIC_RANGES = Map.ofEntries(
            Map.entry("systolic", new MetricRange("收缩压", "60", "240")),
            Map.entry("diastolic", new MetricRange("舒张压", "40", "140")),
            Map.entry("heartRate", new MetricRange("心率", "30", "180")),
            Map.entry("bloodSugarFasting", new MetricRange("空腹血糖", "2", "30")),
            Map.entry("bloodSugarPostprandial", new MetricRange("餐后血糖", "2", "35")),
            Map.entry("spo2", new MetricRange("血氧饱和度", "50", "100")),
            Map.entry("bloodOxygen", new MetricRange("血氧饱和度", "50", "100")),
            Map.entry("temperature", new MetricRange("体温", "34", "42")),
            Map.entry("bmi", new MetricRange("BMI", "10", "60")),
            Map.entry("steps", new MetricRange("步数", "0", "100000")),
            Map.entry("sleep", new MetricRange("睡眠时长", "0", "24"))
    );
    private static final Map<String, Integer> RULE_TYPE_BY_METRIC = Map.ofEntries(
            Map.entry("systolic", 1),
            Map.entry("diastolic", 1),
            Map.entry("bloodSugarFasting", 2),
            Map.entry("bloodSugarPostprandial", 2),
            Map.entry("heartRate", 3),
            Map.entry("temperature", 4),
            Map.entry("bmi", 5),
            Map.entry("spo2", 6),
            Map.entry("bloodOxygen", 6),
            Map.entry("steps", 6),
            Map.entry("sleep", 6));
    private static final Map<Integer, String> RULE_TYPE_LABELS = Map.of(
            1, "血压", 2, "血糖", 3, "心率", 4, "体温", 5, "BMI", 6, "综合");

    @Autowired
    private WarningRuleMapper warningRuleMapper;

    @Autowired
    private WarningService warningService;

    @Autowired
    private TimelineService timelineService;

    @Autowired
    private ElderReferenceService elderReferenceService;

    @Override
    public List<WarningRule> listRules(Long doctorId) {
        LambdaQueryWrapper<WarningRule> wrapper = new LambdaQueryWrapper<>();
        if (doctorId != null) {
            wrapper.and(w -> w.eq(WarningRule::getDoctorId, doctorId).or().isNull(WarningRule::getDoctorId));
        }
        wrapper.orderByDesc(WarningRule::getCreateTime);
        return warningRuleMapper.selectList(wrapper);
    }

    @Override
    public WarningRule createRule(WarningRule rule) {
        validateRule(rule);
        rule.setCreateTime(LocalDateTime.now());
        if (rule.getEnabled() == null) {
            rule.setEnabled(1);
        }
        warningRuleMapper.insert(rule);
        return rule;
    }

    @Override
    public void updateRule(Long id, WarningRule rule) {
        validateRule(rule);
        rule.setId(id);
        warningRuleMapper.updateById(rule);
    }

    @Override
    public void deleteRule(Long id) {
        warningRuleMapper.deleteById(id);
    }

    @Override
    public void toggleRule(Long id, Integer enabled) {
        WarningRule rule = new WarningRule();
        rule.setId(id);
        rule.setEnabled(enabled);
        warningRuleMapper.updateById(rule);
    }

    @Override
    public int evaluateVitalSigns(Long elderId, Map<String, BigDecimal> vitalData) {
        validateVitalData(elderId, vitalData);
        elderReferenceService.requireActive(elderId);
        // 获取所有启用的规则
        LambdaQueryWrapper<WarningRule> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WarningRule::getEnabled, 1);
        List<WarningRule> rules = warningRuleMapper.selectList(wrapper);

        int triggeredCount = 0;
        for (WarningRule rule : rules) {
            String metricCode = rule.getMetricCode();
            BigDecimal value = resolveMetricValue(vitalData, metricCode);
            if (value == null) {
                continue;
            }
            if (evaluateCondition(rule.getConditionExpr(), metricCode, value)) {
                // 触发预警
                createWarningFromRule(elderId, rule, value);
                triggeredCount++;
            }
        }
        return triggeredCount;
    }

    private void validateVitalData(Long elderId, Map<String, BigDecimal> vitalData) {
        if (elderId == null || elderId <= 0) {
            throw new BusinessException(400, "老人ID必须为正整数");
        }
        if (vitalData == null || vitalData.isEmpty()) {
            throw new BusinessException(400, "请至少填写一项生命体征数据");
        }
        for (Map.Entry<String, BigDecimal> entry : vitalData.entrySet()) {
            MetricRange range = METRIC_RANGES.get(entry.getKey());
            if (range == null) {
                throw new BusinessException(400, "不支持的生命体征指标: " + entry.getKey());
            }
            BigDecimal value = entry.getValue();
            if (value == null || value.compareTo(range.min()) < 0 || value.compareTo(range.max()) > 0) {
                throw new BusinessException(400, range.label() + "必须在" + range.min().stripTrailingZeros().toPlainString()
                        + "到" + range.max().stripTrailingZeros().toPlainString() + "之间");
            }
        }
        BigDecimal systolic = vitalData.get("systolic");
        BigDecimal diastolic = vitalData.get("diastolic");
        if (systolic != null && diastolic != null && systolic.compareTo(diastolic) <= 0) {
            throw new BusinessException(400, "收缩压必须大于舒张压");
        }
    }

    /**
     * 解析条件表达式并评估
     * 支持格式: metric>value, metric<value, metric>=value, metric<=value
     */
    private boolean evaluateCondition(String conditionExpr, String metricCode, BigDecimal value) {
        if (conditionExpr == null || metricCode == null || value == null) {
            return false;
        }
        try {
            Matcher matcher = CONDITION_PATTERN.matcher(conditionExpr.trim());
            if (!matcher.matches() || !metricEquivalent(metricCode, matcher.group(1))) return false;
            BigDecimal threshold = new BigDecimal(matcher.group(3));
            int comparison = value.compareTo(threshold);
            return switch (matcher.group(2)) {
                case ">=" -> comparison >= 0;
                case "<=" -> comparison <= 0;
                case ">" -> comparison > 0;
                case "<" -> comparison < 0;
                default -> false;
            };
        } catch (Exception e) {
            // 条件解析失败，不触发
        }
        return false;
    }

    private BigDecimal resolveMetricValue(Map<String, BigDecimal> vitalData, String metricCode) {
        if (vitalData == null || metricCode == null) return null;
        BigDecimal value = vitalData.get(metricCode);
        if (value != null) return value;
        if ("spo2".equals(metricCode)) return vitalData.get("bloodOxygen");
        if ("bloodOxygen".equals(metricCode)) return vitalData.get("spo2");
        return null;
    }

    private boolean metricEquivalent(String first, String second) {
        if (first.equals(second)) return true;
        return ("spo2".equals(first) && "bloodOxygen".equals(second))
                || ("bloodOxygen".equals(first) && "spo2".equals(second));
    }

    private void validateRule(WarningRule rule) {
        if (rule == null) throw new BusinessException(400, "预警规则不能为空");
        if (rule.getRuleName() == null || rule.getRuleName().trim().isEmpty()) {
            throw new BusinessException(400, "规则名称不能为空");
        }
        if (!SUPPORTED_METRICS.contains(rule.getMetricCode())) {
            throw new BusinessException(400, "指标编码不受支持");
        }
        Integer expectedRuleType = RULE_TYPE_BY_METRIC.get(rule.getMetricCode());
        if (rule.getRuleType() == null || !rule.getRuleType().equals(expectedRuleType)) {
            throw new BusinessException(400, METRIC_RANGES.get(rule.getMetricCode()).label()
                    + "指标必须选择" + RULE_TYPE_LABELS.get(expectedRuleType) + "规则类型");
        }
        Matcher matcher = CONDITION_PATTERN.matcher(rule.getConditionExpr() == null ? "" : rule.getConditionExpr().trim());
        if (!matcher.matches() || !metricEquivalent(rule.getMetricCode(), matcher.group(1))) {
            throw new BusinessException(400, "条件表达式必须使用所选指标，并采用 指标>=数值 等格式");
        }
        MetricRange range = METRIC_RANGES.get(rule.getMetricCode());
        BigDecimal threshold = new BigDecimal(matcher.group(3));
        if (threshold.compareTo(range.min()) < 0 || threshold.compareTo(range.max()) > 0) {
            throw new BusinessException(400, range.label() + "规则阈值必须在"
                    + range.min().stripTrailingZeros().toPlainString() + "到"
                    + range.max().stripTrailingZeros().toPlainString() + "之间");
        }
        if (rule.getWarningLevel() == null || rule.getWarningLevel() < 1 || rule.getWarningLevel() > 3) {
            throw new BusinessException(400, "预警等级必须是黄色、橙色或红色");
        }
        if (rule.getEnabled() != null && rule.getEnabled() != 0 && rule.getEnabled() != 1) {
            throw new BusinessException(400, "启用状态只能是0或1");
        }
        if (rule.getDoctorId() != null && rule.getDoctorId() <= 0) {
            throw new BusinessException(400, "医生ID必须为正整数");
        }
    }

    private void createWarningFromRule(Long elderId, WarningRule rule, BigDecimal actualValue) {
        // 创建健康预警（通过WarningService自动触发SSE推送）
        HealthWarning warning = new HealthWarning();
        warning.setElderId(elderId);
        warning.setWarningType(rule.getRuleType());
        warning.setWarningLevel(rule.getWarningLevel());
        String title = rule.getWarningTemplate() != null ? rule.getWarningTemplate() : rule.getRuleName();
        warning.setWarningTitle(title);
        warning.setWarningContent("规则[" + rule.getRuleName() + "]触发: " + rule.getMetricCode() + "=" + actualValue + ", 条件: " + rule.getConditionExpr());
        warning.setWarningValue(actualValue.toString());
        warning.setThresholdValue(rule.getConditionExpr());
        warning.setCreateTime(LocalDateTime.now());
        warning.setUpdateTime(LocalDateTime.now());

        Long warningId = warningService.create(warning);

        // 写入时间轴
        TimelineEvent event = new TimelineEvent();
        event.setElderId(elderId);
        event.setEventType(4); // 预警
        event.setEventTitle("智能预警: " + title);
        event.setEventContent(warning.getWarningContent());
        event.setSourceType("warning");
        event.setSourceId(warningId);
        event.setEventTime(LocalDateTime.now());
        timelineService.addEvent(event);
    }

    private record MetricRange(String label, BigDecimal min, BigDecimal max) {
        private MetricRange(String label, String min, String max) {
            this(label, new BigDecimal(min), new BigDecimal(max));
        }
    }
}
