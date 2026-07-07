-- ============================================
-- AI 健康评估报告模块 — 建表脚本
-- 包含：ai_health_report（报告主表）、ai_config（API配置）
-- ============================================

-- AI 健康评估报告主表
CREATE TABLE IF NOT EXISTS ai_health_report (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    doctor_id BIGINT DEFAULT NULL COMMENT '生成/确认医生ID',
    source TINYINT NOT NULL DEFAULT 1 COMMENT '来源:1规则引擎 2AI引擎',
    risk_score INT DEFAULT 0 COMMENT '风险评分(0-100)',
    risk_level VARCHAR(20) DEFAULT NULL COMMENT '风险等级:LOW/MEDIUM/HIGH/CRITICAL',
    report_json TEXT DEFAULT NULL COMMENT '结构化报告JSON',
    status TINYINT DEFAULT 0 COMMENT '状态:0草稿 1已确认 2已驳回 3已归档',
    model_name VARCHAR(50) DEFAULT NULL COMMENT '使用的模型名称(规则引擎为rule-engine)',
    prompt_version VARCHAR(20) DEFAULT NULL COMMENT '提示词模板版本号',
    reject_reason VARCHAR(500) DEFAULT NULL COMMENT '驳回原因',
    edited_report_json TEXT DEFAULT NULL COMMENT '医生编辑后的报告JSON',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间',
    confirm_time DATETIME DEFAULT NULL COMMENT '确认时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_doctor_id (doctor_id),
    KEY idx_status (status),
    KEY idx_source (source),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI健康评估报告表';

-- API 配置表（管理员在后台管理页面设置）
CREATE TABLE IF NOT EXISTS ai_config (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    config_key VARCHAR(100) NOT NULL COMMENT '配置键',
    config_value VARCHAR(2000) DEFAULT NULL COMMENT '配置值',
    config_desc VARCHAR(255) DEFAULT NULL COMMENT '配置说明',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI配置表';

-- 插入默认配置
INSERT IGNORE INTO ai_config (config_key, config_value, config_desc) VALUES
('ai.api_key', '', 'DeepSeek API Key'),
('ai.base_url', 'https://api.deepseek.com', 'API 基础地址'),
('ai.model', 'deepseek-chat', '模型名称'),
('ai.mock_enabled', 'true', '是否启用Mock模式:true/false'),
('ai.max_per_day', '20', '每个医生每日最大AI调用次数'),
('ai.timeout_seconds', '30', 'AI调用超时时间(秒)'),
('ai.max_retries', '2', 'AI调用失败重试次数');
