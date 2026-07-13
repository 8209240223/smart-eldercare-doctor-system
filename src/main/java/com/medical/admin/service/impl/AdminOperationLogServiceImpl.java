package com.medical.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.admin.dto.AdminOperationLogQuery;
import com.medical.admin.dto.AdminOperationLogView;
import com.medical.admin.service.AdminOperationLogService;
import com.medical.auth.security.SensitiveDataSanitizer;
import com.medical.common.exception.BusinessException;
import com.medical.entity.SysOperationLog;
import com.medical.mapper.SysOperationLogMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.stream.Collectors;

@Service
public class AdminOperationLogServiceImpl implements AdminOperationLogService {

    private static final int MAX_LOG_FIELD_LENGTH = 2000;

    private final SysOperationLogMapper operationLogMapper;
    private final SensitiveDataSanitizer sensitiveDataSanitizer;

    public AdminOperationLogServiceImpl(SysOperationLogMapper operationLogMapper,
                                        SensitiveDataSanitizer sensitiveDataSanitizer) {
        this.operationLogMapper = operationLogMapper;
        this.sensitiveDataSanitizer = sensitiveDataSanitizer;
    }

    @Override
    public Page<AdminOperationLogView> listLogs(AdminOperationLogQuery query) {
        AdminOperationLogQuery actual = query == null ? new AdminOperationLogQuery() : query;
        long pageNum = normalizePage(actual.getPageNum(), 1, Integer.MAX_VALUE);
        long pageSize = normalizePage(actual.getPageSize(), 20, 100);
        if (actual.getStatus() != null && actual.getStatus() != 0 && actual.getStatus() != 1) {
            throw new BusinessException(400, "日志状态仅支持0或1");
        }
        if (actual.getStartTime() != null && actual.getEndTime() != null
                && actual.getStartTime().isAfter(actual.getEndTime())) {
            throw new BusinessException(400, "开始时间不能晚于结束时间");
        }

        LambdaQueryWrapper<SysOperationLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(actual.getUserId() != null, SysOperationLog::getUserId, actual.getUserId())
                .like(StringUtils.hasText(actual.getUsername()),
                        SysOperationLog::getUsername, trim(actual.getUsername()))
                .eq(StringUtils.hasText(actual.getModule()),
                        SysOperationLog::getModule, trim(actual.getModule()))
                .eq(StringUtils.hasText(actual.getOperationType()),
                        SysOperationLog::getOperationType, trim(actual.getOperationType()))
                .eq(actual.getStatus() != null, SysOperationLog::getStatus, actual.getStatus())
                .ge(actual.getStartTime() != null, SysOperationLog::getCreateTime, actual.getStartTime())
                .le(actual.getEndTime() != null, SysOperationLog::getCreateTime, actual.getEndTime())
                .orderByDesc(SysOperationLog::getCreateTime)
                .orderByDesc(SysOperationLog::getId);

        Page<SysOperationLog> storedPage = operationLogMapper.selectPage(
                new Page<>(pageNum, pageSize), wrapper);
        Page<AdminOperationLogView> result = new Page<>(pageNum, pageSize, storedPage.getTotal());
        result.setRecords(storedPage.getRecords().stream()
                .map(this::toView)
                .collect(Collectors.toList()));
        return result;
    }

    private AdminOperationLogView toView(SysOperationLog log) {
        AdminOperationLogView view = new AdminOperationLogView();
        view.setId(log.getId());
        view.setUserId(log.getUserId());
        view.setUsername(log.getUsername());
        view.setModule(log.getModule());
        view.setOperationType(log.getOperationType());
        view.setDescription(log.getDescription());
        view.setMethod(log.getMethod());
        view.setRequestUrl(log.getRequestUrl());
        view.setRequestIp(log.getRequestIp());
        view.setRequestParams(sensitiveDataSanitizer.sanitizeStoredText(
                log.getRequestParams(), MAX_LOG_FIELD_LENGTH));
        view.setResponseResult(sensitiveDataSanitizer.sanitizeStoredText(
                log.getResponseResult(), MAX_LOG_FIELD_LENGTH));
        view.setDuration(log.getDuration());
        view.setStatus(log.getStatus());
        view.setErrorMsg(sensitiveDataSanitizer.sanitizeStoredText(
                log.getErrorMsg(), MAX_LOG_FIELD_LENGTH));
        view.setCreateTime(log.getCreateTime());
        return view;
    }

    private long normalizePage(Integer value, int defaultValue, int maximum) {
        if (value == null) {
            return defaultValue;
        }
        if (value < 1) {
            throw new BusinessException(400, "分页参数必须大于0");
        }
        return Math.min(value, maximum);
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}
