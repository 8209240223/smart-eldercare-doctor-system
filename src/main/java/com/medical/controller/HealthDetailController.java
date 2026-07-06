package com.medical.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.entity.*;
import com.medical.mapper.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 健康档案详细信息控制器
 */
@RestController
@RequestMapping("/api/health-detail")
public class HealthDetailController {

    @Autowired
    private MedicalHistoryMapper medicalHistoryMapper;

    @Autowired
    private MedicationRecordMapper medicationRecordMapper;

    @Autowired
    private AllergyRecordMapper allergyRecordMapper;

    @Autowired
    private FamilyHistoryMapper familyHistoryMapper;

    /**
     * 获取老人完整健康档案详情
     */
    @GetMapping("/{elderId}")
    public R<?> getFullRecord(@PathVariable Long elderId) {
        Map<String, Object> result = new HashMap<>();
        result.put("medicalHistory", medicalHistoryMapper.selectList(
                new LambdaQueryWrapper<MedicalHistory>().eq(MedicalHistory::getElderId, elderId).orderByDesc(MedicalHistory::getDiagnoseDate)));
        result.put("medications", medicationRecordMapper.selectList(
                new LambdaQueryWrapper<MedicationRecord>().eq(MedicationRecord::getElderId, elderId).orderByDesc(MedicationRecord::getStatus)));
        result.put("allergies", allergyRecordMapper.selectList(
                new LambdaQueryWrapper<AllergyRecord>().eq(AllergyRecord::getElderId, elderId)));
        result.put("familyHistory", familyHistoryMapper.selectList(
                new LambdaQueryWrapper<FamilyHistory>().eq(FamilyHistory::getElderId, elderId)));
        return R.ok(result);
    }

    // ===== 病史 CRUD =====
    @PostMapping("/medical-history")
    @OperationLog(module = "健康档案", type = "新增", desc = "添加病史记录")
    public R<?> addMedicalHistory(@RequestBody MedicalHistory record) {
        medicalHistoryMapper.insert(record);
        return R.ok("添加成功", record.getId());
    }

    @DeleteMapping("/medical-history/{id}")
    public R<?> deleteMedicalHistory(@PathVariable Long id) {
        medicalHistoryMapper.deleteById(id);
        return R.ok("删除成功");
    }

    // ===== 用药记录 CRUD =====
    @PostMapping("/medication")
    @OperationLog(module = "健康档案", type = "新增", desc = "添加用药记录")
    public R<?> addMedication(@RequestBody MedicationRecord record) {
        medicationRecordMapper.insert(record);
        return R.ok("添加成功", record.getId());
    }

    @PutMapping("/medication/{id}")
    public R<?> updateMedication(@PathVariable Long id, @RequestBody MedicationRecord record) {
        record.setId(id);
        medicationRecordMapper.updateById(record);
        return R.ok("修改成功");
    }

    @DeleteMapping("/medication/{id}")
    public R<?> deleteMedication(@PathVariable Long id) {
        medicationRecordMapper.deleteById(id);
        return R.ok("删除成功");
    }

    // ===== 过敏记录 CRUD =====
    @PostMapping("/allergy")
    @OperationLog(module = "健康档案", type = "新增", desc = "添加过敏记录")
    public R<?> addAllergy(@RequestBody AllergyRecord record) {
        allergyRecordMapper.insert(record);
        return R.ok("添加成功", record.getId());
    }

    @DeleteMapping("/allergy/{id}")
    public R<?> deleteAllergy(@PathVariable Long id) {
        allergyRecordMapper.deleteById(id);
        return R.ok("删除成功");
    }

    // ===== 家族病史 CRUD =====
    @PostMapping("/family-history")
    @OperationLog(module = "健康档案", type = "新增", desc = "添加家族病史")
    public R<?> addFamilyHistory(@RequestBody FamilyHistory record) {
        familyHistoryMapper.insert(record);
        return R.ok("添加成功", record.getId());
    }

    @DeleteMapping("/family-history/{id}")
    public R<?> deleteFamilyHistory(@PathVariable Long id) {
        familyHistoryMapper.deleteById(id);
        return R.ok("删除成功");
    }
}
