-- ============================================
-- 评估规则配置表 + 60 条种子规则
-- 覆盖：血压 / 血糖 / 心率 / 血氧 / 体温 / BMI / 腰围
--      病史 / 过敏 / 家族史 / 用药 / 生活方式 / 生活能力
--      预警 / 随访 / 干预 / 评估 / 护理 / 转诊 / 设备
-- ============================================

CREATE TABLE IF NOT EXISTS assessment_rule (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    rule_code VARCHAR(50) NOT NULL COMMENT '规则编码',
    rule_name VARCHAR(100) NOT NULL COMMENT '规则名称',
    category VARCHAR(20) NOT NULL COMMENT '分类:血压/血糖/心率/血氧/体温/BMI/腰围/病史/过敏/家族史/用药/生活方式/生活能力/预警/随访/干预/评估/护理/转诊/设备',
    indicator VARCHAR(50) DEFAULT NULL COMMENT '指标字段名',
    data_source VARCHAR(30) DEFAULT 'physical_exam' COMMENT '数据来源',
    operator VARCHAR(10) NOT NULL COMMENT '比较符:>= <= < > == !=',
    threshold DECIMAL(10,2) DEFAULT NULL COMMENT '阈值',
    extra_condition VARCHAR(100) DEFAULT NULL COMMENT '附加条件(如 gender=M)',
    severity TINYINT NOT NULL DEFAULT 1 COMMENT '1提示 2注意 3警告',
    finding_text VARCHAR(500) DEFAULT NULL COMMENT '发现描述模板 {value}替换为实际值',
    advice_text VARCHAR(1000) DEFAULT NULL COMMENT '建议措施',
    enabled TINYINT DEFAULT 1 COMMENT '是否启用',
    sort_order INT DEFAULT 0 COMMENT '同类内排序',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_rule_code (rule_code),
    KEY idx_category (category),
    KEY idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评估规则配置表';

-- ===== 一、血压（8条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('BP_SYSTOLIC_CRISIS',      '收缩压危急值',     '血压', 'systolic',   'physical_exam', '>=', 180, 3, '收缩压达危急值（{value}mmHg），属高血压3级，需紧急处理',           '立即联系医生或就医，不可拖延。遵医嘱调整降压方案，保持情绪平稳', 1),
('BP_SYSTOLIC_HIGH_2',      '收缩压2级高血压',   '血压', 'systolic',   'physical_exam', '>=', 160, 2, '收缩压偏高（{value}mmHg），属高血压2级，需积极干预',             '3天内复测血压，评估降压方案调整。减少钠盐摄入（<5g/天），戒烟限酒', 2),
('BP_SYSTOLIC_HIGH_1',      '收缩压1级高血压',   '血压', 'systolic',   'physical_exam', '>=', 140, 2, '收缩压偏高（{value}mmHg），属高血压1级',                       '低盐饮食（<5g/天），7天内复测血压。保持规律作息，避免情绪激动', 3),
('BP_SYSTOLIC_NORMAL_HI',   '收缩压正常高值',    '血压', 'systolic',   'physical_exam', '>=', 130, 1, '收缩压处于正常高值（{value}mmHg），需关注血压趋势',              '保持健康生活方式，每1-3个月监测血压。适度运动，控制体重', 4),
('BP_SYSTOLIC_LOW',         '收缩压偏低',        '血压', 'systolic',   'physical_exam', '<',   90, 2, '收缩压偏低（{value}mmHg），需关注',                         '排查体位性低血压。起床、站立时动作放缓，注意防跌倒。保证充足饮水', 5),
('BP_DIASTOLIC_HIGH_2',     '舒张压2级高血压',   '血压', 'diastolic',  'physical_exam', '>=', 100, 2, '舒张压偏高（{value}mmHg），属高血压2级',                      '联合用药方案评估，排查继发性高血压。减少钠盐及高脂饮食', 6),
('BP_DIASTOLIC_HIGH_1',     '舒张压1级高血压',   '血压', 'diastolic',  'physical_exam', '>=',  90, 2, '舒张压偏高（{value}mmHg），属高血压1级',                      '限盐限酒，增加有氧运动（快走、太极等）。定期监测血压变化', 7),
('BP_DIASTOLIC_LOW',        '舒张压偏低',        '血压', 'diastolic',  'physical_exam', '<',   60, 2, '舒张压偏低（{value}mmHg），需评估心功能',                     '评估心功能及血管弹性。注意头晕、乏力等症状，适当增加优质蛋白摄入', 8);

-- ===== 二、血糖（6条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('BG_FASTING_CRISIS',       '空腹血糖危急值',    '血糖', 'bloodSugarFasting', 'physical_exam', '>=', 11.1, 3, '空腹血糖危急值（{value}mmol/L），需立即处理',                '立即内分泌科就诊，排查酮症酸中毒风险。暂停高糖饮食，多饮水', 1),
('BG_FASTING_HIGH',         '空腹血糖偏高',      '血糖', 'bloodSugarFasting', 'physical_exam', '>=',  7.0, 2, '空腹血糖偏高（{value}mmol/L），达糖尿病诊断阈值',             '内分泌科随访，完善糖化血红蛋白及OGTT检查。控制主食量，定时定量进餐', 2),
('BG_FASTING_IMPAIRED',     '空腹血糖受损',      '血糖', 'bloodSugarFasting', 'physical_exam', '>=',  6.1, 1, '空腹血糖受损（{value}mmol/L），属糖尿病前期',                 '控制碳水化合物摄入，每周≥150分钟中等强度运动。3个月后复查空腹血糖', 3),
('BG_FASTING_LOW',          '空腹血糖偏低',      '血糖', 'bloodSugarFasting', 'physical_exam', '<',   3.9, 2, '空腹血糖偏低（{value}mmol/L），警惕低血糖风险',               '排查降糖药是否过量。随身携带糖果或饼干，告知家属低血糖急救方法', 4),
('BG_POSTPRANDIAL_HIGH',    '餐后血糖偏高',      '血糖', 'bloodSugarPostprandial', 'vital_sign', '>=', 11.1, 2, '餐后血糖偏高（{value}mmol/L），血糖控制欠佳',                 '分餐饮食，减少精制碳水摄入。餐后适量散步15-20分钟有助于降糖', 5),
('BG_RANDOM_HIGH',          '随机血糖偏高',      '血糖', 'bloodSugarRandom', 'physical_exam', '>=', 11.1, 2, '随机血糖偏高（{value}mmol/L），需关注',                       '建议空腹状态下复测血糖，排查糖尿病可能', 6);

-- ===== 三、心率（4条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('HR_TACHYCARDIA_SEVERE',   '心率过快（严重）',  '心率', 'heartRate',  'physical_exam', '>=', 120, 3, '心率过快（{value}次/分），需紧急评估',                        '立即行心电图检查，排查房颤/室上速/心衰等可能。保持安静休息，避免剧烈活动', 1),
('HR_TACHYCARDIA',          '心率偏快',          '心率', 'heartRate',  'physical_exam', '>=', 100, 2, '心率偏快（{value}次/分），超出正常范围',                      '排查甲亢、贫血、焦虑等原因。避免咖啡、浓茶，保持情绪平稳', 2),
('HR_BRADYCARDIA',          '心率偏慢',          '心率', 'heartRate',  'physical_exam', '<',   60, 2, '心率偏慢（{value}次/分），低于正常范围',                      '排查药物影响（如β受体阻滞剂）。关注有无乏力、头晕、黑矇等症状', 3),
('HR_BRADYCARDIA_SEVERE',   '心率过缓',          '心率', 'heartRate',  'physical_exam', '<',   45, 3, '心率过缓（{value}次/分），需排查心脏传导系统问题',             '建议动态心电图检查，排查病态窦房结综合征或房室传导阻滞', 4);

-- ===== 四、血氧（3条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('SPO2_CRITICAL',           '血氧饱和度危急',    '血氧', 'bloodOxygen', 'physical_exam', '<=',  90, 3, '血氧饱和度危急（{value}%），存在呼吸衰竭风险',                '立即吸氧（2-4L/min），排查COPD急性加重/重症肺炎/心衰。必要时拨打120', 1),
('SPO2_LOW',                '血氧饱和度偏低',    '血氧', 'bloodOxygen', 'physical_exam', '<=',  94, 2, '血氧饱和度偏低（{value}%），需持续关注',                       '持续监测血氧，排查慢性呼吸系统疾病或心功能不全。指导缩唇呼吸训练', 2),
('SPO2_BORDERLINE',         '血氧饱和度临界',    '血氧', 'bloodOxygen', 'physical_exam', '<=',  96, 1, '血氧饱和度临界偏低（{value}%），需保持关注',                    '对慢阻肺或心衰病史者应提高警惕。定期监测，鼓励深呼吸练习', 3);

-- ===== 五、体温（3条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('TEMP_FEVER_HIGH',         '高热',              '体温', 'temperature', 'physical_exam', '>=',  39, 3, '高热（{value}℃），需立即处理',                               '排查感染源，物理降温（温水擦浴）+药物退热。补充足够水分，必要时就医', 1),
('TEMP_FEVER',              '发热',              '体温', 'temperature', 'physical_exam', '>=', 37.3, 1, '体温偏高（{value}℃），存在低热',                              '监测体温变化，注意有无咳嗽、咽痛、乏力等伴随症状。多饮水，注意休息', 2),
('TEMP_HYPOTHERMIA',        '体温偏低',          '体温', 'temperature', 'physical_exam', '<',  35.5, 2, '体温偏低（{value}℃），需保暖复温',                           '加强保暖措施。排查低代谢状态（甲状腺功能减退、低血糖等）', 3);

-- ===== 六、BMI（5条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('BMI_OBESE_SEVERE',        '重度肥胖',          'BMI', 'bmi', 'physical_exam', '>=', 35, 2, '重度肥胖（BMI={value}），代谢综合征风险极高',                     '建议多学科减重方案（营养科+内分泌科+运动康复科）。设定合理减重目标，每月减重2-4kg', 1),
('BMI_OBESE_MODERATE',      '中度肥胖',          'BMI', 'bmi', 'physical_exam', '>=', 30, 2, '中度肥胖（BMI={value}），需积极干预',                           '制定个性化减重计划。控制总热量摄入，增加膳食纤维。每周≥150分钟中等强度运动', 2),
('BMI_OBESE_MILD',          '肥胖',              'BMI', 'bmi', 'physical_exam', '>=', 28, 2, '肥胖（BMI={value}），建议减重',                                '控制总热量摄入，避免高油高糖食物。每周≥150分钟中等强度有氧运动', 3),
('BMI_OVERWEIGHT',          '超重',              'BMI', 'bmi', 'physical_exam', '>=', 24, 1, '超重（BMI={value}），需注意体重管理',                           '均衡饮食，增加蔬菜水果比例。每周运动3-5次，避免体重继续增长', 4),
('BMI_UNDERWEIGHT',         '体重过轻',          'BMI', 'bmi', 'physical_exam', '<', 18.5, 2, '体重过轻（BMI={value}），需排查原因',                           '排查营养不良、慢性消耗性疾病。增加优质蛋白（鱼、蛋、奶）摄入，适当加餐', 5);

-- ===== 七、腰围（2条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, extra_condition, sort_order) VALUES
('WAISTLINE_HIGH_M',        '腰围超标（男）',    '腰围', 'waistline', 'physical_exam', '>=',  90, 1, '腰围超标（{value}cm），存在中心性肥胖风险',                    '减少腹部脂肪堆积。增加核心肌群训练，控制精制碳水和饱和脂肪摄入', 'gender=1', 1),
('WAISTLINE_HIGH_F',        '腰围超标（女）',    '腰围', 'waistline', 'physical_exam', '>=',  85, 1, '腰围超标（{value}cm），存在中心性肥胖风险',                    '减少腹部脂肪堆积。增加核心肌群训练，控制精制碳水和饱和脂肪摄入', 'gender=2', 2);

