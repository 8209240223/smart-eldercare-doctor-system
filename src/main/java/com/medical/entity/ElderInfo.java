package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;

/**
 * 老人信息实体
 */
@Data
@TableName("elder_info")
public class ElderInfo implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    @NotBlank(message = "姓名不能为空")
    private String name;

    @NotNull(message = "性别不能为空")
    private Integer gender;

    private LocalDate birthDate;

    @NotBlank(message = "身份证号不能为空")
    @Pattern(regexp = "^[0-9Xx]{15,18}$", message = "身份证号格式不正确")
    private String idCard;

    @NotBlank(message = "联系电话不能为空")
    @Pattern(regexp = "^1\\d{10}$", message = "联系电话格式不正确")
    private String phone;

    private String emergencyContact;

    @Pattern(regexp = "^$|^1\\d{10}$", message = "紧急联系电话格式不正确")
    private String emergencyPhone;

    private String nation;

    private Integer maritalStatus;

    private Integer education;

    private String address;

    private String community;

    private Integer medicalInsuranceType;

    private Long doctorId;

    private Integer accountStatus;

    private String password;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
