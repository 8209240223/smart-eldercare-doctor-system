package com.medical.admin.dto;

import lombok.Data;

@Data
public class AdminUserRelationView {
    private Long id;
    private String username;
    private String realName;
    private String department;
}
