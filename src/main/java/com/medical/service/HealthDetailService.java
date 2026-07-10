package com.medical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.common.exception.BusinessException;
import com.medical.entity.AllergyRecord;
import com.medical.entity.FamilyHistory;
import com.medical.entity.MedicalHistory;
import com.medical.entity.MedicationRecord;
import com.medical.mapper.AllergyRecordMapper;
import com.medical.mapper.FamilyHistoryMapper;
import com.medical.mapper.MedicalHistoryMapper;
import com.medical.mapper.MedicationRecordMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class HealthDetailService {

    @Autowired
    private MedicalHistoryMapper medicalHistoryMapper;

    @Autowired
    private MedicationRecordMapper medicationRecordMapper;

    @Autowired
    private AllergyRecordMapper allergyRecordMapper;

    @Autowired
    private FamilyHistoryMapper familyHistoryMapper;

    @Autowired
    private ElderReferenceService elderReferenceService;

    public Map<String, Object> getFullRecord(Long elderId) {
        elderReferenceService.requireActive(elderId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("medicalHistory", medicalHistoryMapper.selectList(
                new LambdaQueryWrapper<MedicalHistory>()
                        .eq(MedicalHistory::getElderId, elderId)
                        .orderByDesc(MedicalHistory::getDiagnoseDate)));
        result.put("medications", medicationRecordMapper.selectList(
                new LambdaQueryWrapper<MedicationRecord>()
                        .eq(MedicationRecord::getElderId, elderId)
                        .orderByDesc(MedicationRecord::getStatus)));
        result.put("allergies", allergyRecordMapper.selectList(
                new LambdaQueryWrapper<AllergyRecord>().eq(AllergyRecord::getElderId, elderId)));
        result.put("familyHistory", familyHistoryMapper.selectList(
                new LambdaQueryWrapper<FamilyHistory>().eq(FamilyHistory::getElderId, elderId)));
        return result;
    }

    public Long addMedicalHistory(MedicalHistory record) {
        requireRecord(record, record == null ? null : record.getElderId());
        medicalHistoryMapper.insert(record);
        return record.getId();
    }

    public Long addMedication(MedicationRecord record) {
        requireRecord(record, record == null ? null : record.getElderId());
        medicationRecordMapper.insert(record);
        return record.getId();
    }

    public void updateMedication(Long id, MedicationRecord record) {
        MedicationRecord existing = medicationRecordMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(404, "用药记录不存在");
        }
        Long elderId = record != null && record.getElderId() != null
                ? record.getElderId() : existing.getElderId();
        requireRecord(record, elderId);
        record.setId(id);
        record.setElderId(elderId);
        medicationRecordMapper.updateById(record);
    }

    public Long addAllergy(AllergyRecord record) {
        requireRecord(record, record == null ? null : record.getElderId());
        allergyRecordMapper.insert(record);
        return record.getId();
    }

    public Long addFamilyHistory(FamilyHistory record) {
        requireRecord(record, record == null ? null : record.getElderId());
        familyHistoryMapper.insert(record);
        return record.getId();
    }

    public void deleteMedicalHistory(Long id) {
        medicalHistoryMapper.deleteById(id);
    }

    public void deleteMedication(Long id) {
        medicationRecordMapper.deleteById(id);
    }

    public void deleteAllergy(Long id) {
        allergyRecordMapper.deleteById(id);
    }

    public void deleteFamilyHistory(Long id) {
        familyHistoryMapper.deleteById(id);
    }

    private void requireRecord(Object record, Long elderId) {
        if (record == null) {
            throw new BusinessException(400, "健康档案记录不能为空");
        }
        elderReferenceService.requireActive(elderId);
    }
}
