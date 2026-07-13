package com.medical.common.config;

import com.medical.auth.security.SensitiveDataSanitizer;
import com.medical.common.annotation.OperationLog;
import com.medical.entity.SysOperationLog;
import com.medical.mapper.SysOperationLogMapper;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 操作日志AOP切面
 */
@Aspect
@Component
public class OperationLogAspect {

    private final SysOperationLogMapper logMapper;
    private final SensitiveDataSanitizer sensitiveDataSanitizer;

    public OperationLogAspect(SysOperationLogMapper logMapper,
                              SensitiveDataSanitizer sensitiveDataSanitizer) {
        this.logMapper = logMapper;
        this.sensitiveDataSanitizer = sensitiveDataSanitizer;
    }

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
                List<Object> businessArgs = Arrays.stream(args)
                        .filter(argument -> !(argument instanceof HttpServletRequest))
                        .filter(argument -> !(argument instanceof HttpServletResponse))
                        .filter(argument -> !(argument instanceof MultipartFile))
                        .collect(Collectors.toList());
                Object params = businessArgs.size() == 1 ? businessArgs.get(0) : businessArgs;
                log.setRequestParams(sensitiveDataSanitizer.serialize(params, 500));
            }
        } catch (Exception ignored) {}

        // 执行目标方法
        Object result = null;
        try {
            result = point.proceed();
            log.setStatus(1);
            try {
                log.setResponseResult(sensitiveDataSanitizer.serialize(result, 500));
            } catch (Exception ignored) {}
        } catch (Throwable e) {
            log.setStatus(0);
            log.setErrorMsg(sensitiveDataSanitizer.sanitizeStoredText(e.getMessage(), 500));
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
