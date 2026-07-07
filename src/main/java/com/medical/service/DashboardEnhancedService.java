package com.medical.service;

import java.util.Map;

/**
 * 工作台增强服务接口
 */
public interface DashboardEnhancedService {

    /**
     * 获取今日待办清单
     */
    Map<String, Object> getTodoList(Long doctorId);

    /**
     * 获取待审核事项数量
     */
    Map<String, Object> getReviewCounts();

    /**
     * 获取慢病管理概览数据
     */
    Map<String, Object> getChronicOverview();

    /**
     * 获取重点人群统计数据(模块三新增)
     * 包含高危人数、重点人数、逾期随访数、今日应随访任务
     */
    Map<String, Object> getKeyPopulationStats();
}
