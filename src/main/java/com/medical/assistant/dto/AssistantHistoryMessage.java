package com.medical.assistant.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

public class AssistantHistoryMessage {
    @NotBlank(message = "历史消息角色不能为空")
    @Pattern(regexp = "user|assistant", message = "历史消息角色只能是 user 或 assistant")
    private String role;

    @NotBlank(message = "历史消息内容不能为空")
    @Size(max = 1000, message = "单条历史消息不能超过1000个字符")
    private String content;

    public AssistantHistoryMessage() {}

    public AssistantHistoryMessage(String role, String content) {
        this.role = role;
        this.content = content;
    }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
