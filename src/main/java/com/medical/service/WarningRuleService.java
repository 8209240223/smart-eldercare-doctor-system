package com.medical.service;

import com.medical.entity.WarningRule;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 预警规则服务接口
 */
public interface WarningRuleService {

    List<WarningRule> listRules(Long doctorId);

    WarningRule createRule(WarningRule rule);

    void updateRule(Long id, WarningRule rule);

    void deleteRule(Long id);

    void toggleRule(Long id, Integer enabled);

    /**
     * 核心方法：评估体征数据，触发匹配的预警规则
     * @param elderId 患者ID
     * @param vitalData 体征数据 key=metricCode, value=数值
     * @return 触发的预警数量
     */
    int evaluateVitalSigns(Long elderId, Map<String, BigDecimal> vitalData);
}
