package com.medical.service.risk;

import com.medical.entity.ElderInfo;
import com.medical.entity.RiskRuleConfig;
import com.medical.mapper.RiskRuleConfigMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 随访逾期风险规则
 * 超过计划随访日期7天未随访，加20分
 */
@Component
public class FollowupOverdueRiskRule implements RiskRule {

    private final String RULE_CODE = "FOLLOWUP_OVERDUE";
    private final int DEFAULT_SCORE = 20;

    @Autowired
    private RiskRuleConfigMapper riskRuleConfigMapper;

    @Override
    public String getRuleCode() {
        return RULE_CODE;
    }

    @Override
    public String getRuleName() {
        return "随访逾期超过7天";
    }

    @Override
    public int calculate(ElderInfo elderInfo, RiskContext context) {
        if (!isEnabled()) {
            return 0;
        }

        Integer days = context.getFollowupOverdueDays();
        if (days != null && days >= 7) {
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