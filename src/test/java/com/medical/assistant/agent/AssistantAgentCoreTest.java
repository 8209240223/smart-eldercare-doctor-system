package com.medical.assistant.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.assistant.config.KimiAssistantProperties;
import com.medical.assistant.dto.AssistantActionResponse;
import com.medical.assistant.dto.AssistantChatRequest;
import com.medical.assistant.service.KimiClient;
import com.medical.assistant.tool.AssistantToolHandlingResult;
import com.medical.assistant.tool.AssistantToolRegistry;
import com.medical.common.utils.RedisUtils;
import dev.langchain4j.agent.tool.ToolExecutionRequest;
import dev.langchain4j.agent.tool.ToolSpecification;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AssistantAgentCoreTest {

    @Test
    void emitsOnlyDeltaAndDoneForOrdinaryFinalAnswer() {
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
                kimiClient, memory, tools, new AssistantRequestModeResolver(), approvals,
                permissions, new ObjectMapper(), properties);
        AssistantChatRequest request = new AssistantChatRequest();
        request.setMessage("query status");
        List<String> events = new ArrayList<>();

        AssistantAgentResult result = service.run(request, 7L, 2, "Bearer jwt", "token-id",
                (type, payload) -> events.add(type));

        assertThat(result.answer()).isEqualTo("completed answer");
        assertThat(events).containsExactly("delta", "done");
        verify(memory).appendExchange(7L, "conversation-1", "query status", "completed answer");
    }

    @Test
    void answersOrdinaryQuestionsDirectlyEvenWhenAgentToolsAreAvailable() {
        KimiClient kimiClient = mock(KimiClient.class);
        AssistantConversationMemoryService memory = mock(AssistantConversationMemoryService.class);
        AssistantToolRegistry tools = mock(AssistantToolRegistry.class);
        AssistantApprovalService approvals = mock(AssistantApprovalService.class);
        AssistantPermissionService permissions = mock(AssistantPermissionService.class);
        KimiAssistantProperties properties = new KimiAssistantProperties();
        when(memory.resolveConversationId(null)).thenReturn("conversation-ordinary");
        when(memory.load(any(), any(), any())).thenReturn(List.of());
        when(tools.specificationsForRole(2)).thenReturn(List.of(mock(ToolSpecification.class)));
        when(kimiClient.chat(anyList(), anyList(), anyInt())).thenAnswer(invocation -> {
            List<ChatMessage> messages = invocation.getArgument(0);
            List<ToolSpecification> availableTools = invocation.getArgument(1);
            assertThat(((SystemMessage) messages.get(0)).text())
                    .contains("普通问答与站内 Agent 两种能力")
                    .contains("不依赖实时站内数据的问题，必须直接回答");
            assertThat(availableTools).isEmpty();
            return ChatResponse.builder()
                    .aiMessage(AiMessage.from("高血压老人应控制盐摄入，并按医嘱规律监测血压。"))
                    .build();
        });
        when(kimiClient.modelName()).thenReturn("kimi-for-coding");
        AssistantAgentService service = new AssistantAgentService(
                kimiClient, memory, tools, new AssistantRequestModeResolver(), approvals,
                permissions, new ObjectMapper(), properties);
        AssistantChatRequest request = new AssistantChatRequest();
        request.setMessage("高血压老人日常饮食要注意什么？");

        AssistantAgentResult result = service.run(
                request, 7L, 2, "Bearer jwt", "token-id", AssistantEventSink.NOOP);

        assertThat(result.answer()).contains("控制盐摄入");
        assertThat(result.awaitingApproval()).isFalse();
        verify(tools, never()).specificationsForRole(anyInt());
        verify(tools, never()).handle(any(), any());
    }

    @Test
    void emitsAgentStepsOnlyWhenTheModelActuallyCallsAWebsiteTool() {
        KimiClient kimiClient = mock(KimiClient.class);
        AssistantConversationMemoryService memory = mock(AssistantConversationMemoryService.class);
        AssistantToolRegistry tools = mock(AssistantToolRegistry.class);
        AssistantApprovalService approvals = mock(AssistantApprovalService.class);
        AssistantPermissionService permissions = mock(AssistantPermissionService.class);
        KimiAssistantProperties properties = new KimiAssistantProperties();
        ToolExecutionRequest toolRequest = ToolExecutionRequest.builder()
                .id("tool-1")
                .name("query_site_api")
                .arguments("{\"method\":\"GET\",\"path\":\"/api/elders\"}")
                .build();
        when(memory.resolveConversationId(null)).thenReturn("conversation-agent");
        when(memory.load(any(), any(), any())).thenReturn(List.of());
        when(tools.specificationsForRole(2)).thenReturn(List.of(mock(ToolSpecification.class)));
        when(kimiClient.chat(anyList(), anyList(), anyInt())).thenReturn(
                ChatResponse.builder().aiMessage(AiMessage.from(toolRequest)).build(),
                ChatResponse.builder().aiMessage(AiMessage.from("当前可见老人档案共 26 条。")).build());
        when(tools.handle(any(), any())).thenReturn(
                new AssistantToolHandlingResult("{\"total\":26}", null));
        when(kimiClient.modelName()).thenReturn("kimi-for-coding");
        AssistantAgentService service = new AssistantAgentService(
                kimiClient, memory, tools, new AssistantRequestModeResolver(), approvals,
                permissions, new ObjectMapper(), properties);
        AssistantChatRequest request = new AssistantChatRequest();
        request.setMessage("查询当前系统老人档案总数");
        List<String> events = new ArrayList<>();

        AssistantAgentResult result = service.run(request, 7L, 2, "Bearer jwt", "token-id",
                (type, payload) -> events.add(type));

        assertThat(result.answer()).contains("26");
        assertThat(events).containsExactly("step", "tool", "tool_result", "delta", "done");
        verify(tools).handle(any(), any());
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
