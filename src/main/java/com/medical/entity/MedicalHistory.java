package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 既往病史记录
 */
@Data
@TableName("medical_history")
public class MedicalHistory implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long elderId;

    private String diseaseName;

    private LocalDate diagnoseDate;

    private Integer isCured;

    private String treatment;

    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
