package com.medical.assistant.dto;

public class AssistantActionResponse {
    private final String actionId;
    private final String tool;
    private final Object result;
    private final boolean replayed;

    public AssistantActionResponse(String actionId, String tool, Object result, boolean replayed) {
        this.actionId = actionId;
        this.tool = tool;
        this.result = result;
        this.replayed = replayed;
    }

    public String getActionId() { return actionId; }
    public String getTool() { return tool; }
    public Object getResult() { return result; }
    public boolean isReplayed() { return replayed; }
}
