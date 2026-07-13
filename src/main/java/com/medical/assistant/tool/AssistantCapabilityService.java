package com.medical.assistant.tool;

import com.medical.common.annotation.OperationLog;
import com.medical.common.annotation.RequireRole;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.lang.reflect.Parameter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class AssistantCapabilityService {

    private static final int MAX_RESULTS = 80;
    private static final Map<String, List<String>> KEYWORD_ALIASES = Map.ofEntries(
            Map.entry("老人", List.of("elder", "health-detail")),
            Map.entry("档案", List.of("elder", "health-detail")),
            Map.entry("随访", List.of("followup")),
            Map.entry("护理", List.of("nurse", "nursing")),
            Map.entry("消息", List.of("message")),
            Map.entry("协同", List.of("message")),
            Map.entry("用户", List.of("admin", "user")),
            Map.entry("账号", List.of("admin", "user", "profile")),
            Map.entry("个人", List.of("profile", "auth/info")),
            Map.entry("我的", List.of("profile", "auth/info")),
            Map.entry("预警", List.of("warning")),
            Map.entry("转诊", List.of("referral")),
            Map.entry("评估", List.of("assessment")),
            Map.entry("体检", List.of("exam")),
            Map.entry("体征", List.of("vital")),
            Map.entry("报告", List.of("ai", "health-report")),
            Map.entry("风险", List.of("risk")),
            Map.entry("重点人群", List.of("risk")),
            Map.entry("时间轴", List.of("timeline")),
            Map.entry("干预", List.of("intervention")),
            Map.entry("工作台", List.of("dashboard")));

    private final RequestMappingHandlerMapping handlerMapping;
    private final AssistantInternalApiInvoker apiInvoker;

    public AssistantCapabilityService(@Lazy RequestMappingHandlerMapping handlerMapping,
                                      AssistantInternalApiInvoker apiInvoker) {
        this.handlerMapping = handlerMapping;
        this.apiInvoker = apiInvoker;
    }

    public List<Map<String, Object>> search(Integer role, String keyword) {
        Set<String> searchTerms = searchTerms(keyword);
        List<Map<String, Object>> capabilities = new ArrayList<>();
        for (Map.Entry<RequestMappingInfo, HandlerMethod> entry : handlerMapping.getHandlerMethods().entrySet()) {
            HandlerMethod handler = entry.getValue();
            if (!isRoleAllowed(handler, role)) {
                continue;
            }
            Set<String> paths = entry.getKey().getPatternValues();
            Set<RequestMethod> methods = entry.getKey().getMethodsCondition().getMethods();
            for (String path : paths) {
                if (!apiInvoker.isAllowedCapability(path, role)) {
                    continue;
                }
                String description = description(handler);
                String searchable = (path + " " + description + " "
                        + handler.getBeanType().getSimpleName() + " " + handler.getMethod().getName())
                        .toLowerCase(Locale.ROOT);
                if (!searchTerms.isEmpty() && searchTerms.stream().noneMatch(searchable::contains)) {
                    continue;
                }
                Set<RequestMethod> actualMethods = methods.isEmpty()
                        ? Set.of(RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE)
                        : methods;
                for (RequestMethod method : actualMethods) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("method", method.name());
                    item.put("path", path);
                    item.put("description", description);
                    Map<String, Map<String, Object>> bodySchema = requestBodySchema(handler);
                    if (!bodySchema.isEmpty()) {
                        item.put("bodyFields", new ArrayList<>(bodySchema.keySet()));
                        item.put("bodySchema", bodySchema);
                    }
                    capabilities.add(item);
                }
            }
        }
        capabilities.sort(Comparator
                .comparing((Map<String, Object> item) -> String.valueOf(item.get("path")))
                .thenComparing(item -> String.valueOf(item.get("method"))));
        return capabilities.size() <= MAX_RESULTS
                ? capabilities
                : new ArrayList<>(capabilities.subList(0, MAX_RESULTS));
    }

    private Set<String> searchTerms(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return Set.of();
        }
        String normalized = keyword.trim().toLowerCase(Locale.ROOT);
        Set<String> terms = new LinkedHashSet<>();
        terms.add(normalized);
        KEYWORD_ALIASES.forEach((chineseKeyword, aliases) -> {
            if (normalized.contains(chineseKeyword)) {
                terms.addAll(aliases);
            }
        });
        return terms;
    }

    private boolean isRoleAllowed(HandlerMethod handler, Integer role) {
        RequireRole requirement = AnnotatedElementUtils.findMergedAnnotation(handler.getMethod(), RequireRole.class);
        if (requirement == null) {
            requirement = AnnotatedElementUtils.findMergedAnnotation(handler.getBeanType(), RequireRole.class);
        }
        if (requirement == null) {
            return true;
        }
        return Arrays.stream(requirement.value()).anyMatch(value -> value == role);
    }

    private String description(HandlerMethod handler) {
        OperationLog operation = AnnotatedElementUtils.findMergedAnnotation(handler.getMethod(), OperationLog.class);
        if (operation != null && StringUtils.hasText(operation.desc())) {
            return operation.desc();
        }
        return handler.getBeanType().getSimpleName() + "." + handler.getMethod().getName();
    }

    private Map<String, Map<String, Object>> requestBodySchema(HandlerMethod handler) {
        for (Parameter parameter : handler.getMethod().getParameters()) {
            if (parameter.getAnnotation(RequestBody.class) == null) {
                continue;
            }
            Map<String, Map<String, Object>> fields = new LinkedHashMap<>();
            Class<?> currentType = parameter.getType();
            while (currentType != null && currentType != Object.class) {
                for (Field field : currentType.getDeclaredFields()) {
                    if (!Modifier.isStatic(field.getModifiers()) && !field.isSynthetic()
                            && !fields.containsKey(field.getName())) {
                        fields.put(field.getName(), fieldSchema(field));
                    }
                }
                currentType = currentType.getSuperclass();
            }
            return fields;
        }
        return Map.of();
    }

    private Map<String, Object> fieldSchema(Field field) {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", jsonType(field.getType()));
        schema.put("required", field.getAnnotation(NotNull.class) != null
                || field.getAnnotation(NotBlank.class) != null);
        Min minimum = field.getAnnotation(Min.class);
        Max maximum = field.getAnnotation(Max.class);
        Size size = field.getAnnotation(Size.class);
        if (minimum != null) {
            schema.put("minimum", minimum.value());
        }
        if (maximum != null) {
            schema.put("maximum", maximum.value());
        }
        if (size != null && size.max() < Integer.MAX_VALUE) {
            schema.put("maxLength", size.max());
        }
        return schema;
    }

    private String jsonType(Class<?> type) {
        if (type == boolean.class || type == Boolean.class) {
            return "boolean";
        }
        if (type == float.class || type == double.class
                || type == Float.class || type == Double.class
                || type == java.math.BigDecimal.class) {
            return "number";
        }
        if (Number.class.isAssignableFrom(type)
                || type == byte.class || type == short.class || type == int.class || type == long.class) {
            return "integer";
        }
        if (CharSequence.class.isAssignableFrom(type) || type.isEnum()
                || java.time.temporal.Temporal.class.isAssignableFrom(type)) {
            return "string";
        }
        if (type.isArray() || Iterable.class.isAssignableFrom(type)) {
            return "array";
        }
        return "object";
    }
}
