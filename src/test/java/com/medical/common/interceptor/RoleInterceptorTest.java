package com.medical.common.interceptor;

import com.medical.common.annotation.RequireRole;
import com.medical.common.result.R;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.method.HandlerMethod;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

/**
 * RoleInterceptor 单元测试
 * 验证角色权限拦截器在各种情况下的行为。
 */
class RoleInterceptorTest {

    private RoleInterceptor roleInterceptor;

    @BeforeEach
    void setUp() {
        roleInterceptor = new RoleInterceptor();
    }

    @Test
    void testNoAnnotation_AllowRequest() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/test");
        MockHttpServletResponse response = new MockHttpServletResponse();
        HandlerMethod hm = createHandlerMethod("noAnnotationMethod");

        boolean allowed = roleInterceptor.preHandle(request, response, hm);
        assertTrue(allowed, "未贴注解应该放行");
    }

    @Test
    void testAnnotationOnMethod_AdminAllowed() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/only");
        request.setAttribute("currentUserType", 1);
        MockHttpServletResponse response = new MockHttpServletResponse();
        HandlerMethod hm = createHandlerMethod("adminOnlyMethod");

        boolean allowed = roleInterceptor.preHandle(request, response, hm);
        assertTrue(allowed, "管理员应该被允许");
    }

    @Test
    void testAnnotationOnMethod_DoctorForbidden() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/only");
        request.setAttribute("currentUserType", 2);
        MockHttpServletResponse response = new MockHttpServletResponse();
        HandlerMethod hm = createHandlerMethod("adminOnlyMethod");

        boolean allowed = roleInterceptor.preHandle(request, response, hm);
        assertFalse(allowed, "医生不应被允许访问仅管理员接口");
    }

    @Test
    void testAnnotationOnMethod_NurseForbidden() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/only");
        request.setAttribute("currentUserType", 3);
        MockHttpServletResponse response = new MockHttpServletResponse();
        HandlerMethod hm = createHandlerMethod("adminOnlyMethod");

        boolean allowed = roleInterceptor.preHandle(request, response, hm);
        assertFalse(allowed, "护士不应被允许访问仅管理员接口");
    }

    @Test
    void testNoCurrentUserType_Returns401() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/only");
        MockHttpServletResponse response = new MockHttpServletResponse();
        HandlerMethod hm = createHandlerMethod("adminOnlyMethod");

        boolean allowed = roleInterceptor.preHandle(request, response, hm);
        assertFalse(allowed, "无 currentUserType 应该返回 401");
    }

    @Test
    void testOptionsRequest_AlwaysAllowed() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/admin/only");
        MockHttpServletResponse response = new MockHttpServletResponse();
        boolean allowed = roleInterceptor.preHandle(request, response, new Object());
        assertTrue(allowed, "OPTIONS 请求应放行");
    }

    @Test
    void testNonHandlerMethod_Allowed() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/test");
        MockHttpServletResponse response = new MockHttpServletResponse();
        boolean allowed = roleInterceptor.preHandle(request, response, new Object());
        assertTrue(allowed, "非 HandlerMethod 应放行");
    }

    @Test
    void testMultiRole_AllAllowed() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/shared");
        MockHttpServletResponse response = new MockHttpServletResponse();
        HandlerMethod hm = createHandlerMethod("sharedMethod");

        for (int userType = 1; userType <= 3; userType++) {
            request.setAttribute("currentUserType", userType);
            boolean allowed = roleInterceptor.preHandle(request, response, hm);
            assertTrue(allowed, "userType=" + userType + " 应该被允许");
        }
    }

    @Test
    void testInvalidUserTypeFormat_Returns401() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/only");
        request.setAttribute("currentUserType", "invalid");
        MockHttpServletResponse response = new MockHttpServletResponse();
        HandlerMethod hm = createHandlerMethod("adminOnlyMethod");

        boolean allowed = roleInterceptor.preHandle(request, response, hm);
        assertFalse(allowed, "非法 userType 应该返回 401");
    }

    @Test
    void testForbiddenResponseCode() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/only");
        request.setAttribute("currentUserType", 2);
        MockHttpServletResponse response = new MockHttpServletResponse();
        HandlerMethod hm = createHandlerMethod("adminOnlyMethod");

        roleInterceptor.preHandle(request, response, hm);

        // Status should still be 200 (errors return JSON with code in body)
        assertEquals(200, response.getStatus());
        String content = response.getContentAsString();
        assertTrue(content.contains("\"code\":403") || content.contains("\"code\":401"),
                "响应体应包含 403 或 401 错误码: " + content);
    }

    private HandlerMethod createHandlerMethod(String methodName) throws NoSuchMethodException {
        Method method = TestController.class.getDeclaredMethod(methodName);
        return new HandlerMethod(new TestController(), method);
    }

    static class TestController {
        public void noAnnotationMethod() {}

        @RequireRole({1})
        public void adminOnlyMethod() {}

        @RequireRole({1, 2, 3})
        public void sharedMethod() {}
    }
}
