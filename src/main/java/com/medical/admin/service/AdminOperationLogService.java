package com.medical.admin.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.admin.dto.AdminOperationLogQuery;
import com.medical.admin.dto.AdminOperationLogView;

public interface AdminOperationLogService {

    Page<AdminOperationLogView> listLogs(AdminOperationLogQuery query);
}
