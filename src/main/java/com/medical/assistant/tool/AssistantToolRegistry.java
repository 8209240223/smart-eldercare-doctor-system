package com.medical.assistant.tool;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.assistant.agent.AssistantApprovalService;
import com.medical.assistant.agent.AssistantExecutionContext;
import com.medical.assistant.agent.AssistantPermissionService;
import com.medical.common.exception.BusinessException;
import dev.langchain4j.agent.tool.ToolExecutionRequest;
import dev.langchain4j.agent.tool.ToolSpecification;
import dev.langchain4j.model.chat.request.json.JsonObjectSchema;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AssistantToolRegistry {

    private final Map<String, AssistantToolDefinition> definitions = new LinkedHashMap<>();
    private final AssistantInternalApiInvoker apiInvoker;
    private final AssistantPermissionService permissionService;
    private final AssistantApprovalService approvalService;
    private final AssistantCapabilityService capabilityService;
    private final ObjectMapper objectMapper;

    public AssistantToolRegistry(AssistantInternalApiInvoker apiInvoker,
                                 AssistantPermissionService permissionService,
                                 AssistantApprovalService approvalService,
                                 AssistantCapabilityService capabilityService,
                                 ObjectMapper objectMapper) {
        this.apiInvoker = apiInvoker;
        this.permissionService = permissionService;
        this.approvalService = approvalService;
        this.capabilityService = capabilityService;
        this.objectMapper = objectMapper;
        registerTools();
    }

    public List<ToolSpecification> specificationsForRole(Integer role) {
        List<ToolSpecification> result = new ArrayList<>();
        for (AssistantToolDefinition definition : definitions.values()) {
            if (definition.roles().contains(role)) {
                result.add(definition.specification());
            }
        }
        return result;
    }

    public List<Map<String, Object>> capabilityHintsForRole(Integer role, String userRequest) {
        List<Map<String, Object>> matches = capabilityService.search(role, userRequest);
        int limit = Math.min(matches.size(), 80);
        return new ArrayList<>(matches.subList(0, limit));
    }

    public AssistantToolHandlingResult handle(ToolExecutionRequest request,
                                               AssistantExecutionContext context) {
        AssistantToolDefinition definition = requireDefinition(request.name());
        permissionService.requireRole(context, definition.roles());
        JsonNode arguments = parseArguments(request.arguments());
        if (definition.approvalRequired()) {
            String summary = definition.summaryBuilder().apply(arguments);
            AssistantApprovalService.ApprovalRequest approval = approvalService.issue(
                    request.name(), writeArguments(arguments), summary, context);
            return new AssistantToolHandlingResult(null, approval);
        }
        Object result = definition.executor().apply(context, arguments);
        return new AssistantToolHandlingResult(writeResult(result), null);
    }

    public Object executeApproved(AssistantApprovalService.PendingAction action,
                                  AssistantExecutionContext currentContext) {
        AssistantToolDefinition definition = requireDefinition(action.tool);
        if (!definition.write() || !definition.approvalRequired()) {
            throw new BusinessException(400, "Tool is not an approvable write operation");
        }
        if (!action.userId.equals(currentContext.userId()) || !action.role.equals(currentContext.role())) {
            throw new BusinessException(403, "Approval token does not belong to current user");
        }
        permissionService.requireRole(currentContext, definition.roles());
        return definition.executor().apply(currentContext, parseArguments(action.argumentsJson));
    }

    private void registerTools() {
        Set<Integer> roles = Set.of(
                AssistantPermissionService.ADMIN,
                AssistantPermissionService.DOCTOR,
                AssistantPermissionService.NURSE);

        JsonObjectSchema capabilitySchema = JsonObjectSchema.builder()
                .addStringProperty("keyword", "Optional module or action keyword, for example 老人、随访、护理、消息、用户")
                .additionalProperties(false)
                .build();
        register(new AssistantToolDefinition(
                specification("list_site_capabilities",
                        "List the real protected Spring MVC endpoints available to the current role. "
                                + "Call this before query_site_api or execute_site_api whenever the exact path, method or body fields are uncertain.",
                        capabilitySchema),
                roles,
                false,
                false,
                (context, arguments) -> capabilityService.search(context.role(), arguments.path("keyword").asText("")),
                arguments -> "List available site capabilities"));

        JsonObjectSchema querySchema = JsonObjectSchema.builder()
                .addEnumProperty("method", List.of("GET"), "Only GET is allowed for query tools")
                .addStringProperty("path", "Whitelisted relative site API path beginning with /api/")
                .addStringProperty("queryJson", "Optional JSON object containing query parameters")
                .required("method", "path")
                .additionalProperties(false)
                .build();
        register(new AssistantToolDefinition(
                specification("query_site_api",
                        "Call an existing protected site query API with the current user's original JWT and tokenId. "
                                + "Allowed modules include elders, followup, warnings, nursing, referrals, messages, "
                                + "AI reports, assessments, exams, vitals, timeline, dashboard and role-scoped admin APIs.",
                        querySchema),
                roles,
                false,
                false,
                (context, arguments) -> apiInvoker.invoke(context, arguments, false),
                arguments -> "Query site API " + arguments.path("path").asText()));

        JsonObjectSchema writeSchema = JsonObjectSchema.builder()
                .addEnumProperty("method", List.of("POST", "PUT", "PATCH", "DELETE"),
                        "HTTP method of the existing protected site API")
                .addStringProperty("path", "Whitelisted relative site API path beginning with /api/")
                .addStringProperty("queryJson", "Optional JSON object containing query parameters")
                .addStringProperty("bodyJson", "Optional JSON request body")
                .required("method", "path")
                .additionalProperties(false)
                .build();
        register(new AssistantToolDefinition(
                specification("execute_site_api",
                        "Execute an existing protected site API with the current user's original JWT and tokenId. "
                                + "Use this for AI report generation, followup plans/tasks, warning handling, nursing "
                                + "records/plans, referral status, messages and other whitelisted site operations. "
                                + "bodyJson values must follow the exact JSON types returned by bodySchema; omit optional fields when their coded value is unknown. "
                                + "Call this as soon as all write parameters are ready. It only stages the operation "
                                + "and returns approval_required; it never executes before the user confirms the UI approval card.",
                        writeSchema),
                roles,
                true,
                true,
                (context, arguments) -> apiInvoker.invoke(context, arguments, true),
                arguments -> arguments.path("method").asText() + " " + arguments.path("path").asText()));
    }

    private ToolSpecification specification(String name, String description, JsonObjectSchema parameters) {
        return ToolSpecification.builder()
                .name(name)
                .description(description)
                .parameters(parameters)
                .strict(false)
                .build();
    }

    private void register(AssistantToolDefinition definition) {
        if (definition.write() && !definition.approvalRequired()) {
            throw new IllegalStateException("Every site write tool must require approval: "
                    + definition.specification().name());
        }
        if (definitions.putIfAbsent(definition.specification().name(), definition) != null) {
            throw new IllegalStateException("Duplicate assistant tool: " + definition.specification().name());
        }
    }

    private AssistantToolDefinition requireDefinition(String name) {
        AssistantToolDefinition definition = definitions.get(name);
        if (definition == null) {
            throw new BusinessException(400, "Tool is not whitelisted: " + name);
        }
        return definition;
    }

    private JsonNode parseArguments(String json) {
        try {
            JsonNode node = objectMapper.readTree(json == null || json.isBlank() ? "{}" : json);
            if (!node.isObject()) {
                throw new BusinessException(400, "Tool arguments must be a JSON object");
            }
            return node;
        } catch (BusinessException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BusinessException(400, "Tool arguments are invalid JSON");
        }
    }

    private String writeArguments(JsonNode arguments) {
        try {
            return objectMapper.writeValueAsString(arguments);
        } catch (Exception exception) {
            throw new BusinessException(400, "Tool arguments cannot be serialized");
        }
    }

    private String writeResult(Object result) {
        try {
            return objectMapper.writeValueAsString(result);
        } catch (Exception exception) {
            throw new BusinessException(500, "Site API result cannot be serialized");
        }
    }
}
