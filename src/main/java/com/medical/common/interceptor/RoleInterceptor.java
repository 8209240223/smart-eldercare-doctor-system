package com.medical.common.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.common.annotation.RequireRole;
import com.medical.common.result.R;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class RoleInterceptor implements HandlerInterceptor {

    private final ObjectMapper objectMapper;

    public RoleInterceptor(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod()) || !(handler instanceof HandlerMethod)) {
            return true;
        }

        HandlerMethod handlerMethod = (HandlerMethod) handler;
        RequireRole requirement = handlerMethod.getMethodAnnotation(RequireRole.class);
        if (requirement == null) {
            requirement = handlerMethod.getBeanType().getAnnotation(RequireRole.class);
        }
        if (requirement == null) {
            return true;
        }

        Object currentUserType = request.getAttribute("currentUserType");
        if (currentUserType == null) {
            writeError(response, 401, "未登录或Token无效");
            return false;
        }

        final int userType;
        try {
            userType = Integer.parseInt(currentUserType.toString());
        } catch (NumberFormatException exception) {
            writeError(response, 401, "用户身份信息异常");
            return false;
        }

        for (int allowed : requirement.value()) {
            if (allowed == userType) {
                return true;
            }
        }

        writeError(response, 403, "当前角色无权访问该功能");
        return false;
    }

    private void writeError(HttpServletResponse response, int code, String message) throws IOException {
        response.setContentType("application/json;charset=utf-8");
        response.setStatus(HttpServletResponse.SC_OK);
        response.getWriter().write(objectMapper.writeValueAsString(R.fail(code, message)));
    }
}
