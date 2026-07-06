package com.medical.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.common.annotation.OperationLog;
import com.medical.entity.SysOperationLog;
import com.medical.mapper.SysOperationLogMapper;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;
import java.time.LocalDateTime;

/**
 * 操作日志AOP切面
 */
@Aspect
@Component
public class OperationLogAspect {

    @Autowired
    private SysOperationLogMapper logMapper;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Around("@annotation(com.medical.common.annotation.OperationLog)")
    public Object around(ProceedingJoinPoint point) throws Throwable {
        long startTime = System.currentTimeMillis();
        SysOperationLog log = new SysOperationLog();

        // 获取注解信息
        MethodSignature signature = (MethodSignature) point.getSignature();
        Method method = signature.getMethod();
        OperationLog annotation = method.getAnnotation(OperationLog.class);
        log.setModule(annotation.module());
        log.setOperationType(annotation.type());
        log.setDescription(annotation.desc());
        log.setMethod(point.getTarget().getClass().getName() + "." + method.getName());

        // 获取请求信息
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                log.setRequestUrl(request.getRequestURI());
                log.setRequestIp(request.getRemoteAddr());
                Long userId = (Long) request.getAttribute("currentUserId");
                String username = (String) request.getAttribute("currentUsername");
                log.setUserId(userId);
                log.setUsername(username);
            }
        } catch (Exception ignored) {}

        // 记录请求参数
        try {
            Object[] args = point.getArgs();
            if (args != null && args.length > 0) {
                String params = objectMapper.writeValueAsString(args[0]);
                log.setRequestParams(params.length() > 500 ? params.substring(0, 500) : params);
            }
        } catch (Exception ignored) {}

        // 执行目标方法
        Object result = null;
        try {
            result = point.proceed();
            log.setStatus(1);
            try {
                String res = objectMapper.writeValueAsString(result);
                log.setResponseResult(res.length() > 500 ? res.substring(0, 500) : res);
            } catch (Exception ignored) {}
        } catch (Throwable e) {
            log.setStatus(0);
            log.setErrorMsg(e.getMessage());
            throw e;
        } finally {
            log.setDuration(System.currentTimeMillis() - startTime);
            log.setCreateTime(LocalDateTime.now());
            try {
                logMapper.insert(log);
            } catch (Exception ignored) {}
        }
        return result;
    }
}
