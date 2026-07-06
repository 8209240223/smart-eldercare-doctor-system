package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * 随访干预记录实体
 */
@Data
@TableName("intervention_record")
public class InterventionRecord implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long followRecordId;

    @NotNull(message = "老人ID不能为空")
    private Long elderId;

    private Long doctorId;

    /** 干预类型 1药物干预 2非药物干预 3转诊处理 4健康教育 */
    @NotNull(message = "干预类型不能为空")
    private Integer interventionType;

    @NotBlank(message = "干预标题不能为空")
    private String interventionTitle;

    @NotBlank(message = "干预内容不能为空")
    private String interventionContent;

    private String medicationAdjust;

    private String lifestyleGuidance;

    private String healthEducation;

    /** 效果评价 1显著 2有效 3一般 4无效 */
    private Integer effectEvaluation;

    private String effectDesc;

    private String nextPlan;

    private LocalDateTime interventionDate;

    private Integer status;

    private Integer deleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
