package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 预警规则配置实体
 */
@Data
@TableName("warning_rule")
public class WarningRule implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String ruleName;

    /** 规则类型: 1血压 2血糖 3心率 4体温 5BMI 6综合 */
    private Integer ruleType;

    /** 指标编码 */
    private String metricCode;

    /** 条件表达式 如 systolic>180 */
    private String conditionExpr;

    /** 触发预警等级 1黄 2橙 3红 */
    private Integer warningLevel;

    /** 预警消息模板 */
    private String warningTemplate;

    /** 是否启用 */
    private Integer enabled;

    /** 创建医生ID, NULL为全局规则 */
    private Long doctorId;

    private LocalDateTime createTime;
}
