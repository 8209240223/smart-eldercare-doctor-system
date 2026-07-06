package com.medical.controller;

import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.entity.FollowPlan;
import com.medical.entity.FollowRecord;
import com.medical.service.FollowUpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

/**
 * 随访管理控制器
 */
@RestController
@RequestMapping("/api/followup")
public class FollowUpController {

    @Autowired
    private FollowUpService followUpService;

    @GetMapping("/plans")
    public R<?> planList(@RequestParam(defaultValue = "1") Integer pageNum,
                         @RequestParam(defaultValue = "10") Integer pageSize,
                         @RequestParam(required = false) Integer status,
                         @RequestParam(required = false) Integer diseaseType,
                         @RequestParam(required = false) Long elderId) {
        return R.ok(followUpService.listPlans(pageNum, pageSize, status, diseaseType, elderId));
    }

    @PostMapping("/plans")
    @OperationLog(module = "随访管理", type = "新增", desc = "创建随访计划")
    public R<?> createPlan(@Valid @RequestBody FollowPlan plan) {
        return R.ok("创建成功", followUpService.createPlan(plan));
    }

    @PutMapping("/plans/{id}")
    public R<?> updatePlan(@PathVariable Long id, @Valid @RequestBody FollowPlan plan) {
        followUpService.updatePlan(id, plan);
        return R.ok("修改成功");
    }

    @PutMapping("/plans/{id}/status")
    public R<?> changePlanStatus(@PathVariable Long id, @RequestParam Integer status) {
        followUpService.changePlanStatus(id, status);
        return R.ok("操作成功");
    }

    @GetMapping("/records")
    public R<?> recordList(@RequestParam(defaultValue = "1") Integer pageNum,
                           @RequestParam(defaultValue = "10") Integer pageSize,
                           @RequestParam(required = false) Long planId,
                           @RequestParam(required = false) Long elderId) {
        return R.ok(followUpService.listRecords(pageNum, pageSize, planId, elderId));
    }

    @PostMapping("/records")
    @OperationLog(module = "随访管理", type = "新增", desc = "新增随访记录")
    public R<?> createRecord(@Valid @RequestBody FollowRecord record) {
        return R.ok("记录成功", followUpService.createRecord(record));
    }

    @GetMapping("/records/{id}")
    public R<?> recordDetail(@PathVariable Long id) {
        return R.ok(followUpService.getRecordDetail(id));
    }

    @GetMapping("/stats")
    public R<?> stats() {
        return R.ok(followUpService.getStats());
    }
}
