package com.medical.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.InterventionRecord;

import java.util.Map;

/**
 * 随访干预服务接口
 */
public interface InterventionService {

    Page<InterventionRecord> list(Integer pageNum, Integer pageSize, Long elderId, Long followRecordId, Integer type);

    InterventionRecord getById(Long id);

    Long create(InterventionRecord record);

    void update(Long id, InterventionRecord record);

    void delete(Long id);

    Map<String, Object> getStats();
}
