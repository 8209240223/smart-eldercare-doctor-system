package com.medical.message.service;

import com.medical.entity.SysMessage;
import com.medical.mapper.SysMessageMapper;
import com.medical.message.config.MessageNotificationProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Properties;

@Slf4j
@Service
public class MessageMailService {

    public static final int EMAIL_SKIPPED = 0;
    public static final int EMAIL_PENDING = 1;
    public static final int EMAIL_SENT = 2;
    public static final int EMAIL_FAILED = 3;

    private final SysMessageMapper messageMapper;
    private final MessageNotificationProperties properties;

    public MessageMailService(SysMessageMapper messageMapper, MessageNotificationProperties properties) {
        this.messageMapper = messageMapper;
        this.properties = properties;
    }

    public boolean canSend(String recipientEmail) {
        MessageNotificationProperties.Mail mail = properties.getMail();
        return mail.isEnabled()
                && StringUtils.hasText(mail.getHost())
                && StringUtils.hasText(resolveFrom(mail))
                && StringUtils.hasText(recipientEmail);
    }

    @Async
    public void sendAsync(Long messageId, String recipientEmail, String title, String content) {
        if (messageId == null || !canSend(recipientEmail)) {
            return;
        }
        try {
            MessageNotificationProperties.Mail mail = properties.getMail();
            JavaMailSenderImpl sender = createSender(mail);
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(resolveFrom(mail));
            mailMessage.setTo(recipientEmail);
            mailMessage.setSubject(mail.getSubjectPrefix() + title);
            mailMessage.setText(content);
            sender.send(mailMessage);
            updateStatus(messageId, EMAIL_SENT, LocalDateTime.now(), null);
        } catch (Exception exception) {
            log.warn("站内消息邮件发送失败: messageId={}, error={}", messageId, exception.getMessage());
            updateStatus(messageId, EMAIL_FAILED, null, truncate(exception.getMessage()));
        }
    }

    JavaMailSenderImpl createSender(MessageNotificationProperties.Mail mail) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(mail.getHost());
        sender.setPort(mail.getPort());
        sender.setUsername(mail.getUsername());
        sender.setPassword(mail.getPassword());
        sender.setDefaultEncoding("UTF-8");
        Properties javaMailProperties = sender.getJavaMailProperties();
        javaMailProperties.put("mail.smtp.auth", String.valueOf(mail.isAuth()));
        javaMailProperties.put("mail.smtp.starttls.enable", String.valueOf(mail.isStartTls()));
        javaMailProperties.put("mail.smtp.connectiontimeout", String.valueOf(mail.getTimeoutMs()));
        javaMailProperties.put("mail.smtp.timeout", String.valueOf(mail.getTimeoutMs()));
        javaMailProperties.put("mail.smtp.writetimeout", String.valueOf(mail.getTimeoutMs()));
        return sender;
    }

    private String resolveFrom(MessageNotificationProperties.Mail mail) {
        return StringUtils.hasText(mail.getFrom()) ? mail.getFrom() : mail.getUsername();
    }

    private void updateStatus(Long messageId, int status, LocalDateTime sentTime, String error) {
        try {
            SysMessage update = new SysMessage();
            update.setId(messageId);
            update.setEmailStatus(status);
            update.setEmailSentTime(sentTime);
            update.setEmailError(error);
            messageMapper.updateById(update);
        } catch (Exception exception) {
            log.error("更新消息邮件状态失败: messageId={}, error={}", messageId, exception.getMessage());
        }
    }

    private String truncate(String value) {
        if (!StringUtils.hasText(value)) {
            return "邮件发送失败";
        }
        return value.length() <= 500 ? value : value.substring(0, 500);
    }
}
