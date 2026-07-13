package com.medical.message.service;

import com.medical.common.exception.BusinessException;
import com.medical.entity.SysMessage;
import com.medical.entity.SysUser;
import com.medical.mapper.SysMessageMapper;
import com.medical.mapper.SysUserMapper;
import com.medical.message.dto.DirectMessageRequest;
import com.medical.message.dto.MessageContentRequest;
import com.medical.message.dto.MessageView;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DefaultMessageServiceTest {

    private final SysMessageMapper messageMapper = mock(SysMessageMapper.class);
    private final SysUserMapper userMapper = mock(SysUserMapper.class);
    private final MessageSseService sseService = mock(MessageSseService.class);
    private final MessageMailService mailService = mock(MessageMailService.class);
    private final DefaultMessageService service = new DefaultMessageService(
            messageMapper, userMapper, sseService, mailService);

    @AfterEach
    void clearTransactionState() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
        TransactionSynchronizationManager.setActualTransactionActive(false);
    }

    @Test
    void directMessagePersistsBeforeSseAndMailAfterCommit() {
        SysUser sender = user(2L, 2, "张医生", null, 1);
        SysUser recipient = user(3L, 3, "李护士", "nurse@example.com", 1);
        when(userMapper.selectById(2L)).thenReturn(sender);
        when(userMapper.selectById(3L)).thenReturn(recipient);
        when(mailService.canSend(recipient.getEmail())).thenReturn(true);
        when(messageMapper.insert(any(SysMessage.class))).thenAnswer(invocation -> {
            SysMessage message = invocation.getArgument(0);
            message.setId(101L);
            return 1;
        });

        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);
        DirectMessageRequest request = directRequest(3L);

        MessageView result = service.sendToUser(2L, request);

        assertEquals(101L, result.getId());
        assertEquals(3L, result.getUserId());
        assertEquals(2L, result.getSenderUserId());
        assertEquals(1, result.getAudienceType());
        assertEquals(5, result.getMsgType());
        assertEquals(2, result.getPriority());
        assertEquals("/nurse-records", result.getActionUrl());
        assertEquals(MessageMailService.EMAIL_PENDING, result.getEmailStatus());
        verify(messageMapper).insert(any(SysMessage.class));
        verify(sseService, never()).sendToUser(any(), any());
        verify(mailService, never()).sendAsync(any(), any(), any(), any());

        List<TransactionSynchronization> synchronizations = TransactionSynchronizationManager.getSynchronizations();
        assertEquals(1, synchronizations.size());
        synchronizations.forEach(TransactionSynchronization::afterCommit);

        InOrder order = inOrder(messageMapper, sseService, mailService);
        order.verify(messageMapper).insert(any(SysMessage.class));
        order.verify(sseService).sendToUser(3L, result);
        order.verify(mailService).sendAsync(101L, "nurse@example.com", "护理协同", "发送人：张医生\n\n请查看护理记录\n\n请登录智慧医养系统查看：/nurse-records");
    }

    @Test
    void disabledRecipientCannotReceiveDirectMessage() {
        when(userMapper.selectById(2L)).thenReturn(user(2L, 2, "张医生", null, 1));
        when(userMapper.selectById(3L)).thenReturn(user(3L, 3, "停用护士", null, 0));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.sendToUser(2L, directRequest(3L)));

        assertEquals(400, exception.getCode());
        assertEquals("收件人不存在或账号已停用", exception.getMessage());
        verify(messageMapper, never()).insert(any());
    }

    @Test
    void roleBroadcastCreatesIndependentInboxMessageForEveryActiveRecipient() {
        SysUser admin = user(1L, 1, "系统管理员", null, 1);
        SysUser doctorA = user(2L, 2, "张医生", null, 1);
        SysUser doctorB = user(4L, 2, "王医生", null, 1);
        when(userMapper.selectById(1L)).thenReturn(admin);
        when(userMapper.selectList(any())).thenReturn(List.of(doctorA, doctorB));
        when(mailService.canSend(any())).thenReturn(false);
        AtomicLong ids = new AtomicLong(200L);
        when(messageMapper.insert(any(SysMessage.class))).thenAnswer(invocation -> {
            SysMessage message = invocation.getArgument(0);
            message.setId(ids.incrementAndGet());
            return 1;
        });
        MessageContentRequest request = new MessageContentRequest();
        request.setTitle("系统维护通知");
        request.setContent("今晚进行系统维护");
        request.setPriority(3);

        List<MessageView> results = service.broadcastToRole(1L, 2, request);

        assertEquals(2, results.size());
        ArgumentCaptor<SysMessage> captor = ArgumentCaptor.forClass(SysMessage.class);
        verify(messageMapper, times(2)).insert(captor.capture());
        assertEquals(List.of(2L, 4L), captor.getAllValues().stream().map(SysMessage::getUserId).toList());
        captor.getAllValues().forEach(message -> {
            assertEquals(2, message.getAudienceType());
            assertEquals(2, message.getAudienceRole());
            assertEquals(0, message.getIsRead());
            assertEquals(3, message.getPriority());
            assertNotNull(message.getCreateTime());
        });
        verify(sseService).sendToUser(2L, results.get(0));
        verify(sseService).sendToUser(4L, results.get(1));
    }

    @Test
    void nonAdminCannotBroadcastEvenWhenServiceIsCalledDirectly() {
        when(userMapper.selectById(2L)).thenReturn(user(2L, 2, "张医生", null, 1));
        MessageContentRequest request = new MessageContentRequest();
        request.setTitle("广播测试");
        request.setContent("只有管理员可以广播");

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.broadcastToAll(2L, request));

        assertEquals(403, exception.getCode());
        verify(messageMapper, never()).insert(any());
    }

    @Test
    void userCannotMarkAnotherUsersMessageAsRead() {
        SysMessage message = new SysMessage();
        message.setId(88L);
        message.setUserId(3L);
        message.setIsRead(0);
        when(messageMapper.selectById(88L)).thenReturn(message);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.markRead(2L, 88L));

        assertEquals(404, exception.getCode());
        verify(messageMapper, never()).updateById(any());
    }

    @Test
    void externalActionUrlIsRejectedBeforePersistence() {
        when(userMapper.selectById(2L)).thenReturn(user(2L, 2, "张医生", null, 1));
        when(userMapper.selectById(3L)).thenReturn(user(3L, 3, "李护士", null, 1));
        DirectMessageRequest request = directRequest(3L);
        request.setActionUrl("https://example.com/phishing");

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.sendToUser(2L, request));

        assertEquals(400, exception.getCode());
        verify(messageMapper, never()).insert(any());
    }

    private DirectMessageRequest directRequest(Long recipientId) {
        DirectMessageRequest request = new DirectMessageRequest();
        request.setRecipientUserId(recipientId);
        request.setTitle("护理协同");
        request.setContent("请查看护理记录");
        request.setActionUrl("/nurse-records");
        return request;
    }

    private SysUser user(Long id, int userType, String realName, String email, int status) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setUsername("user" + id);
        user.setRealName(realName);
        user.setEmail(email);
        user.setUserType(userType);
        user.setStatus(status);
        return user;
    }
}
