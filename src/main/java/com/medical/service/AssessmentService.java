package com.medical.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.AssessmentRecord;

import java.util.Map;

/**
 * 健康评估服务接口
 */
public interface AssessmentService {

    Page<AssessmentRecord> list(Integer pageNum, Integer pageSize, Long elderId, Integer assessType);

    AssessmentRecord getDetail(Long id);

    Long create(AssessmentRecord record);

    void update(Long id, AssessmentRecord record);

    void delete(Long id);

    Map<String, Object> getStats(Long elderId);

    /**
     * 生成老人健康评估报告
     */
    Map<String, Object> getReport(Long elderId, Long doctorId);
}
