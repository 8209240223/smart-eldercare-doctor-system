package com.medical.controller;

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
public class DashboardEnhancedController {

    @Autowired
    private DashboardEnhancedService dashboardEnhancedService;

    @GetMapping("/todo")
    public R<?> getTodoList(HttpServletRequest request) {
        Long doctorId = (Long) request.getAttribute("currentUserId");
        return R.ok(dashboardEnhancedService.getTodoList(doctorId != null ? doctorId : 2L));
    }

    @GetMapping("/review-counts")
    public R<?> getReviewCounts() {
        return R.ok(dashboardEnhancedService.getReviewCounts());
    }

    @GetMapping("/chronic-overview")
    public R<?> getChronicOverview() {
        return R.ok(dashboardEnhancedService.getChronicOverview());
    }
}
