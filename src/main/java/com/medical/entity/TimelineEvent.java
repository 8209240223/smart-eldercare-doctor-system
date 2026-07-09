package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 患者时间轴事件实体
 */
@Data
@TableName("timeline_event")
public class TimelineEvent implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long elderId;

    /** 事件类型: 1就诊 2检查 3用药变更 4预警 5随访 6评估 7转诊 8住院 9出院 */
    private Integer eventType;

    private String eventTitle;

    private String eventContent;

    /** 结构化数据JSON */
    private String eventData;

    /** 来源模块 */
    private String sourceType;

    /** 关联源记录ID */
    private Long sourceId;

    private LocalDateTime eventTime;

    private Long doctorId;

    private LocalDateTime createTime;
}
