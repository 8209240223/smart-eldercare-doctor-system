package com.medical.assistant.tool;

import com.medical.common.annotation.OperationLog;
import com.medical.common.annotation.RequireRole;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.DefaultParameterNameDiscoverer;
import org.springframework.core.ParameterNameDiscoverer;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ValueConstants;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

import java.lang.reflect.AnnotatedElement;
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

    private static final int MAX_RESULTS = 240;
    private static final ParameterNameDiscoverer PARAMETER_NAMES = new DefaultParameterNameDiscoverer();
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
            Map.entry("重点", List.of("risk", "warning", "dashboard")),
            Map.entry("今日", List.of("dashboard", "followup", "warning", "message")),
            Map.entry("待办", List.of("dashboard", "followup", "review", "message")),
            Map.entry("任务", List.of("followup", "nurse")),
            Map.entry("计划", List.of("followup", "nurse", "care-workflow")),
            Map.entry("流程", List.of("care-workflow", "timeline")),
            Map.entry("审核", List.of("review", "admin")),
            Map.entry("日志", List.of("operation-log", "warning", "profile")),
            Map.entry("封禁", List.of("admin", "user", "ban")),
            Map.entry("解封", List.of("admin", "user", "unban")),
            Map.entry("密码", List.of("admin", "profile", "password")),
            Map.entry("下线", List.of("admin", "logout", "session")),
            Map.entry("导出", List.of("export")),
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
                    Map<String, Map<String, Object>> pathSchema = pathParameterSchema(handler);
                    Map<String, Map<String, Object>> querySchema = queryParameterSchema(handler);
                    if (!pathSchema.isEmpty()) {
                        item.put("pathParameters", pathSchema);
                    }
                    if (!querySchema.isEmpty()) {
                        item.put("queryParameters", querySchema);
                    }
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
            return fieldsSchema(parameter.getType());
        }
        return Map.of();
    }

    private Map<String, Map<String, Object>> pathParameterSchema(HandlerMethod handler) {
        Map<String, Map<String, Object>> fields = new LinkedHashMap<>();
        Parameter[] parameters = handler.getMethod().getParameters();
        String[] discoveredNames = PARAMETER_NAMES.getParameterNames(handler.getMethod());
        for (int index = 0; index < parameters.length; index++) {
            Parameter parameter = parameters[index];
            PathVariable annotation = parameter.getAnnotation(PathVariable.class);
            if (annotation == null) {
                continue;
            }
            String name = parameterName(annotation.name(), annotation.value(), discoveredNames, index);
            fields.put(name, valueSchema(parameter.getType(), parameter, annotation.required()));
        }
        return fields;
    }

    private Map<String, Map<String, Object>> queryParameterSchema(HandlerMethod handler) {
        Map<String, Map<String, Object>> fields = new LinkedHashMap<>();
        Parameter[] parameters = handler.getMethod().getParameters();
        String[] discoveredNames = PARAMETER_NAMES.getParameterNames(handler.getMethod());
        for (int index = 0; index < parameters.length; index++) {
            Parameter parameter = parameters[index];
            RequestParam requestParam = parameter.getAnnotation(RequestParam.class);
            if (requestParam != null) {
                String name = parameterName(requestParam.name(), requestParam.value(), discoveredNames, index);
                boolean hasDefault = !ValueConstants.DEFAULT_NONE.equals(requestParam.defaultValue());
                Map<String, Object> schema = valueSchema(
                        parameter.getType(), parameter, requestParam.required() && !hasDefault);
                if (hasDefault) {
                    schema.put("defaultValue", requestParam.defaultValue());
                }
                fields.put(name, schema);
                continue;
            }
            if (parameter.getAnnotation(ModelAttribute.class) != null) {
                fields.putAll(fieldsSchema(parameter.getType()));
            }
        }
        return fields;
    }

    private String parameterName(String name,
                                 String value,
                                 String[] discoveredNames,
                                 int index) {
        if (StringUtils.hasText(name)) {
            return name;
        }
        if (StringUtils.hasText(value)) {
            return value;
        }
        if (discoveredNames != null && index < discoveredNames.length
                && StringUtils.hasText(discoveredNames[index])) {
            return discoveredNames[index];
        }
        return "arg" + index;
    }

    private Map<String, Map<String, Object>> fieldsSchema(Class<?> type) {
        Map<String, Map<String, Object>> fields = new LinkedHashMap<>();
        Class<?> currentType = type;
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

    private Map<String, Object> fieldSchema(Field field) {
        return valueSchema(field.getType(), field,
                field.getAnnotation(NotNull.class) != null || field.getAnnotation(NotBlank.class) != null);
    }

    private Map<String, Object> valueSchema(Class<?> type,
                                            AnnotatedElement annotatedElement,
                                            boolean required) {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", jsonType(type));
        schema.put("required", required);
        Min minimum = annotatedElement.getAnnotation(Min.class);
        Max maximum = annotatedElement.getAnnotation(Max.class);
        Size size = annotatedElement.getAnnotation(Size.class);
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