-- ===== 八、病史（4条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('MULTI_MORBIDITY',         '多种慢病共存',      '病史', 'diseaseCount',  'aggregate', '>=',  3, 2, '多种慢性病共存（≥{value}种），疾病管理复杂度较高',              '建议多学科协作管理，避免单病种孤立治疗。优先处理交互风险最高的疾病组合', 1),
('DISEASE_UNCURED',         '存在未愈慢病',      '病史', 'diseaseCount',  'aggregate', '>=',  1, 1, '存在{value}种未治愈慢性病，需建立长期管理方案',                  '按病种建立个性化随访计划，定期复查相关指标', 2),
('DISEASE_CVD',             '有心脑血管病史',    '病史', 'hasCVD',        'aggregate', '==',  1, 2, '有心脑血管疾病史，需严格控制血压和血脂',                        '低盐低脂饮食，遵医嘱服用抗血小板/调脂药物。注意头晕、胸闷等警示症状', 3),
('DISEASE_DIABETES',        '有糖尿病史',        '病史', 'hasDiabetes',   'aggregate', '==',  1, 2, '有糖尿病史，需持续血糖管理和并发症筛查',                        '定期检查糖化血红蛋白、眼底、肾功能、足部。控制饮食+规律运动+规范用药', 4);

-- ===== 九、过敏（3条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('ALLERGY_DRUG_SEVERE',     '重度药物过敏',      '过敏', 'hasDrugAllergySevere', 'aggregate', '==', 1, 3, '存在重度药物过敏（{allergens}），必须严格规避',              '处方前必须核对过敏史，在病历显著位置标注。避免使用该类药物及交叉过敏药物', 1),
('ALLERGY_DRUG',            '有药物过敏史',      '过敏', 'hasDrugAllergy',  'aggregate', '==',  1, 2, '存在药物过敏史（{allergens}），处方时需注意',                  '开具新药前确认不含过敏成分，告知老人及家属过敏药物名称', 2),
('ALLERGY_OTHER',           '有其他过敏史',      '过敏', 'hasOtherAllergy', 'aggregate', '==',  1, 1, '存在过敏史（{allergens}），日常需注意避免接触',                  '了解过敏原及过敏反应类型，日常注意规避', 3);

