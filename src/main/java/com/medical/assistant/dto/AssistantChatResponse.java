package com.medical.assistant.dto;

public class AssistantChatResponse {
    private final String answer;
    private final String model;
    private final boolean configured;

    public AssistantChatResponse(String answer, String model, boolean configured) {
        this.answer = answer;
        this.model = model;
        this.configured = configured;
    }

    public String getAnswer() { return answer; }
    public String getModel() { return model; }
    public boolean isConfigured() { return configured; }
}
