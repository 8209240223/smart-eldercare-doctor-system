package com.medical.message.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotNull;

@Data
@EqualsAndHashCode(callSuper = true)
public class DirectMessageRequest extends MessageContentRequest {

    @NotNull(message = "收件人不能为空")
    private Long recipientUserId;
}
