package com.medical.assistant.dto;

public class AssistantStatusResponse {
    private final String model;
    private final boolean configured;

    public AssistantStatusResponse(String model, boolean configured) {
        this.model = model;
        this.configured = configured;
    }

    public String getModel() { return model; }
    public boolean isConfigured() { return configured; }
}
