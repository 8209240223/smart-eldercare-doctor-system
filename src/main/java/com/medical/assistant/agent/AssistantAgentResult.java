package com.medical.assistant.agent;

public record AssistantAgentResult(String answer, String conversationId, boolean awaitingApproval) {
}
