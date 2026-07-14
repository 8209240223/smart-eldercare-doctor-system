package com.medical.controller;

import com.medical.common.annotation.RequireRole;
import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.entity.ReferralOrder;
import com.medical.service.ReferralService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 医生间患者移交控制器
 */
@RestController
@RequestMapping("/api/referrals")
@RequireRole({1, 2})
public class ReferralController {

    @Autowired
    private ReferralService referralService;

    @GetMapping
    public R<?> list(@RequestParam(defaultValue = "1") Integer pageNum,
                     @RequestParam(defaultValue = "10") Integer pageSize,
                     @RequestParam(required = false) Long doctorId,
                     @RequestParam(required = false) Integer status,
                     @RequestParam(required = false) Integer referralType) {
        return R.ok(referralService.listReferrals(pageNum, pageSize, doctorId, status, referralType));
    }

    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id) {
        return R.ok(referralService.getDetail(id));
    }

    @GetMapping("/stats")
    public R<?> stats() {
        return R.ok(referralService.getStats());
    }

    @GetMapping("/doctor-options")
    public R<?> doctorOptions(javax.servlet.http.HttpServletRequest request) {
        return R.ok(referralService.listTargetDoctors(
                (Long) request.getAttribute("currentUserId")));
    }

    @RequireRole({2})
    @PostMapping
    @OperationLog(module = "患者移交", type = "新增", desc = "创建医生间患者移交申请")
    public R<?> create(@RequestBody ReferralOrder order,
                       javax.servlet.http.HttpServletRequest request) {
        return R.ok("移交申请已创建", referralService.createReferral(order,
                (Long) request.getAttribute("currentUserId"),
                (Integer) request.getAttribute("currentUserType")));
    }

    @RequireRole({2})
    @PutMapping("/{id}/accept")
    @OperationLog(module = "患者移交", type = "接收", desc = "接收患者移交申请")
    public R<?> accept(@PathVariable Long id, javax.servlet.http.HttpServletRequest request) {
        referralService.acceptReferral(id,
                (Long) request.getAttribute("currentUserId"),
                (Integer) request.getAttribute("currentUserType"));
        return R.ok("已接收患者移交申请");
    }

    @RequireRole({2})
    @PutMapping("/{id}/complete")
    @OperationLog(module = "患者移交", type = "完成", desc = "完成患者及关联工作流移交")
    public R<?> complete(@PathVariable Long id, @RequestBody Map<String, String> body,
                         javax.servlet.http.HttpServletRequest request) {
        referralService.completeReferral(id, body.get("dischargeSummary"),
                (Long) request.getAttribute("currentUserId"),
                (Integer) request.getAttribute("currentUserType"));
        return R.ok("患者移交已完成");
    }

    @RequireRole({2})
    @PutMapping("/{id}/reject")
    @OperationLog(module = "患者移交", type = "拒绝", desc = "拒绝患者移交申请")
    public R<?> reject(@PathVariable Long id, @RequestBody Map<String, String> body,
                       javax.servlet.http.HttpServletRequest request) {
        referralService.rejectReferral(id, body.get("reason"),
                (Long) request.getAttribute("currentUserId"),
                (Integer) request.getAttribute("currentUserType"));
        return R.ok("患者移交申请已拒绝");
    }

    @RequireRole({2})
    @PutMapping("/{id}/cancel")
    public R<?> cancel(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body,
                       javax.servlet.http.HttpServletRequest request) {
        String reason = body == null ? null : body.get("reason");
        referralService.cancelReferral(id, reason,
                (Long) request.getAttribute("currentUserId"),
                (Integer) request.getAttribute("currentUserType"));
        return R.ok("患者移交申请已取消");
    }
}
