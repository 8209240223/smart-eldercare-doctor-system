package com.medical.dto;

import com.alibaba.excel.annotation.ExcelProperty;
import com.medical.entity.ElderInfo;
import com.medical.entity.HealthRecord;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ElderExportRow {

    @ExcelProperty("老人ID")
    private Long id;
    @ExcelProperty("姓名")
    private String name;
    @ExcelProperty("性别")
    private String gender;
    @ExcelProperty("出生日期")
    private LocalDate birthDate;
    @ExcelProperty("身份证号")
    private String idCard;
    @ExcelProperty("联系电话")
    private String phone;
    @ExcelProperty("紧急联系人")
    private String emergencyContact;
    @ExcelProperty("紧急联系电话")
    private String emergencyPhone;
    @ExcelProperty("民族")
    private String nation;
    @ExcelProperty("居住地址")
    private String address;
    @ExcelProperty("所属社区")
    private String community;
    @ExcelProperty("责任医生ID")
    private Long doctorId;
    @ExcelProperty("账号状态")
    private String accountStatus;
    @ExcelProperty("档案编号")
    private String recordNo;
    @ExcelProperty("血型")
    private String bloodType;
    @ExcelProperty("身高(cm)")
    private BigDecimal height;
    @ExcelProperty("体重(kg)")
    private BigDecimal weight;
    @ExcelProperty("既往病史")
    private String medicalHistory;
    @ExcelProperty("家族史")
    private String familyHistory;
    @ExcelProperty("过敏史")
    private String allergyHistory;
    @ExcelProperty("手术史")
    private String surgeryHistory;
    @ExcelProperty("当前用药")
    private String currentMedication;
    @ExcelProperty("残疾情况")
    private String disabilityStatus;
    @ExcelProperty("生活自理能力")
    private Integer livingAbility;
    @ExcelProperty("吸烟状态")
    private Integer smokingStatus;
    @ExcelProperty("饮酒状态")
    private Integer drinkingStatus;
    @ExcelProperty("锻炼频率")
    private Integer exerciseFrequency;

    public static ElderExportRow from(ElderInfo elder, HealthRecord record) {
        ElderExportRow row = new ElderExportRow();
        row.setId(elder.getId());
        row.setName(elder.getName());
        row.setGender(elder.getGender() != null && elder.getGender() == 2 ? "女" : "男");
        row.setBirthDate(elder.getBirthDate());
        row.setIdCard(elder.getIdCard());
        row.setPhone(elder.getPhone());
        row.setEmergencyContact(elder.getEmergencyContact());
        row.setEmergencyPhone(elder.getEmergencyPhone());
        row.setNation(elder.getNation());
        row.setAddress(elder.getAddress());
        row.setCommunity(elder.getCommunity());
        row.setDoctorId(elder.getDoctorId());
        row.setAccountStatus(elder.getAccountStatus() != null && elder.getAccountStatus() == 0 ? "停用" : "正常");
        if (record != null) {
            row.setRecordNo(record.getRecordNo());
            row.setBloodType(record.getBloodType());
            row.setHeight(record.getHeight());
            row.setWeight(record.getWeight());
            row.setMedicalHistory(record.getMedicalHistory());
            row.setFamilyHistory(record.getFamilyHistory());
            row.setAllergyHistory(record.getAllergyHistory());
            row.setSurgeryHistory(record.getSurgeryHistory());
            row.setCurrentMedication(record.getCurrentMedication());
            row.setDisabilityStatus(record.getDisabilityStatus());
            row.setLivingAbility(record.getLivingAbility());
            row.setSmokingStatus(record.getSmokingStatus());
            row.setDrinkingStatus(record.getDrinkingStatus());
            row.setExerciseFrequency(record.getExerciseFrequency());
        }
        return row;
    }
}
