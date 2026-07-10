package com.medical.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.result.R;
import com.medical.service.RiskProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 风险分层控制器
 */
@RestController
@RequestMapping("/api/risk")
public class RiskProfileController {

    @Autowired
    private RiskProfileService riskProfileService;

    /**
     * 手动触发全量风险计算
     */
    @PostMapping("/elders/calculate")
    public R<Integer> calculateAllRisk() {
        int count = riskProfileService.calculateAllRisk();
        return R.ok("完成风险计算，共计算" + count + "位老人", count);
    }

    /**
     * 重点人群列表
     */
    @GetMapping("/elders")
    public R<Page<Map<String, Object>>> getKeyPopulationList(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Integer riskLevel,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) String community) {
        Page<Map<String, Object>> page = riskProfileService.getKeyPopulationList(
                pageNum, pageSize, riskLevel, doctorId, community);
        return R.ok(page);
    }

    /**
     * 老人风险画像详情
     */
    @GetMapping("/elders/{elderId}")
    public R<Map<String, Object>> getRiskProfileDetail(@PathVariable Long elderId) {
        Map<String, Object> detail = riskProfileService.getRiskProfileDetail(elderId);
        return R.ok(detail);
    }

    /**
     * 风险等级统计
     */
    @GetMapping("/stats")
    public R<Map<String, Object>> getRiskLevelStats() {
        Map<String, Object> stats = riskProfileService.getRiskLevelStats();
        return R.ok(stats);
    }

    /**
     * 单个老人风险计算(测试用)
     */
    @PostMapping("/elders/{elderId}/calculate")
    public R<Map<String, Object>> calculateRisk(@PathVariable Long elderId) {
        riskProfileService.calculateRisk(elderId);
        Map<String, Object> result = riskProfileService.getRiskProfileDetail(elderId);
        return R.ok("风险评分计算完成", result);
    }
}
