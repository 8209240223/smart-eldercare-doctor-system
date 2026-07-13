package com.medical.controller;

import com.medical.common.annotation.RequireRole;
import com.medical.common.annotation.OperationLog;
import com.medical.common.exception.BusinessException;
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
@RequireRole({1, 2})
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    // ========== 护理记录审核 ==========

    @GetMapping("/records")
    public R<?> listPendingRecords(@RequestParam(defaultValue = "1") Integer pageNum,
                                   @RequestParam(defaultValue = "10") Integer pageSize,
                                   HttpServletRequest request) {
        Integer userType = (Integer) request.getAttribute("currentUserType");
        Long doctorId = userType != null && userType == 2 ? (Long) request.getAttribute("currentUserId") : null;
        return R.ok(reviewService.listPendingRecords(pageNum, pageSize, doctorId));
    }

    @GetMapping("/records/history")
    public R<?> listReviewedRecords(@RequestParam(defaultValue = "1") Integer pageNum,
                                    @RequestParam(defaultValue = "10") Integer pageSize,
                                    HttpServletRequest request) {
        Integer userType = (Integer) request.getAttribute("currentUserType");
        Long doctorId = userType != null && userType == 2 ? (Long) request.getAttribute("currentUserId") : null;
        return R.ok(reviewService.listReviewedRecords(pageNum, pageSize, doctorId));
    }

    @RequireRole({2})
    @PostMapping("/records/{id}/approve")
    @OperationLog(module = "护士审核", type = "审核通过", desc = "审核通过护理记录")
    public R<?> approveRecord(@PathVariable Long id,
                              @RequestBody(required = false) Map<String, String> body,
                              HttpServletRequest request) {
        Long doctorId = (Long) request.getAttribute("currentUserId");
        String comment = body != null ? body.getOrDefault("comment", "") : "";
        reviewService.reviewRecord(id, requireCurrentUserId(doctorId), comment, 1);
        return R.ok("审核通过，已处理该异常记录");
    }

    @RequireRole({2})
    @PostMapping("/records/{id}/reject")
    @OperationLog(module = "护士审核", type = "驳回", desc = "驳回护理记录")
    public R<?> rejectRecord(@PathVariable Long id,
                             @RequestBody Map<String, String> body,
                             HttpServletRequest request) {
        Long doctorId = (Long) request.getAttribute("currentUserId");
        String comment = body != null ? body.getOrDefault("comment", "") : "";
        reviewService.reviewRecord(id, requireCurrentUserId(doctorId), comment, 2);
        return R.ok("已驳回，请护士重新提交");
    }

    // ========== 护理计划审核 ==========

    @GetMapping("/plans")
    public R<?> listPendingPlans(@RequestParam(defaultValue = "1") Integer pageNum,
                                 @RequestParam(defaultValue = "10") Integer pageSize,
                                 HttpServletRequest request) {
        Integer userType = (Integer) request.getAttribute("currentUserType");
        Long doctorId = userType != null && userType == 2 ? (Long) request.getAttribute("currentUserId") : null;
        return R.ok(reviewService.listPendingPlans(pageNum, pageSize, doctorId));
    }

    @GetMapping("/plans/history")
    public R<?> listReviewedPlans(@RequestParam(defaultValue = "1") Integer pageNum,
                                  @RequestParam(defaultValue = "10") Integer pageSize,
                                  HttpServletRequest request) {
        Integer userType = (Integer) request.getAttribute("currentUserType");
        Long doctorId = userType != null && userType == 2 ? (Long) request.getAttribute("currentUserId") : null;
        return R.ok(reviewService.listReviewedPlans(pageNum, pageSize, doctorId));
    }

    @RequireRole({2})
    @PostMapping("/plans/{id}/approve")
    @OperationLog(module = "护士审核", type = "审核通过", desc = "审核通过护理计划")
    public R<?> approvePlan(@PathVariable Long id, HttpServletRequest request) {
        Long doctorId = (Long) request.getAttribute("currentUserId");
        reviewService.reviewPlan(id, requireCurrentUserId(doctorId), 1);
        return R.ok("审核通过，护理计划已生效");
    }

    @RequireRole({2})
    @PostMapping("/plans/{id}/reject")
    @OperationLog(module = "护士审核", type = "驳回", desc = "驳回护理计划")
    public R<?> rejectPlan(@PathVariable Long id, HttpServletRequest request) {
        Long doctorId = (Long) request.getAttribute("currentUserId");
        reviewService.reviewPlan(id, requireCurrentUserId(doctorId), 2);
        return R.ok("已驳回该护理计划");
    }

    @GetMapping("/stats")
    public R<?> stats(HttpServletRequest request) {
        Integer userType = (Integer) request.getAttribute("currentUserType");
        Long doctorId = userType != null && userType == 2 ? (Long) request.getAttribute("currentUserId") : null;
        return R.ok(reviewService.getReviewStats(doctorId));
    }

    private Long requireCurrentUserId(Long currentUserId) {
        if (currentUserId == null) {
            throw new BusinessException(401, "登录身份已失效，请重新登录");
        }
        return currentUserId;
    }
}
