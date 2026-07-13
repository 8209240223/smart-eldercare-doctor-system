-- ============================================
-- AI 健康评估报告模块 — 建表脚本
-- 包含：ai_health_report（报告主表）
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
