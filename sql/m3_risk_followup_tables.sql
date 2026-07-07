-- ============================================
-- 模块三：重点人群智能分层与随访任务自动生成
-- 新增数据库表
-- ============================================

-- 老人风险分层表
CREATE TABLE IF NOT EXISTS elder_risk_profile (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    risk_score INT NOT NULL DEFAULT 0 COMMENT '风险评分(总分)',
    risk_level TINYINT NOT NULL DEFAULT 1 COMMENT '风险等级:1普通 2关注 3重点 4高危',
    risk_tags VARCHAR(500) DEFAULT NULL COMMENT '风险标签(逗号分隔)',
    reason_json TEXT DEFAULT NULL COMMENT '评分原因详情(JSON格式)',
    last_calculate_time DATETIME DEFAULT NULL COMMENT '上次计算时间',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_elder_id (elder_id),
    KEY idx_risk_level (risk_level),
    KEY idx_risk_score (risk_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='老人风险分层表';

-- 随访任务表(自动生成的随访任务)
CREATE TABLE IF NOT EXISTS followup_task (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    doctor_id BIGINT DEFAULT NULL COMMENT '负责医生ID',
    task_type TINYINT NOT NULL DEFAULT 1 COMMENT '任务类型:1风险随访 2逾期随访 3预约随访',
    priority TINYINT NOT NULL DEFAULT 1 COMMENT '优先级:1低 2中 3高 4紧急',
    due_date DATE DEFAULT NULL COMMENT '截止日期',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态:0待执行 1执行中 2已完成 3已取消',
    source VARCHAR(50) DEFAULT NULL COMMENT '任务来源:RISK_AUTO表示自动生成',
    task_reason VARCHAR(500) DEFAULT NULL COMMENT '任务原因',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    finish_time DATETIME DEFAULT NULL COMMENT '完成时间',
    follow_record_id BIGINT DEFAULT NULL COMMENT '关联随访记录ID',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_doctor_id (doctor_id),
    KEY idx_status (status),
    KEY idx_due_date (due_date),
    KEY idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='随访任务表';

-- 风险评分规则配置表
CREATE TABLE IF NOT EXISTS risk_rule_config (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    rule_code VARCHAR(50) NOT NULL COMMENT '规则编码',
    rule_name VARCHAR(100) NOT NULL COMMENT '规则名称',
    score INT NOT NULL DEFAULT 0 COMMENT '规则分值',
    condition_expr VARCHAR(500) DEFAULT NULL COMMENT '触发条件表达式',
    enabled TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用:0禁用 1启用',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注说明',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_rule_code (rule_code),
    KEY idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='风险评分规则配置表';

-- 插入默认评分规则
INSERT INTO risk_rule_config (rule_code, rule_name, score, condition_expr, enabled, remark) VALUES
('AGE_OVER_80', '年龄>=80岁', 15, 'age >= 80', 1, '高龄老人风险加分'),
('CHRONIC_DISEASE_COUNT', '慢病数量>=2', 20, 'chronicDiseaseCount >= 2', 1, '多重慢病风险加分'),
('WARNING_COUNT_30', '近30天预警次数>=3', 20, 'warningCountIn30Days >= 3', 1, '频繁预警风险加分'),
('HIGH_LEVEL_WARNING', '高危预警次数>=1', 25, 'highLevelWarningCount >= 1', 1, '高危预警风险加分'),
('FOLLOWUP_OVERDUE', '随访逾期超过7天', 20, 'followupOverdueDays >= 7', 1, '随访逾期风险加分'),
('NURSING_ABNORMAL', '近30天护理异常>=2', 10, 'nursingAbnormalCount >= 2', 1, '护理异常风险加分'),
('VITAL_SIGN_ABNORMAL', '近30天体征异常>=3', 15, 'vitalSignAbnormalCount >= 3', 1, '体征异常趋势风险加分');