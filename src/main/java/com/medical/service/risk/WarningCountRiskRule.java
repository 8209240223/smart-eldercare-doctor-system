package com.medical.service.risk;

import com.medical.entity.ElderInfo;
import com.medical.entity.RiskRuleConfig;
import com.medical.mapper.RiskRuleConfigMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 预警次数风险规则
 * 近30天预警次数 >= 3，加20分
 */
@Component
public class WarningCountRiskRule implements RiskRule {

    private final String RULE_CODE = "WARNING_COUNT_30";
    private final int DEFAULT_SCORE = 20;

    @Autowired
    private RiskRuleConfigMapper riskRuleConfigMapper;

    @Override
    public String getRuleCode() {
        return RULE_CODE;
    }

    @Override
    public String getRuleName() {
        return "近30天预警次数>=3";
    }

    @Override
    public int calculate(ElderInfo elderInfo, RiskContext context) {
        if (!isEnabled()) {
            return 0;
        }

        Integer count = context.getWarningCountIn30Days();
        if (count != null && count >= 3) {
            return getScore();
        }
        return 0;
    }

    @Override
    public int getScore() {
        RiskRuleConfig config = riskRuleConfigMapper.selectById(RULE_CODE);
        return config != null ? config.getScore() : DEFAULT_SCORE;
    }

    @Override
    public boolean isEnabled() {
        RiskRuleConfig config = riskRuleConfigMapper.selectById(RULE_CODE);
        return config == null || config.getEnabled() == 1;
    }
}