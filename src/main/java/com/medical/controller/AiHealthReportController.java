package com.medical.controller;

import com.medical.common.annotation.OperationLog;
import com.medical.common.annotation.RequireRole;
import com.medical.common.result.R;
import com.medical.entity.AiHealthReport;
import com.medical.service.AiHealthReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * AI 健康评估报告控制器
 */
@RestController
@RequestMapping("/api/ai/health-report")
@RequireRole({1, 2, 3})
public class AiHealthReportController {

    @Autowired
    private AiHealthReportService reportService;

    /**
     * 生成规则引擎评估报告
     */
    @RequireRole({2})
    @PostMapping("/generate/{elderId}")
    @OperationLog(module = "AI健康评估", type = "生成报告", desc = "生成规则引擎健康评估报告")
    public R<?> generate(@PathVariable Long elderId, HttpServletRequest request) {
        Long doctorId = (Long) request.getAttribute("currentUserId");
        AiHealthReport report = reportService.generateByRule(elderId, doctorId);
        return R.ok("评估报告已生成", report);
    }

    /**
     * AI 深度分析
     */
    @RequireRole({2})
    @PostMapping("/{id}/deep-analysis")
    @OperationLog(module = "AI健康评估", type = "AI分析", desc = "启动AI深度分析")
    public R<?> deepAnalysis(@PathVariable Long id, HttpServletRequest request) {
        Long doctorId = (Long) request.getAttribute("currentUserId");
        AiHealthReport report = reportService.deepAnalysis(id, doctorId);
        return R.ok("AI 深度分析完成", report);
    }

    /**
     * 查看报告详情
     */
    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id) {
        return R.ok(reportService.getById(id));
    }

    /**
     * 确认报告
     */
    @RequireRole({2})
    @PutMapping("/{id}/confirm")
    @OperationLog(module = "AI健康评估", type = "确认报告", desc = "确认AI健康评估报告")
    public R<?> confirm(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body,
                        HttpServletRequest request) {
        Long doctorId = (Long) request.getAttribute("currentUserId");
        String editedJson = body != null && body.containsKey("editedJson") ?
                body.get("editedJson").toString() : null;
        reportService.confirm(id, doctorId, editedJson);
        return R.ok("报告已确认");
    }

    /**
     * 驳回报告
     */
    @RequireRole({2})
    @PutMapping("/{id}/reject")
    @OperationLog(module = "AI健康评估", type = "驳回报告", desc = "驳回AI健康评估报告")
    public R<?> reject(@PathVariable Long id, @RequestBody Map<String, String> body,
                       HttpServletRequest request) {
        Long doctorId = (Long) request.getAttribute("currentUserId");
        String reason = body.getOrDefault("reason", "");
        reportService.reject(id, doctorId, reason);
        return R.ok("报告已驳回");
    }

    /**
     * 按老人查询报告列表
     */
    @GetMapping("/list")
    public R<?> list(@RequestParam Long elderId,
                     @RequestParam(defaultValue = "1") Integer pageNum,
                     @RequestParam(defaultValue = "10") Integer pageSize) {
        return R.ok(reportService.listByElder(elderId, pageNum, pageSize));
    }
}
