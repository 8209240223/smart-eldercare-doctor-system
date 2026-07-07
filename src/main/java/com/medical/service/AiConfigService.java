package com.medical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.entity.AiConfig;
import com.medical.mapper.AiConfigMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * AI 配置服务 — 缓存配置项，支持管理页面动态修改
 */
@Service
public class AiConfigService {

    @Autowired
    private AiConfigMapper configMapper;

    /** 内存缓存，避免每次读库 */
    private final Map<String, String> cache = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        try {
            reload();
        } catch (Exception e) {
            // 表不存在时使用默认值，不阻塞启动
            System.err.println("[AI配置] 数据库表 ai_config 尚未创建，使用默认配置。请执行 sql/add_ai_health_report.sql");
        }
    }

    /**
     * 重新加载所有配置
     */
    public void reload() {
        try {
            List<AiConfig> configs = configMapper.selectList(null);
            for (AiConfig c : configs) {
                cache.put(c.getConfigKey(), c.getConfigValue());
            }
        } catch (Exception e) {
            // 表不存在时忽略
        }
    }

    public String get(String key) {
        return cache.getOrDefault(key, "");
    }

    public String get(String key, String defaultValue) {
        return cache.getOrDefault(key, defaultValue);
    }

    public boolean getBool(String key, boolean defaultValue) {
        String val = cache.get(key);
        if (val == null) return defaultValue;
        return "true".equalsIgnoreCase(val.trim());
    }

    public int getInt(String key, int defaultValue) {
        String val = cache.get(key);
        if (val == null || val.isEmpty()) return defaultValue;
        try { return Integer.parseInt(val.trim()); } catch (NumberFormatException e) { return defaultValue; }
    }

    /**
     * 更新单个配置（表不存在时仅写缓存，优雅降级）
     */
    public void set(String key, String value, String desc) {
        cache.put(key, value);
        try {
            AiConfig existing = configMapper.selectOne(
                    new LambdaQueryWrapper<AiConfig>().eq(AiConfig::getConfigKey, key));
            if (existing != null) {
                existing.setConfigValue(value);
                if (desc != null) existing.setConfigDesc(desc);
                configMapper.updateById(existing);
            } else {
                AiConfig config = new AiConfig();
                config.setConfigKey(key);
                config.setConfigValue(value);
                config.setConfigDesc(desc);
                configMapper.insert(config);
            }
        } catch (Exception e) {
            System.err.println("[AI配置] 数据库写入失败（缓存已更新）: " + e.getMessage());
        }
    }

    /**
     * 获取所有配置（供管理页面展示，表不存在时返回空）
     */
    public List<AiConfig> listAll() {
        try {
            return configMapper.selectList(null);
        } catch (Exception e) {
            return java.util.Collections.emptyList();
        }
    }

    /** 便捷方法 */
    public boolean isMockEnabled() { return getBool("ai.mock_enabled", true); }
    public String getApiKey() { return get("ai.api_key", ""); }
    public String getBaseUrl() { return get("ai.base_url", "https://api.deepseek.com"); }
    public String getModel() { return get("ai.model", "deepseek-chat"); }
    public int getMaxPerDay() { return getInt("ai.max_per_day", 20); }
    public int getTimeoutSeconds() { return getInt("ai.timeout_seconds", 30); }
    public int getMaxRetries() { return getInt("ai.max_retries", 2); }
}
