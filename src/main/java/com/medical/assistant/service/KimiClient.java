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
import dev.langchain4j.model.chat.request.ChatRequest;
import dev.langchain4j.model.chat.request.ResponseFormat;
import dev.langchain4j.model.chat.response.ChatResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class KimiClient {

    private final ChatModel chatModel;
    private final KimiAssistantProperties properties;

    public KimiClient(@Qualifier("kimiChatModel") ChatModel chatModel,
                      KimiAssistantProperties properties) {
        this.chatModel = chatModel;
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
        } catch (AuthenticationException exception) {
            throw new BusinessException(502, "Kimi 认证失败，请检查服务端密钥");
        } catch (RateLimitException exception) {
            throw new BusinessException(429, "Kimi 当前请求较多，请稍后重试");
        } catch (TimeoutException exception) {
            throw new BusinessException(504, "Kimi 响应超时，请稍后重试");
        } catch (BusinessException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            throw new BusinessException(502, "Kimi 服务暂时不可用，请稍后重试");
        }
    }

    private void ensureConfigured() {
        if (!isConfigured()) {
            throw new BusinessException(503, "AI 服务尚未配置，请设置 KIMI_API_KEY");
        }
    }
}
