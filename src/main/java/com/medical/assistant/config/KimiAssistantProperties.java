package com.medical.assistant.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@ConfigurationProperties(prefix = "assistant.kimi")
public class KimiAssistantProperties {

    private String apiKey = "";
    private String baseUrl = "https://api.kimi.com/coding/v1";
    private String model = "kimi-for-coding";
    private Duration connectTimeout = Duration.ofSeconds(10);
    private Duration readTimeout = Duration.ofSeconds(60);

    public String getApiKey() { return apiKey; }

    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getBaseUrl() { return baseUrl; }

    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public String getModel() { return model; }

    public void setModel(String model) { this.model = model; }

    public Duration getConnectTimeout() { return connectTimeout; }

    public void setConnectTimeout(Duration connectTimeout) { this.connectTimeout = connectTimeout; }

    public Duration getReadTimeout() { return readTimeout; }

    public void setReadTimeout(Duration readTimeout) { this.readTimeout = readTimeout; }
}
