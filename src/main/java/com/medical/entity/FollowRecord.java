package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.NotBlank;

/**
 * 随访记录实体
 */
@Data
@TableName("follow_record")
public class FollowRecord implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    @NotNull(message = "随访计划不能为空")
    private Long planId;

    @NotNull(message = "老人ID不能为空")
    private Long elderId;

    private Long doctorId;

    private LocalDateTime followDate;

    @NotNull(message = "随访方式不能为空")
    private Integer followType;

    private Integer diseaseType;

    private String symptomDesc;

    private Integer systolicPressure;

    private Integer diastolicPressure;

    private Integer heartRate;

    private BigDecimal bloodSugarFasting;

    private BigDecimal weight;

    private Integer medicationCompliance;

    private String currentMedication;

    @NotBlank(message = "随访结论不能为空")
    private String followResult;

    private LocalDate nextFollowDate;

    private Integer isOverdue;

    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
