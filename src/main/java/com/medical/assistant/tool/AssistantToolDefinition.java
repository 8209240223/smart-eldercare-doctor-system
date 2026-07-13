package com.medical.assistant.tool;

import com.fasterxml.jackson.databind.JsonNode;
import com.medical.assistant.agent.AssistantExecutionContext;
import dev.langchain4j.agent.tool.ToolSpecification;

import java.util.Set;
import java.util.function.BiFunction;
import java.util.function.Function;

public record AssistantToolDefinition(
        ToolSpecification specification,
        Set<Integer> roles,
        boolean write,
        boolean approvalRequired,
        BiFunction<AssistantExecutionContext, JsonNode, Object> executor,
        Function<JsonNode, String> summaryBuilder) {
}
