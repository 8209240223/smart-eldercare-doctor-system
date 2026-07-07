package com.medical.controller;

import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.service.AiConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * AI 配置管理控制器（仅管理员可访问）
 */
@RestController
@RequestMapping("/api/ai/config")
public class AiConfigController {

    @Autowired
    private AiConfigService configService;

    /**
     * 获取所有配置
     */
    @GetMapping
    public R<?> list() {
        return R.ok(configService.listAll());
    }

    /**
     * 更新单个配置
     */
    @PutMapping("/{key}")
    @OperationLog(module = "AI配置", type = "更新配置", desc = "修改AI配置项")
    public R<?> update(@PathVariable String key, @RequestBody Map<String, String> body,
                       HttpServletRequest request) {
        String value = body.get("value");
        String desc = body.get("desc");
        if (value == null || value.isEmpty()) {
            return R.fail("配置值不能为空");
        }
        configService.set(key, value, desc);
        configService.reload();
        return R.ok("配置已更新");
    }

    /**
     * 批量更新配置
     */
    @PutMapping
    @OperationLog(module = "AI配置", type = "批量更新", desc = "批量修改AI配置")
    public R<?> batchUpdate(@RequestBody Map<String, Map<String, String>> body,
                            HttpServletRequest request) {
        try {
            if (body != null) {
                for (Map.Entry<String, Map<String, String>> entry : body.entrySet()) {
                    String key = entry.getKey();
                    Map<String, String> item = entry.getValue();
                    if (item == null) continue;
                    String value = item.get("value");
                    String desc = item.get("desc");
                    configService.set(key, value != null ? value : "", desc);
                }
                configService.reload();
            }
            return R.ok("配置已更新");
        } catch (Exception e) {
            e.printStackTrace();
            return R.fail(500, "保存配置失败: " + e.getMessage());
        }
    }

    /**
     * 重新加载缓存
     */
    @PostMapping("/reload")
    public R<?> reload() {
        configService.reload();
        return R.ok("配置缓存已刷新");
    }
}
