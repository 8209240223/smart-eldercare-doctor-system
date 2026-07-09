package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 设备体征数据实体
 */
@Data
@TableName("vital_sign_data")
public class VitalSignData implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long elderId;

    private Long deviceId;

    /** 数据类型: 1收缩压 2舒张压 3心率 4血糖空腹 5血糖餐后 6血氧 7体温 8步数 9睡眠 */
    private Integer dataType;

    private BigDecimal dataValue;

    private String unit;

    /** 测量时间 */
    private LocalDateTime measureTime;

    /** 是否异常 */
    private Integer isAbnormal;

    private LocalDateTime createTime;
}