-- ===== 十、家族史（2条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('FAMILY_CANCER',           '有肿瘤家族史',      '家族史', 'hasFamilyCancer', 'aggregate', '==', 1, 1, '有肿瘤家族史（{diseases}），建议关注相关筛查',                '根据家族肿瘤类型，按指南定期进行癌症筛查。保持健康生活方式降低风险', 1),
('FAMILY_CVD_DM',           '有心脑血管代谢病家族史', '家族史', 'hasFamilyCVD', 'aggregate', '==', 1, 1, '有心脑血管代谢病家族史（{diseases}），需加强一级预防',         '严格控制血压血糖血脂。定期体检，早发现早干预', 2);

-- ===== 十一、用药（3条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('POLYPHARMACY',            '多重用药',          '用药', 'medicationCount', 'aggregate', '>=',  5, 2, '多重用药（≥{value}种），药物相互作用风险增加',                '建议进行药物重整（Medication Reconciliation），评估每种药物的必要性。精简非必需用药，减少不必要联合用药', 1),
('MED_MULTIPLE',            '多药联用',          '用药', 'medicationCount', 'aggregate', '>=',  3, 1, '使用{value}种药物，需关注潜在的药物相互作用',                  '定期评估用药方案。关注老人有无新发不适症状，排查是否为药物不良反应', 2),
('MED_LONG_TERM',           '长期用药',          '用药', 'hasLongTermMed',  'aggregate', '==',  1, 1, '存在长期用药（>1年），需评估继续用药的必要性',                  '定期复查肝肾功能等相关指标，评估是否可减量或停药', 3);

