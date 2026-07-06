-- ============================================
-- 补充更多随访历史记录（丰富纵向对比数据）
-- ============================================
USE medical_doctor;

-- Plan 1: 高血压随访（老人1）- 再补充3次历史（共5次）
INSERT INTO follow_record
    (plan_id, elder_id, doctor_id, follow_date, follow_type, disease_type, symptom_desc,
     systolic_pressure, diastolic_pressure, heart_rate, blood_sugar_fasting, weight,
     medication_compliance, current_medication, follow_result, next_follow_date, is_overdue, remark)
VALUES
    (1, 1, 1, '2026-01-15 09:30:00', 2, 1, '刚确诊高血压，头晕头痛明显',
     162, 98, 80, 6.2, 70.5, 2, '苯磺酸氨氯地平 5mg qd', '血压偏高，开始药物治疗，嘱低盐饮食', '2026-02-15', 0, '已开始服药，注意监测血压'),
    (1, 1, 1, '2026-02-15 10:00:00', 2, 1, '服药后头晕症状缓解',
     155, 94, 78, 6.4, 69.8, 2, '苯磺酸氨氯地平 5mg qd', '血压有所下降，继续当前方案', '2026-03-15', 0, '建议每日测量血压'),
    (1, 1, 1, '2026-03-15 10:30:00', 2, 1, '血压控制不稳定，偶有头晕',
     160, 96, 79, 6.3, 69.5, 2, '苯磺酸氨氯地平 5mg qd', '血压波动，加强服药依从性教育', '2026-04-15', 0, '已强调规律服药重要性');

-- Plan 2: 糖尿病随访（老人2）- 再补充3次历史（共5次）
INSERT INTO follow_record
    (plan_id, elder_id, doctor_id, follow_date, follow_type, disease_type, symptom_desc,
     systolic_pressure, diastolic_pressure, heart_rate, blood_sugar_fasting, weight,
     medication_compliance, current_medication, follow_result, next_follow_date, is_overdue, remark)
VALUES
    (2, 2, 1, '2026-01-20 14:00:00', 2, 2, '新诊断糖尿病，空腹血糖偏高',
     132, 84, 80, 10.2, 73.0, 2, '二甲双胍 0.5g tid', '血糖明显偏高，开始药物治疗，饮食控制', '2026-02-20', 0, '已发放糖尿病饮食手册'),
    (2, 2, 1, '2026-02-20 14:30:00', 2, 2, '饮食控制后血糖有所下降',
     130, 82, 78, 9.2, 72.5, 2, '二甲双胍 0.5g tid', '血糖改善中，继续饮食控制', '2026-03-20', 0, '建议记录每日饮食'),
    (2, 2, 1, '2026-03-20 15:00:00', 2, 2, '血糖控制不稳定，主食摄入偏多',
     129, 81, 77, 9.5, 72.0, 2, '二甲双胍 0.5g tid', '血糖波动，加强饮食教育', '2026-04-20', 0, '已调整饮食方案');

-- Plan 3: 脑卒中康复（老人3）- 再补充3次历史（共5次）
INSERT INTO follow_record
    (plan_id, elder_id, doctor_id, follow_date, follow_type, disease_type, symptom_desc,
     systolic_pressure, diastolic_pressure, heart_rate, blood_sugar_fasting, weight,
     medication_compliance, current_medication, follow_result, next_follow_date, is_overdue, remark)
VALUES
    (3, 3, 1, '2026-01-10 09:00:00', 1, 5, '脑卒中出院后首次随访，左侧肢体活动受限',
     170, 108, 85, 5.7, 71.0, 2, '阿司匹林 100mg qd; 阿托伐他汀 20mg qn', '血压偏高，加强康复训练', '2026-02-10', 0, '建议住院康复'),
    (3, 3, 1, '2026-02-10 09:30:00', 1, 5, '康复训练后左侧肌力有所恢复',
     168, 106, 83, 5.8, 70.8, 2, '阿司匹林 100mg qd; 阿托伐他汀 20mg qn', '肌力恢复中，继续康复', '2026-03-10', 0, 'PT/OT训练每周3次'),
    (3, 3, 1, '2026-03-10 10:00:00', 1, 5, '康复训练效果明显，左侧肌力改善',
     165, 103, 81, 5.9, 70.5, 2, '阿司匹林 100mg qd; 阿托伐他汀 20mg qn', '肌力继续恢复，康复训练有效', '2026-04-10', 0, '继续康复训练');

-- Plan 5: 慢阻肺（老人5）- 再补充3次历史（共5次）
INSERT INTO follow_record
    (plan_id, elder_id, doctor_id, follow_date, follow_type, disease_type, symptom_desc,
     systolic_pressure, diastolic_pressure, heart_rate, blood_sugar_fasting, weight,
     medication_compliance, current_medication, follow_result, next_follow_date, is_overdue, remark)
VALUES
    (5, 5, 1, '2026-01-05 10:00:00', 2, 7, '慢阻肺稳定期，活动后轻度气促',
     142, 88, 90, 5.6, 66.0, 2, '沙美特罗替卡松 50/250 ug bid', '稳定期，继续当前治疗', '2026-02-05', 0, '建议戒烟，避免烟雾刺激'),
    (5, 5, 1, '2026-02-05 10:30:00', 2, 7, '症状稳定，活动耐量改善',
     140, 87, 88, 5.5, 65.8, 2, '沙美特罗替卡松 50/250 ug bid', '病情稳定，继续治疗', '2026-03-05', 0, '建议接种肺炎疫苗'),
    (5, 5, 1, '2026-03-05 11:00:00', 2, 7, '气候变化后症状加重，咳嗽咳痰增多',
     145, 89, 92, 5.7, 65.5, 2, '沙美特罗替卡松 50/250 ug bid', '急性加重期，加用抗生素', '2026-04-05', 1, '已加用头孢克肟');

-- Plan 7: 冠心病（老人7）- 再补充3次历史（共5次）
INSERT INTO follow_record
    (plan_id, elder_id, doctor_id, follow_date, follow_type, disease_type, symptom_desc,
     systolic_pressure, diastolic_pressure, heart_rate, blood_sugar_fasting, weight,
     medication_compliance, current_medication, follow_result, next_follow_date, is_overdue, remark)
VALUES
    (7, 7, 1, '2026-01-12 15:00:00', 1, 4, '冠心病出院后首次随访，偶有心前区不适',
     138, 86, 78, 5.5, 69.0, 2, '美托洛尔 25mg bid; 阿司匹林 100mg qd', '心电图无明显ST-T改变，建议动态心电图', '2026-02-12', 0, 'Holter检查已预约'),
    (7, 7, 1, '2026-02-12 15:30:00', 1, 4, '症状未再发作，Holter示偶发房早',
     136, 84, 76, 5.6, 68.8, 2, '美托洛尔 25mg bid; 阿司匹林 100mg qd', '心率控制可，无恶性心律失常', '2026-03-12', 0, '继续随访监测'),
    (7, 7, 1, '2026-03-12 16:00:00', 1, 4, '症状稳定，无心前区不适发作',
     135, 83, 75, 5.7, 68.5, 2, '美托洛尔 25mg bid; 阿司匹林 100mg qd', '病情稳定，继续当前治疗', '2026-04-12', 0, '建议低脂饮食，适度运动');

-- 验证插入结果
SELECT plan_id, COUNT(*) AS total_records
FROM follow_record
WHERE plan_id IN (1,2,3,5,7)
GROUP BY plan_id
ORDER BY plan_id;