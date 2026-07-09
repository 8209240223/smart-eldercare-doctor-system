package com.medical.controller;

import com.medical.common.annotation.RequireRole;
import com.medical.common.result.R;
import com.medical.service.DashboardEnhancedService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;

/**
 * 工作台增强控制器（待办、审核、慢病概览）
 */
@RestController
@RequestMapping("/api/dashboard")
@RequireRole({1, 2, 3})
public class DashboardEnhancedController {

    @Autowired
    private DashboardEnhancedService dashboardEnhancedService;

    @GetMapping("/todo")
    public R<?> getTodoList(HttpServletRequest request) {
        Long currentUserId = (Long) request.getAttribute("currentUserId");
        Integer currentUserType = (Integer) request.getAttribute("currentUserType");
        Long todoUserId = currentUserId;
        if (todoUserId == null) {
            todoUserId = 2L;
        }
        if (currentUserType != null && currentUserType == 3) {
            todoUserId = 0L;
        }
        return R.ok(dashboardEnhancedService.getTodoList(todoUserId));
    }

    @GetMapping("/review-counts")
    public R<?> getReviewCounts() {
        return R.ok(dashboardEnhancedService.getReviewCounts());
    }

    @GetMapping("/chronic-overview")
    public R<?> getChronicOverview() {
        return R.ok(dashboardEnhancedService.getChronicOverview());
    }

    @GetMapping("/key-population-stats")
    public R<?> getKeyPopulationStats() {
        return R.ok(dashboardEnhancedService.getKeyPopulationStats());
    }
}
