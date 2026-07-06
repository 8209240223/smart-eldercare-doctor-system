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
}
