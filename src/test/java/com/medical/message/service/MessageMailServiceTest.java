package com.medical.message.service;

import com.medical.entity.SysMessage;
import com.medical.mapper.SysMessageMapper;
import com.medical.message.config.MessageNotificationProperties;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;

class MessageMailServiceTest {

    @Test
    void missingSmtpConfigurationSkipsMailWithoutFailure() {
        SysMessageMapper mapper = mock(SysMessageMapper.class);
        MessageNotificationProperties properties = new MessageNotificationProperties();
        MessageMailService service = new MessageMailService(mapper, properties);

        assertFalse(service.canSend("doctor@example.com"));
        service.sendAsync(10L, "doctor@example.com", "标题", "内容");

        verify(mapper, never()).updateById(any());
    }

    @Test
    void configuredSmtpRecordsSuccessfulDelivery() {
        SysMessageMapper mapper = mock(SysMessageMapper.class);
        MessageNotificationProperties properties = configuredProperties();
        MessageMailService service = spy(new MessageMailService(mapper, properties));
        JavaMailSenderImpl sender = mock(JavaMailSenderImpl.class);
        doReturn(sender).when(service).createSender(properties.getMail());
        doNothing().when(sender).send(any(SimpleMailMessage.class));

        service.sendAsync(11L, "doctor@example.com", "审核通知", "护理计划已提交");

        ArgumentCaptor<SysMessage> captor = ArgumentCaptor.forClass(SysMessage.class);
        verify(mapper).updateById(captor.capture());
        assertEquals(11L, captor.getValue().getId());
        assertEquals(MessageMailService.EMAIL_SENT, captor.getValue().getEmailStatus());
        assertNotNull(captor.getValue().getEmailSentTime());
    }

    @Test
    void smtpFailureIsRecordedAndDoesNotEscape() {
        SysMessageMapper mapper = mock(SysMessageMapper.class);
        MessageNotificationProperties properties = configuredProperties();
        MessageMailService service = spy(new MessageMailService(mapper, properties));
        JavaMailSenderImpl sender = mock(JavaMailSenderImpl.class);
        doReturn(sender).when(service).createSender(properties.getMail());
        doThrow(new MailSendException("SMTP不可用"))
                .when(sender).send(any(SimpleMailMessage.class));

        service.sendAsync(12L, "nurse@example.com", "协同通知", "请查看任务");

        ArgumentCaptor<SysMessage> captor = ArgumentCaptor.forClass(SysMessage.class);
        verify(mapper).updateById(captor.capture());
        assertEquals(MessageMailService.EMAIL_FAILED, captor.getValue().getEmailStatus());
        assertEquals("SMTP不可用", captor.getValue().getEmailError());
    }

    private MessageNotificationProperties configuredProperties() {
        MessageNotificationProperties properties = new MessageNotificationProperties();
        properties.getMail().setEnabled(true);
        properties.getMail().setHost("smtp.example.com");
        properties.getMail().setFrom("notify@example.com");
        return properties;
    }
}
