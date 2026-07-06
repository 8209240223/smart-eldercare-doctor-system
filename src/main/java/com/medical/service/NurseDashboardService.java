package com.medical.service;

import java.util.Map;

/**
 * 护士工作台服务接口
 */
public interface NurseDashboardService {

    /**
     * 获取护士工作台统计数据
     */
    Map<String, Object> getStats(Long nurseId);

    /**
     * 获取今日待办任务列表
     */
    Map<String, Object> getTodayTasks(Long nurseId);
}
