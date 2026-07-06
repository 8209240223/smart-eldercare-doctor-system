package com.medical.controller;

import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.entity.InterventionRecord;
import com.medical.service.InterventionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

/**
 * 随访干预记录控制器
 */
@RestController
@RequestMapping("/api/intervention")
public class InterventionController {

    @Autowired
    private InterventionService interventionService;

    @GetMapping("/list")
    public R<?> list(@RequestParam(defaultValue = "1") Integer pageNum,
                     @RequestParam(defaultValue = "10") Integer pageSize,
                     @RequestParam(required = false) Long elderId,
                     @RequestParam(required = false) Long followRecordId,
                     @RequestParam(required = false) Integer type) {
        return R.ok(interventionService.list(pageNum, pageSize, elderId, followRecordId, type));
    }

    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id) {
        return R.ok(interventionService.getById(id));
    }

    @PostMapping
    @OperationLog(module = "干预管理", type = "新增", desc = "新建干预记录")
    public R<?> create(@Valid @RequestBody InterventionRecord record) {
        return R.ok("创建成功", interventionService.create(record));
    }

    @PutMapping("/{id}")
    @OperationLog(module = "干预管理", type = "修改", desc = "更新干预记录")
    public R<?> update(@PathVariable Long id, @Valid @RequestBody InterventionRecord record) {
        interventionService.update(id, record);
        return R.ok("修改成功");
    }

    @DeleteMapping("/{id}")
    @OperationLog(module = "干预管理", type = "删除", desc = "删除干预记录")
    public R<?> delete(@PathVariable Long id) {
        interventionService.delete(id);
        return R.ok("删除成功");
    }

    @GetMapping("/stats")
    public R<?> stats() {
        return R.ok(interventionService.getStats());
    }
}
