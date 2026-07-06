package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

/**
 * 随访计划实体
 */
@Data
@TableName("follow_plan")
public class FollowPlan implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    @NotNull(message = "老人ID不能为空")
    private Long elderId;

    private Long doctorId;

    @NotBlank(message = "计划名称不能为空")
    private String planName;

    @NotNull(message = "病种类型不能为空")
    private Integer diseaseType;

    @NotNull(message = "随访频次不能为空")
    private Integer frequencyType;

    @NotNull(message = "开始日期不能为空")
    private LocalDate startDate;

    private LocalDate endDate;

    private LocalDate nextFollowDate;

    @NotNull(message = "计划总次数不能为空")
    @Min(value = 1, message = "计划总次数至少为1")
    private Integer totalCount;

    private Integer completedCount;

    private Integer status;

    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
