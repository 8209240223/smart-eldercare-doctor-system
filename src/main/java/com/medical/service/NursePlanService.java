package com.medical.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.NursingPlan;

import java.util.Map;

/**
 * 护理计划服务接口
 */
public interface NursePlanService {

    Page<NursingPlan> list(Integer pageNum, Integer pageSize, Long elderId, Long nurseId,
                           Integer planType, Integer status);

    NursingPlan getById(Long id);

    Long create(NursingPlan plan);

    void update(Long id, NursingPlan plan);

    void delete(Long id);

    /**
     * 更新计划状态
     */
    void updateStatus(Long id, Integer status);

    /**
     * 增加已完成次数
     */
    void incrementCompleted(Long id);

    Map<String, Object> getStats(Long nurseId);
}
