package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 家族病史
 */
@Data
@TableName("family_history")
public class FamilyHistory implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long elderId;

    private String diseaseName;

    private String relationship;

    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
