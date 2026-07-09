package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 预警推送渠道配置实体
 */
@Data
@TableName("warning_push_channel")
public class WarningPushChannel implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long doctorId;

    /** 渠道类型:1页面推送 2声音提醒 3弹窗提醒 */
    private Integer channelType;

    /** 是否启用:0禁用 1启用 */
    private Integer enabled;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
