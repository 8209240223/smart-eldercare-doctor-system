package com.medical.controller;

import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.entity.WarningRule;
import com.medical.service.WarningRuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * 预警规则控制器
 */
@RestController
@RequestMapping("/api/warning-rules")
public class WarningRuleController {

    @Autowired
    private WarningRuleService warningRuleService;

    @GetMapping
    public R<?> list(@RequestParam(required = false) Long doctorId) {
        return R.ok(warningRuleService.listRules(doctorId));
    }

    @PostMapping
    @OperationLog(module = "预警规则", type = "新增", desc = "新增预警规则")
    public R<?> create(@RequestBody WarningRule rule) {
        return R.ok("创建成功", warningRuleService.createRule(rule));
    }

    @PutMapping("/{id}")
    @OperationLog(module = "预警规则", type = "修改", desc = "修改预警规则")
    public R<?> update(@PathVariable Long id, @RequestBody WarningRule rule) {
        warningRuleService.updateRule(id, rule);
        return R.ok("修改成功");
    }

    @DeleteMapping("/{id}")
    @OperationLog(module = "预警规则", type = "删除", desc = "删除预警规则")
    public R<?> delete(@PathVariable Long id) {
        warningRuleService.deleteRule(id);
        return R.ok("删除成功");
    }

    @PutMapping("/{id}/toggle")
    public R<?> toggle(@PathVariable Long id, @RequestParam Integer enabled) {
        warningRuleService.toggleRule(id, enabled);
        return R.ok("操作成功");
    }

    @PostMapping("/evaluate")
    public R<?> evaluate(@RequestParam Long elderId, @RequestBody Map<String, BigDecimal> vitalData) {
        int count = warningRuleService.evaluateVitalSigns(elderId, vitalData);
        return R.ok("评估完成，触发" + count + "条预警", count);
    }
}
