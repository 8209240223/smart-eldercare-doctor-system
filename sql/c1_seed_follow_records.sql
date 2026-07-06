-- ============================================
-- 补充随访历史记录（让"查看历史记录"有纵向数据）
-- ============================================
USE medical_doctor;

-- Plan 1: 高血压随访（老人1）- 补充2次历史
INSERT INTO follow_record
    (plan_id, elder_id, doctor_id, follow_date, follow_type, disease_type, symptom_desc,
     systolic_pressure, diastolic_pressure, heart_rate, blood_sugar_fasting, weight,
     medication_compliance, current_medication, follow_result, next_follow_date, is_overdue, remark)
VALUES
    (1, 1, 1, '2026-04-01 10:00:00', 2, 1, '偶感头晕，未规律服药',
     158, 96, 76, 6.5, 69.0, 2, '苯磺酸氨氯地平 5mg qd', '血压控制欠佳，建议加强服药依从性', '2026-05-01', 1, '已告知家属监督服药'),
    (1, 1, 1, '2026-05-01 10:30:00', 2, 1, '症状改善，血压趋于稳定',
     152, 92, 74, 6.3, 68.5, 2, '苯磺酸氨氯地平 5mg qd', '血压有所下降，继续当前治疗方案', '2026-06-01', 0, '已预约下次门诊随访');

-- Plan 2: 糖尿病随访（老人2）- 补充2次历史
INSERT INTO follow_record
    (plan_id, elder_id, doctor_id, follow_date, follow_type, disease_type, symptom_desc,
     systolic_pressure, diastolic_pressure, heart_rate, blood_sugar_fasting, weight,
     medication_compliance, current_medication, follow_result, next_follow_date, is_overdue, remark)
VALUES
    (2, 2, 1, '2026-04-10 14:00:00', 2, 2, '空腹血糖控制不佳，主食摄入过多',
     130, 82, 78, 9.8, 72.0, 2, '二甲双胍 0.5g tid', '血糖明显偏高，需饮食干预，加强运动', '2026-05-10', 1, '已发放饮食指导手册'),
    (2, 2, 1, '2026-05-10 14:30:00', 2, 2, '饮食控制后血糖有所下降',
     128, 80, 76, 8.5, 71.5, 2, '二甲双胍 0.5g tid', '血糖改善中，建议继续饮食控制', '2026-06-10', 0, '已制定运动计划');

-- Plan 3: 脑卒中康复（老人3）- 补充2次历史
INSERT INTO follow_record
    (plan_id, elder_id, doctor_id, follow_date, follow_type, disease_type, symptom_desc,
     systolic_pressure, diastolic_pressure, heart_rate, blood_sugar_fasting, weight,
     medication_compliance, current_medication, follow_result, next_follow_date, is_overdue, remark)
VALUES
    (3, 3, 1, '2026-04-08 09:00:00', 1, 5, '左侧肢体活动受限，言语略含糊',
     168, 105, 82, 5.8, 70.0, 3, '阿司匹林 100mg qd; 阿托伐他汀 20mg qn', '血压偏高，加强康复训练', '2026-05-08', 1, '建议住院康复'),
    (3, 3, 1, '2026-05-08 09:30:00', 1, 5, '康复训练后左侧肌力有所恢复',
     165, 102, 80, 5.9, 70.5, 2, '阿司匹林 100mg qd; 阿托伐他汀 20mg qn', '肌力恢复中，继续康复', '2026-06-08', 0, 'PT/OT训练每周3次');

-- Plan 5: 慢阻肺（老人5）- 补充2次历史
INSERT INTO follow_record
    (plan_id, elder_id, doctor_id, follow_date, follow_type, disease_type, symptom_desc,
     systolic_pressure, diastolic_pressure, heart_rate, blood_sugar_fasting, weight,
     medication_compliance, current_medication, follow_result, next_follow_date, is_overdue, remark)
VALUES
    (5, 5, 1, '2026-04-05 10:00:00', 2, 7, '活动后气促加重，咳嗽咳痰增多',
     140, 86, 88, 5.5, 65.0, 2, '沙美特罗替卡松 50/250 ug bid', '慢阻肺急性加重期，建议加用抗生素', '2026-05-05', 1, '已加用头孢克肟'),
    (5, 5, 1, '2026-05-05 10:30:00', 2, 7, '症状缓解，活动耐量改善',
     138, 85, 84, 5.4, 65.5, 2, '沙美特罗替卡松 50/250 ug bid', '稳定期，继续当前治疗', '2026-06-05', 0, '建议秋冬接种流感疫苗');

-- Plan 7: 冠心病（老人7）- 补充2次历史
INSERT INTO follow_record
    (plan_id, elder_id, doctor_id, follow_date, follow_type, disease_type, symptom_desc,
     systolic_pressure, diastolic_pressure, heart_rate, blood_sugar_fasting, weight,
     medication_compliance, current_medication, follow_result, next_follow_date, is_overdue, remark)
VALUES
    (7, 7, 1, '2026-04-12 15:00:00', 1, 4, '偶有心前区不适，持续约1-2分钟',
     135, 84, 76, 5.6, 68.0, 2, '美托洛尔 25mg bid; 阿司匹林 100mg qd', '心电图无明显ST-T改变，建议动态心电图', '2026-05-12', 1, 'Holter检查已预约'),
    (7, 7, 1, '2026-05-12 15:30:00', 1, 4, '症状未再发作，Holter示偶发房早',
     134, 82, 74, 5.7, 68.5, 2, '美托洛尔 25mg bid; 阿司匹林 100mg qd', '心率控制可，无恶性心律失常', '2026-06-12', 0, '继续随访监测');

SELECT plan_id, COUNT(*) AS total
FROM follow_record
WHERE plan_id IN (1,2,3,5,7)
GROUP BY plan_id
ORDER BY plan_id;
