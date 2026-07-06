package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 健康预警实体
 */
@Data
@TableName("health_warning")
public class HealthWarning implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long elderId;

    private Long doctorId;

    private Integer warningType;

    private Integer warningLevel;

    private String warningTitle;

    private String warningContent;

    private String warningValue;

    private String thresholdValue;

    private Integer status;

    private LocalDateTime handleTime;

    private String handleResult;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
