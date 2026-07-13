package com.medical.message.dto;

import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class MessageContentRequest {

    @NotBlank(message = "消息标题不能为空")
    @Size(max = 200, message = "消息标题不能超过200个字符")
    private String title;

    @NotBlank(message = "消息内容不能为空")
    @Size(max = 1000, message = "消息内容不能超过1000个字符")
    private String content;

    @Min(value = 1, message = "消息类型不合法")
    @Max(value = 5, message = "消息类型不合法")
    private Integer msgType;

    @Min(value = 1, message = "消息优先级不合法")
    @Max(value = 3, message = "消息优先级不合法")
    private Integer priority;

    @Size(max = 500, message = "站内跳转地址不能超过500个字符")
    private String actionUrl;
}
