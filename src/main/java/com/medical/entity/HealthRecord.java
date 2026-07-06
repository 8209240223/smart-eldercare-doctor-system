package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 健康档案实体
 */
@Data
@TableName("health_record")
public class HealthRecord implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long elderId;

    private String recordNo;

    private String bloodType;

    private BigDecimal height;

    private BigDecimal weight;

    private String medicalHistory;

    private String familyHistory;

    private String allergyHistory;

    private String surgeryHistory;

    private String currentMedication;

    private String disabilityStatus;

    private Integer livingAbility;

    private Integer smokingStatus;

    private Integer drinkingStatus;

    private Integer exerciseFrequency;

    private Long createDoctorId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
