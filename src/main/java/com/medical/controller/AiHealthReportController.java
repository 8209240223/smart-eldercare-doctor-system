package com.medical.controller;

import com.medical.common.annotation.OperationLog;
import com.medical.common.annotation.RequireRole;
import com.medical.common.result.R;
import com.medical.entity.AiHealthReport;
import com.medical.service.AiHealthReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/ai/health-report")
@RequireRole({1, 2, 3})
public class AiHealthReportController {

    @Autowired
    private AiHealthReportService reportService;

    @RequireRole({2})
    @PostMapping("/generate/{elderId}")
    @OperationLog(module = "AI健康评估", type = "生成报告", desc = "生成Kimi健康评估报告")
    public R<?> generate(@PathVariable Long elderId, HttpServletRequest request) {
        AiHealthReport report = reportService.generateOrRefreshByRule(elderId, userId(request));
        return R.ok("Kimi健康评估报告已生成或刷新", report);
    }

    @RequireRole({2})
    @PostMapping("/{id}/deep-analysis")
    @OperationLog(module = "AI健康评估", type = "AI分析", desc = "使用Kimi重新分析健康报告")
    public R<?> deepAnalysis(@PathVariable Long id, HttpServletRequest request) {
        return R.ok("Kimi重新分析完成", reportService.deepAnalysis(id, userId(request)));
    }

    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id, HttpServletRequest request) {
        return R.ok(reportService.getByIdForUser(id, userId(request), userType(request)));
    }

    @RequireRole({2})
    @PutMapping("/{id}/confirm")
    @OperationLog(module = "AI健康评估", type = "确认报告", desc = "确认Kimi健康评估报告")
    public R<?> confirm(@PathVariable Long id,
                        @RequestBody(required = false) Map<String, Object> body,
                        HttpServletRequest request) {
        Object editedValue = body == null ? null : body.get("editedReportJson");
        if (editedValue == null && body != null) editedValue = body.get("editedJson");
        reportService.confirm(id, userId(request), editedValue == null ? null : editedValue.toString());
        return R.ok("报告已确认");
    }

    @RequireRole({2})
    @PutMapping("/{id}/reject")
    @OperationLog(module = "AI健康评估", type = "驳回报告", desc = "驳回Kimi健康评估报告")
    public R<?> reject(@PathVariable Long id,
                       @RequestBody Map<String, String> body,
                       HttpServletRequest request) {
        reportService.reject(id, userId(request), body.getOrDefault("reason", ""));
        return R.ok("报告已驳回");
    }

    @GetMapping("/list")
    public R<?> list(@RequestParam Long elderId,
                     @RequestParam(defaultValue = "1") Integer pageNum,
                     @RequestParam(defaultValue = "10") Integer pageSize,
                     HttpServletRequest request) {
        return R.ok(reportService.listByElderForUser(
                elderId, pageNum, pageSize, userId(request), userType(request)));
    }

    private Long userId(HttpServletRequest request) {
        return (Long) request.getAttribute("currentUserId");
    }

    private Integer userType(HttpServletRequest request) {
        return (Integer) request.getAttribute("currentUserType");
    }
}
