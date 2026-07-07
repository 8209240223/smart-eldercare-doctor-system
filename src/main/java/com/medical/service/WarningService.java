package com.medical.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.HealthWarning;

import java.util.List;
import java.util.Map;

/**
 * 健康预警服务接口
 */
public interface WarningService {

    Page<HealthWarning> list(Integer pageNum, Integer pageSize, Integer status, Integer warningLevel, Long elderId);

    HealthWarning getDetail(Long id);

    void handle(Long id, String handleResult, Long doctorId);

    void ignore(Long id, String handleResult);

    /**
     * 创建预警（含实时推送）
     * @param warning 预警信息
     * @return 预警ID
     */
    Long create(HealthWarning warning);

    /**
     * 标记预警为已读
     * @param id 预警ID
     * @param doctorId 医生ID
     */
    void markAsRead(Long id, Long doctorId);

    Map<String, Object> getStats();

    /**
     * 获取实时统计数据
     * @return 实时统计信息（含趋势数据）
     */
    Map<String, Object> getRealtimeStats();

    /**
     * 获取预警事件日志
     * @param warningId 预警ID
     * @return 事件日志列表
     */
    List<Map<String, Object>> getEventLogs(Long warningId);

    /**
     * 自动检测并创建预警（体征数据异常时调用）
     * @param elderId 老人ID
     * @param dataType 数据类型
     * @param dataValue 数据值
     * @return 创建的预警ID，若无触发则返回null
     */
    Long autoDetectAndCreate(Long elderId, Integer dataType, String dataValue);
}
