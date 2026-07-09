-- ============================================
-- 智慧医养大数据公共服务平台医生服务系统 数据库初始化脚本
-- ============================================

CREATE DATABASE IF NOT EXISTS medical_doctor DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE medical_doctor;

-- ----------------------------
-- 1. 系统用户表
-- ----------------------------
DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    avatar VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    phone VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    email VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    user_type TINYINT NOT NULL DEFAULT 2 COMMENT '用户类型:1管理员 2医生 3护士',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0禁用 1启用',
    last_login_time DATETIME DEFAULT NULL COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除:0未删除 1已删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username),
    KEY idx_phone (phone),
    KEY idx_user_type (user_type),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- ----------------------------
-- 2. 系统角色表
-- ----------------------------
DROP TABLE IF EXISTS sys_role;
CREATE TABLE sys_role (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
    role_code VARCHAR(50) NOT NULL COMMENT '角色编码',
    description VARCHAR(255) DEFAULT NULL COMMENT '角色描述',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0禁用 1启用',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_role_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统角色表';

-- ----------------------------
-- 3. 用户角色关联表
-- ----------------------------
DROP TABLE IF EXISTS sys_user_role;
CREATE TABLE sys_user_role (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_role (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- ----------------------------
-- 4. 医生信息表
-- ----------------------------
DROP TABLE IF EXISTS doctor_info;
CREATE TABLE doctor_info (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '关联用户ID',
    name VARCHAR(50) NOT NULL COMMENT '医生姓名',
    gender TINYINT NOT NULL DEFAULT 1 COMMENT '性别:1男 2女',
    phone VARCHAR(20) NOT NULL COMMENT '联系电话',
    department VARCHAR(100) NOT NULL COMMENT '所属科室',
    title VARCHAR(50) DEFAULT NULL COMMENT '职称',
    specialty VARCHAR(200) DEFAULT NULL COMMENT '专业特长',
    institution VARCHAR(200) DEFAULT NULL COMMENT '所属机构',
    license_no VARCHAR(50) DEFAULT NULL COMMENT '执业证书编号',
    service_area VARCHAR(200) DEFAULT NULL COMMENT '服务区域',
    managed_count INT NOT NULL DEFAULT 0 COMMENT '管理老人数',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0离职 1在职',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_id (user_id),
    KEY idx_department (department),
    KEY idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='医生信息表';

-- ----------------------------
-- 5. 老人信息表
-- ----------------------------
DROP TABLE IF EXISTS elder_info;
CREATE TABLE elder_info (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    gender TINYINT NOT NULL COMMENT '性别:1男 2女',
    birth_date DATE NOT NULL COMMENT '出生日期',
    id_card VARCHAR(18) NOT NULL COMMENT '身份证号',
    phone VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    emergency_contact VARCHAR(50) DEFAULT NULL COMMENT '紧急联系人',
    emergency_phone VARCHAR(20) DEFAULT NULL COMMENT '紧急联系人电话',
    nation VARCHAR(20) DEFAULT '汉族' COMMENT '民族',
    marital_status TINYINT DEFAULT NULL COMMENT '婚姻状况:1未婚 2已婚 3丧偶 4离异',
    education TINYINT DEFAULT NULL COMMENT '文化程度:1文盲 2小学 3初中 4高中 5大专以上',
    address VARCHAR(300) DEFAULT NULL COMMENT '现住址',
    community VARCHAR(200) DEFAULT NULL COMMENT '所属社区/养老机构',
    medical_insurance_type TINYINT DEFAULT NULL COMMENT '医保类型:1城镇职工 2城乡居民 3新农合 4自费',
    doctor_id BIGINT DEFAULT NULL COMMENT '责任医生ID',
    account_status TINYINT NOT NULL DEFAULT 1 COMMENT '账户状态:0停用 1启用 2注销',
    password VARCHAR(255) DEFAULT NULL COMMENT '账户密码',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (id),
    UNIQUE KEY uk_id_card (id_card),
    KEY idx_name (name),
    KEY idx_doctor_id (doctor_id),
    KEY idx_community (community),
    KEY idx_account_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='老人信息表';

-- ----------------------------
-- 6. 健康档案表
-- ----------------------------
DROP TABLE IF EXISTS health_record;
CREATE TABLE health_record (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    record_no VARCHAR(50) NOT NULL COMMENT '档案编号',
    blood_type VARCHAR(10) DEFAULT NULL COMMENT '血型',
    height DECIMAL(5,2) DEFAULT NULL COMMENT '身高cm',
    weight DECIMAL(5,2) DEFAULT NULL COMMENT '体重kg',
    medical_history TEXT DEFAULT NULL COMMENT '既往病史JSON',
    family_history TEXT DEFAULT NULL COMMENT '家族病史JSON',
    allergy_history TEXT DEFAULT NULL COMMENT '过敏史JSON',
    surgery_history TEXT DEFAULT NULL COMMENT '手术史JSON',
    current_medication TEXT DEFAULT NULL COMMENT '当前用药JSON',
    disability_status VARCHAR(200) DEFAULT NULL COMMENT '残疾情况',
    living_ability TINYINT DEFAULT NULL COMMENT '生活自理能力:1完全自理 2部分自理 3不能自理',
    smoking_status TINYINT DEFAULT NULL COMMENT '吸烟:1从不 2已戒 3吸烟',
    drinking_status TINYINT DEFAULT NULL COMMENT '饮酒:1从不 2偶尔 3经常 4每天',
    exercise_frequency TINYINT DEFAULT NULL COMMENT '运动频率:1不运动 2偶尔 3经常 4每天',
    create_doctor_id BIGINT NOT NULL COMMENT '建档医生ID',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建档日期',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_elder_id (elder_id),
    UNIQUE KEY uk_record_no (record_no),
    KEY idx_create_doctor (create_doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康档案表';

-- ----------------------------
-- 7. 体检记录表
-- ----------------------------
DROP TABLE IF EXISTS physical_exam;
CREATE TABLE physical_exam (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    doctor_id BIGINT NOT NULL COMMENT '体检医生ID',
    exam_date DATE NOT NULL COMMENT '体检日期',
    height DECIMAL(5,2) DEFAULT NULL COMMENT '身高cm',
    weight DECIMAL(5,2) DEFAULT NULL COMMENT '体重kg',
    systolic_pressure INT DEFAULT NULL COMMENT '收缩压mmHg',
    diastolic_pressure INT DEFAULT NULL COMMENT '舒张压mmHg',
    heart_rate INT DEFAULT NULL COMMENT '心率次/分',
    blood_sugar_fasting DECIMAL(4,2) DEFAULT NULL COMMENT '空腹血糖mmol/L',
    blood_sugar_random DECIMAL(4,2) DEFAULT NULL COMMENT '随机血糖mmol/L',
    temperature DECIMAL(3,1) DEFAULT NULL COMMENT '体温℃',
    exam_summary TEXT DEFAULT NULL COMMENT '体检总结',
    doctor_advice TEXT DEFAULT NULL COMMENT '医生建议',
    abnormal_flag TINYINT NOT NULL DEFAULT 0 COMMENT '是否异常:0正常 1异常',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_exam_date (exam_date),
    KEY idx_doctor_id (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='体检记录表';

-- ----------------------------
-- 8. 健康预警表
-- ----------------------------
DROP TABLE IF EXISTS health_warning;
CREATE TABLE health_warning (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    doctor_id BIGINT DEFAULT NULL COMMENT '处理医生ID',
    warning_type TINYINT NOT NULL COMMENT '预警类型:1血压 2血糖 3心率 4体温 5用药 6复诊 7其他',
    warning_level TINYINT NOT NULL COMMENT '预警等级:1黄色 2橙色 3红色',
    warning_title VARCHAR(200) NOT NULL COMMENT '预警标题',
    warning_content TEXT NOT NULL COMMENT '预警内容',
    warning_value VARCHAR(100) DEFAULT NULL COMMENT '触发值',
    threshold_value VARCHAR(100) DEFAULT NULL COMMENT '阈值',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态:0待处理 1处理中 2已处理 3已忽略',
    handle_time DATETIME DEFAULT NULL COMMENT '处理时间',
    handle_result TEXT DEFAULT NULL COMMENT '处理结果',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_doctor_id (doctor_id),
    KEY idx_status (status),
    KEY idx_warning_level (warning_level),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康预警表';

-- ----------------------------
-- 9. 随访计划表
-- ----------------------------
DROP TABLE IF EXISTS follow_plan;
CREATE TABLE follow_plan (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    doctor_id BIGINT NOT NULL COMMENT '责任医生ID',
    plan_name VARCHAR(200) NOT NULL COMMENT '计划名称',
    disease_type TINYINT NOT NULL COMMENT '病种:1高血压 2糖尿病 3精神障碍 4冠心病 5脑卒中 6老年人常规 7其他',
    frequency_type TINYINT NOT NULL COMMENT '频次:1每周 2每月 3每季度 4每半年 5每年',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE DEFAULT NULL COMMENT '结束日期',
    next_follow_date DATE DEFAULT NULL COMMENT '下次随访日期',
    total_count INT NOT NULL DEFAULT 0 COMMENT '计划总次数',
    completed_count INT NOT NULL DEFAULT 0 COMMENT '已完成次数',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0暂停 1进行中 2已完成 3已终止',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_doctor_id (doctor_id),
    KEY idx_status (status),
    KEY idx_next_follow (next_follow_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='随访计划表';

-- ----------------------------
-- 10. 随访记录表
-- ----------------------------
DROP TABLE IF EXISTS follow_record;
CREATE TABLE follow_record (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    plan_id BIGINT NOT NULL COMMENT '随访计划ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    doctor_id BIGINT NOT NULL COMMENT '随访医生ID',
    follow_date DATETIME NOT NULL COMMENT '随访日期',
    follow_type TINYINT NOT NULL COMMENT '随访方式:1门诊 2电话 3上门 4远程视频',
    disease_type TINYINT NOT NULL COMMENT '病种类型',
    symptom_desc TEXT DEFAULT NULL COMMENT '症状描述',
    systolic_pressure INT DEFAULT NULL COMMENT '收缩压',
    diastolic_pressure INT DEFAULT NULL COMMENT '舒张压',
    heart_rate INT DEFAULT NULL COMMENT '心率',
    blood_sugar_fasting DECIMAL(4,2) DEFAULT NULL COMMENT '空腹血糖',
    weight DECIMAL(5,2) DEFAULT NULL COMMENT '体重kg',
    medication_compliance TINYINT DEFAULT NULL COMMENT '服药依从性:1规律 2间断 3不服药',
    current_medication TEXT DEFAULT NULL COMMENT '当前用药情况',
    follow_result TEXT DEFAULT NULL COMMENT '随访结论',
    next_follow_date DATE DEFAULT NULL COMMENT '下次随访日期',
    is_overdue TINYINT NOT NULL DEFAULT 0 COMMENT '是否逾期:0否 1是',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_plan_id (plan_id),
    KEY idx_elder_id (elder_id),
    KEY idx_doctor_id (doctor_id),
    KEY idx_follow_date (follow_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='随访记录表';

-- ----------------------------
-- 11. 随访干预记录表
-- ----------------------------
DROP TABLE IF EXISTS intervention_record;
CREATE TABLE intervention_record (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    follow_record_id BIGINT NOT NULL COMMENT '随访记录ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    doctor_id BIGINT NOT NULL COMMENT '干预医生ID',
    intervention_type TINYINT NOT NULL COMMENT '干预类型:1药物 2饮食 3运动 4心理 5转诊 6健康教育 7其他',
    intervention_date DATETIME NOT NULL COMMENT '干预日期',
    intervention_content TEXT NOT NULL COMMENT '干预内容',
    medication_adjust TEXT DEFAULT NULL COMMENT '药物调整JSON',
    diet_guidance VARCHAR(500) DEFAULT NULL COMMENT '饮食指导',
    exercise_guidance VARCHAR(500) DEFAULT NULL COMMENT '运动指导',
    health_education VARCHAR(500) DEFAULT NULL COMMENT '健康宣教',
    target_goal VARCHAR(500) DEFAULT NULL COMMENT '干预目标',
    actual_effect TEXT DEFAULT NULL COMMENT '实际效果',
    effect_evaluation TINYINT DEFAULT NULL COMMENT '效果评价:1显著 2有效 3一般 4无效',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_follow_record_id (follow_record_id),
    KEY idx_elder_id (elder_id),
    KEY idx_doctor_id (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='随访干预记录表';

-- ----------------------------
-- 12. 健康评估记录表
-- ----------------------------
DROP TABLE IF EXISTS assessment_record;
CREATE TABLE assessment_record (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    doctor_id BIGINT NOT NULL COMMENT '评估医生ID',
    assess_type TINYINT NOT NULL COMMENT '评估类型:1日常生活能力 2认知功能 3情绪心理 4营养状况 5跌倒风险 6压疮风险 7疼痛 8社会功能 9综合',
    scale_name VARCHAR(100) NOT NULL COMMENT '量表名称',
    assess_date DATETIME NOT NULL COMMENT '评估日期',
    total_score DECIMAL(6,2) NOT NULL COMMENT '总评分',
    result_level TINYINT DEFAULT NULL COMMENT '评估等级:1正常 2轻度 3中度 4重度',
    result_desc VARCHAR(500) DEFAULT NULL COMMENT '评估结论',
    detail_scores TEXT DEFAULT NULL COMMENT '明细评分JSON',
    suggestion TEXT DEFAULT NULL COMMENT '评估建议',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_doctor_id (doctor_id),
    KEY idx_assess_type (assess_type),
    KEY idx_assess_date (assess_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康评估记录表';

-- ----------------------------
-- 13. 系统操作日志表
-- ----------------------------
DROP TABLE IF EXISTS sys_log;
CREATE TABLE sys_log (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT DEFAULT NULL COMMENT '操作用户ID',
    username VARCHAR(50) DEFAULT NULL COMMENT '操作用户名',
    operation VARCHAR(200) NOT NULL COMMENT '操作描述',
    method VARCHAR(200) DEFAULT NULL COMMENT '请求方法',
    request_url VARCHAR(500) DEFAULT NULL COMMENT '请求URL',
    request_params TEXT DEFAULT NULL COMMENT '请求参数',
    ip_address VARCHAR(50) DEFAULT NULL COMMENT '操作IP',
    execute_time BIGINT DEFAULT NULL COMMENT '执行时长ms',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态:0失败 1成功',
    error_msg TEXT DEFAULT NULL COMMENT '错误信息',
    log_type TINYINT NOT NULL DEFAULT 1 COMMENT '日志类型:1操作 2登录 3异常',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_create_time (create_time),
    KEY idx_log_type (log_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统操作日志表';

-- ============================================
-- 初始化数据
-- ============================================

-- 初始化角色
INSERT INTO sys_role (role_name, role_code, description) VALUES
('系统管理员', 'ADMIN', '系统管理员，拥有所有权限'),
('医生', 'DOCTOR', '医生角色，负责老人健康管理'),
('护士', 'NURSE', '护士角色，协助医生工作');

-- 初始化管理员账号（密码: admin123）
INSERT INTO sys_user (username, password, real_name, phone, user_type, status) VALUES
('admin', 'admin123', '系统管理员', '13800000000', 1, 1);

-- 初始化测试医生账号（密码: doctor123）
INSERT INTO sys_user (username, password, real_name, phone, user_type, status) VALUES
('doctor01', 'doctor123', '张医生', '13800000001', 2, 1);

-- 关联角色
INSERT INTO sys_user_role (user_id, role_id) VALUES (1, 1), (2, 2);

-- 初始化医生信息
INSERT INTO doctor_info (user_id, name, gender, phone, department, title, institution, service_area) VALUES
(2, '张医生', 1, '13800000001', '全科医学科', '主治医师', '社区卫生服务中心', '阳光社区');

-- 初始化测试老人数据
INSERT INTO elder_info (name, gender, birth_date, id_card, phone, emergency_contact, emergency_phone, address, community, medical_insurance_type, doctor_id) VALUES
('王大爷', 1, '1945-03-15', '110101194503150011', '13900000001', '王小明', '13900000002', '北京市朝阳区阳光社区1号楼', '阳光社区', 1, 1),
('李奶奶', 2, '1948-07-20', '110101194807200022', '13900000003', '李小红', '13900000004', '北京市朝阳区阳光社区2号楼', '阳光社区', 2, 1),
('赵大爷', 1, '1950-11-08', '110101195011080033', '13900000005', '赵小刚', '13900000006', '北京市朝阳区阳光社区3号楼', '阳光社区', 1, 1);

-- 初始化健康档案
INSERT INTO health_record (elder_id, record_no, blood_type, height, weight, medical_history, living_ability, smoking_status, drinking_status, create_doctor_id) VALUES
(1, 'HR202401001', 'A', 170.00, 68.50, '["高血压","冠心病"]', 1, 2, 1, 1),
(2, 'HR202401002', 'B', 158.00, 55.00, '["糖尿病","骨质疏松"]', 1, 1, 1, 1),
(3, 'HR202401003', 'O', 175.00, 72.00, '["高血压"]', 1, 3, 2, 1);

