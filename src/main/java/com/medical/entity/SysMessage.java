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

    private Long senderUserId;

    /** 1指定用户 2指定角色 3全员 */
    private Integer audienceType;

    /** 1管理员 2医生 3护士 */
    private Integer audienceRole;

    private String title;

    private String content;

    /** 1预警通知 2随访提醒 3系统公告 4转诊通知 5协同消息 */
    private Integer msgType;

    private Integer isRead;

    private LocalDateTime readTime;

    private String sourceType;

    private Long sourceId;

    private String actionUrl;

    /** 1普通 2重要 3紧急 */
    private Integer priority;

    /** 0跳过 1待发送 2成功 3失败 */
    private Integer emailStatus;

    private LocalDateTime emailSentTime;

    private String emailError;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
