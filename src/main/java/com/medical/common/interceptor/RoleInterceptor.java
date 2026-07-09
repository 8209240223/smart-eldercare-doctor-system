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

/**
 * 角色权限拦截器。必须注册在 JwtInterceptor 之后。
 */
@Component
public class RoleInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }
        HandlerMethod hm = (HandlerMethod) handler;

        RequireRole ann = hm.getMethodAnnotation(RequireRole.class);
        if (ann == null) {
            ann = hm.getBeanType().getAnnotation(RequireRole.class);
        }
        if (ann == null) {
            return true; // 没贴注解 = 不限角色，保持旧行为
        }

        Object userTypeObj = request.getAttribute("currentUserType");
        if (userTypeObj == null) {
            writeError(response, 401, "未登录或Token无效");
            return false;
        }
        int userType = Integer.parseInt(userTypeObj.toString());
        for (int allowed : ann.value()) {
            if (allowed == userType) {
                return true;
            }
        }
        writeError(response, 403, "当前角色无权访问该功能");
        return false;
    }

    private void writeError(HttpServletResponse response, int code, String msg) throws IOException {
        response.setContentType("application/json;charset=utf-8");
        response.setStatus(200);
        ObjectMapper mapper = new ObjectMapper();
        response.getWriter().write(mapper.writeValueAsString(R.fail(code, msg)));
    }
}