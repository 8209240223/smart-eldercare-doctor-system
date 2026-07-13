package com.medical.assistant.service;

import com.medical.assistant.agent.AssistantAgentResult;
import com.medical.assistant.agent.AssistantAgentService;
import com.medical.assistant.agent.AssistantEventSink;
import com.medical.assistant.dto.AssistantActionResponse;
import com.medical.assistant.dto.AssistantChatRequest;
import com.medical.assistant.dto.AssistantChatResponse;
import com.medical.assistant.dto.AssistantStatusResponse;
import org.springframework.stereotype.Service;

import java.util.function.Consumer;

@Service
public class KimiAssistantService {

    private final AssistantAgentService agentService;
    private final KimiClient kimiClient;

    public KimiAssistantService(AssistantAgentService agentService, KimiClient kimiClient) {
        this.agentService = agentService;
        this.kimiClient = kimiClient;
    }

    public AssistantStatusResponse status() {
        return new AssistantStatusResponse(kimiClient.modelName(), kimiClient.isConfigured());
    }

    public AssistantChatResponse chat(AssistantChatRequest request,
                                      Long currentUserId,
                                      Integer currentUserType,
                                      String authorization,
                                      String tokenId) {
        AssistantAgentResult result = agentService.run(
                request, currentUserId, currentUserType, authorization, tokenId, AssistantEventSink.NOOP);
        return new AssistantChatResponse(result.answer(), kimiClient.modelName(), true, result.conversationId());
    }

    public void streamChat(AssistantChatRequest request,
                           Long currentUserId,
                           Integer currentUserType,
                           String authorization,
                           String tokenId,
                           AssistantEventSink eventSink) {
        agentService.run(request, currentUserId, currentUserType, authorization, tokenId, eventSink);
    }

    public void streamChat(AssistantChatRequest request,
                           Long currentUserId,
                           Integer currentUserType,
                           Consumer<String> onDelta) {
        streamChat(request, currentUserId, currentUserType, null, null, (type, payload) -> {
            if ("delta".equals(type) && payload.get("content") instanceof String content) {
                onDelta.accept(content);
            }
        });
    }

    public AssistantActionResponse confirmAction(String token,
                                                 Long currentUserId,
                                                 Integer currentUserType,
                                                 String authorization,
                                                 String tokenId) {
        return agentService.confirmAction(token, currentUserId, currentUserType, authorization, tokenId);
    }

    public void cancelAction(String token, Long currentUserId, Integer currentUserType) {
        agentService.cancelAction(token, currentUserId, currentUserType);
    }
}
