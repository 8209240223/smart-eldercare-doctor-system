package com.medical.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.FollowupTask;
import com.medical.dto.FollowupTaskGenerationResult;

import java.util.List;
import java.util.Map;

/**
 * 随访任务服务接口(自动生成的随访任务)
 */
public interface FollowupTaskService {

    /**
     * 自动生成随访任务
     * 根据风险等级和逾期情况自动生成
     * @return 生成的任务数量
     */
    int generateAutoTasks(Long doctorId, Long elderId);

    /**
     * 为指定老人和随访计划生成任务；已有待执行任务时直接复用。
     */
    FollowupTaskGenerationResult generateForElder(Long elderId, Long doctorId, Long planId);

    /**
     * 查询今日待执行任务
     * @return 今日任务列表
     */
    List<Map<String, Object>> getTodayTasks();

    /**
     * 根据医生ID查询任务列表
     * @param pageNum 页码
     * @param pageSize 每页大小
     * @param doctorId 医生ID
     * @param status 任务状态
     * @return 分页结果
     */
    Page<Map<String, Object>> getTaskList(Integer pageNum, Integer pageSize, Long doctorId, Long elderId, Integer status);

    /**
     * 完成随访任务
     * @param taskId 任务ID
     * @param followRecordId 关联的随访记录ID
     * @return 是否成功
     */
    boolean finishTask(Long taskId, Long followRecordId, Long doctorId);

    /**
     * 取消随访任务
     * @param taskId 任务ID
     * @param reason 取消原因
     * @return 是否成功
     */
    boolean cancelTask(Long taskId, String reason, Long doctorId);

    /**
     * 统计待执行任务数量
     */
    int countPendingTasks();

    /**
     * 统计今日任务数量
     */
    int countTodayTasks();

    /**
     * 查询逾期随访任务
     * @return 逾期任务列表
     */
    List<Map<String, Object>> getOverdueTasks();
}
