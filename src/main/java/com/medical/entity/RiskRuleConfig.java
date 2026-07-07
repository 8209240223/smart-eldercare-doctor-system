package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 风险评分规则配置实体
 */
@Data
@TableName("risk_rule_config")
public class RiskRuleConfig implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 规则编码
     */
    private String ruleCode;

    /**
     * 规则名称
     */
    private String ruleName;

    /**
     * 规则分值
     */
    private Integer score;

    /**
     * 触发条件表达式
     */
    private String conditionExpr;

    /**
     * 是否启用:0禁用 1启用
     */
    private Integer enabled;

    /**
     * 备注说明
     */
    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}