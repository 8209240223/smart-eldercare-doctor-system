package com.medical.admin.controller;

import com.medical.admin.dto.AdminOperationLogQuery;
import com.medical.admin.service.AdminOperationLogService;
import com.medical.common.annotation.RequireRole;
import com.medical.common.result.R;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/operation-logs")
@RequireRole({1})
public class AdminOperationLogController {

    private final AdminOperationLogService operationLogService;

    public AdminOperationLogController(AdminOperationLogService operationLogService) {
        this.operationLogService = operationLogService;
    }

    @GetMapping
    public R<?> listLogs(@ModelAttribute AdminOperationLogQuery query) {
        return R.ok(operationLogService.listLogs(query));
    }
}
