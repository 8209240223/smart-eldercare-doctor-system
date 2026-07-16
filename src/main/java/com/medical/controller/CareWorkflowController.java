package com.medical.controller;

import com.medical.common.annotation.RequireRole;
import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.dto.CareWorkflowResult;
import com.medical.service.CareWorkflowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/care-workflows/elders")
@RequireRole({1, 2})
public class CareWorkflowController {

    @Autowired
    private CareWorkflowService careWorkflowService;

    @RequireRole({2})
    @PostMapping("/{elderId}/generate")
    @OperationLog(module = "健康管理流程", type = "生成", desc = "生成老人统一健康管理流程")
    public R<CareWorkflowResult> generate(@PathVariable Long elderId, HttpServletRequest request) {
        return R.ok("健康管理流程已生成或复用", careWorkflowService.generate(
                elderId,
                (Long) request.getAttribute("currentUserId"),
                (Integer) request.getAttribute("currentUserType")));
    }

    @GetMapping("/{elderId}/summary")
    public R<CareWorkflowResult> summary(@PathVariable Long elderId, HttpServletRequest request) {
        return R.ok(careWorkflowService.summary(
                elderId,
                (Long) request.getAttribute("currentUserId"),
                (Integer) request.getAttribute("currentUserType")));
    }
}
