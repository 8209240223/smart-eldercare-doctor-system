package com.medical.assistant.config;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.time.Duration;
import java.util.concurrent.Executor;

@Configuration
public class KimiAssistantConfig {

    @Bean("kimiChatModel")
    public ChatModel kimiChatModel(KimiAssistantProperties properties) {
        String apiKey = properties.getApiKey() == null || properties.getApiKey().isBlank()
                ? "not-configured"
                : properties.getApiKey().trim();
        Duration timeout = properties.getConnectTimeout().plus(properties.getReadTimeout());
        return OpenAiChatModel.builder()
                .apiKey(apiKey)
                .baseUrl(properties.getBaseUrl())
                .modelName(properties.getModel())
                .timeout(timeout)
                .maxRetries(Math.max(0, properties.getMaxRetries()))
                .temperature(1.0)
                .strictTools(false)
                .parallelToolCalls(false)
                .logRequests(false)
                .logResponses(false)
                .build();
    }

    @Bean("kimiStreamingChatModel")
    public StreamingChatModel kimiStreamingChatModel(KimiAssistantProperties properties) {
        String apiKey = properties.getApiKey() == null || properties.getApiKey().isBlank()
                ? "not-configured"
                : properties.getApiKey().trim();
        Duration timeout = properties.getConnectTimeout().plus(properties.getReadTimeout());
        return OpenAiStreamingChatModel.builder()
                .apiKey(apiKey)
                .baseUrl(properties.getBaseUrl())
                .modelName(properties.getModel())
                .timeout(timeout)
                .temperature(1.0)
                .strictTools(false)
                .parallelToolCalls(false)
                .logRequests(false)
                .logResponses(false)
                .build();
    }

    @Bean("assistantExecutor")
    public Executor assistantExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("assistant-agent-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(10);
        executor.initialize();
        return executor;
    }
}
