package com.medical.assistant.tool;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medical.assistant.agent.AssistantExecutionContext;
import com.medical.assistant.agent.AssistantPermissionService;
import com.medical.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Set;

@Service
public class AssistantInternalApiInvoker {

    private static final Set<Integer> ALL_ROLES = Set.of(
            AssistantPermissionService.ADMIN,
            AssistantPermissionService.DOCTOR,
            AssistantPermissionService.NURSE);
    private static final List<RoutePolicy> ROUTES = List.of(
            new RoutePolicy("/api/admin", Set.of(AssistantPermissionService.ADMIN)),
            new RoutePolicy("/api/auth/info", ALL_ROLES),
            new RoutePolicy("/api/nurse", ALL_ROLES),
            new RoutePolicy("/api/ai", ALL_ROLES),
            new RoutePolicy("/api/assessments", ALL_ROLES),
            new RoutePolicy("/api/care-workflows", ALL_ROLES),
            new RoutePolicy("/api/dashboard", ALL_ROLES),
            new RoutePolicy("/api/elders", ALL_ROLES),
            new RoutePolicy("/api/exams", ALL_ROLES),
            new RoutePolicy("/api/followup", ALL_ROLES),
            new RoutePolicy("/api/health-detail", ALL_ROLES),
            new RoutePolicy("/api/intervention", ALL_ROLES),
            new RoutePolicy("/api/messages", ALL_ROLES),
            new RoutePolicy("/api/profile", ALL_ROLES),
            new RoutePolicy("/api/referrals", ALL_ROLES),
            new RoutePolicy("/api/review", ALL_ROLES),
            new RoutePolicy("/api/risk", ALL_ROLES),
            new RoutePolicy("/api/timeline", ALL_ROLES),
            new RoutePolicy("/api/vitals", ALL_ROLES),
            new RoutePolicy("/api/warning-rules", ALL_ROLES),
            new RoutePolicy("/api/warnings", ALL_ROLES));

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String baseUrl;

