package com.medical.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.PhysicalExam;

import java.util.List;
import java.util.Map;

/**
 * 体检管理服务接口
 */
public interface ExamService {

    Page<PhysicalExam> list(Integer pageNum, Integer pageSize, Long elderId, String startDate, String endDate);

    PhysicalExam getById(Long id);

    Long create(PhysicalExam exam);

    void update(Long id, PhysicalExam exam);

    void delete(Long id);

    List<PhysicalExam> getCompareData(Long elderId, String startDate, String endDate);

    Map<String, Object> getStats(Long elderId);
}