-- ===== 十二、生活方式（3条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('SMOKE_CURRENT',           '当前吸烟',          '生活方式', 'smokingStatus', 'aggregate', '==', 1, 2, '当前吸烟，增加心脑血管疾病、慢性阻塞性肺病及多种癌症风险',       '强烈建议戒烟。可转介戒烟门诊，必要时使用尼古丁替代疗法', 1),
('DRINK_EXCESSIVE',         '饮酒量偏大',        '生活方式', 'drinkingStatus', 'aggregate', '>=', 2, 2, '饮酒量偏大，可能与降压药、降糖药产生相互作用，增加肝损伤风险',     '建议将饮酒量减至最低或完全戒酒。空腹不饮酒，不与药物同服', 2),
('EXERCISE_INSUFFICIENT',   '运动量不足',        '生活方式', 'exerciseFrequency', 'aggregate', '<=', 1, 1, '运动量不足，不利于慢性病控制和身体功能维持',                     '建议每周≥150分钟中等强度运动（快走、太极拳、健身操等），循序渐进', 3);

-- ===== 十三、生活能力（3条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('LIVING_ABILITY_LOW',      '生活自理能力下降',  '生活能力', 'livingAbility', 'aggregate', '>=',  3, 2, '生活自理能力下降，需评估照护需求',                              '评估居家环境安全性。必要时申请长期护理保险，安排居家照护或社区日间照料', 1),
('DISABILITY_EXISTS',       '存在残疾情况',      '生活能力', 'hasDisability',  'aggregate', '==',  1, 1, '存在残疾情况，需个性化照护方案',                                '评估无障碍设施需求（扶手、坡道、助行器等）。制定个性化康复计划', 2),
('FALL_RISK',               '跌倒高风险',        '生活能力', 'fallRisk',       'aggregate', '==',  1, 2, '年龄较大且生活能力下降，跌倒风险较高',                           '居家安全评估：加装扶手、浴室防滑垫、夜灯照明。鞋子防滑，起床遵循"三部曲"（坐30秒-站30秒-走）', 3);

