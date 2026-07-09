package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 过敏记录
 */
@Data
@TableName("allergy_record")
public class AllergyRecord implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long elderId;

    private String allergen;

    /** 1药物 2食物 3环境 4其他 */
    private Integer allergyType;

    /** 1轻度 2中度 3重度 */
    private Integer severity;

    private String reaction;

    private LocalDate discoverDate;

    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
