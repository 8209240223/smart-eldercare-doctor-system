package com.medical.common.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.auth.session.AuthSessionService;
import com.medical.common.result.R;
import com.medical.common.utils.JwtUtils;
import com.medical.entity.SysUser;
import com.medical.mapper.SysUserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.DispatcherType;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

import static com.medical.auth.session.AuthSessionErrors.SESSION_REPLACED_CODE;
import static com.medical.auth.session.AuthSessionErrors.SESSION_REPLACED_MESSAGE;

/**
 * JWT Token 拦截器
 */
@Component
public class JwtInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private AuthSessionService authSessionService;

    @Autowired
    private SysUserMapper sysUserMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // OPTIONS请求直接放行
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        if (request.getDispatcherType() == DispatcherType.ASYNC) {
            return true;
        }

        String token = getToken(request);
        if (!StringUtils.hasText(token)) {
            writeError(response, 401, "未登录或Token已过期");
            return false;
        }

        String tokenId = request.getHeader("X-Token-Id");
        if (!StringUtils.hasText(tokenId)) {
            writeError(response, 401, "缺少会话标识，请重新登录");
            return false;
        }

        // 1. 校验 JWT Token 签名和有效期
        if (!jwtUtils.validateToken(token)) {
            writeError(response, 401, "Token无效或已过期");
            return false;
        }

        Long userId;
        try {
            userId = jwtUtils.getUserIdFromToken(token);
        } catch (Exception exception) {
            writeError(response, 401, "Token无效或已过期");
            return false;
        }

        // 2. 同时校验 tokenId、Redis Token 内容和用户当前唯一 tokenId 映射
        if (!authSessionService.validateSession(userId, tokenId, token)) {
            if (authSessionService.isSessionReplaced(userId, tokenId)) {
                writeError(response, SESSION_REPLACED_CODE, SESSION_REPLACED_MESSAGE);
                return false;
            }
            writeError(response, 401, "会话已失效，请重新登录");
            return false;
        }

        // 3. 使用数据库中的实时账号状态和角色，避免旧 JWT 保留过期权限
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null || !Integer.valueOf(1).equals(user.getStatus())
                || Integer.valueOf(1).equals(user.getDeleted())) {
            try {
                authSessionService.revokeAllSessions(userId);
            } catch (RuntimeException ignored) {
            }
            writeError(response, 401, "账号不可用，请重新登录");
            return false;
        }

        authSessionService.refreshSession(userId, tokenId);
        request.setAttribute("currentUserId", userId);
        request.setAttribute("currentUsername", user.getUsername());
        request.setAttribute("currentUserType", user.getUserType());
        return true;
    }

    private String getToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        // 也支持从参数获取
        return request.getParameter("token");
    }

    private void writeError(HttpServletResponse response, int code, String msg) throws IOException {
        response.setContentType("application/json;charset=utf-8");
        response.setStatus(200);
        ObjectMapper mapper = new ObjectMapper();
        response.getWriter().write(mapper.writeValueAsString(R.fail(code, msg)));
    }
}