-- ===== 十四、预警（3条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('WARNING_FREQUENT',        '预警频繁',          '预警', 'warningCount30d', 'aggregate', '>=',  3, 2, '近30天健康预警频繁（{value}次），风险控制需加强',              '全面评估现有健康管理方案的有效性。排查预警反复触发的原因，必要时调整治疗策略', 1),
('WARNING_UNHANDLED',       '存在待处理预警',    '预警', 'warningUnhandled', 'aggregate', '>=',  1, 2, '仍有{value}条待处理预警，请及时跟进',                          '逐一处理未关闭的预警事项。处理完毕后更新预警状态', 2),
('WARNING_RED_LEVEL',       '曾触发红色预警',    '预警', 'hasRedWarning',   'aggregate', '==',  1, 3, '近期曾触发红色等级预警，需高度警惕',                             '回顾红色预警事件是否已妥善处理。排查有无复发迹象，确保应急方案就位', 3);

-- ===== 十五、随访（3条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('FOLLOWUP_OVERDUE',        '随访已逾期',        '随访', 'followupOverdue',  'aggregate', '==',  1, 2, '存在随访计划已逾期（{days}天），管理出现空档',                '尽快联系老人或其家属，安排随访。可采用电话、上门或门诊等方式', 1),
('FOLLOWUP_UPCOMING',       '随访日期临近',      '随访', 'followupDays',     'aggregate', '<=',  7, 1, '下次随访日期临近（{date}），请提前做好准备',                     '确认随访时间和方式。回顾上次随访结论，准备好本次随访重点关注事项', 2),
('FOLLOWUP_LOW_COMPLIANCE', '服药依从性不佳',    '随访', 'medCompliance',    'aggregate', '<=',  2, 2, '服药依从性不佳，影响治疗效果',                                   '加强用药教育，简化用药方案（如复方制剂）。必要时家属协助监督，使用药盒或手机提醒', 3);

-- ===== 十六、干预（2条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('INTERVENTION_INEFFECTIVE','干预效果不理想',    '干预', 'interventionEffect', 'aggregate', '<=', 2, 2, '最近干预（{title}）效果欠佳，需重新评估方案',                  '分析干预效果不佳的原因。必要时更换干预策略或多学科会诊', 1),
('INTERVENTION_NONE',       '近期无干预记录',    '干预', 'hasRecentIntervention', 'aggregate', '==', 0, 1, '近期无干预记录，建议对随访发现的问题及时跟进干预',               '将随访中发现的问题转化为干预措施，形成"随访→干预→评估"闭环', 2);

-- ===== 十七、评估（1条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('ASSESSMENT_OUTDATED',     '健康评估已过期',    '评估', 'daysSinceAssessment', 'aggregate', '>=', 180, 1, '超过180天未进行健康评估，建议尽快完成新一轮评估',               '安排综合健康评估，全面更新老人健康状况认知', 1);

-- ===== 十八、护理（2条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('NURSING_ABNORMAL',        '护理发现异常',      '护理', 'hasNursingAbnormal', 'aggregate', '==', 1, 2, '近期护理记录中存在异常情况（{desc}），需医生关注',            '查看护理异常详情。必要时医生介入评估，调整护理或治疗方案', 1),
('NURSING_GAP',             '护理需求未覆盖',    '护理', 'nursingGap',       'aggregate', '==',  1, 1, '生活能力下降但目前无进行中的护理计划，存在照护缺口',             '评估护理需求等级，制定个性化护理计划', 2);

-- ===== 十九、转诊（1条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('REFERRAL_ACTIVE',         '有进行中转诊',      '转诊', 'hasActiveReferral', 'aggregate', '==', 1, 1, '存在进行中的转诊（至{org}），请关注转诊进展和结果',          '跟进转诊进度。收到回转信息后及时更新健康档案', 1);

-- ===== 二十、设备（2条）=====
INSERT IGNORE INTO assessment_rule (rule_code, rule_name, category, indicator, data_source, operator, threshold, severity, finding_text, advice_text, sort_order) VALUES
('DEVICE_BOUND',            '已绑定监测设备',    '设备', 'hasDevice',        'aggregate', '==',  1, 1, '已绑定{deviceNames}，体征数据持续回传中',                        '定期查看设备数据，关注异常告警。确保设备电量充足、佩戴正确', 1),
('DEVICE_NONE_ABNORMAL',    '异常体征未监测',    '设备', 'deviceGap',        'aggregate', '==',  1, 1, '存在异常体征但未绑定对应监测设备，存在监测盲区',                   '建议绑定血压计/血糖仪等设备，实现居家数据连续监测', 2);

-- 幂等修正已执行过旧脚本的环境，不改动任何老人历史档案数据
UPDATE assessment_rule
SET operator = '>=', threshold = 3
WHERE rule_code = 'LIVING_ABILITY_LOW';
