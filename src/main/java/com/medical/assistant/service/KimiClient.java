package com.medical.assistant.service;

import com.medical.assistant.config.KimiAssistantProperties;
import com.medical.common.exception.BusinessException;
import dev.langchain4j.agent.tool.ToolSpecification;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.exception.AuthenticationException;
import dev.langchain4j.exception.RateLimitException;
import dev.langchain4j.exception.TimeoutException;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.request.ChatRequest;
import dev.langchain4j.model.chat.request.ResponseFormat;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.function.Consumer;

@Service
public class KimiClient {

    private final ChatModel chatModel;
    private final StreamingChatModel streamingChatModel;
    private final KimiAssistantProperties properties;

    public KimiClient(@Qualifier("kimiChatModel") ChatModel chatModel,
                      @Qualifier("kimiStreamingChatModel") StreamingChatModel streamingChatModel,
                      KimiAssistantProperties properties) {
        this.chatModel = chatModel;
        this.streamingChatModel = streamingChatModel;
        this.properties = properties;
    }

    public boolean isConfigured() {
        return StringUtils.hasText(properties.getApiKey());
    }

    public String modelName() {
        return properties.getModel();
    }

    public ChatResponse chat(List<ChatMessage> messages,
                             List<ToolSpecification> tools,
                             int maxOutputTokens) {
        ensureConfigured();
        ChatRequest.Builder builder = ChatRequest.builder()
                .messages(messages)
                .maxOutputTokens(maxOutputTokens)
                .temperature(1.0);
        if (tools != null && !tools.isEmpty()) {
            builder.toolSpecifications(tools);
        }
        return invoke(builder.build());
    }

    public ChatResponse streamChat(List<ChatMessage> messages,
                                   List<ToolSpecification> tools,
                                   int maxOutputTokens,
                                   Consumer<String> onDelta) {
        ensureConfigured();
        ChatRequest.Builder builder = ChatRequest.builder()
                .messages(messages)
                .maxOutputTokens(maxOutputTokens)
                .temperature(1.0);
        if (tools != null && !tools.isEmpty()) {
            builder.toolSpecifications(tools);
        }

        CompletableFuture<ChatResponse> future = new CompletableFuture<>();
        try {
            streamingChatModel.chat(builder.build(), new StreamingChatResponseHandler() {
                @Override
                public void onPartialResponse(String partialResponse) {
                    if (StringUtils.hasText(partialResponse) && onDelta != null) {
                        onDelta.accept(partialResponse);
                    }
                }

                @Override
                public void onCompleteResponse(ChatResponse completeResponse) {
                    future.complete(completeResponse);
                }

                @Override
                public void onError(Throwable error) {
                    future.completeExceptionally(error);
                }
            });
            return future.join();
        } catch (CompletionException exception) {
            throw mapException(exception.getCause());
        } catch (RuntimeException exception) {
            throw mapException(exception);
        }
    }

    public String generateJson(String systemPrompt, String userPrompt, int maxOutputTokens) {
        ensureConfigured();
        ChatRequest request = ChatRequest.builder()
                .messages(SystemMessage.from(systemPrompt), UserMessage.from(userPrompt))
                .maxOutputTokens(maxOutputTokens)
                .temperature(1.0)
                .responseFormat(ResponseFormat.JSON)
                .build();
        ChatResponse response = invoke(request);
        String content = response.aiMessage() == null ? null : response.aiMessage().text();
        if (!StringUtils.hasText(content)) {
            throw new BusinessException(502, "Kimi 未返回有效的结构化内容");
        }
        return content.trim();
    }

    private ChatResponse invoke(ChatRequest request) {
        try {
            return chatModel.chat(request);
        } catch (RuntimeException exception) {
            throw mapException(exception);
        }
    }

    private BusinessException mapException(Throwable error) {
        Throwable cause = error;
        while ((cause instanceof CompletionException || cause instanceof java.util.concurrent.ExecutionException)
                && cause.getCause() != null) {
            cause = cause.getCause();
        }
        if (cause instanceof BusinessException businessException) {
            return businessException;
        }
        if (cause instanceof AuthenticationException) {
            return new BusinessException(502, "Kimi 认证失败，请检查服务端密钥");
        }
        if (cause instanceof RateLimitException) {
            return new BusinessException(429, "Kimi 当前请求较多，请稍后重试");
        }
        if (cause instanceof TimeoutException) {
            return new BusinessException(504, "Kimi 响应超时，请稍后重试");
        }
        return new BusinessException(502, "Kimi 服务暂时不可用，请稍后重试");
    }

    private void ensureConfigured() {
        if (!isConfigured()) {
            throw new BusinessException(503, "AI 服务尚未配置，请设置 KIMI_API_KEY");
        }
    }
}
