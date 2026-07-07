package com.medical.service.risk;

import com.medical.entity.ElderInfo;
import com.medical.entity.RiskRuleConfig;
import com.medical.mapper.RiskRuleConfigMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.Period;

/**
 * 年龄风险规则
 * 年龄 >= 80岁，加15分
 */
@Component
public class AgeRiskRule implements RiskRule {

    private final String RULE_CODE = "AGE_OVER_80";
    private final int DEFAULT_SCORE = 15;

    @Autowired
    private RiskRuleConfigMapper riskRuleConfigMapper;

    @Override
    public String getRuleCode() {
        return RULE_CODE;
    }

    @Override
    public String getRuleName() {
        return "年龄>=80岁";
    }

    @Override
    public int calculate(ElderInfo elderInfo, RiskContext context) {
        if (!isEnabled()) {
            return 0;
        }

        Integer age = context.getAge();
        if (age == null && elderInfo.getBirthDate() != null) {
            age = Period.between(elderInfo.getBirthDate(), LocalDate.now()).getYears();
        }

        if (age != null && age >= 80) {
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