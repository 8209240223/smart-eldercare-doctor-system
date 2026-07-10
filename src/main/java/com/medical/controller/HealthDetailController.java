package com.medical.controller;

import com.medical.common.annotation.RequireRole;
import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.entity.*;
import com.medical.service.HealthDetailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 健康档案详细信息控制器
 */
@RestController
@RequestMapping("/api/health-detail")
@RequireRole({1, 2, 3})
public class HealthDetailController {

    @Autowired
    private HealthDetailService healthDetailService;

    /**
     * 获取老人完整健康档案详情
     */
    @GetMapping("/{elderId}")
    public R<?> getFullRecord(@PathVariable Long elderId) {
        return R.ok(healthDetailService.getFullRecord(elderId));
    }

    // ===== 病史 CRUD =====
    @RequireRole({2})
    @PostMapping("/medical-history")
    @OperationLog(module = "健康档案", type = "新增", desc = "添加病史记录")
    public R<?> addMedicalHistory(@RequestBody MedicalHistory record) {
        return R.ok("添加成功", healthDetailService.addMedicalHistory(record));
    }

    @RequireRole({2})
    @DeleteMapping("/medical-history/{id}")
    public R<?> deleteMedicalHistory(@PathVariable Long id) {
        healthDetailService.deleteMedicalHistory(id);
        return R.ok("删除成功");
    }

    // ===== 用药记录 CRUD =====
    @RequireRole({2})
    @PostMapping("/medication")
    @OperationLog(module = "健康档案", type = "新增", desc = "添加用药记录")
    public R<?> addMedication(@RequestBody MedicationRecord record) {
        return R.ok("添加成功", healthDetailService.addMedication(record));
    }

    @RequireRole({2})
    @PutMapping("/medication/{id}")
    public R<?> updateMedication(@PathVariable Long id, @RequestBody MedicationRecord record) {
        healthDetailService.updateMedication(id, record);
        return R.ok("修改成功");
    }

    @RequireRole({2})
    @DeleteMapping("/medication/{id}")
    public R<?> deleteMedication(@PathVariable Long id) {
        healthDetailService.deleteMedication(id);
        return R.ok("删除成功");
    }

    // ===== 过敏记录 CRUD =====
    @RequireRole({2})
    @PostMapping("/allergy")
    @OperationLog(module = "健康档案", type = "新增", desc = "添加过敏记录")
    public R<?> addAllergy(@RequestBody AllergyRecord record) {
        return R.ok("添加成功", healthDetailService.addAllergy(record));
    }

    @RequireRole({2})
    @DeleteMapping("/allergy/{id}")
    public R<?> deleteAllergy(@PathVariable Long id) {
        healthDetailService.deleteAllergy(id);
        return R.ok("删除成功");
    }

    // ===== 家族病史 CRUD =====
    @RequireRole({2})
    @PostMapping("/family-history")
    @OperationLog(module = "健康档案", type = "新增", desc = "添加家族病史")
    public R<?> addFamilyHistory(@RequestBody FamilyHistory record) {
        return R.ok("添加成功", healthDetailService.addFamilyHistory(record));
    }

    @RequireRole({2})
    @DeleteMapping("/family-history/{id}")
    public R<?> deleteFamilyHistory(@PathVariable Long id) {
        healthDetailService.deleteFamilyHistory(id);
        return R.ok("删除成功");
    }
}