    public AssistantInternalApiInvoker(RestTemplateBuilder builder,
                                       ObjectMapper objectMapper,
                                       @Value("${server.port:8080}") int serverPort) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(3))
                .setReadTimeout(Duration.ofSeconds(45))
                .build();
        this.objectMapper = objectMapper;
        this.baseUrl = "http://127.0.0.1:" + serverPort;
    }

    public Object invoke(AssistantExecutionContext context, JsonNode arguments, boolean write) {
        requireCredentials(context);
        String path = requiredText(arguments, "path");
        HttpMethod method = parseMethod(requiredText(arguments, "method"));
        if (write == HttpMethod.GET.equals(method)) {
            throw new BusinessException(400, write
                    ? "Write tool does not allow GET"
                    : "Query tool only allows GET");
        }
        requireAllowedRoute(path, context.role());

        URI uri = buildUri(path, text(arguments, "queryJson"));
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, context.authorization());
        headers.set("X-Token-Id", context.tokenId());
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_JSON);

        Object body = parseJson(text(arguments, "bodyJson"));
        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    uri, method, new HttpEntity<>(body, headers), JsonNode.class);
            JsonNode responseBody = response.getBody();
            if (responseBody == null) {
                return objectMapper.createObjectNode();
            }
            JsonNode code = responseBody.get("code");
            if (code != null && code.isInt() && code.asInt() != 200) {
                throw new BusinessException(code.asInt(), responseBody.path("msg").asText("Site API rejected the request"));
            }
            return sanitizeForAssistant(responseBody.deepCopy());
        } catch (HttpStatusCodeException exception) {
            throw new BusinessException(exception.getRawStatusCode(), safeRemoteMessage(exception.getResponseBodyAsString()));
        }
    }

    public boolean isAllowedCapability(String path, Integer role) {
        try {
            requireAllowedRoute(path, role);
            return true;
        } catch (BusinessException exception) {
            return false;
        }
    }

    private URI buildUri(String path, String queryJson) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(baseUrl).path(path);
        JsonNode query = parseJsonNode(queryJson);
        if (query != null) {
            if (!query.isObject()) {
                throw new BusinessException(400, "queryJson must be a JSON object");
            }
            query.fields().forEachRemaining(entry -> {
                JsonNode value = entry.getValue();
                if (value.isArray()) {
                    value.forEach(item -> builder.queryParam(entry.getKey(), item.asText()));
                } else if (!value.isNull()) {
                    builder.queryParam(entry.getKey(), value.asText());
                }
            });
        }
        try {
            return builder.build().encode(StandardCharsets.UTF_8).toUri();
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(400, "站内查询参数格式不正确");
        }
    }

    private void requireAllowedRoute(String path, Integer role) {
        if (!path.startsWith("/api/") || path.contains("?") || path.contains("#")
                || path.indexOf(92) >= 0 || path.contains("%") || path.contains("..")
                || path.contains(":") || path.contains("//") || path.endsWith("/stream")) {
            throw new BusinessException(400, "Invalid internal API path");
        }
        RoutePolicy policy = ROUTES.stream().filter(route -> route.matches(path)).findFirst().orElse(null);
        if (policy == null) {
            throw new BusinessException(403, "Internal API path is not whitelisted: " + path);
        }
        if (!policy.roles().contains(role)) {
            throw new BusinessException(403, "Current role cannot call this internal API");
        }
    }

    private void requireCredentials(AssistantExecutionContext context) {
        if (!StringUtils.hasText(context.authorization()) || !context.authorization().startsWith("Bearer ")
                || !StringUtils.hasText(context.tokenId())) {
            throw new BusinessException(401, "Original JWT and tokenId are required for site API tools");
        }
    }

    private HttpMethod parseMethod(String value) {
        try {
            HttpMethod method = HttpMethod.valueOf(value.trim().toUpperCase());
            if (method != HttpMethod.GET && method != HttpMethod.POST && method != HttpMethod.PUT
                    && method != HttpMethod.PATCH && method != HttpMethod.DELETE) {
                throw new IllegalArgumentException();
            }
            return method;
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(400, "Unsupported internal API method");
        }
    }

    private Object parseJson(String json) {
        JsonNode node = parseJsonNode(json);
        return node == null ? null : objectMapper.convertValue(node, Object.class);
    }

    private JsonNode parseJsonNode(String json) {
        if (!StringUtils.hasText(json)) {
            return null;
        }
        try {
            return objectMapper.readTree(json);
        } catch (Exception exception) {
            throw new BusinessException(400, "Tool JSON argument is invalid");
        }
    }

    private String safeRemoteMessage(String body) {
        JsonNode node = parseJsonNode(body);
        return node == null ? "Site API call failed" : node.path("msg").asText("Site API call failed");
    }

    private JsonNode sanitizeForAssistant(JsonNode node) {
        if (node == null || node.isNull()) {
            return node;
        }
        if (node.isArray()) {
            ArrayNode array = (ArrayNode) node;
            for (int index = 0; index < array.size(); index++) {
                array.set(index, sanitizeForAssistant(array.get(index)));
            }
            return array;
        }
        if (!node.isObject()) {
            return node;
        }
        ObjectNode object = (ObjectNode) node;
        List<String> fieldNames = new java.util.ArrayList<>();
        object.fieldNames().forEachRemaining(fieldNames::add);
        for (String fieldName : fieldNames) {
            JsonNode value = object.get(fieldName);
            String normalized = fieldName.replace("_", "").replace("-", "").toLowerCase();
            if (isSecretField(normalized)) {
                object.put(fieldName, "[已隐藏]");
            } else if (isIdentityField(normalized)) {
                object.put(fieldName, maskIdentity(value == null ? null : value.asText()));
            } else if (isPhoneField(normalized)) {
                object.put(fieldName, maskPhone(value == null ? null : value.asText()));
            } else if (normalized.contains("email")) {
                object.put(fieldName, maskEmail(value == null ? null : value.asText()));
            } else if (normalized.contains("address")) {
                object.put(fieldName, "[地址已脱敏]");
            } else {
                object.set(fieldName, sanitizeForAssistant(value));
            }
        }
        return object;
    }

    private boolean isSecretField(String field) {
        return field.contains("password") || field.equals("pwd") || field.contains("token")
                || field.contains("authorization") || field.contains("secret")
                || field.contains("apikey") || field.contains("captcha");
    }

    private boolean isIdentityField(String field) {
        return field.contains("idcard") || field.contains("identitycard")
                || field.contains("identitynumber") || field.contains("certificateno");
    }

    private boolean isPhoneField(String field) {
        return field.contains("phone") || field.contains("mobile") || field.endsWith("tel");
    }

    private String maskIdentity(String value) {
        if (!StringUtils.hasText(value) || value.length() < 6) {
            return "[证件号已脱敏]";
        }
        return value.substring(0, 3) + "*************" + value.substring(value.length() - 2);
    }

    private String maskPhone(String value) {
        if (!StringUtils.hasText(value) || value.length() < 7) {
            return "[手机号已脱敏]";
        }
        return value.substring(0, 3) + "****" + value.substring(value.length() - 4);
    }

    private String maskEmail(String value) {
        if (!StringUtils.hasText(value) || !value.contains("@")) {
            return "[邮箱已脱敏]";
        }
        int separator = value.indexOf('@');
        return value.substring(0, 1) + "***" + value.substring(separator);
    }

    private String requiredText(JsonNode arguments, String field) {
        String value = text(arguments, field);
        if (!StringUtils.hasText(value)) {
            throw new BusinessException(400, field + " is required");
        }
        return value.trim();
    }

    private String text(JsonNode arguments, String field) {
        JsonNode value = arguments == null ? null : arguments.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    private record RoutePolicy(String prefix, Set<Integer> roles) {
        private boolean matches(String path) {
            return path.equals(prefix) || path.startsWith(prefix + "/");
        }
    }
}
