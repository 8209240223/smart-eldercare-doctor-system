package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 随访任务实体(自动生成的随访任务)
 */
@Data
@TableName("followup_task")
public class FollowupTask implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 老人ID
     */
    private Long elderId;

    /**
     * 关联随访计划ID
     */
    private Long planId;

    /**
     * 负责医生ID
     */
    private Long doctorId;

    /**
     * 执行随访协作任务的护士ID
     */
    private Long nurseId;

    /**
     * 任务类型:1风险随访 2逾期随访 3预约随访
     */
    private Integer taskType;

    /**
     * 优先级:1低 2中 3高 4紧急
     */
    private Integer priority;

    /**
     * 截止日期
     */
    private LocalDate dueDate;

    /**
     * 状态:0待执行 1执行中 2已完成 3已取消
     */
    private Integer status;

    /**
     * 任务来源:RISK_AUTO表示自动生成
     */
    private String source;

    /**
     * 任务原因
     */
    private String taskReason;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 完成时间
     */
    private LocalDateTime finishTime;

    /**
     * 关联随访记录ID
     */
    private Long followRecordId;

    /**
     * 备注
     */
    private String remark;
}
