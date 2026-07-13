package com.medical.assistant.dto;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

public class AssistantChatRequest {
    @NotBlank(message = "消息不能为空")
    @Size(max = 2000, message = "消息不能超过2000个字符")
    private String message;

    @Valid
    @Size(max = 12, message = "历史消息最多保留12条")
    private List<AssistantHistoryMessage> history = new ArrayList<>();

    @Size(max = 64, message = "会话ID不能超过64个字符")
    private String conversationId;

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public List<AssistantHistoryMessage> getHistory() { return history; }
    public void setHistory(List<AssistantHistoryMessage> history) { this.history = history; }
    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }
}
