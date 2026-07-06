package com.medical.controller;

import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.entity.ElderInfo;
import com.medical.entity.HealthRecord;
import com.medical.service.ElderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.util.List;

/**
 * 老人健康档案控制器
 */
@RestController
@RequestMapping("/api/elders")
public class ElderController {

    @Autowired
    private ElderService elderService;

    @GetMapping
    public R<?> list(@RequestParam(defaultValue = "1") Integer pageNum,
                     @RequestParam(defaultValue = "10") Integer pageSize,
                     @RequestParam(required = false) String name,
                     @RequestParam(required = false) String community,
                     @RequestParam(required = false) Long doctorId) {
        return R.ok(elderService.listElders(pageNum, pageSize, name, community, doctorId));
    }

    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id) {
        return R.ok(elderService.getDetail(id));
    }

    @PostMapping
    @OperationLog(module = "老人档案", type = "新增", desc = "新增老人信息")
    public R<?> create(@Valid @RequestBody ElderInfo elderInfo) {
        return R.ok("新增成功", elderService.create(elderInfo));
    }

    @PutMapping("/{id}")
    @OperationLog(module = "老人档案", type = "修改", desc = "修改老人信息")
    public R<?> update(@PathVariable Long id, @Valid @RequestBody ElderInfo elderInfo) {
        elderService.update(id, elderInfo);
        return R.ok("修改成功");
    }

    @DeleteMapping("/{id}")
    @OperationLog(module = "老人档案", type = "删除", desc = "删除老人信息")
    public R<?> delete(@PathVariable Long id) {
        elderService.delete(id);
        return R.ok("删除成功");
    }

    @GetMapping("/{id}/record")
    public R<?> getRecord(@PathVariable Long id) {
        return R.ok(elderService.getHealthRecord(id));
    }

    @PostMapping("/{id}/record")
    public R<?> saveRecord(@PathVariable Long id, @RequestBody HealthRecord record) {
        elderService.saveHealthRecord(id, record);
        return R.ok("保存成功");
    }

    @GetMapping("/stats")
    public R<?> stats(HttpServletRequest request) {
        return R.ok(elderService.getStats());
    }

    @GetMapping("/export")
    @OperationLog(module = "老人档案", type = "导出", desc = "导出Excel")
    public void export(HttpServletResponse response) throws Exception {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment;filename=elders.xlsx");
        List<ElderInfo> list = elderService.listElders(1, 1000, null, null, null).getRecords();
        com.alibaba.excel.EasyExcel.write(response.getOutputStream(), ElderInfo.class).sheet("老人信息").doWrite(list);
    }
}
