package com.medical.service.risk;

import com.medical.entity.ElderInfo;
import com.medical.entity.RiskRuleConfig;
import com.medical.mapper.RiskRuleConfigMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 体征异常趋势风险规则
 * 近30天体征异常记录次数 >= 3，加15分
 */
@Component
public class VitalSignAbnormalRiskRule implements RiskRule {

    private final String RULE_CODE = "VITAL_SIGN_ABNORMAL";
    private final int DEFAULT_SCORE = 15;

    @Autowired
    private RiskRuleConfigMapper riskRuleConfigMapper;

    @Override
    public String getRuleCode() {
        return RULE_CODE;
    }

    @Override
    public String getRuleName() {
        return "近30天体征异常>=3";
    }

    @Override
    public int calculate(ElderInfo elderInfo, RiskContext context) {
        if (!isEnabled()) {
            return 0;
        }

        Integer count = context.getVitalSignAbnormalCount();
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