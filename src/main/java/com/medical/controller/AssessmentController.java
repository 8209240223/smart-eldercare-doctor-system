package com.medical.controller;

import com.medical.common.result.R;
import com.medical.entity.AssessmentRecord;
import com.medical.service.AssessmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

/**
 * 健康评估控制器
 */
@RestController
@RequestMapping("/api/assessments")
public class AssessmentController {

    @Autowired
    private AssessmentService assessmentService;

    @GetMapping
    public R<?> list(@RequestParam(defaultValue = "1") Integer pageNum,
                     @RequestParam(defaultValue = "10") Integer pageSize,
                     @RequestParam(required = false) Long elderId,
                     @RequestParam(required = false) Integer assessType) {
        return R.ok(assessmentService.list(pageNum, pageSize, elderId, assessType));
    }

    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id) {
        return R.ok(assessmentService.getDetail(id));
    }

    @PostMapping
    public R<?> create(@RequestBody AssessmentRecord record) {
        return R.ok("评估完成", assessmentService.create(record));
    }

    @PutMapping("/{id}")
    public R<?> update(@PathVariable Long id, @RequestBody AssessmentRecord record) {
        assessmentService.update(id, record);
        return R.ok("修改成功");
    }

    @DeleteMapping("/{id}")
    public R<?> delete(@PathVariable Long id) {
        assessmentService.delete(id);
        return R.ok("删除成功");
    }

    @GetMapping("/stats")
    public R<?> stats(@RequestParam(required = false) Long elderId) {
        return R.ok(assessmentService.getStats(elderId));
    }

    /**
     * 生成老人健康评估报告
     */
    @GetMapping("/report/{elderId}")
    public R<?> report(@PathVariable Long elderId, HttpServletRequest request) {
        Long doctorId = (Long) request.getAttribute("currentUserId");
        return R.ok(assessmentService.getReport(elderId, doctorId));
    }
}
