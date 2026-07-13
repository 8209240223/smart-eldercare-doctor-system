package com.medical.assistant.tool;

import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AssistantCapabilityServiceTest {

    @Test
    void chineseBusinessKeywordFindsEnglishFollowupQueryRoute() throws Exception {
        RequestMappingHandlerMapping handlerMapping = mock(RequestMappingHandlerMapping.class);
        AssistantInternalApiInvoker apiInvoker = mock(AssistantInternalApiInvoker.class);
        Method method = DemoFollowupController.class.getDeclaredMethod("listPlans");
        HandlerMethod handlerMethod = new HandlerMethod(new DemoFollowupController(), method);
        RequestMappingInfo mappingInfo = RequestMappingInfo
                .paths("/api/followup/plans")
                .methods(RequestMethod.GET)
                .build();
        when(handlerMapping.getHandlerMethods()).thenReturn(Map.of(mappingInfo, handlerMethod));
        when(apiInvoker.isAllowedCapability(anyString(), eq(2))).thenReturn(true);
        AssistantCapabilityService service = new AssistantCapabilityService(handlerMapping, apiInvoker);

        List<Map<String, Object>> capabilities = service.search(2, "随访计划");

        assertThat(capabilities).singleElement().satisfies(capability -> {
            assertThat(capability.get("method")).isEqualTo("GET");
            assertThat(capability.get("path")).isEqualTo("/api/followup/plans");
        });
    }

    @Test
    void capabilityIncludesInheritedRequestBodyFields() throws Exception {
        RequestMappingHandlerMapping handlerMapping = mock(RequestMappingHandlerMapping.class);
        AssistantInternalApiInvoker apiInvoker = mock(AssistantInternalApiInvoker.class);
        Method method = DemoMessageController.class.getDeclaredMethod("send", ChildMessageRequest.class);
        HandlerMethod handlerMethod = new HandlerMethod(new DemoMessageController(), method);
        RequestMappingInfo mappingInfo = RequestMappingInfo
                .paths("/api/messages/send")
                .methods(RequestMethod.POST)
                .build();
        when(handlerMapping.getHandlerMethods()).thenReturn(Map.of(mappingInfo, handlerMethod));
        when(apiInvoker.isAllowedCapability(anyString(), eq(2))).thenReturn(true);
        AssistantCapabilityService service = new AssistantCapabilityService(handlerMapping, apiInvoker);

        List<Map<String, Object>> capabilities = service.search(2, "消息");

        assertThat(capabilities).singleElement().satisfies(capability -> {
            List<String> bodyFields = ((List<?>) capability.get("bodyFields")).stream()
                    .map(String::valueOf)
                    .toList();
            assertThat(bodyFields).contains("recipientUserId", "title", "content");
            Map<?, ?> bodySchema = (Map<?, ?>) capability.get("bodySchema");
            assertThat(String.valueOf(((Map<?, ?>) bodySchema.get("recipientUserId")).get("type")))
                    .isEqualTo("integer");
            assertThat(String.valueOf(((Map<?, ?>) bodySchema.get("title")).get("type")))
                    .isEqualTo("string");
        });
    }

    private static class DemoFollowupController {
        public Object listPlans() {
            return null;
        }
    }

    private static class DemoMessageController {
        public Object send(@RequestBody ChildMessageRequest request) {
            return request;
        }
    }

    private static class BaseMessageRequest {
        private String title;
        private String content;
    }

    private static class ChildMessageRequest extends BaseMessageRequest {
        private Long recipientUserId;
    }
}
