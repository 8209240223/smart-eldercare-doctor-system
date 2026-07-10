package com.medical.assistant.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class KimiAssistantConfig {

    @Bean("kimiAssistantRestTemplate")
    public RestTemplate kimiAssistantRestTemplate(RestTemplateBuilder builder,
                                                   KimiAssistantProperties properties) {
        return builder
                .setConnectTimeout(properties.getConnectTimeout())
                .setReadTimeout(properties.getReadTimeout())
                .build();
    }
}
