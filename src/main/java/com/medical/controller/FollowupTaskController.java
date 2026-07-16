package com.medical.controller;

import com.medical.common.annotation.RequireRole;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.result.R;
import com.medical.service.FollowupTaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 随访任务控制器
 */
@RestController
@RequestMapping("/api/followup/tasks")
@RequireRole({1, 2, 3})
public class FollowupTaskController {

    @Autowired
    private FollowupTaskService followupTaskService;

    /**
     * 自动生成随访任务
     */
    @RequireRole({2})
    @PostMapping("/generate")
    public R<Integer> generateAutoTasks(@RequestAttribute("currentUserId") Long currentUserId,
                                        @RequestParam(required = false) Long elderId,
                                        @RequestParam Long nurseId) {
        int count = followupTaskService.generateAutoTasks(currentUserId, elderId, nurseId);
        return R.ok("自动生成随访任务完成，共生成" + count + "条", count);
    }

    @RequireRole({2})
    @PutMapping("/{id}/assign")
    public R<?> assignTask(@PathVariable Long id,
                           @RequestParam Long nurseId,
                           @RequestAttribute("currentUserId") Long currentUserId) {
        followupTaskService.assignTask(id, nurseId, currentUserId);
        return R.ok("随访任务已分配");
    }

    /**
     * 今日任务列表
     */
    @GetMapping("/today")
    public R<List<Map<String, Object>>> getTodayTasks(
            @RequestAttribute("currentUserId") Long currentUserId,
            @RequestAttribute("currentUserType") Integer currentUserType) {
        List<Map<String, Object>> tasks = followupTaskService.getTodayTasks(currentUserId, currentUserType);
        return R.ok(tasks);
    }

    /**
     * 任务列表(按医生查询)
     */
    @GetMapping
    public R<Page<Map<String, Object>>> getTaskList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long elderId,
            @RequestParam(required = false) Integer status,
            @RequestAttribute("currentUserId") Long currentUserId,
            @RequestAttribute("currentUserType") Integer currentUserType) {
        Page<Map<String, Object>> page = followupTaskService.getTaskList(
                pageNum, pageSize, doctorId, elderId, status, currentUserId, currentUserType);
        return R.ok(page);
    }

    /**
     * 完成随访任务
     */
    @RequireRole({2})
    @PutMapping("/{id}/finish")
    public R<Boolean> finishTask(
            @PathVariable Long id,
            @RequestParam Long followRecordId,
            @RequestAttribute("currentUserId") Long currentUserId) {
        boolean success = followupTaskService.finishTask(id, followRecordId, currentUserId);
        return success ? R.ok("任务已完成", true) : R.fail("任务已完成或不存在");
    }

    /**
     * 取消随访任务
     */
    @RequireRole({2})
    @PutMapping("/{id}/cancel")
    public R<Boolean> cancelTask(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @RequestAttribute("currentUserId") Long currentUserId) {
        boolean success = followupTaskService.cancelTask(id, reason, currentUserId);
        return success ? R.ok("任务已取消", true) : R.fail("任务已完成或不存在");
    }

    /**
     * 逾期任务列表
     */
    @GetMapping("/overdue")
    public R<List<Map<String, Object>>> getOverdueTasks(
            @RequestAttribute("currentUserId") Long currentUserId,
            @RequestAttribute("currentUserType") Integer currentUserType) {
        List<Map<String, Object>> tasks = followupTaskService.getOverdueTasks(currentUserId, currentUserType);
        return R.ok(tasks);
    }

    /**
     * 任务统计
     */
    @GetMapping("/stats")
    public R<Map<String, Object>> getTaskStats(
            @RequestAttribute("currentUserId") Long currentUserId,
            @RequestAttribute("currentUserType") Integer currentUserType) {
        Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("pending", followupTaskService.countPendingTasks(currentUserId, currentUserType));
        stats.put("today", followupTaskService.countTodayTasks(currentUserId, currentUserType));
        return R.ok(stats);
    }
}
