package com.medical.admin.dto;

import lombok.Data;

@Data
public class AdminUserStatistics {

    private Long total;
    private Long normal;
    private Long banned;
    private Long pending;
    private Long administrators;
    private Long doctors;
    private Long nurses;
}
