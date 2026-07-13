package com.medical.assistant.tool;

import com.medical.common.annotation.RequireRole;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.lang.reflect.Method;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.validation.constraints.Min;

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

    @Test
    void capabilityIncludesPathQueryAndModelAttributeParameters() throws Exception {
        RequestMappingHandlerMapping handlerMapping = mock(RequestMappingHandlerMapping.class);
        AssistantInternalApiInvoker apiInvoker = mock(AssistantInternalApiInvoker.class);
        Method method = DemoCapabilityController.class.getDeclaredMethod(
                "detail", Long.class, Integer.class, DemoFilter.class);
        HandlerMethod handlerMethod = new HandlerMethod(new DemoCapabilityController(), method);
        RequestMappingInfo mappingInfo = RequestMappingInfo
                .paths("/api/elders/{elderId}")
                .methods(RequestMethod.GET)
                .build();
        when(handlerMapping.getHandlerMethods()).thenReturn(Map.of(mappingInfo, handlerMethod));
        when(apiInvoker.isAllowedCapability(anyString(), eq(2))).thenReturn(true);
        AssistantCapabilityService service = new AssistantCapabilityService(handlerMapping, apiInvoker);

        List<Map<String, Object>> capabilities = service.search(2, "老人详情");

        assertThat(capabilities).singleElement().satisfies(capability -> {
            Map<?, ?> pathParameters = (Map<?, ?>) capability.get("pathParameters");
            Map<?, ?> elderId = (Map<?, ?>) pathParameters.get("elderId");
            assertThat(elderId.get("type")).isEqualTo("integer");
            assertThat(elderId.get("required")).isEqualTo(true);

            Map<?, ?> queryParameters = (Map<?, ?>) capability.get("queryParameters");
            Map<?, ?> pageNum = (Map<?, ?>) queryParameters.get("pageNum");
            assertThat(pageNum.get("defaultValue")).isEqualTo("1");
            assertThat(pageNum.get("minimum")).isEqualTo(1L);
            assertThat(queryParameters.keySet().stream().map(String::valueOf).toList())
                    .contains("name", "status");
        });
    }

    @Test
    void roleRestrictedCapabilitiesAreNotExposedToOtherRoles() throws Exception {
        RequestMappingHandlerMapping handlerMapping = mock(RequestMappingHandlerMapping.class);
        AssistantInternalApiInvoker apiInvoker = mock(AssistantInternalApiInvoker.class);
        Method method = DemoAdminController.class.getDeclaredMethod("listUsers");
        HandlerMethod handlerMethod = new HandlerMethod(new DemoAdminController(), method);
        RequestMappingInfo mappingInfo = RequestMappingInfo
                .paths("/api/admin/users")
                .methods(RequestMethod.GET)
                .build();
        when(handlerMapping.getHandlerMethods()).thenReturn(Map.of(mappingInfo, handlerMethod));
        when(apiInvoker.isAllowedCapability(anyString(), eq(1))).thenReturn(true);
        when(apiInvoker.isAllowedCapability(anyString(), eq(2))).thenReturn(true);
        AssistantCapabilityService service = new AssistantCapabilityService(handlerMapping, apiInvoker);

        assertThat(service.search(1, "用户")).hasSize(1);
        assertThat(service.search(2, "用户")).isEmpty();
    }

    @Test
    void blankSearchCanReturnMoreThanTheOldEightyEndpointLimit() throws Exception {
        RequestMappingHandlerMapping handlerMapping = mock(RequestMappingHandlerMapping.class);
        AssistantInternalApiInvoker apiInvoker = mock(AssistantInternalApiInvoker.class);
        Method method = DemoFollowupController.class.getDeclaredMethod("listPlans");
        HandlerMethod handlerMethod = new HandlerMethod(new DemoFollowupController(), method);
        Map<RequestMappingInfo, HandlerMethod> mappings = new LinkedHashMap<>();
        for (int index = 0; index < 100; index++) {
            mappings.put(RequestMappingInfo.paths("/api/followup/demo-" + index)
                    .methods(RequestMethod.GET).build(), handlerMethod);
        }
        when(handlerMapping.getHandlerMethods()).thenReturn(mappings);
        when(apiInvoker.isAllowedCapability(anyString(), eq(2))).thenReturn(true);
        AssistantCapabilityService service = new AssistantCapabilityService(handlerMapping, apiInvoker);

        assertThat(service.search(2, null)).hasSize(100);
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

    private static class DemoCapabilityController {
        public Object detail(@PathVariable("elderId") Long elderId,
                             @RequestParam(name = "pageNum", defaultValue = "1") @Min(1) Integer pageNum,
                             @ModelAttribute DemoFilter filter) {
            return Map.of("elderId", elderId, "pageNum", pageNum, "filter", filter);
        }
    }

    @RequireRole({1})
    private static class DemoAdminController {
        public Object listUsers() {
            return null;
        }
    }

    private static class DemoFilter {
        private String name;
        private Integer status;
    }

    private static class BaseMessageRequest {
        private String title;
        private String content;
    }

    private static class ChildMessageRequest extends BaseMessageRequest {
        private Long recipientUserId;
    }
}
