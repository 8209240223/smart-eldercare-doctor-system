package com.medical.auth.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Iterator;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Component
public class SensitiveDataSanitizer {

    private static final String MASK = "***";
    private static final Pattern TEXT_SECRET_PATTERN = Pattern.compile(
            "(?i)((?:password|oldPassword|newPassword|confirmPassword|token|tokenId|authorization|captchaCode|captchaKey|secret|apiKey)[\\s\\']*[=:][\\s\\']*)[^&,;\\s}\\]]+");

    private final ObjectMapper objectMapper;

    public SensitiveDataSanitizer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String serialize(Object value, int maximumLength) {
        if (value == null) {
            return null;
        }
        try {
            JsonNode node = objectMapper.valueToTree(value);
            sanitizeNode(node);
            return truncate(objectMapper.writeValueAsString(node), maximumLength);
        } catch (Exception exception) {
            return truncate(sanitizeStoredText(String.valueOf(value), maximumLength), maximumLength);
        }
    }

    public String sanitizeStoredText(String value, int maximumLength) {
        if (!StringUtils.hasText(value)) {
            return value;
        }
        try {
            JsonNode node = objectMapper.readTree(value);
            sanitizeNode(node);
            return truncate(objectMapper.writeValueAsString(node), maximumLength);
        } catch (Exception exception) {
            String sanitized = TEXT_SECRET_PATTERN.matcher(value).replaceAll("$1" + MASK);
            return truncate(sanitized, maximumLength);
        }
    }

    private void sanitizeNode(JsonNode node) {
        if (node instanceof ObjectNode) {
            ObjectNode objectNode = (ObjectNode) node;
            Iterator<Map.Entry<String, JsonNode>> fields = objectNode.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                if (isSensitive(field.getKey())) {
                    objectNode.set(field.getKey(), TextNode.valueOf(MASK));
                } else {
                    sanitizeNode(field.getValue());
                }
            }
            return;
        }
        if (node instanceof ArrayNode) {
            for (JsonNode item : node) {
                sanitizeNode(item);
            }
        }
    }

    private boolean isSensitive(String fieldName) {
        if (fieldName == null) {
            return false;
        }
        String normalized = fieldName.toLowerCase(Locale.ROOT)
                .replace("_", "")
                .replace("-", "");
        return normalized.contains("password")
                || normalized.contains("token")
                || normalized.contains("authorization")
                || normalized.contains("captcha")
                || normalized.contains("secret")
                || normalized.contains("apikey");
    }

    private String truncate(String value, int maximumLength) {
        if (value == null || maximumLength <= 0 || value.length() <= maximumLength) {
            return value;
        }
        return value.substring(0, maximumLength);
    }
}
