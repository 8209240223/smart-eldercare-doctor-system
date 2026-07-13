package com.medical.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.auth.security.SensitiveDataSanitizer;
import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.entity.SysOperationLog;
import com.medical.mapper.SysOperationLogMapper;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.lang.reflect.Method;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OperationLogAspectTest {

    @Test
    void masksSensitiveRequestAndResponseFieldsBeforeInsert() throws Throwable {
        SysOperationLogMapper mapper = mock(SysOperationLogMapper.class);
        OperationLogAspect aspect = new OperationLogAspect(
                mapper, new SensitiveDataSanitizer(new ObjectMapper()));
        ProceedingJoinPoint point = mock(ProceedingJoinPoint.class);
        MethodSignature signature = mock(MethodSignature.class);
        LoggedTarget target = new LoggedTarget();
        Method method = LoggedTarget.class.getDeclaredMethod("update", Map.class);
        when(point.getSignature()).thenReturn(signature);
        when(signature.getMethod()).thenReturn(method);
        when(point.getTarget()).thenReturn(target);
        when(point.getArgs()).thenReturn(new Object[]{Map.of(
                "newPassword", "Newpass2", "captchaCode", "1234")});
        when(point.proceed()).thenReturn(R.ok(Map.of(
                "token", "jwt-secret", "value", "visible")));

        aspect.around(point);

        ArgumentCaptor<SysOperationLog> logCaptor = ArgumentCaptor.forClass(SysOperationLog.class);
        verify(mapper).insert(logCaptor.capture());
        SysOperationLog log = logCaptor.getValue();
        assertFalse(log.getRequestParams().contains("Newpass2"));
        assertFalse(log.getRequestParams().contains("1234"));
        assertFalse(log.getResponseResult().contains("jwt-secret"));
        assertTrue(log.getResponseResult().contains("visible"));
    }

    private static class LoggedTarget {

        @OperationLog(module = "测试", type = "修改", desc = "测试脱敏")
        public R<?> update(Map<String, Object> request) {
            return R.ok();
        }
    }
}
