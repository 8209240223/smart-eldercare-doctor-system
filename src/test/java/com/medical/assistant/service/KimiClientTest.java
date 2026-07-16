package com.medical.assistant.service;

import com.medical.assistant.config.KimiAssistantProperties;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.request.ChatRequest;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class KimiClientTest {

    @Test
    void codingModelRequestsUseRequiredTemperatureForChatAndStreaming() {
        ChatModel chatModel = mock(ChatModel.class);
        StreamingChatModel streamingChatModel = mock(StreamingChatModel.class);
        KimiAssistantProperties properties = new KimiAssistantProperties();
        properties.setApiKey("test-key");
        ChatResponse response = ChatResponse.builder().aiMessage(AiMessage.from("ok")).build();
        when(chatModel.chat(any(ChatRequest.class))).thenReturn(response);
        doAnswer(invocation -> {
            StreamingChatResponseHandler handler = invocation.getArgument(1);
            handler.onPartialResponse("ok");
            handler.onCompleteResponse(response);
            return null;
        }).when(streamingChatModel).chat(any(ChatRequest.class), any(StreamingChatResponseHandler.class));
        KimiClient client = new KimiClient(chatModel, streamingChatModel, properties);

        client.chat(List.of(UserMessage.from("hello")), List.of(), 64);
        List<String> deltas = new ArrayList<>();
        client.streamChat(List.of(UserMessage.from("hello")), List.of(), 64, deltas::add);

        ArgumentCaptor<ChatRequest> chatRequest = ArgumentCaptor.forClass(ChatRequest.class);
        verify(chatModel).chat(chatRequest.capture());
        ArgumentCaptor<ChatRequest> streamRequest = ArgumentCaptor.forClass(ChatRequest.class);
        verify(streamingChatModel).chat(streamRequest.capture(), any(StreamingChatResponseHandler.class));
        assertThat(chatRequest.getValue().temperature()).isEqualTo(1.0);
        assertThat(streamRequest.getValue().temperature()).isEqualTo(1.0);
        assertThat(deltas).containsExactly("ok");
    }
}
