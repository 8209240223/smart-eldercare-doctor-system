package com.medical.message.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "notification")
public class MessageNotificationProperties {

    private final Sse sse = new Sse();
    private final Mail mail = new Mail();

    @Data
    public static class Sse {
        private long timeoutMs = 1_800_000L;
    }

    @Data
    public static class Mail {
        private boolean enabled;
        private String host;
        private int port = 25;
        private String username;
        private String password;
        private String from;
        private boolean auth;
        private boolean startTls;
        private int timeoutMs = 5_000;
        private String subjectPrefix = "智慧医养通知：";
    }
}
