package com.medical.message.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.message.dto.DirectMessageRequest;
import com.medical.message.dto.MessageContentRequest;
import com.medical.message.dto.MessageRecipientView;
import com.medical.message.dto.MessageView;

import java.util.List;

public interface MessageService {
    MessageView sendToUser(Long senderUserId, DirectMessageRequest request);

    List<MessageView> broadcastToRole(Long senderUserId, Integer targetUserType, MessageContentRequest request);

    List<MessageView> broadcastToAll(Long senderUserId, MessageContentRequest request);

    MessageView sendSystemNotification(Long recipientUserId,
                                       String title,
                                       String content,
                                       Integer msgType,
                                       Integer priority,
                                       String actionUrl);

    List<MessageRecipientView> listRecipients(Integer userType, String keyword);

    Page<MessageView> inbox(Long userId, int pageNum, int pageSize, Integer isRead, Integer msgType);

    Page<MessageView> sent(Long userId, int pageNum, int pageSize);

    long unreadCount(Long userId);

    void markRead(Long userId, Long messageId);

    int markAllRead(Long userId);
}
