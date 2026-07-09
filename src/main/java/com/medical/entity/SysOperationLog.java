package com.medical.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 操作日志实体
 */
@Data
@TableName("sys_operation_log")
public class SysOperationLog implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 操作用户ID */
    private Long userId;

    /** 操作用户名 */
    private String username;

    /** 操作模块 */
    private String module;

    /** 操作类型（新增/修改/删除/查询） */
    private String operationType;

    /** 操作描述 */
    private String description;

    /** 请求方法 */
    private String method;

    /** 请求URL */
    private String requestUrl;

    /** 请求IP */
    private String requestIp;

    /** 请求参数 */
    private String requestParams;

    /** 响应结果 */
    private String responseResult;

    /** 执行时长(ms) */
    private Long duration;

    /** 状态 0失败 1成功 */
    private Integer status;

    /** 错误信息 */
    private String errorMsg;

    private LocalDateTime createTime;
}
