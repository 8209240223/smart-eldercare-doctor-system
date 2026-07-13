package com.medical.assistant.tool;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.assistant.agent.AssistantExecutionContext;
import com.medical.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class AssistantInternalApiInvokerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void callsOnlyWhitelistedLocalApiWithOriginalCredentials() throws Exception {
        AssistantInternalApiInvoker invoker = new AssistantInternalApiInvoker(
                new RestTemplateBuilder(), objectMapper, 8080);
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(invoker, "restTemplate");
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        server.expect(requestTo("http://127.0.0.1:8080/api/elders/9?detail=true"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("Authorization", "Bearer jwt-value"))
                .andExpect(header("X-Token-Id", "token-id"))
                .andRespond(withSuccess("""
                        {"code":200,"data":{"id":9,"idCard":"110101194611210038","phone":"13812345678"}}
                        """, MediaType.APPLICATION_JSON));
        JsonNode arguments = objectMapper.createObjectNode()
                .put("method", "GET")
                .put("path", "/api/elders/9")
                .put("queryJson", objectMapper.writeValueAsString(Map.of("detail", true)));
        AssistantExecutionContext context = new AssistantExecutionContext(
                7L, 2, "conversation", "Bearer jwt-value", "token-id");

        JsonNode result = (JsonNode) invoker.invoke(context, arguments, false);

        assertThat(result.path("data").path("id").asLong()).isEqualTo(9L);
        assertThat(result.path("data").path("idCard").asText()).doesNotContain("194611210038");
        assertThat(result.path("data").path("phone").asText()).isEqualTo("138****5678");
        server.verify();
    }

    @Test
    void rejectsArbitraryUrlAndRoleEscalation() throws Exception {
        AssistantInternalApiInvoker invoker = new AssistantInternalApiInvoker(
                new RestTemplateBuilder(), objectMapper, 8080);
        AssistantExecutionContext doctor = new AssistantExecutionContext(
                7L, 2, "conversation", "Bearer jwt-value", "token-id");

        JsonNode externalUrl = objectMapper.createObjectNode()
                .put("method", "GET")
                .put("path", "https://example.com/api/elders");
        JsonNode adminApi = objectMapper.createObjectNode()
                .put("method", "GET")
                .put("path", "/api/admin/users");

        assertThatThrownBy(() -> invoker.invoke(doctor, externalUrl, false))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Invalid internal API path");
        assertThatThrownBy(() -> invoker.invoke(doctor, adminApi, false))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Current role");
    }

    @Test
    void routePolicyLetsBackendMethodRolesDecideNurseModuleReadAccess() {
        AssistantInternalApiInvoker invoker = new AssistantInternalApiInvoker(
                new RestTemplateBuilder(), objectMapper, 8080);

        assertThat(invoker.isAllowedCapability("/api/nurse/plans", 2)).isTrue();
        assertThat(invoker.isAllowedCapability("/api/nurse/records", 2)).isTrue();
        assertThat(invoker.isAllowedCapability("/api/admin/users", 2)).isFalse();
        assertThat(invoker.isAllowedCapability("/api/admin/users", 3)).isFalse();
    }

    @Test
    void encodesChineseQueryParametersBeforeCallingSiteApi() throws Exception {
        AssistantInternalApiInvoker invoker = new AssistantInternalApiInvoker(
                new RestTemplateBuilder(), objectMapper, 8080);
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(invoker, "restTemplate");
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        server.expect(requestTo("http://127.0.0.1:8080/api/followup/plans?keyword=%E7%8E%8B%E5%BB%BA%E5%9B%BD"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {"code":200,"data":[]}
                        """, MediaType.APPLICATION_JSON));
        JsonNode arguments = objectMapper.createObjectNode()
                .put("method", "GET")
                .put("path", "/api/followup/plans")
                .put("queryJson", objectMapper.writeValueAsString(Map.of("keyword", "王建国")));
        AssistantExecutionContext context = new AssistantExecutionContext(
                7L, 2, "conversation", "Bearer jwt-value", "token-id");

        invoker.invoke(context, arguments, false);

        server.verify();
    }
}
