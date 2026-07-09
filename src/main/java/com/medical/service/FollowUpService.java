package com.medical.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.FollowPlan;
import com.medical.entity.FollowRecord;

import java.util.Map;

/**
 * 随访管理服务接口
 */
public interface FollowUpService {

    Page<FollowPlan> listPlans(Integer pageNum, Integer pageSize, Integer status, Integer diseaseType, Long elderId);

    Long createPlan(FollowPlan plan);

    Map<String, Object> generateRiskFollowPlans(Long doctorId, Long elderId);

    int deleteGeneratedRiskFollowPlans();

    void updatePlan(Long id, FollowPlan plan);

    void changePlanStatus(Long id, Integer status);

    void deletePlan(Long id);

    Page<FollowRecord> listRecords(Integer pageNum, Integer pageSize, Long planId, Long elderId);

    Long createRecord(FollowRecord record);

    FollowRecord getRecordDetail(Long id);

    Map<String, Object> getStats();
}
