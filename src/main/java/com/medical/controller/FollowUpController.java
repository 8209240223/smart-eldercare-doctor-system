package com.medical.controller;

import com.medical.common.annotation.OperationLog;
import com.medical.common.annotation.RequireRole;
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
@RequireRole({1, 2, 3})
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

    @RequireRole({2})
    @PostMapping("/plans")
    @OperationLog(module = "随访管理", type = "新增", desc = "创建随访计划")
    public R<?> createPlan(@Valid @RequestBody FollowPlan plan) {
        return R.ok("创建成功", followUpService.createPlan(plan));
    }

    @RequireRole({2})
    @PostMapping("/plans/generate-risk")
    @OperationLog(module = "随访管理", type = "生成", desc = "根据风险分层生成随访计划")
    public R<?> generateRiskPlans(@RequestParam(required = false) Long doctorId,
                                  @RequestParam(required = false) Long elderId) {
        return R.ok("生成成功", followUpService.generateRiskFollowPlans(doctorId, elderId));
    }

    @RequireRole({2})
    @DeleteMapping("/plans/generated")
    @OperationLog(module = "随访管理", type = "删除", desc = "清理自动生成的风险随访计划")
    public R<?> deleteGeneratedPlans() {
        return R.ok("清理成功", followUpService.deleteGeneratedRiskFollowPlans());
    }

    @RequireRole({2})
    @PutMapping("/plans/{id}")
    @OperationLog(module = "随访管理", type = "修改", desc = "修改随访计划")
    public R<?> updatePlan(@PathVariable Long id, @Valid @RequestBody FollowPlan plan) {
        followUpService.updatePlan(id, plan);
        return R.ok("修改成功");
    }

    @RequireRole({2})
    @PutMapping("/plans/{id}/status")
    public R<?> changePlanStatus(@PathVariable Long id, @RequestParam Integer status) {
        followUpService.changePlanStatus(id, status);
        return R.ok("操作成功");
    }

    @RequireRole({2})
    @DeleteMapping("/plans/{id}")
    @OperationLog(module = "随访管理", type = "删除", desc = "删除随访计划")
    public R<?> deletePlan(@PathVariable Long id) {
        followUpService.deletePlan(id);
        return R.ok("删除成功");
    }

    @GetMapping("/records")
    public R<?> recordList(@RequestParam(defaultValue = "1") Integer pageNum,
                           @RequestParam(defaultValue = "10") Integer pageSize,
                           @RequestParam(required = false) Long planId,
                           @RequestParam(required = false) Long elderId) {
        return R.ok(followUpService.listRecords(pageNum, pageSize, planId, elderId));
    }

    @RequireRole({2})
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
