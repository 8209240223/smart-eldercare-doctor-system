package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.entity.HealthWarning;
import com.medical.entity.TimelineEvent;
import com.medical.entity.WarningRule;
import com.medical.mapper.WarningRuleMapper;
import com.medical.service.TimelineService;
import com.medical.service.WarningRuleService;
import com.medical.service.WarningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class WarningRuleServiceImpl implements WarningRuleService {

    @Autowired
    private WarningRuleMapper warningRuleMapper;

    @Autowired
    private WarningService warningService;

    @Autowired
    private TimelineService timelineService;

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
        rule.setCreateTime(LocalDateTime.now());
        if (rule.getEnabled() == null) {
            rule.setEnabled(1);
        }
        warningRuleMapper.insert(rule);
        return rule;
    }

    @Override
    public void updateRule(Long id, WarningRule rule) {
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
        // 获取所有启用的规则
        LambdaQueryWrapper<WarningRule> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WarningRule::getEnabled, 1);
        List<WarningRule> rules = warningRuleMapper.selectList(wrapper);

        int triggeredCount = 0;
        for (WarningRule rule : rules) {
            String metricCode = rule.getMetricCode();
            if (metricCode == null || !vitalData.containsKey(metricCode)) {
                continue;
            }
            BigDecimal value = vitalData.get(metricCode);
            if (evaluateCondition(rule.getConditionExpr(), metricCode, value)) {
                // 触发预警
                createWarningFromRule(elderId, rule, value);
                triggeredCount++;
            }
        }
        return triggeredCount;
    }

    /**
     * 解析条件表达式并评估
     * 支持格式: metric>value, metric<value, metric>=value, metric<=value
     */
    private boolean evaluateCondition(String conditionExpr, String metricCode, BigDecimal value) {
        if (conditionExpr == null || conditionExpr.isEmpty()) {
            return false;
        }
        try {
            String expr = conditionExpr.trim();
            BigDecimal threshold;
            if (expr.contains(">=")) {
                threshold = new BigDecimal(expr.substring(expr.indexOf(">=") + 2).trim());
                return value.compareTo(threshold) >= 0;
            } else if (expr.contains("<=")) {
                threshold = new BigDecimal(expr.substring(expr.indexOf("<=") + 2).trim());
                return value.compareTo(threshold) <= 0;
            } else if (expr.contains(">")) {
                threshold = new BigDecimal(expr.substring(expr.indexOf(">") + 1).trim());
                return value.compareTo(threshold) > 0;
            } else if (expr.contains("<")) {
                threshold = new BigDecimal(expr.substring(expr.indexOf("<") + 1).trim());
                return value.compareTo(threshold) < 0;
            }
        } catch (Exception e) {
            // 条件解析失败，不触发
        }
        return false;
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
}
