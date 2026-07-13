package com.medical.admin.dto;

import lombok.Data;

@Data
public class AdminUserQuery {

    private Integer pageNum = 1;
    private Integer pageSize = 10;
    private String keyword;
    private Integer userType;
    private Integer status;
}
