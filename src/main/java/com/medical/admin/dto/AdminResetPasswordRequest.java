package com.medical.admin.dto;

import lombok.Data;

@Data
public class AdminResetPasswordRequest {

    private String newPassword;
    private String confirmPassword;
}
