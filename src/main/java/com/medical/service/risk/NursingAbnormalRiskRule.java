package com.medical.service.risk;

import com.medical.entity.ElderInfo;
import com.medical.entity.RiskRuleConfig;
import com.medical.mapper.RiskRuleConfigMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 护理异常风险规则
 * 近30天异常护理上报 >= 2，加10分
 */
@Component
public class NursingAbnormalRiskRule implements RiskRule {

    private final String RULE_CODE = "NURSING_ABNORMAL";
    private final int DEFAULT_SCORE = 10;

    @Autowired
    private RiskRuleConfigMapper riskRuleConfigMapper;

    @Override
    public String getRuleCode() {
        return RULE_CODE;
    }

    @Override
    public String getRuleName() {
        return "近30天护理异常>=2";
    }

    @Override
    public int calculate(ElderInfo elderInfo, RiskContext context) {
        if (!isEnabled()) {
            return 0;
        }

        Integer count = context.getNursingAbnormalCount();
        if (count != null && count >= 2) {
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