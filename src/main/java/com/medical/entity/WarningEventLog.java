package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 预警事件日志实体
 */
@Data
@TableName("warning_event_log")
public class WarningEventLog implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long warningId;

    /** 事件类型:1生成 2推送 3已读 4处理 5忽略 6超时 */
    private Integer eventType;

    private Long operatorId;

    private String operatorName;

    private String eventDetail;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
