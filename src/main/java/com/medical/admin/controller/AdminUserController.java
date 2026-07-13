package com.medical.admin.controller;

import com.medical.admin.dto.AdminCreateUserRequest;
import com.medical.admin.dto.AdminResetPasswordRequest;
import com.medical.admin.dto.AdminReviewRequest;
import com.medical.admin.dto.AdminUserQuery;
import com.medical.admin.service.AdminUserService;
import com.medical.common.annotation.OperationLog;
import com.medical.common.annotation.RequireRole;
import com.medical.common.exception.BusinessException;
import com.medical.common.result.R;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/admin/users")
@RequireRole({1})
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public R<?> listUsers(@ModelAttribute AdminUserQuery query) {
        return R.ok(adminUserService.listUsers(query));
    }

    @GetMapping("/stats")
    public R<?> statistics() {
        return R.ok(adminUserService.getStatistics());
    }

    @PostMapping
    @OperationLog(module = "用户治理", type = "创建", desc = "管理员创建用户")
    public R<?> createUser(@RequestBody AdminCreateUserRequest request) {
        return R.ok("创建成功", adminUserService.createUser(request));
    }

    @PutMapping("/{id}/review")
    @OperationLog(module = "用户治理", type = "审核", desc = "审核注册用户")
    public R<?> reviewUser(@PathVariable Long id, @RequestBody AdminReviewRequest request) {
        adminUserService.reviewUser(id, request);
        return R.ok("审核完成");
    }

    @PutMapping("/{id}/approve")
    @OperationLog(module = "用户治理", type = "审核通过", desc = "通过注册用户审核")
    public R<?> approveUser(@PathVariable Long id) {
        adminUserService.approveUser(id);
        return R.ok("审核已通过");
    }

    @PutMapping("/{id}/reject")
    @OperationLog(module = "用户治理", type = "审核驳回", desc = "驳回注册用户审核")
    public R<?> rejectUser(@PathVariable Long id) {
        adminUserService.rejectUser(id);
        return R.ok("审核已驳回");
    }

    @PutMapping({"/{id}/ban", "/{id}/disable"})
    @OperationLog(module = "用户治理", type = "封禁", desc = "封禁用户账号")
    public R<?> banUser(@PathVariable Long id, HttpServletRequest request) {
        adminUserService.banUser(id, currentAdminId(request));
        return R.ok("账号已封禁");
    }

    @PutMapping({"/{id}/unban", "/{id}/enable"})
    @OperationLog(module = "用户治理", type = "解封", desc = "解封用户账号")
    public R<?> unbanUser(@PathVariable Long id) {
        adminUserService.unbanUser(id);
        return R.ok("账号已解封");
    }

    @PutMapping({"/{id}/reset-password", "/{id}/password"})
    @OperationLog(module = "用户治理", type = "重置密码", desc = "管理员重置用户密码")
    public R<?> resetPassword(@PathVariable Long id,
                              @RequestBody AdminResetPasswordRequest request) {
        adminUserService.resetPassword(id, request);
        return R.ok("密码已重置，用户需要重新登录");
    }

    @PostMapping({"/{id}/force-logout", "/{id}/logout"})
    @OperationLog(module = "用户治理", type = "强制下线", desc = "强制用户会话下线")
    public R<?> forceLogout(@PathVariable Long id) {
        adminUserService.forceLogout(id);
        return R.ok("用户已下线");
    }

    @DeleteMapping("/{id}/sessions")
    @OperationLog(module = "用户治理", type = "强制下线", desc = "撤销用户全部会话")
    public R<?> revokeSessions(@PathVariable Long id) {
        adminUserService.forceLogout(id);
        return R.ok("用户会话已撤销");
    }

    private Long currentAdminId(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("currentUserId");
        if (userId == null) {
            throw new BusinessException(401, "管理员未登录");
        }
        return userId;
    }
}
