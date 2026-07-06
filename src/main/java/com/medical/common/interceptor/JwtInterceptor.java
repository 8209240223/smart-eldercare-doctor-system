package com.medical.common.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.common.constant.RedisKeyConstant;
import com.medical.common.result.R;
import com.medical.common.utils.JwtUtils;
import com.medical.common.utils.RedisUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;

/**
 * JWT Token 拦截器（支持 Redis 分布式 Token 校验）
 */
@Component
public class JwtInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private RedisUtils redisUtils;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // OPTIONS请求直接放行
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String token = getToken(request);
        if (!StringUtils.hasText(token)) {
            writeError(response, 401, "未登录或Token已过期");
            return false;
        }

        // 1. 校验 JWT Token 签名和有效期
        if (!jwtUtils.validateToken(token)) {
            writeError(response, 401, "Token无效或已过期");
            return false;
        }

        // 2. 获取用户信息
        Long userId = jwtUtils.getUserIdFromToken(token);
        String username = jwtUtils.getUsernameFromToken(token);

        // 3. 校验 Token 是否在 Redis 中存在（用于强制登出/分布式会话管理）
        boolean redisTokenValid = false;
        // 遍历所有可能的 tokenId（这里取巧：通过扫描 user 维度校验）
        // 更优做法：前端在请求头中携带 tokenId
        String tokenId = request.getHeader("X-Token-Id");
        if (StringUtils.hasText(tokenId)) {
            String redisKey = RedisKeyConstant.buildTokenKey(tokenId);
            Object tokenInfo = redisUtils.get(redisKey);
            if (tokenInfo instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> infoMap = (Map<String, Object>) tokenInfo;
                Object storedUserId = infoMap.get("userId");
                if (storedUserId != null && Long.valueOf(storedUserId.toString()).equals(userId)) {
                    redisTokenValid = true;
                    // 刷新 Token 过期时间（活跃续期）
                    redisUtils.expire(redisKey, RedisKeyConstant.TOKEN_TTL, java.util.concurrent.TimeUnit.SECONDS);
                }
            }
        }

        // 如果没有 tokenId 头，只做 JWT 校验（兼容旧版本客户端）
        // 但如果 Redis 中明确存在该用户的 Token 标记为已下线，则拒绝
        if (!redisTokenValid && StringUtils.hasText(tokenId)) {
            writeError(response, 401, "Token已被注销，请重新登录");
            return false;
        }

        // 将用户信息放入request属性中
        request.setAttribute("currentUserId", userId);
        request.setAttribute("currentUsername", username);
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
