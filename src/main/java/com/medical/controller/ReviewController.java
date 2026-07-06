package com.medical.controller;

import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * 护士工作审核控制器
 */
@RestController
@RequestMapping("/api/review")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    // ========== 护理记录审核 ==========

    @GetMapping("/records")
    public R<?> listPendingRecords(@RequestParam(defaultValue = "1") Integer pageNum,
                                   @RequestParam(defaultValue = "10") Integer pageSize) {
        return R.ok(reviewService.listPendingRecords(pageNum, pageSize));
    }

    @PostMapping("/records/{id}/approve")
    @OperationLog(module = "护士审核", type = "审核通过", desc = "审核通过护理记录")
    public R<?> approveRecord(@PathVariable Long id,
                              @RequestBody(required = false) Map<String, String> body,
                              HttpServletRequest request) {
        Long doctorId = (Long) request.getAttribute("currentUserId");
        String comment = body != null ? body.getOrDefault("comment", "") : "";
        reviewService.reviewRecord(id, doctorId != null ? doctorId : 2L, comment, 1);
        return R.ok("审核通过，已处理该异常记录");
    }

    @PostMapping("/records/{id}/reject")
    @OperationLog(module = "护士审核", type = "驳回", desc = "驳回护理记录")
    public R<?> rejectRecord(@PathVariable Long id,
                             @RequestBody Map<String, String> body,
                             HttpServletRequest request) {
        Long doctorId = (Long) request.getAttribute("currentUserId");
        String comment = body != null ? body.getOrDefault("comment", "") : "";
        reviewService.reviewRecord(id, doctorId != null ? doctorId : 2L, comment, 2);
        return R.ok("已驳回，请护士重新提交");
    }

    // ========== 护理计划审核 ==========

    @GetMapping("/plans")
    public R<?> listPendingPlans(@RequestParam(defaultValue = "1") Integer pageNum,
                                 @RequestParam(defaultValue = "10") Integer pageSize) {
        return R.ok(reviewService.listPendingPlans(pageNum, pageSize));
    }

    @PostMapping("/plans/{id}/approve")
    @OperationLog(module = "护士审核", type = "审核通过", desc = "审核通过护理计划")
    public R<?> approvePlan(@PathVariable Long id, HttpServletRequest request) {
        Long doctorId = (Long) request.getAttribute("currentUserId");
        reviewService.reviewPlan(id, doctorId != null ? doctorId : 2L, 1);
        return R.ok("审核通过，护理计划已生效");
    }

    @PostMapping("/plans/{id}/reject")
    @OperationLog(module = "护士审核", type = "驳回", desc = "驳回护理计划")
    public R<?> rejectPlan(@PathVariable Long id, HttpServletRequest request) {
        Long doctorId = (Long) request.getAttribute("currentUserId");
        reviewService.reviewPlan(id, doctorId != null ? doctorId : 2L, 2);
        return R.ok("已驳回该护理计划");
    }

    @GetMapping("/stats")
    public R<?> stats() {
        return R.ok(reviewService.getReviewStats());
    }
}
