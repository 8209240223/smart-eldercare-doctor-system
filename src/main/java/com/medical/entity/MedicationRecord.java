package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 用药记录
 */
@Data
@TableName("medication_record")
public class MedicationRecord implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long elderId;

    private String drugName;

    private String dosage;

    private String frequency;

    private String route;

    private LocalDate startDate;

    private LocalDate endDate;

    private String prescribeDoctor;

    private Integer status;

    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
