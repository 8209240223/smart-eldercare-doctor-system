package com.medical.message.dto;

import com.medical.entity.SysMessage;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageView {
    private Long id;
    private Long userId;
    private String recipientName;
    private Long senderUserId;
    private String senderName;
    private Integer audienceType;
    private Integer audienceRole;
    private String title;
    private String content;
    private Integer msgType;
    private Integer isRead;
    private LocalDateTime readTime;
    private String sourceType;
    private Long sourceId;
    private String actionUrl;
    private Integer priority;
    private Integer emailStatus;
    private LocalDateTime emailSentTime;
    private String emailError;
    private LocalDateTime createTime;

    public static MessageView from(SysMessage message, String senderName, String recipientName) {
        MessageView view = new MessageView();
        view.setId(message.getId());
        view.setUserId(message.getUserId());
        view.setRecipientName(recipientName);
        view.setSenderUserId(message.getSenderUserId());
        view.setSenderName(senderName);
        view.setAudienceType(message.getAudienceType());
        view.setAudienceRole(message.getAudienceRole());
        view.setTitle(message.getTitle());
        view.setContent(message.getContent());
        view.setMsgType(message.getMsgType());
        view.setIsRead(message.getIsRead());
        view.setReadTime(message.getReadTime());
        view.setSourceType(message.getSourceType());
        view.setSourceId(message.getSourceId());
        view.setActionUrl(message.getActionUrl());
        view.setPriority(message.getPriority());
        view.setEmailStatus(message.getEmailStatus());
        view.setEmailSentTime(message.getEmailSentTime());
        view.setEmailError(message.getEmailError());
        view.setCreateTime(message.getCreateTime());
        return view;
    }
}
