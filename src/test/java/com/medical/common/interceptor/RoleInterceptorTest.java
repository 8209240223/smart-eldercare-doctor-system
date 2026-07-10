package com.medical.common.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.common.annotation.RequireRole;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.method.HandlerMethod;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RoleInterceptorTest {

    private final RoleInterceptor interceptor = new RoleInterceptor(new ObjectMapper());

    @Test
    void allowsRoleDeclaredOnHandlerMethod() throws Exception {
        MockHttpServletRequest request = requestWithRole(2);
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertTrue(interceptor.preHandle(request, response, handler("doctorOnly")));
    }

    @Test
    void methodRequirementOverridesClassRequirement() throws Exception {
        MockHttpServletRequest request = requestWithRole(1);
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertFalse(interceptor.preHandle(request, response, handler("doctorOnly")));
        assertEquals(200, response.getStatus());
        assertTrue(response.getContentAsString().contains("\"code\":403"));
    }

    @Test
    void allowsClassLevelRoleWhenMethodHasNoOverride() throws Exception {
        MockHttpServletRequest request = requestWithRole(3);
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertTrue(interceptor.preHandle(request, response, handler("sharedRead")));
    }

    @Test
    void rejectsMissingAuthenticatedRole() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        assertFalse(interceptor.preHandle(request, response, handler("sharedRead")));
        assertTrue(response.getContentAsString().contains("\"code\":401"));
    }

    private MockHttpServletRequest requestWithRole(int userType) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("currentUserType", userType);
        return request;
    }

    private HandlerMethod handler(String methodName) throws NoSuchMethodException {
        SecuredController controller = new SecuredController();
        return new HandlerMethod(controller, SecuredController.class.getDeclaredMethod(methodName));
    }

    @RequireRole({1, 2, 3})
    private static class SecuredController {

        @RequireRole({2})
        public void doctorOnly() {
        }

        public void sharedRead() {
        }
    }
}
