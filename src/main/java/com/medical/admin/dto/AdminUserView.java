package com.medical.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminUserView {

    private Long id;
    private String username;
    private String realName;
    private String avatar;
    private String phone;
    private String email;
    private Integer userType;
    private Integer status;
    private LocalDateTime lastLoginTime;
    private String lastLoginIp;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
