package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 可穿戴设备绑定实体
 */
@Data
@TableName("wearable_device")
public class WearableDevice implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long elderId;

    /** 设备类型: 1智能手环 2血压计 3血糖仪 4心电监护 */
    private Integer deviceType;

    private String deviceName;

    private String deviceSn;

    /** 绑定状态: 0解绑 1绑定 */
    private Integer bindStatus;

    private LocalDateTime bindTime;

    private LocalDateTime createTime;
}
