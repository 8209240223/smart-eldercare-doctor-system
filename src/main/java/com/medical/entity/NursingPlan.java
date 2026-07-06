package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 护理计划实体
 */
@Data
@TableName("nursing_plan")
public class NursingPlan implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long elderId;

    private Long nurseId;

    private String planName;

    /** 计划类型:1基础护理 2康复护理 3专科护理 4心理护理 */
    private Integer planType;

    private LocalDate startDate;

    private LocalDate endDate;

    private String frequency;

    private String nursingGoal;

    private String nursingContent;

    /** 状态:0待执行 1进行中 2已完成 3已终止 */
    private Integer status;

    private Integer totalCount;

    private Integer completedCount;

    /** 效果评分:1-5 */
    private Integer effectScore;

    /** 医生审核:0待审核 1通过 2驳回 */
    private Integer doctorApproval;

    private String remark;

    @TableLogic
    private Integer deleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
