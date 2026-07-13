package com.medical.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.admin.dto.AdminOperationLogQuery;
import com.medical.admin.dto.AdminOperationLogView;
import com.medical.auth.security.SensitiveDataSanitizer;
import com.medical.entity.SysOperationLog;
import com.medical.mapper.SysOperationLogMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AdminOperationLogServiceImplTest {

    @Test
    void historicalLogSecretsAreSanitizedBeforeReturningToAdministrator() {
        SysOperationLogMapper mapper = mock(SysOperationLogMapper.class);
        SysOperationLog stored = new SysOperationLog();
        stored.setRequestParams("""
                {"username":"doctor01","password":"Plain123"}
                """);
        stored.setResponseResult("""
                {"token":"jwt-secret","tokenId":"id-secret"}
                """);
        Page<SysOperationLog> storedPage = new Page<>(1, 20, 1);
        storedPage.setRecords(List.of(stored));
        when(mapper.selectPage(any(Page.class), any(Wrapper.class))).thenReturn(storedPage);
        AdminOperationLogServiceImpl service = new AdminOperationLogServiceImpl(
                mapper, new SensitiveDataSanitizer(new ObjectMapper()));

        AdminOperationLogView view = service.listLogs(new AdminOperationLogQuery())
                .getRecords().get(0);

        assertFalse(view.getRequestParams().contains("Plain123"));
        assertFalse(view.getResponseResult().contains("jwt-secret"));
        assertFalse(view.getResponseResult().contains("id-secret"));
        assertTrue(view.getRequestParams().contains("***"));
    }
}
