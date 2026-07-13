package com.medical.assistant.dto;

public class AssistantChatResponse {
    private final String answer;
    private final String model;
    private final boolean configured;
    private final String conversationId;

    public AssistantChatResponse(String answer, String model, boolean configured) {
        this(answer, model, configured, null);
    }

    public AssistantChatResponse(String answer, String model, boolean configured, String conversationId) {
        this.answer = answer;
        this.model = model;
        this.configured = configured;
        this.conversationId = conversationId;
    }

    public String getAnswer() { return answer; }
    public String getModel() { return model; }
    public boolean isConfigured() { return configured; }
    public String getConversationId() { return conversationId; }
}
