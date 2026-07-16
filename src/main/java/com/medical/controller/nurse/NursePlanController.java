package com.medical.controller.nurse;

import com.medical.common.annotation.RequireRole;
import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.entity.NursingPlan;
import com.medical.service.NursePlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 护理计划控制器
 */
@RestController
@RequestMapping("/api/nurse/plans")
@RequireRole({1, 2, 3})
public class NursePlanController {

    @Autowired
    private NursePlanService nursePlanService;

    @GetMapping
    public R<?> list(@RequestParam(defaultValue = "1") Integer pageNum,
                     @RequestParam(defaultValue = "10") Integer pageSize,
                     @RequestParam(required = false) Long elderId,
                     @RequestParam(required = false) Long nurseId,
                     @RequestParam(required = false) Integer planType,
                     @RequestParam(required = false) Integer status,
                     @RequestAttribute("currentUserId") Long currentUserId,
                     @RequestAttribute("currentUserType") Integer currentUserType) {
        return R.ok(nursePlanService.list(pageNum, pageSize, elderId, nurseId, planType, status,
                currentUserId, currentUserType));
    }

    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id,
                       @RequestAttribute("currentUserId") Long currentUserId,
                       @RequestAttribute("currentUserType") Integer currentUserType) {
        return R.ok(nursePlanService.getById(id, currentUserId, currentUserType));
    }

    @RequireRole({3})
    @PostMapping
    @OperationLog(module = "护理计划", type = "新增", desc = "新增护理计划")
    public R<?> create(@RequestBody NursingPlan plan,
                       @RequestAttribute("currentUserId") Long currentUserId) {
        plan.setNurseId(currentUserId);
        return R.ok("新增成功", nursePlanService.create(plan));
    }

    @RequireRole({3})
    @PutMapping("/{id}")
    @OperationLog(module = "护理计划", type = "修改", desc = "修改护理计划")
    public R<?> update(@PathVariable Long id,
                       @RequestBody NursingPlan plan,
                       @RequestAttribute("currentUserId") Long currentUserId) {
        nursePlanService.update(id, plan, currentUserId);
        return R.ok("修改成功");
    }

    @RequireRole({3})
    @DeleteMapping("/{id}")
    @OperationLog(module = "护理计划", type = "删除", desc = "删除护理计划")
    public R<?> delete(@PathVariable Long id,
                       @RequestAttribute("currentUserId") Long currentUserId) {
        nursePlanService.delete(id, currentUserId);
        return R.ok("删除成功");
    }

    @RequireRole({3})
    @PutMapping("/{id}/status")
    @OperationLog(module = "护理计划", type = "修改状态", desc = "更新护理计划状态")
    public R<?> updateStatus(@PathVariable Long id,
                             @RequestBody Map<String, Integer> body,
                             @RequestAttribute("currentUserId") Long currentUserId) {
        Integer status = body.get("status");
        if (status == null) {
            return R.fail(400, "状态不能为空");
        }
        nursePlanService.updateStatus(id, status, currentUserId);
        return R.ok("状态更新成功");
    }

    @RequireRole({3})
    @PostMapping("/{id}/increment")
    @OperationLog(module = "护理计划", type = "增加次数", desc = "增加护理计划完成次数")
    public R<?> incrementCompleted(@PathVariable Long id,
                                   @RequestAttribute("currentUserId") Long currentUserId) {
        nursePlanService.incrementCompleted(id, currentUserId);
        return R.ok("完成次数+1");
    }

    @GetMapping("/stats")
    public R<?> stats(@RequestAttribute("currentUserId") Long currentUserId,
                      @RequestAttribute("currentUserType") Integer currentUserType) {
        return R.ok(nursePlanService.getStats(currentUserId, currentUserType));
    }
}
