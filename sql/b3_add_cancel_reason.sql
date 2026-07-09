-- =============================================================
-- 步骤 B3：转诊单表新增 cancel_reason 字段
-- 执行时间：2026-07-05
-- 适用范围：已有 medical_doctor 数据库
-- =============================================================

USE medical_doctor;

-- 检查字段是否已存在（避免重复添加报错）
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'medical_doctor'
      AND TABLE_NAME = 'referral_order'
      AND COLUMN_NAME = 'cancel_reason'
);

-- 仅在字段不存在时执行 ALTER
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE referral_order ADD COLUMN cancel_reason VARCHAR(500) DEFAULT NULL COMMENT ''取消原因'' AFTER reject_reason',
    'SELECT ''cancel_reason 已存在，跳过'' AS msg'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
