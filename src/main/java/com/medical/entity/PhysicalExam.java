package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 体检记录实体
 */
@Data
@TableName("physical_exam")
public class PhysicalExam implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long elderId;

    private Long doctorId;

    private LocalDate examDate;

    private BigDecimal height;

    private BigDecimal weight;

    private Integer systolicPressure;

    private Integer diastolicPressure;

    private Integer heartRate;

    private BigDecimal bloodSugarFasting;

    private BigDecimal bloodSugarRandom;

    private BigDecimal temperature;

    private BigDecimal bloodOxygen;

    private BigDecimal waistline;

    private BigDecimal bmi;

    private String examSummary;

    private String doctorAdvice;

    private Integer abnormalFlag;

    @TableLogic
    private Integer deleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
