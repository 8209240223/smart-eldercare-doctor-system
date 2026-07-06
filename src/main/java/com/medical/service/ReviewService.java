package com.medical.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.NursingPlan;
import com.medical.entity.NursingRecord;

import java.util.Map;

/**
 * 护士工作审核服务接口
 */
public interface ReviewService {

    /**
     * 查询待审核的异常护理记录
     */
    Page<NursingRecord> listPendingRecords(Integer pageNum, Integer pageSize);

    /**
     * 审核护理记录（通过/驳回）
     */
    void reviewRecord(Long id, Long doctorId, String comment, Integer action);

    /**
     * 查询待审核的护理计划
     */
    Page<NursingPlan> listPendingPlans(Integer pageNum, Integer pageSize);

    /**
     * 审核护理计划
     */
    void reviewPlan(Long id, Long doctorId, Integer action);

    /**
     * 获取审核统计
     */
    Map<String, Object> getReviewStats();
}
