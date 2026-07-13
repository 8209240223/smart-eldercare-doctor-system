package com.medical.message.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MessageRecipientView {
    private Long id;
    private String username;
    private String realName;
    private Integer userType;
}
