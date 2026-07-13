package com.medical.admin.dto;

import lombok.Data;

@Data
public class AdminCreateUserRequest {

    private String username;
    private String password;
    private String confirmPassword;
    private String realName;
    private String phone;
    private String email;
    private Integer userType;
}
