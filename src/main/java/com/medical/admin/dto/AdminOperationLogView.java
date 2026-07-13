package com.medical.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminOperationLogView {

    private Long id;
    private Long userId;
    private String username;
    private String module;
    private String operationType;
    private String description;
    private String method;
    private String requestUrl;
    private String requestIp;
    private String requestParams;
    private String responseResult;
    private Long duration;
    private Integer status;
    private String errorMsg;
    private LocalDateTime createTime;
}
