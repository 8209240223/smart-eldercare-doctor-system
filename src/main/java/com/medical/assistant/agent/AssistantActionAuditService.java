package com.medical.assistant.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.entity.SysOperationLog;
import com.medical.entity.SysUser;
import com.medical.mapper.SysOperationLogMapper;
import com.medical.mapper.SysUserMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AssistantActionAuditService {

    private final SysOperationLogMapper operationLogMapper;
    private final SysUserMapper sysUserMapper;
    private final ObjectMapper objectMapper;

    public AssistantActionAuditService(SysOperationLogMapper operationLogMapper,
                                       SysUserMapper sysUserMapper,
                                       ObjectMapper objectMapper) {
        this.operationLogMapper = operationLogMapper;
        this.sysUserMapper = sysUserMapper;
        this.objectMapper = objectMapper;
    }

    public void record(AssistantApprovalService.PendingAction action,
                       Object result,
                       Throwable error,
                       long durationMillis) {
        try {
            SysUser user = sysUserMapper.selectById(action.userId);
            SysOperationLog log = new SysOperationLog();
            log.setUserId(action.userId);
            log.setUsername(user == null ? null : user.getUsername());
            log.setModule("AI站内Agent");
            log.setOperationType("工具执行");
            log.setDescription(action.tool + "：" + action.summary);
            log.setMethod("AssistantToolRegistry.executeApproved");
            log.setRequestUrl("/api/assistant/actions/confirm");
            log.setRequestParams(limit(action.argumentsJson, 2000));
            log.setResponseResult(error == null ? limit(objectMapper.writeValueAsString(result), 2000) : null);
            log.setDuration(durationMillis);
            log.setStatus(error == null ? 1 : 0);
            log.setErrorMsg(error == null ? null : limit(error.getMessage(), 500));
            log.setCreateTime(LocalDateTime.now());
            operationLogMapper.insert(log);
        } catch (Exception ignored) {
        }
    }

    private String limit(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
