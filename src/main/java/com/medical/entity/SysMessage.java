package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 系统消息
 */
@Data
@TableName("sys_message")
public class SysMessage implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String title;

    private String content;

    /** 1预警通知 2随访提醒 3系统公告 4转诊通知 */
    private Integer msgType;

    private Integer isRead;

    private String sourceType;

    private Long sourceId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
