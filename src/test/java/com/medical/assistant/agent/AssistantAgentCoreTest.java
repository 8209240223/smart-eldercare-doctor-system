package com.medical.assistant.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.assistant.config.KimiAssistantProperties;
import com.medical.assistant.dto.AssistantActionResponse;
import com.medical.assistant.dto.AssistantChatRequest;
import com.medical.assistant.service.KimiClient;
import com.medical.assistant.tool.AssistantToolRegistry;
import com.medical.common.utils.RedisUtils;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.model.chat.response.ChatResponse;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AssistantAgentCoreTest {

    @Test
    void emitsStepDeltaAndDoneForFinalModelAnswer() {
        KimiClient kimiClient = mock(KimiClient.class);
        AssistantConversationMemoryService memory = mock(AssistantConversationMemoryService.class);
        AssistantToolRegistry tools = mock(AssistantToolRegistry.class);
        AssistantApprovalService approvals = mock(AssistantApprovalService.class);
        AssistantPermissionService permissions = mock(AssistantPermissionService.class);
        KimiAssistantProperties properties = new KimiAssistantProperties();
        when(memory.resolveConversationId(null)).thenReturn("conversation-1");
        when(memory.load(any(), any(), any())).thenReturn(List.of());
        when(tools.specificationsForRole(2)).thenReturn(List.of());
        when(kimiClient.chat(anyList(), anyList(), anyInt())).thenReturn(
                ChatResponse.builder().aiMessage(AiMessage.from("completed answer")).build());
        when(kimiClient.modelName()).thenReturn("kimi-for-coding");
        AssistantAgentService service = new AssistantAgentService(
                kimiClient, memory, tools, approvals, permissions, new ObjectMapper(), properties);
        AssistantChatRequest request = new AssistantChatRequest();
        request.setMessage("query status");
        List<String> events = new ArrayList<>();

        AssistantAgentResult result = service.run(request, 7L, 2, "Bearer jwt", "token-id",
                (type, payload) -> events.add(type));

        assertThat(result.answer()).isEqualTo("completed answer");
        assertThat(events).containsExactly("step", "delta", "done");
        verify(memory).appendExchange(7L, "conversation-1", "query status", "completed answer");
    }

    @Test
    void approvalTokenIsOneTimeAndIdempotent() {
        RedisUtils redisUtils = mock(RedisUtils.class);
        AssistantActionAuditService audit = mock(AssistantActionAuditService.class);
        KimiAssistantProperties properties = new KimiAssistantProperties();
        when(redisUtils.tryLock(any(), any(), anyLong())).thenReturn(true);
        AssistantApprovalService service = new AssistantApprovalService(
                redisUtils, new ObjectMapper(), audit, properties);
        AssistantExecutionContext context = new AssistantExecutionContext(
                7L, 2, "conversation-1", "Bearer jwt", "token-id");
        AssistantApprovalService.ApprovalRequest approval = service.issue(
                "execute_site_api", "{}",
                "POST report generation", context);
        AtomicInteger executions = new AtomicInteger();

        AssistantActionResponse first = service.consume(
                approval.token(), 7L, 2, pending -> executions.incrementAndGet());
        AssistantActionResponse replay = service.consume(
                approval.token(), 7L, 2, pending -> executions.incrementAndGet());

        assertThat(executions).hasValue(1);
        assertThat(first.isReplayed()).isFalse();
        assertThat(replay.isReplayed()).isTrue();
        verify(audit).record(any(), any(), any(), anyLong());
    }
}
