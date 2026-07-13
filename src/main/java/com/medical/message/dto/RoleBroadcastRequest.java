package com.medical.message.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

@Data
@EqualsAndHashCode(callSuper = true)
public class RoleBroadcastRequest extends MessageContentRequest {

    @NotNull(message = "目标角色不能为空")
    @Min(value = 1, message = "目标角色不合法")
    @Max(value = 3, message = "目标角色不合法")
    private Integer targetUserType;
}
