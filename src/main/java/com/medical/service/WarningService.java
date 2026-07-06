package com.medical.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.HealthWarning;

import java.util.Map;

/**
 * 健康预警服务接口
 */
public interface WarningService {

    Page<HealthWarning> list(Integer pageNum, Integer pageSize, Integer status, Integer warningLevel, Long elderId);

    HealthWarning getDetail(Long id);

    void handle(Long id, String handleResult, Long doctorId);

    void ignore(Long id, String handleResult);

    Long create(HealthWarning warning);

    Map<String, Object> getStats();
}
