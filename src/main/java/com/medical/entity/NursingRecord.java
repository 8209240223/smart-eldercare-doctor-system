package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 护理记录实体
 */
@Data
@TableName("nursing_record")
public class NursingRecord implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long elderId;

    private Long nurseId;

    /** 记录类型:1基础护理 2专科护理 3生活照料 4心理护理 5康复护理 */
    private Integer recordType;

    private String recordTitle;

    private String recordContent;

    private String nursingMeasures;

    private String observation;

    private String evaluation;

    private LocalDateTime recordDate;

    /** 是否异常:0正常 1异常 */
    private Integer isAbnormal;

    private String abnormalDesc;

    /** 上报状态:0未上报 1已上报 2已处理 */
    private Integer reportStatus;

    /** 医生审核:0未审核 1已查看 2已处理 */
    private Integer doctorReview;

    private Long reviewDoctorId;

    private String reviewComment;

    private LocalDateTime reviewTime;

    private String remark;

    @TableLogic
    private Integer deleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
