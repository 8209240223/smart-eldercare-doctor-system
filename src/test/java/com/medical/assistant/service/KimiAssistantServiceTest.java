package com.medical.assistant.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.assistant.config.KimiAssistantProperties;
import com.medical.assistant.dto.AssistantChatRequest;
import com.medical.assistant.dto.AssistantChatResponse;
import com.medical.assistant.dto.AssistantHistoryMessage;
import com.medical.assistant.dto.AssistantStatusResponse;
import com.medical.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class KimiAssistantServiceTest {

    private static final String URL = "https://api.kimi.com/coding/v1/chat/completions";

    @Test
    void statusReportsConfigurationWithoutExposingApiKey() throws Exception {
        Fixture fixture = fixture("test-secret");

        AssistantStatusResponse status = fixture.service.status();
        String json = new ObjectMapper().writeValueAsString(status);

        assertThat(status.isConfigured()).isTrue();
        assertThat(status.getModel()).isEqualTo("kimi-for-coding");
        assertThat(json).doesNotContain("test-secret").doesNotContain("apiKey");
    }

    @Test
    void chatReturnsContentAndIgnoresReasoningContent() {
        Fixture fixture = fixture("test-secret");
        fixture.server.expect(once(), requestTo(URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer test-secret"))
                .andExpect(content().string(containsString("\"model\":\"kimi-for-coding\"")))
                .andExpect(content().string(containsString("medical_system_data")))
                .andExpect(content().string(containsString("follow_plan")))
                .andRespond(withSuccess(
                        "{\"choices\":[{\"message\":{\"reasoning_content\":\"internal\",\"content\":\"您好，我是乐奈猫。\"}}]}",
                        MediaType.APPLICATION_JSON));

        AssistantChatRequest request = new AssistantChatRequest();
        request.setMessage("你好");
        request.setHistory(List.of(new AssistantHistoryMessage("assistant", "您好")));

        AssistantChatResponse response = fixture.service.chat(request, 2L, 2);

        assertThat(response.getAnswer()).isEqualTo("您好，我是乐奈猫。");
        assertThat(response.getAnswer()).doesNotContain("internal");
        assertThat(response.isConfigured()).isTrue();
        fixture.server.verify();
    }

    @Test
    void chatRejectsMoreThanTwelveHistoryMessagesBeforeCallingUpstream() {
        Fixture fixture = fixture("test-secret");
        AssistantChatRequest request = new AssistantChatRequest();
        request.setMessage("继续");
        List<AssistantHistoryMessage> history = new ArrayList<>();
        for (int i = 0; i < 13; i++) {
            history.add(new AssistantHistoryMessage("user", "消息" + i));
        }
        request.setHistory(history);

        assertThatThrownBy(() -> fixture.service.chat(request, 2L, 2))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("最多保留12条");
        fixture.server.verify();
    }

    @Test
    void chatMapsRateLimitToFriendlyError() {
        Fixture fixture = fixture("test-secret");
        fixture.server.expect(once(), requestTo(URL))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));
        AssistantChatRequest request = new AssistantChatRequest();
        request.setMessage("你好");

        assertThatThrownBy(() -> fixture.service.chat(request, 2L, 2))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("请求较多");
        fixture.server.verify();
    }

    @Test
    void chatReturnsHardPermissionDenialWithoutCallingUpstream() {
        Fixture fixture = fixture("test-secret");
        when(fixture.dataContextService.permissionDeniedAnswer("followup", 3))
                .thenReturn("permission denied");
        AssistantChatRequest request = new AssistantChatRequest();
        request.setMessage("followup");

        AssistantChatResponse response = fixture.service.chat(request, 6L, 3);

        assertThat(response.getAnswer()).isEqualTo("permission denied");
        fixture.server.verify();
    }

    private Fixture fixture(String apiKey) {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        KimiAssistantProperties properties = new KimiAssistantProperties();
        properties.setApiKey(apiKey);
        properties.setBaseUrl("https://api.kimi.com/coding/v1");
        properties.setModel("kimi-for-coding");
        AssistantDataContextService dataContextService = mock(AssistantDataContextService.class);
        when(dataContextService.buildContext(org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyInt()))
                .thenReturn("{\"queryType\":\"elder_full_record\",\"follow_plan\":[{\"id\":1}]}" );
        KimiAssistantService service = new KimiAssistantService(restTemplate, new ObjectMapper(), properties, dataContextService);
        return new Fixture(service, server, dataContextService);
    }

    private static class Fixture {
        private final KimiAssistantService service;
        private final MockRestServiceServer server;
        private final AssistantDataContextService dataContextService;

        private Fixture(KimiAssistantService service, MockRestServiceServer server,
                        AssistantDataContextService dataContextService) {
            this.service = service;
            this.server = server;
            this.dataContextService = dataContextService;
        }
    }
}
