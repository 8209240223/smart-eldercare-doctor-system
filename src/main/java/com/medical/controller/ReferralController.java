package com.medical.controller;

import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.entity.ReferralOrder;
import com.medical.service.ReferralService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 双向转诊控制器
 */
@RestController
@RequestMapping("/api/referrals")
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

    @PostMapping
    @OperationLog(module = "双向转诊", type = "新增", desc = "创建转诊单")
    public R<?> create(@RequestBody ReferralOrder order) {
        return R.ok("创建成功", referralService.createReferral(order));
    }

    @PutMapping("/{id}/accept")
    @OperationLog(module = "双向转诊", type = "接收", desc = "接收转诊")
    public R<?> accept(@PathVariable Long id, javax.servlet.http.HttpServletRequest request) {
        referralService.acceptReferral(id,
                (Long) request.getAttribute("currentUserId"),
                (Integer) request.getAttribute("currentUserType"));
        return R.ok("已接收");
    }

    @PutMapping("/{id}/complete")
    @OperationLog(module = "双向转诊", type = "完成", desc = "完成转诊")
    public R<?> complete(@PathVariable Long id, @RequestBody Map<String, String> body,
                         javax.servlet.http.HttpServletRequest request) {
        referralService.completeReferral(id, body.get("dischargeSummary"),
                (Long) request.getAttribute("currentUserId"),
                (Integer) request.getAttribute("currentUserType"));
        return R.ok("已完成");
    }

    @PutMapping("/{id}/reject")
    @OperationLog(module = "双向转诊", type = "拒绝", desc = "拒绝转诊")
    public R<?> reject(@PathVariable Long id, @RequestBody Map<String, String> body,
                       javax.servlet.http.HttpServletRequest request) {
        referralService.rejectReferral(id, body.get("reason"),
                (Long) request.getAttribute("currentUserId"),
                (Integer) request.getAttribute("currentUserType"));
        return R.ok("已拒绝");
    }

    @PutMapping("/{id}/cancel")
    public R<?> cancel(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body,
                       javax.servlet.http.HttpServletRequest request) {
        String reason = body == null ? null : body.get("reason");
        referralService.cancelReferral(id, reason,
                (Long) request.getAttribute("currentUserId"),
                (Integer) request.getAttribute("currentUserType"));
        return R.ok("已取消");
    }
}
