package com.medical.admin.dto;

import lombok.Data;

import java.util.List;

@Data
public class AdminUpdateWorkProfileRequest {
    private String department;
    private List<Long> collaboratorIds;
}
