package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 健康评估记录实体
 */
@Data
@TableName("assessment_record")
public class AssessmentRecord implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long elderId;

    private Long doctorId;

    /** 评估类型: 1日常生活能力 2认知功能 3情绪/心理 4营养 5跌倒风险 6综合 */
    private Integer assessType;

    private LocalDate assessDate;

    private BigDecimal score;

    /** 评估等级 */
    private String level;

    /** 评估结果 */
    private String result;

    /** 建议 */
    private String suggestion;

    @TableLogic
    private Integer deleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
