package com.medical.controller;

import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.entity.HealthWarning;
import com.medical.service.WarningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 健康预警控制器
 */
@RestController
@RequestMapping("/api/warnings")
public class WarningController {

    @Autowired
    private WarningService warningService;

    @GetMapping
    public R<?> list(@RequestParam(defaultValue = "1") Integer pageNum,
                     @RequestParam(defaultValue = "10") Integer pageSize,
                     @RequestParam(required = false) Integer status,
                     @RequestParam(required = false) Integer warningLevel,
                     @RequestParam(required = false) Long elderId) {
        return R.ok(warningService.list(pageNum, pageSize, status, warningLevel, elderId));
    }

    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id) {
        return R.ok(warningService.getDetail(id));
    }

    @PutMapping("/{id}/handle")
    @OperationLog(module = "健康预警", type = "处理", desc = "处理健康预警")
    public R<?> handle(@PathVariable Long id, @RequestBody HealthWarning warning) {
        warningService.handle(id, warning.getHandleResult(), warning.getDoctorId());
        return R.ok("处理成功");
    }

    @PutMapping("/{id}/ignore")
    public R<?> ignore(@PathVariable Long id, @RequestBody HealthWarning warning) {
        warningService.ignore(id, warning.getHandleResult());
        return R.ok("已忽略");
    }

    @PostMapping
    @OperationLog(module = "健康预警", type = "新增", desc = "手动添加预警")
    public R<?> create(@RequestBody HealthWarning warning) {
        return R.ok("预警已生成", warningService.create(warning));
    }

    @GetMapping("/stats")
    public R<?> stats() {
        return R.ok(warningService.getStats());
    }
}
