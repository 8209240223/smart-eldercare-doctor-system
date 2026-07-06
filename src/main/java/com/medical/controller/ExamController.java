package com.medical.controller;

import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.entity.PhysicalExam;
import com.medical.service.ExamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

/**
 * 体检管理控制器
 */
@RestController
@RequestMapping("/api/exams")
public class ExamController {

    @Autowired
    private ExamService examService;

    @GetMapping
    public R<?> list(@RequestParam(defaultValue = "1") Integer pageNum,
                     @RequestParam(defaultValue = "10") Integer pageSize,
                     @RequestParam(required = false) Long elderId,
                     @RequestParam(required = false) String startDate,
                     @RequestParam(required = false) String endDate) {
        return R.ok(examService.list(pageNum, pageSize, elderId, startDate, endDate));
    }

    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id) {
        return R.ok(examService.getById(id));
    }

    @PostMapping
    @OperationLog(module = "体检管理", type = "新增", desc = "新增体检记录")
    public R<?> create(@RequestBody PhysicalExam exam, HttpServletRequest request) {
        Long doctorId = (Long) request.getAttribute("currentUserId");
        if (exam.getDoctorId() == null) {
            exam.setDoctorId(doctorId != null ? doctorId : 2L);
        }
        return R.ok("新增成功", examService.create(exam));
    }

    @PutMapping("/{id}")
    @OperationLog(module = "体检管理", type = "修改", desc = "修改体检记录")
    public R<?> update(@PathVariable Long id, @RequestBody PhysicalExam exam) {
        examService.update(id, exam);
        return R.ok("修改成功");
    }

    @DeleteMapping("/{id}")
    @OperationLog(module = "体检管理", type = "删除", desc = "删除体检记录")
    public R<?> delete(@PathVariable Long id) {
        examService.delete(id);
        return R.ok("删除成功");
    }

    @GetMapping("/compare")
    public R<?> compare(@RequestParam Long elderId,
                        @RequestParam(required = false) String startDate,
                        @RequestParam(required = false) String endDate) {
        return R.ok(examService.getCompareData(elderId, startDate, endDate));
    }

    @GetMapping("/stats")
    public R<?> stats(@RequestParam(required = false) Long elderId) {
        return R.ok(examService.getStats(elderId));
    }
}
