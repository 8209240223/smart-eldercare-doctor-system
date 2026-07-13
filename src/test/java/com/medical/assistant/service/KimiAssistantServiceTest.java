package com.medical.assistant.service;

import com.medical.assistant.agent.AssistantAgentResult;
import com.medical.assistant.agent.AssistantAgentService;
import com.medical.assistant.agent.AssistantEventSink;
import com.medical.assistant.dto.AssistantChatRequest;
import com.medical.assistant.dto.AssistantChatResponse;
import com.medical.assistant.dto.AssistantStatusResponse;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class KimiAssistantServiceTest {

    @Test
    void statusDoesNotExposeApiKey() {
        AssistantAgentService agentService = mock(AssistantAgentService.class);
        KimiClient kimiClient = mock(KimiClient.class);
        when(kimiClient.modelName()).thenReturn("kimi-for-coding");
        when(kimiClient.isConfigured()).thenReturn(true);

        AssistantStatusResponse status = new KimiAssistantService(agentService, kimiClient).status();

        assertThat(status.getModel()).isEqualTo("kimi-for-coding");
        assertThat(status.isConfigured()).isTrue();
    }

    @Test
    void chatPassesOriginalCredentialsToAgent() {
        AssistantAgentService agentService = mock(AssistantAgentService.class);
        KimiClient kimiClient = mock(KimiClient.class);
        AssistantChatRequest request = new AssistantChatRequest();
        request.setMessage("query elder status");
        when(kimiClient.modelName()).thenReturn("kimi-for-coding");
        when(agentService.run(eq(request), eq(7L), eq(2), eq("Bearer jwt"), eq("token-id"),
                any(AssistantEventSink.class)))
                .thenReturn(new AssistantAgentResult("done", "conversation-1", false));

        AssistantChatResponse response = new KimiAssistantService(agentService, kimiClient)
                .chat(request, 7L, 2, "Bearer jwt", "token-id");

        assertThat(response.getAnswer()).isEqualTo("done");
        assertThat(response.getConversationId()).isEqualTo("conversation-1");
        verify(agentService).run(eq(request), eq(7L), eq(2), eq("Bearer jwt"), eq("token-id"),
                any(AssistantEventSink.class));
    }
}
