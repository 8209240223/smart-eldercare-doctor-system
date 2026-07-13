package com.medical.assistant.tool;

import com.medical.assistant.agent.AssistantApprovalService;

public record AssistantToolHandlingResult(String resultJson,
                                          AssistantApprovalService.ApprovalRequest approval) {
    public boolean requiresApproval() {
        return approval != null;
    }
}
