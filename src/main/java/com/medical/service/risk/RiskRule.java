package com.medical.service.risk;

import com.medical.entity.ElderInfo;

/**
 * 风险评分规则接口
 * 策略模式实现，每个规则独立计算分值
 */
public interface RiskRule {

    /**
     * 获取规则编码
     */
    String getRuleCode();

    /**
     * 获取规则名称
     */
    String getRuleName();

    /**
     * 计算老人风险分值
     * @param elderInfo 老人基本信息
     * @param context 评分上下文(包含预警次数、随访情况等)
     * @return 风险分值，如果不符合规则则返回0
     */
    int calculate(ElderInfo elderInfo, RiskContext context);

    /**
     * 获取规则分值配置
     */
    int getScore();

    /**
     * 判断是否启用
     */
    boolean isEnabled();
}