package com.medical.message.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class MessageSchemaInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public MessageSchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!tableExists()) {
            return;
        }

        Map<String, String> columns = new LinkedHashMap<>();
        columns.put("sender_user_id", "ALTER TABLE sys_message ADD COLUMN sender_user_id BIGINT DEFAULT NULL COMMENT '发送人用户ID' AFTER user_id");
        columns.put("audience_type", "ALTER TABLE sys_message ADD COLUMN audience_type TINYINT NOT NULL DEFAULT 1 COMMENT '目标类型:1指定用户 2指定角色 3全员' AFTER sender_user_id");
        columns.put("audience_role", "ALTER TABLE sys_message ADD COLUMN audience_role TINYINT DEFAULT NULL COMMENT '目标角色:1管理员 2医生 3护士' AFTER audience_type");
        columns.put("read_time", "ALTER TABLE sys_message ADD COLUMN read_time DATETIME DEFAULT NULL COMMENT '已读时间' AFTER is_read");
        columns.put("action_url", "ALTER TABLE sys_message ADD COLUMN action_url VARCHAR(500) DEFAULT NULL COMMENT '站内业务跳转地址' AFTER source_id");
        columns.put("priority", "ALTER TABLE sys_message ADD COLUMN priority TINYINT NOT NULL DEFAULT 2 COMMENT '优先级:1普通 2重要 3紧急' AFTER action_url");
        columns.put("email_status", "ALTER TABLE sys_message ADD COLUMN email_status TINYINT NOT NULL DEFAULT 0 COMMENT '邮件状态:0跳过 1待发送 2成功 3失败' AFTER priority");
        columns.put("email_sent_time", "ALTER TABLE sys_message ADD COLUMN email_sent_time DATETIME DEFAULT NULL COMMENT '邮件发送时间' AFTER email_status");
        columns.put("email_error", "ALTER TABLE sys_message ADD COLUMN email_error VARCHAR(500) DEFAULT NULL COMMENT '邮件发送失败原因' AFTER email_sent_time");
        columns.forEach(this::addColumnIfMissing);

        addIndexIfMissing("idx_message_sender", "ALTER TABLE sys_message ADD INDEX idx_message_sender (sender_user_id, create_time)");
        addIndexIfMissing("idx_message_inbox", "ALTER TABLE sys_message ADD INDEX idx_message_inbox (user_id, is_read, create_time)");
        addIndexIfMissing("idx_message_audience", "ALTER TABLE sys_message ADD INDEX idx_message_audience (audience_type, audience_role)");
    }

    private boolean tableExists() {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_message'",
                Integer.class);
        return count != null && count > 0;
    }

    private void addColumnIfMissing(String column, String ddl) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_message' AND COLUMN_NAME = ?",
                Integer.class,
                column);
        if (count == null || count == 0) {
            jdbcTemplate.execute(ddl);
        }
    }

    private void addIndexIfMissing(String index, String ddl) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sys_message' AND INDEX_NAME = ?",
                Integer.class,
                index);
        if (count == null || count == 0) {
            jdbcTemplate.execute(ddl);
        }
    }
}
