package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 老人风险分层实体
 */
@Data
@TableName("elder_risk_profile")
public class ElderRiskProfile implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 老人ID
     */
    private Long elderId;

    /**
     * 风险评分(总分)
     */
    private Integer riskScore;

    /**
     * 风险等级:1普通 2关注 3重点 4高危
     */
    private Integer riskLevel;

    /**
     * 风险标签(逗号分隔)
     */
    private String riskTags;

    /**
     * 评分原因详情(JSON格式)
     */
    private String reasonJson;

    /**
     * 上次计算时间
     */
    private LocalDateTime lastCalculateTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}