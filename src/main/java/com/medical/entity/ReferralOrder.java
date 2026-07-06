package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 转诊单实体
 */
@Data
@TableName("referral_order")
public class ReferralOrder implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String referralNo;

    private Long elderId;

    /** 转诊类型: 1上转(社区→三甲) 2下转(三甲→社区) */
    private Integer referralType;

    private String fromOrg;
    private Long fromDoctorId;
    private String fromDoctorName;

    private String toOrg;
    private Long toDoctorId;
    private String toDoctorName;
    private String toDept;

    private String diagnosis;
    private String referralReason;

    /** 紧急程度: 1普通 2紧急 3危急 */
    private Integer urgencyLevel;

    private Integer bedReserved;

    /** 状态: 0待接收 1已接收 2处理中 3已完成 4已拒绝 5已取消 */
    private Integer status;

    private LocalDateTime acceptTime;
    private LocalDateTime completeTime;
    private String dischargeSummary;
    private String rejectReason;
    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
