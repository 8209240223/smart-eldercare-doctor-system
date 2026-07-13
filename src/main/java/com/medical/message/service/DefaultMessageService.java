package com.medical.message.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.SysMessage;
import com.medical.entity.SysUser;
import com.medical.mapper.SysMessageMapper;
import com.medical.mapper.SysUserMapper;
import com.medical.message.dto.DirectMessageRequest;
import com.medical.message.dto.MessageContentRequest;
import com.medical.message.dto.MessageRecipientView;
import com.medical.message.dto.MessageView;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class DefaultMessageService implements MessageService {

    private static final int AUDIENCE_USER = 1;
    private static final int AUDIENCE_ROLE = 2;
    private static final int AUDIENCE_ALL = 3;
    private static final int DEFAULT_COLLABORATION_TYPE = 5;
    private static final int DEFAULT_PRIORITY = 2;

    private final SysMessageMapper messageMapper;
    private final SysUserMapper userMapper;
    private final MessageSseService sseService;
    private final MessageMailService mailService;

    public DefaultMessageService(SysMessageMapper messageMapper,
                                 SysUserMapper userMapper,
                                 MessageSseService sseService,
                                 MessageMailService mailService) {
        this.messageMapper = messageMapper;
        this.userMapper = userMapper;
        this.sseService = sseService;
        this.mailService = mailService;
    }

    @Override
    @Transactional
    public MessageView sendToUser(Long senderUserId, DirectMessageRequest request) {
        SysUser sender = requireActiveUser(senderUserId, "发送账号不可用");
        SysUser recipient = requireActiveUser(request.getRecipientUserId(), "收件人不存在或账号已停用");
        return persistMessages(sender, List.of(recipient), AUDIENCE_USER, null, request).get(0);
    }

    @Override
    @Transactional
    public List<MessageView> broadcastToRole(Long senderUserId, Integer targetUserType, MessageContentRequest request) {
        SysUser sender = requireActiveUser(senderUserId, "发送账号不可用");
        requireAdmin(sender);
        validateUserType(targetUserType);
        List<SysUser> recipients = userMapper.selectList(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getStatus, 1)
                .eq(SysUser::getUserType, targetUserType)
                .orderByAsc(SysUser::getId));
        requireRecipients(recipients);
        return persistMessages(sender, recipients, AUDIENCE_ROLE, targetUserType, request);
    }

    @Override
    @Transactional
    public List<MessageView> broadcastToAll(Long senderUserId, MessageContentRequest request) {
        SysUser sender = requireActiveUser(senderUserId, "发送账号不可用");
        requireAdmin(sender);
        List<SysUser> recipients = userMapper.selectList(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getStatus, 1)
                .orderByAsc(SysUser::getId));
        requireRecipients(recipients);
        return persistMessages(sender, recipients, AUDIENCE_ALL, null, request);
    }

    @Override
    @Transactional
    public MessageView sendSystemNotification(Long recipientUserId,
                                              String title,
                                              String content,
                                              Integer msgType,
                                              Integer priority,
                                              String actionUrl) {
        SysUser recipient = userMapper.selectById(recipientUserId);
        if (recipient == null) {
            throw new BusinessException(404, "通知接收账号不存在");
        }
        MessageContentRequest request = new MessageContentRequest();
        request.setTitle(title);
        request.setContent(content);
        request.setMsgType(msgType);
        request.setPriority(priority);
        request.setActionUrl(actionUrl);
        return persistMessages(null, List.of(recipient), AUDIENCE_USER, null, request).get(0);
    }

    @Override
    public List<MessageRecipientView> listRecipients(Integer userType, String keyword) {
        if (userType != null) {
            validateUserType(userType);
        }
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getStatus, 1)
                .eq(userType != null, SysUser::getUserType, userType)
                .and(StringUtils.hasText(keyword), query -> query
                        .like(SysUser::getRealName, keyword.trim())
                        .or()
                        .like(SysUser::getUsername, keyword.trim()))
                .orderByAsc(SysUser::getUserType)
                .orderByAsc(SysUser::getRealName)
                .orderByAsc(SysUser::getId);
        return userMapper.selectList(wrapper).stream()
                .map(user -> new MessageRecipientView(user.getId(), user.getUsername(), user.getRealName(), user.getUserType()))
                .collect(Collectors.toList());
    }

    @Override
    public Page<MessageView> inbox(Long userId, int pageNum, int pageSize, Integer isRead, Integer msgType) {
        LambdaQueryWrapper<SysMessage> wrapper = new LambdaQueryWrapper<SysMessage>()
                .eq(SysMessage::getUserId, userId)
                .eq(isRead != null, SysMessage::getIsRead, isRead)
                .eq(msgType != null, SysMessage::getMsgType, msgType)
                .orderByDesc(SysMessage::getCreateTime)
                .orderByDesc(SysMessage::getId);
        return selectPage(pageNum, pageSize, wrapper);
    }

    @Override
    public Page<MessageView> sent(Long userId, int pageNum, int pageSize) {
        LambdaQueryWrapper<SysMessage> wrapper = new LambdaQueryWrapper<SysMessage>()
                .eq(SysMessage::getSenderUserId, userId)
                .orderByDesc(SysMessage::getCreateTime)
                .orderByDesc(SysMessage::getId);
        return selectPage(pageNum, pageSize, wrapper);
    }

    @Override
    public long unreadCount(Long userId) {
        return messageMapper.selectCount(new LambdaQueryWrapper<SysMessage>()
                .eq(SysMessage::getUserId, userId)
                .eq(SysMessage::getIsRead, 0));
    }

    @Override
    public void markRead(Long userId, Long messageId) {
        SysMessage message = messageMapper.selectById(messageId);
        if (message == null || !Objects.equals(userId, message.getUserId())) {
            throw new BusinessException(404, "消息不存在");
        }
        if (Integer.valueOf(1).equals(message.getIsRead())) {
            return;
        }
        SysMessage update = new SysMessage();
        update.setId(messageId);
        update.setIsRead(1);
        update.setReadTime(LocalDateTime.now());
        messageMapper.updateById(update);
    }

    @Override
    public int markAllRead(Long userId) {
        SysMessage update = new SysMessage();
        update.setIsRead(1);
        update.setReadTime(LocalDateTime.now());
        return messageMapper.update(update, new LambdaQueryWrapper<SysMessage>()
                .eq(SysMessage::getUserId, userId)
                .eq(SysMessage::getIsRead, 0));
    }

    private List<MessageView> persistMessages(SysUser sender,
                                              List<SysUser> recipients,
                                              int audienceType,
                                              Integer audienceRole,
                                              MessageContentRequest request) {
        String title = request.getTitle().trim();
        String content = request.getContent().trim();
        String actionUrl = normalizeActionUrl(request.getActionUrl());
        int msgType = request.getMsgType() == null ? DEFAULT_COLLABORATION_TYPE : request.getMsgType();
        int priority = request.getPriority() == null ? DEFAULT_PRIORITY : request.getPriority();
        List<Delivery> deliveries = new ArrayList<>();
        List<MessageView> views = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (SysUser recipient : recipients) {
            SysMessage message = new SysMessage();
            message.setUserId(recipient.getId());
            message.setSenderUserId(sender == null ? null : sender.getId());
            message.setAudienceType(audienceType);
            message.setAudienceRole(audienceRole);
            message.setTitle(title);
            message.setContent(content);
            message.setMsgType(msgType);
            message.setIsRead(0);
            message.setSourceType("collaboration");
            message.setActionUrl(actionUrl);
            message.setPriority(priority);
            message.setEmailStatus(mailService.canSend(recipient.getEmail())
                    ? MessageMailService.EMAIL_PENDING
                    : MessageMailService.EMAIL_SKIPPED);
            message.setCreateTime(now);
            messageMapper.insert(message);

            MessageView view = MessageView.from(message, displayName(sender), displayName(recipient));
            views.add(view);
            deliveries.add(new Delivery(view, recipient.getEmail()));
        }

        runAfterCommit(() -> deliveries.forEach(delivery -> {
            MessageView view = delivery.view();
            sseService.sendToUser(view.getUserId(), view);
            if (Integer.valueOf(MessageMailService.EMAIL_PENDING).equals(view.getEmailStatus())) {
                mailService.sendAsync(view.getId(), delivery.recipientEmail(), view.getTitle(), buildMailContent(view));
            }
        }));
        return views;
    }

    private Page<MessageView> selectPage(int pageNum, int pageSize, LambdaQueryWrapper<SysMessage> wrapper) {
        int safePage = Math.max(1, pageNum);
        int safeSize = Math.max(1, Math.min(100, pageSize));
        Page<SysMessage> entityPage = messageMapper.selectPage(new Page<>(safePage, safeSize), wrapper);
        Map<Long, SysUser> users = resolveUsers(entityPage.getRecords());
        List<MessageView> records = entityPage.getRecords().stream()
                .map(message -> MessageView.from(
                        message,
                        displayName(users.get(message.getSenderUserId())),
                        displayName(users.get(message.getUserId()))))
                .collect(Collectors.toList());
        Page<MessageView> result = new Page<>(entityPage.getCurrent(), entityPage.getSize(), entityPage.getTotal());
        result.setRecords(records);
        return result;
    }

    private Map<Long, SysUser> resolveUsers(List<SysMessage> messages) {
        Set<Long> ids = messages.stream()
                .flatMap(message -> java.util.stream.Stream.of(message.getSenderUserId(), message.getUserId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }
        return userMapper.selectBatchIds(ids).stream()
                .collect(Collectors.toMap(SysUser::getId, Function.identity(), (left, right) -> left, LinkedHashMap::new));
    }

    private SysUser requireActiveUser(Long userId, String message) {
        if (userId == null) {
            throw new BusinessException(401, "未登录或Token无效");
        }
        SysUser user = userMapper.selectById(userId);
        if (user == null || !Integer.valueOf(1).equals(user.getStatus())) {
            throw new BusinessException(400, message);
        }
        return user;
    }

    private void requireRecipients(List<SysUser> recipients) {
        if (recipients == null || recipients.isEmpty()) {
            throw new BusinessException(400, "没有符合条件的正常收件账号");
        }
    }

    private void requireAdmin(SysUser sender) {
        if (!Integer.valueOf(1).equals(sender.getUserType())) {
            throw new BusinessException(403, "仅管理员可以发送角色广播或全员广播");
        }
    }

    private void validateUserType(Integer userType) {
        if (userType == null || userType < 1 || userType > 3) {
            throw new BusinessException(400, "目标角色不合法");
        }
    }

    private String normalizeActionUrl(String actionUrl) {
        if (!StringUtils.hasText(actionUrl)) {
            return null;
        }
        String value = actionUrl.trim();
        if (!value.startsWith("/") || value.startsWith("//")) {
            throw new BusinessException(400, "actionUrl只能使用站内相对地址");
        }
        return value;
    }

    private String displayName(SysUser user) {
        if (user == null) {
            return "系统";
        }
        return StringUtils.hasText(user.getRealName()) ? user.getRealName() : user.getUsername();
    }

    private String buildMailContent(MessageView view) {
        StringBuilder content = new StringBuilder();
        content.append("发送人：").append(view.getSenderName()).append('\n').append('\n');
        content.append(view.getContent());
        if (StringUtils.hasText(view.getActionUrl())) {
            content.append('\n').append('\n').append("请登录智慧医养系统查看：").append(view.getActionUrl());
        }
        return content.toString();
    }

    private void runAfterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()
                && TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
            return;
        }
        action.run();
    }

    private record Delivery(MessageView view, String recipientEmail) {
    }
}
