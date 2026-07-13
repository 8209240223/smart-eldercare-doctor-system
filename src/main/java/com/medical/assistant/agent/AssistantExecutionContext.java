package com.medical.assistant.agent;

public record AssistantExecutionContext(Long userId,
                                        Integer role,
                                        String conversationId,
                                        String authorization,
                                        String tokenId) {
}
