package com.medical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.entity.AssessmentRule;
import com.medical.mapper.AssessmentRuleMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 规则引擎 — 加载评估规则，逐条匹配上下文数据，去重后返回触发列表
 */
@Service
public class RuleEngineService {

    @Autowired
    private AssessmentRuleMapper ruleMapper;

    /**
     * 匹配结果
     */
    public static class TriggeredRule {
        public AssessmentRule rule;
        public String renderedFinding;   // 替换 {value} 后的发现文本
        public String renderedAdvice;    // 替换 {value} 后的建议文本
        public String indicator;         // 用于去重
        public int severity;

        public String getCategory() { return rule.getCategory(); }
    }

    /**
     * 执行规则匹配
     * @param ctx ContextAggregator 产出的上下文
     * @return 去重后的触发规则列表
     */
    public List<TriggeredRule> evaluate(Map<String, Object> ctx) {
        // 加载所有启用的规则
        List<AssessmentRule> rules = ruleMapper.selectList(
                new LambdaQueryWrapper<AssessmentRule>()
                        .eq(AssessmentRule::getEnabled, 1)
                        .orderByAsc(AssessmentRule::getCategory, AssessmentRule::getSortOrder));

        List<TriggeredRule> allTriggered = new ArrayList<>();

        for (AssessmentRule rule : rules) {
            BigDecimal value = resolveValue(rule, ctx);
            if (value == null) continue;

            // 附加条件检查
            if (rule.getExtraCondition() != null && !checkExtraCondition(rule.getExtraCondition(), ctx)) {
                continue;
            }

            // 比较运算
            if (!evaluateCondition(rule.getOperator(), value, rule.getThreshold())) {
                continue;
            }

            TriggeredRule tr = new TriggeredRule();
            tr.rule = rule;
            tr.indicator = rule.getIndicator();
            tr.severity = rule.getSeverity();
            tr.renderedFinding = render(rule.getFindingText(), value, ctx);
            tr.renderedAdvice = render(rule.getAdviceText(), value, ctx);
            allTriggered.add(tr);
        }

        // 同 indicator 去重：保留 severity 最高的
        Map<String, TriggeredRule> deduped = new LinkedHashMap<>();
        for (TriggeredRule tr : allTriggered) {
            String key = tr.indicator != null ? tr.indicator : tr.rule.getRuleCode();
            TriggeredRule existing = deduped.get(key);
            if (existing == null || tr.severity > existing.severity) {
                deduped.put(key, tr);
            }
        }

        return new ArrayList<>(deduped.values());
    }

    /**
     * 从上下文中解析指标值
     */
    private BigDecimal resolveValue(AssessmentRule rule, Map<String, Object> ctx) {
        String src = rule.getDataSource();
        String indicator = rule.getIndicator();

        if ("aggregate".equals(src)) {
            // 综合指标从 ctx 直接取
            Object val = ctx.get(indicator);
            if (val instanceof Integer) return BigDecimal.valueOf((Integer) val);
            if (val instanceof Long) return BigDecimal.valueOf((Long) val);
            if (val instanceof BigDecimal) return (BigDecimal) val;
            if (val instanceof Double) return BigDecimal.valueOf((Double) val);
            return null;
        }

        // physical_exam / vital_sign 指标
        Object val = ctx.get(indicator);
        if (val instanceof BigDecimal) return (BigDecimal) val;
        if (val instanceof Integer) return BigDecimal.valueOf((Integer) val);
        if (val instanceof Long) return BigDecimal.valueOf((Long) val);
        if (val instanceof Double) return BigDecimal.valueOf((Double) val);
        return null;
    }

    /**
     * 比较运算
     */
    private boolean evaluateCondition(String operator, BigDecimal value, BigDecimal threshold) {
        if (value == null || threshold == null) return false;
        int cmp = value.compareTo(threshold);
        switch (operator) {
            case ">=": return cmp >= 0;
            case ">":  return cmp > 0;
            case "<=": return cmp <= 0;
            case "<":  return cmp < 0;
            case "==": return cmp == 0;
            case "!=": return cmp != 0;
            default:   return false;
        }
    }

    /**
     * 附加条件检查（如 gender=1）
     */
    private boolean checkExtraCondition(String cond, Map<String, Object> ctx) {
        if (cond.startsWith("gender=")) {
            int expected = Integer.parseInt(cond.substring(7));
            Object actual = ctx.get("gender");
            return actual instanceof Integer && (Integer) actual == expected;
        }
        return true;
    }

    /**
     * 替换模板中的占位符
     */
    private String render(String template, BigDecimal value, Map<String, Object> ctx) {
        if (template == null) return "";
        String result = template;
        if (value != null) {
            // 格式化数值：整数显示整数，小数保留1位
            String formatted;
            if (value.stripTrailingZeros().scale() <= 0) {
                formatted = value.toBigInteger().toString();
            } else {
                formatted = value.setScale(1, java.math.RoundingMode.HALF_UP)
                        .stripTrailingZeros().toPlainString();
            }
            result = result.replace("{value}", formatted);
        }
        // 其他占位符替换
        for (Map.Entry<String, Object> entry : ctx.entrySet()) {
            if (entry.getValue() instanceof String) {
                result = result.replace("{" + entry.getKey() + "}", (String) entry.getValue());
            } else if (entry.getValue() instanceof Integer || entry.getValue() instanceof Long) {
                result = result.replace("{" + entry.getKey() + "}", entry.getValue().toString());
            }
        }
        return result;
    }
}
