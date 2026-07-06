-- ============================================
-- 智慧医养大数据公共服务平台医生服务系统 MySQL 建表脚本
-- ============================================

-- 系统用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password VARCHAR(200) NOT NULL COMMENT '密码',
    real_name VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
    phone VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    email VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    avatar VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    user_type TINYINT DEFAULT 2 COMMENT '用户类型:1管理员 2医生 3护士',
    status TINYINT DEFAULT 1 COMMENT '状态:0停用 1正常',
    last_login_time DATETIME DEFAULT NULL COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除:0未删除 1已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username),
    KEY idx_phone (phone),
    KEY idx_user_type (user_type),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- 系统角色表
CREATE TABLE IF NOT EXISTS sys_role (
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

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS sys_user_role (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    role_id BIGINT NOT NULL COMMENT '角色ID',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_role (user_id, role_id),
    KEY idx_user_id (user_id),
    KEY idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- 医生信息表
CREATE TABLE IF NOT EXISTS doctor_info (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '关联用户ID',
    name VARCHAR(50) DEFAULT NULL COMMENT '医生姓名',
    gender TINYINT DEFAULT 1 COMMENT '性别:1男 2女',
    title VARCHAR(50) DEFAULT NULL COMMENT '职称',
    department VARCHAR(100) DEFAULT NULL COMMENT '科室',
    specialty VARCHAR(200) DEFAULT NULL COMMENT '专业特长',
    hospital VARCHAR(200) DEFAULT NULL COMMENT '所属机构',
    license_no VARCHAR(100) DEFAULT NULL COMMENT '执业证书编号',
    status TINYINT DEFAULT 1 COMMENT '状态:0离职 1在职',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_id (user_id),
    KEY idx_department (department),
    KEY idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='医生信息表';

-- 老人信息表
CREATE TABLE IF NOT EXISTS elder_info (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    gender TINYINT DEFAULT 1 COMMENT '性别:1男 2女',
    birth_date DATE DEFAULT NULL COMMENT '出生日期',
    id_card VARCHAR(18) DEFAULT NULL COMMENT '身份证号',
    phone VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    address VARCHAR(300) DEFAULT NULL COMMENT '现住址',
    community VARCHAR(100) DEFAULT NULL COMMENT '所属社区/养老机构',
    emergency_contact VARCHAR(50) DEFAULT NULL COMMENT '紧急联系人',
    emergency_phone VARCHAR(20) DEFAULT NULL COMMENT '紧急联系人电话',
    nation VARCHAR(20) DEFAULT '汉族' COMMENT '民族',
    marital_status INT DEFAULT NULL COMMENT '婚姻状况',
    education INT DEFAULT NULL COMMENT '文化程度',
    medical_insurance_type INT DEFAULT NULL COMMENT '医保类型',
    doctor_id BIGINT DEFAULT NULL COMMENT '责任医生ID',
    account_status TINYINT DEFAULT 1 COMMENT '账户状态:0停用 1启用 2注销',
    password VARCHAR(200) DEFAULT NULL COMMENT '账户密码',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_id_card (id_card),
    KEY idx_name (name),
    KEY idx_doctor_id (doctor_id),
    KEY idx_community (community),
    KEY idx_account_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='老人信息表';

-- 健康档案表
CREATE TABLE IF NOT EXISTS health_record (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    record_no VARCHAR(50) DEFAULT NULL COMMENT '档案编号',
    blood_type VARCHAR(10) DEFAULT NULL COMMENT '血型',
    height DECIMAL(5,2) DEFAULT NULL COMMENT '身高cm',
    weight DECIMAL(5,2) DEFAULT NULL COMMENT '体重kg',
    medical_history TEXT DEFAULT NULL COMMENT '既往病史JSON',
    family_history TEXT DEFAULT NULL COMMENT '家族病史JSON',
    allergy_history TEXT DEFAULT NULL COMMENT '过敏史JSON',
    surgery_history TEXT DEFAULT NULL COMMENT '手术史JSON',
    current_medication TEXT DEFAULT NULL COMMENT '当前用药JSON',
    disability_status VARCHAR(200) DEFAULT NULL COMMENT '残疾情况',
    living_ability INT DEFAULT NULL COMMENT '生活自理能力',
    smoking_status INT DEFAULT NULL COMMENT '吸烟情况',
    drinking_status INT DEFAULT NULL COMMENT '饮酒情况',
    exercise_frequency INT DEFAULT NULL COMMENT '运动频率',
    create_doctor_id BIGINT DEFAULT NULL COMMENT '建档医生ID',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建档日期',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_elder_id (elder_id),
    UNIQUE KEY uk_record_no (record_no),
    KEY idx_create_doctor (create_doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康档案表';

-- 健康预警表
CREATE TABLE IF NOT EXISTS health_warning (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    doctor_id BIGINT DEFAULT NULL COMMENT '处理医生ID',
    warning_type TINYINT DEFAULT NULL COMMENT '预警类型:1血压 2血糖 3心率 4体温 5用药 6复诊 7其他',
    warning_level TINYINT DEFAULT 1 COMMENT '预警等级:1黄色 2橙色 3红色',
    warning_title VARCHAR(200) DEFAULT NULL COMMENT '预警标题',
    warning_content VARCHAR(1000) DEFAULT NULL COMMENT '预警内容',
    warning_value VARCHAR(100) DEFAULT NULL COMMENT '触发值',
    threshold_value VARCHAR(100) DEFAULT NULL COMMENT '阈值',
    status TINYINT DEFAULT 0 COMMENT '状态:0待处理 1处理中 2已处理 3已忽略',
    handle_result VARCHAR(500) DEFAULT NULL COMMENT '处理结果',
    handle_time DATETIME DEFAULT NULL COMMENT '处理时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_doctor_id (doctor_id),
    KEY idx_status (status),
    KEY idx_warning_level (warning_level),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康预警表';

-- 随访计划表
CREATE TABLE IF NOT EXISTS follow_plan (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    plan_name VARCHAR(200) NOT NULL COMMENT '计划名称',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    doctor_id BIGINT DEFAULT NULL COMMENT '责任医生ID',
    disease_type TINYINT DEFAULT NULL COMMENT '病种:1高血压 2糖尿病 3精神障碍 4冠心病 5脑卒中 6老年人常规 7其他',
    frequency_type TINYINT DEFAULT NULL COMMENT '频次:1每周 2每月 3每季度 4每半年 5每年',
    start_date DATE DEFAULT NULL COMMENT '开始日期',
    end_date DATE DEFAULT NULL COMMENT '结束日期',
    next_follow_date DATE DEFAULT NULL COMMENT '下次随访日期',
    total_count INT DEFAULT 12 COMMENT '计划总次数',
    completed_count INT DEFAULT 0 COMMENT '已完成次数',
    status TINYINT DEFAULT 1 COMMENT '状态:0暂停 1进行中 2已完成 3已终止',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_doctor_id (doctor_id),
    KEY idx_status (status),
    KEY idx_next_follow (next_follow_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='随访计划表';

-- 随访记录表
CREATE TABLE IF NOT EXISTS follow_record (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    plan_id BIGINT DEFAULT NULL COMMENT '随访计划ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    doctor_id BIGINT DEFAULT NULL COMMENT '随访医生ID',
    follow_date DATETIME DEFAULT NULL COMMENT '随访日期',
    follow_type TINYINT DEFAULT NULL COMMENT '随访方式:1门诊 2电话 3上门 4远程',
    disease_type TINYINT DEFAULT NULL COMMENT '病种类型',
    symptom_desc VARCHAR(500) DEFAULT NULL COMMENT '症状描述',
    systolic_pressure INT DEFAULT NULL COMMENT '收缩压',
    diastolic_pressure INT DEFAULT NULL COMMENT '舒张压',
    heart_rate INT DEFAULT NULL COMMENT '心率',
    blood_sugar_fasting DECIMAL(5,2) DEFAULT NULL COMMENT '空腹血糖',
    weight DECIMAL(5,2) DEFAULT NULL COMMENT '体重kg',
    medication_compliance INT DEFAULT NULL COMMENT '服药依从性',
    current_medication VARCHAR(500) DEFAULT NULL COMMENT '当前用药情况',
    follow_result VARCHAR(1000) DEFAULT NULL COMMENT '随访结论',
    next_follow_date DATE DEFAULT NULL COMMENT '下次随访日期',
    is_overdue INT DEFAULT 0 COMMENT '是否逾期:0否 1是',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_plan_id (plan_id),
    KEY idx_elder_id (elder_id),
    KEY idx_doctor_id (doctor_id),
    KEY idx_follow_date (follow_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='随访记录表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS sys_operation_log (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT DEFAULT NULL COMMENT '操作用户ID',
    username VARCHAR(50) DEFAULT NULL COMMENT '操作用户名',
    module VARCHAR(100) DEFAULT NULL COMMENT '操作模块',
    operation_type VARCHAR(50) DEFAULT NULL COMMENT '操作类型',
    description VARCHAR(500) DEFAULT NULL COMMENT '操作描述',
    method VARCHAR(200) DEFAULT NULL COMMENT '请求方法',
    request_url VARCHAR(500) DEFAULT NULL COMMENT '请求URL',
    request_ip VARCHAR(50) DEFAULT NULL COMMENT '操作IP',
    request_params VARCHAR(2000) DEFAULT NULL COMMENT '请求参数',
    response_result VARCHAR(2000) DEFAULT NULL COMMENT '响应结果',
    duration BIGINT DEFAULT NULL COMMENT '执行时长ms',
    status INT DEFAULT 1 COMMENT '状态:0失败 1成功',
    error_msg VARCHAR(1000) DEFAULT NULL COMMENT '错误信息',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统操作日志表';

-- 健康评估记录表
CREATE TABLE IF NOT EXISTS assessment_record (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    doctor_id BIGINT DEFAULT NULL COMMENT '评估医生ID',
    assess_type TINYINT DEFAULT NULL COMMENT '评估类型:1日常生活能力 2认知功能 3情绪心理 4营养状况 5跌倒风险 6压疮风险 7疼痛 8社会功能 9综合',
    assess_date DATE DEFAULT NULL COMMENT '评估日期',
    score DECIMAL(5,2) DEFAULT NULL COMMENT '总评分',
    level VARCHAR(50) DEFAULT NULL COMMENT '评估等级',
    result VARCHAR(1000) DEFAULT NULL COMMENT '评估结论',
    suggestion VARCHAR(1000) DEFAULT NULL COMMENT '评估建议',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_doctor_id (doctor_id),
    KEY idx_assess_type (assess_type),
    KEY idx_assess_date (assess_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康评估记录表';

-- 患者时间轴事件表（整合所有医疗事件）
CREATE TABLE IF NOT EXISTS timeline_event (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    event_type TINYINT DEFAULT NULL COMMENT '事件类型:1就诊 2检查 3用药变更 4预警 5随访 6评估 7转诊 8住院 9出院',
    event_title VARCHAR(200) DEFAULT NULL COMMENT '事件标题',
    event_content VARCHAR(2000) DEFAULT NULL COMMENT '事件内容',
    event_data VARCHAR(2000) DEFAULT NULL COMMENT '结构化数据JSON',
    source_type VARCHAR(50) DEFAULT NULL COMMENT '来源模块',
    source_id BIGINT DEFAULT NULL COMMENT '关联源记录ID',
    event_time DATETIME DEFAULT NULL COMMENT '事件时间',
    doctor_id BIGINT DEFAULT NULL COMMENT '相关医生ID',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_event_type (event_type),
    KEY idx_event_time (event_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='患者时间轴事件表';

-- 预警规则配置表（可自定义阈值的规则引擎）
CREATE TABLE IF NOT EXISTS warning_rule (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    rule_name VARCHAR(100) NOT NULL COMMENT '规则名称',
    rule_type TINYINT DEFAULT NULL COMMENT '规则类型:1血压 2血糖 3心率 4体温 5BMI 6综合',
    metric_code VARCHAR(50) DEFAULT NULL COMMENT '指标编码',
    condition_expr VARCHAR(500) DEFAULT NULL COMMENT '条件表达式',
    warning_level TINYINT DEFAULT NULL COMMENT '触发预警等级:1黄 2橙 3红',
    warning_template VARCHAR(500) DEFAULT NULL COMMENT '预警消息模板',
    enabled TINYINT DEFAULT 1 COMMENT '是否启用:0禁用 1启用',
    doctor_id BIGINT DEFAULT NULL COMMENT '创建医生ID(NULL为全局规则)',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_rule_type (rule_type),
    KEY idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预警规则配置表';

-- 转诊单表
CREATE TABLE IF NOT EXISTS referral_order (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    referral_no VARCHAR(50) DEFAULT NULL COMMENT '转诊编号',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    referral_type TINYINT DEFAULT NULL COMMENT '转诊类型:1上转(社区到三甲) 2下转(三甲到社区)',
    from_org VARCHAR(200) DEFAULT NULL COMMENT '转出机构',
    from_doctor_id BIGINT DEFAULT NULL COMMENT '转出医生ID',
    from_doctor_name VARCHAR(50) DEFAULT NULL COMMENT '转出医生姓名',
    to_org VARCHAR(200) DEFAULT NULL COMMENT '转入机构',
    to_doctor_id BIGINT DEFAULT NULL COMMENT '转入医生ID',
    to_doctor_name VARCHAR(50) DEFAULT NULL COMMENT '转入医生姓名',
    to_dept VARCHAR(100) DEFAULT NULL COMMENT '转入科室',
    diagnosis VARCHAR(500) DEFAULT NULL COMMENT '初步诊断',
    referral_reason VARCHAR(1000) DEFAULT NULL COMMENT '转诊原因',
    urgency_level TINYINT DEFAULT NULL COMMENT '紧急程度:1普通 2紧急 3危急',
    bed_reserved TINYINT DEFAULT 0 COMMENT '是否预留床位:0否 1是',
    status TINYINT DEFAULT 0 COMMENT '状态:0待接收 1已接收 2处理中 3已完成 4已拒绝 5已取消',
    accept_time DATETIME DEFAULT NULL COMMENT '接收时间',
    complete_time DATETIME DEFAULT NULL COMMENT '完成时间',
    discharge_summary VARCHAR(2000) DEFAULT NULL COMMENT '出院结案小结',
    reject_reason VARCHAR(500) DEFAULT NULL COMMENT '拒绝原因',
    cancel_reason VARCHAR(500) DEFAULT NULL COMMENT '取消原因（B3 新增）',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_status (status),
    KEY idx_referral_type (referral_type),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='转诊单表';

-- 可穿戴设备绑定表
CREATE TABLE IF NOT EXISTS wearable_device (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    device_type TINYINT DEFAULT NULL COMMENT '设备类型:1智能手环 2血压计 3血糖仪 4心电监护',
    device_name VARCHAR(100) DEFAULT NULL COMMENT '设备名称',
    device_sn VARCHAR(100) DEFAULT NULL COMMENT '设备序列号',
    bind_status TINYINT DEFAULT 1 COMMENT '绑定状态:0解绑 1绑定',
    bind_time DATETIME DEFAULT NULL COMMENT '绑定时间',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_device_sn (device_sn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='可穿戴设备绑定表';

-- 随访干预记录表
CREATE TABLE IF NOT EXISTS intervention_record (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    follow_record_id BIGINT DEFAULT NULL COMMENT '关联随访记录ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    doctor_id BIGINT DEFAULT NULL COMMENT '干预医生ID',
    intervention_type TINYINT DEFAULT NULL COMMENT '干预类型:1药物干预 2非药物干预 3转诊处理 4健康教育',
    intervention_title VARCHAR(200) DEFAULT NULL COMMENT '干预标题',
    intervention_content VARCHAR(2000) DEFAULT NULL COMMENT '干预具体内容',
    medication_adjust VARCHAR(1000) DEFAULT NULL COMMENT '药物调整详情',
    lifestyle_guidance VARCHAR(1000) DEFAULT NULL COMMENT '生活方式指导',
    health_education VARCHAR(1000) DEFAULT NULL COMMENT '健康教育内容',
    effect_evaluation TINYINT DEFAULT NULL COMMENT '效果评价:1显著 2有效 3一般 4无效',
    effect_desc VARCHAR(500) DEFAULT NULL COMMENT '效果描述',
    next_plan VARCHAR(500) DEFAULT NULL COMMENT '下一步计划',
    intervention_date DATETIME DEFAULT NULL COMMENT '干预日期',
    status TINYINT DEFAULT 1 COMMENT '状态:1正常 0已取消',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_follow_record_id (follow_record_id),
    KEY idx_elder_id (elder_id),
    KEY idx_doctor_id (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='随访干预记录表';

-- 医疗病史记录表
CREATE TABLE IF NOT EXISTS medical_history (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    disease_name VARCHAR(200) NOT NULL COMMENT '疾病名称',
    diagnose_date DATE DEFAULT NULL COMMENT '诊断日期',
    is_cured TINYINT DEFAULT 0 COMMENT '是否治愈:0未治愈 1已治愈',
    treatment VARCHAR(500) DEFAULT NULL COMMENT '治疗方式',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_disease_name (disease_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='医疗病史记录表';

-- 用药记录表
CREATE TABLE IF NOT EXISTS medication_record (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    drug_name VARCHAR(200) NOT NULL COMMENT '药品名称',
    dosage VARCHAR(100) DEFAULT NULL COMMENT '剂量',
    frequency VARCHAR(100) DEFAULT NULL COMMENT '频次',
    route VARCHAR(50) DEFAULT NULL COMMENT '给药途径',
    start_date DATE DEFAULT NULL COMMENT '开始日期',
    end_date DATE DEFAULT NULL COMMENT '结束日期',
    prescribe_doctor VARCHAR(50) DEFAULT NULL COMMENT '处方医生',
    status TINYINT DEFAULT 1 COMMENT '状态:1使用中 0已停用',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用药记录表';

-- 过敏记录表
CREATE TABLE IF NOT EXISTS allergy_record (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    allergen VARCHAR(200) NOT NULL COMMENT '过敏原',
    allergy_type TINYINT DEFAULT NULL COMMENT '过敏类型:1药物 2食物 3环境 4其他',
    severity TINYINT DEFAULT NULL COMMENT '严重程度:1轻度 2中度 3重度',
    reaction VARCHAR(500) DEFAULT NULL COMMENT '过敏反应',
    discover_date DATE DEFAULT NULL COMMENT '发现日期',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_allergen (allergen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='过敏记录表';

-- 家族病史表
CREATE TABLE IF NOT EXISTS family_history (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    disease_name VARCHAR(200) NOT NULL COMMENT '疾病名称',
    relationship VARCHAR(50) DEFAULT NULL COMMENT '亲属关系',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_disease_name (disease_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家族病史表';

-- 系统消息表
CREATE TABLE IF NOT EXISTS sys_message (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    title VARCHAR(200) DEFAULT NULL COMMENT '消息标题',
    content VARCHAR(1000) DEFAULT NULL COMMENT '消息内容',
    msg_type TINYINT DEFAULT NULL COMMENT '消息类型:1预警通知 2随访提醒 3系统公告 4转诊通知',
    is_read TINYINT DEFAULT 0 COMMENT '是否已读:0未读 1已读',
    source_type VARCHAR(50) DEFAULT NULL COMMENT '来源类型',
    source_id BIGINT DEFAULT NULL COMMENT '来源ID',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_is_read (is_read),
    KEY idx_msg_type (msg_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统消息表';

-- 设备体征数据表
CREATE TABLE IF NOT EXISTS vital_sign_data (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    device_id BIGINT DEFAULT NULL COMMENT '设备ID',
    data_type TINYINT DEFAULT NULL COMMENT '数据类型:1收缩压 2舒张压 3心率 4血糖空腹 5血糖餐后 6血氧 7体温 8步数 9睡眠',
    data_value DECIMAL(10,2) DEFAULT NULL COMMENT '数据值',
    unit VARCHAR(20) DEFAULT NULL COMMENT '单位',
    measure_time DATETIME DEFAULT NULL COMMENT '测量时间',
    is_abnormal TINYINT DEFAULT 0 COMMENT '是否异常:0否 1是',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_data_type (data_type),
    KEY idx_measure_time (measure_time),
    KEY idx_device_id (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备体征数据表';

-- ============================================
-- 护士模块表（v1.0 新增）
-- ============================================

-- 护理记录表
CREATE TABLE IF NOT EXISTS nursing_record (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    nurse_id BIGINT NOT NULL COMMENT '护士ID',
    record_type TINYINT NOT NULL COMMENT '记录类型:1基础护理 2专科护理 3生活照料 4心理护理 5康复护理',
    record_title VARCHAR(200) NOT NULL COMMENT '记录标题',
    record_content TEXT DEFAULT NULL COMMENT '护理记录内容',
    nursing_measures TEXT DEFAULT NULL COMMENT '护理措施',
    observation TEXT DEFAULT NULL COMMENT '观察结果',
    evaluation TEXT DEFAULT NULL COMMENT '效果评价',
    record_date DATETIME NOT NULL COMMENT '护理日期',
    is_abnormal TINYINT DEFAULT 0 COMMENT '是否异常:0正常 1异常',
    abnormal_desc VARCHAR(500) DEFAULT NULL COMMENT '异常情况描述',
    report_status TINYINT DEFAULT 0 COMMENT '上报状态:0未上报 1已上报 2已处理',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除:0未删除 1已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_nurse_id (nurse_id),
    KEY idx_record_date (record_date),
    KEY idx_report_status (report_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='护理记录表';

-- 护理计划表
CREATE TABLE IF NOT EXISTS nursing_plan (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    elder_id BIGINT NOT NULL COMMENT '老人ID',
    nurse_id BIGINT NOT NULL COMMENT '制定护士ID',
    plan_name VARCHAR(200) NOT NULL COMMENT '护理计划名称',
    plan_type TINYINT NOT NULL COMMENT '计划类型:1基础护理 2康复护理 3专科护理 4心理护理',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE DEFAULT NULL COMMENT '结束日期',
    frequency VARCHAR(100) DEFAULT NULL COMMENT '护理频次描述',
    nursing_goal TEXT DEFAULT NULL COMMENT '护理目标',
    nursing_content TEXT DEFAULT NULL COMMENT '护理内容',
    status TINYINT DEFAULT 0 COMMENT '状态:0待执行 1进行中 2已完成 3已终止',
    total_count INT DEFAULT 0 COMMENT '计划总次数',
    completed_count INT DEFAULT 0 COMMENT '已完成次数',
    effect_score TINYINT DEFAULT NULL COMMENT '效果评分:1-5',
    doctor_approval TINYINT DEFAULT 0 COMMENT '医生审核:0待审核 1通过 2驳回',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除:0未删除 1已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_nurse_id (nurse_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='护理计划表';

-- ============================================
-- 医生模块增强（v1.0 新增）
-- ============================================

-- 体检记录表
CREATE TABLE IF NOT EXISTS physical_exam (
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
    blood_oxygen DECIMAL(4,1) DEFAULT NULL COMMENT '血氧饱和度%',
    waistline DECIMAL(5,2) DEFAULT NULL COMMENT '腰围cm',
    bmi DECIMAL(4,1) DEFAULT NULL COMMENT 'BMI',
    exam_summary TEXT DEFAULT NULL COMMENT '体检总结',
    doctor_advice TEXT DEFAULT NULL COMMENT '医生建议',
    abnormal_flag TINYINT NOT NULL DEFAULT 0 COMMENT '是否异常:0正常 1异常',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_elder_id (elder_id),
    KEY idx_exam_date (exam_date),
    KEY idx_doctor_id (doctor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='体检记录表';

-- 给护理记录表增加医生审核相关字段（通过存储过程避免重复执行错误）
DELIMITER $$
DROP PROCEDURE IF EXISTS add_column_if_not_exists$$
CREATE PROCEDURE add_column_if_not_exists()
BEGIN
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='nursing_record' AND COLUMN_NAME='doctor_review') THEN
        ALTER TABLE nursing_record ADD COLUMN doctor_review TINYINT DEFAULT 0 COMMENT '医生审核:0未审核 1已查看 2已处理' AFTER report_status;
        ALTER TABLE nursing_record ADD COLUMN review_doctor_id BIGINT DEFAULT NULL COMMENT '审核医生ID' AFTER doctor_review;
        ALTER TABLE nursing_record ADD COLUMN review_comment VARCHAR(500) DEFAULT NULL COMMENT '医生审核意见' AFTER review_doctor_id;
        ALTER TABLE nursing_record ADD COLUMN review_time DATETIME DEFAULT NULL COMMENT '审核时间' AFTER review_comment;
    END IF;
END$$
DELIMITER ;
CALL add_column_if_not_exists();
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
