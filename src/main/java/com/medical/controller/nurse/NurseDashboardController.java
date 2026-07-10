package com.medical.controller.nurse;

import com.medical.common.annotation.RequireRole;
import com.medical.common.result.R;
import com.medical.service.NurseDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 护士工作台控制器
 */
@RestController
@RequestMapping("/api/nurse/dashboard")
@RequireRole({1, 2, 3})
public class NurseDashboardController {

    @Autowired
    private NurseDashboardService nurseDashboardService;

    @GetMapping("/stats")
    public R<?> getStats(@RequestAttribute Long currentUserId,
                         @RequestAttribute Integer currentUserType) {
        Long nurseId = Integer.valueOf(3).equals(currentUserType) ? currentUserId : null;
        return R.ok(nurseDashboardService.getStats(nurseId));
    }

    @GetMapping("/tasks")
    public R<?> getTodayTasks(@RequestAttribute Long currentUserId,
                              @RequestAttribute Integer currentUserType) {
        Long nurseId = Integer.valueOf(3).equals(currentUserType) ? currentUserId : null;
        return R.ok(nurseDashboardService.getTodayTasks(nurseId));
    }
}
