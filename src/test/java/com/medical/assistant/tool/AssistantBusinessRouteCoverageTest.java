package com.medical.assistant.tool;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.assistant.agent.AssistantPermissionService;
import com.medical.common.annotation.RequireRole;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class AssistantBusinessRouteCoverageTest {

    @Test
    void everyProtectedBusinessControllerRouteIsInsideTheAgentAllowlist() throws Exception {
        AssistantInternalApiInvoker invoker = new AssistantInternalApiInvoker(
                new RestTemplateBuilder(), new ObjectMapper(), 8080);
        ClassPathScanningCandidateComponentProvider scanner =
                new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));
        List<String> uncovered = new ArrayList<>();
        int[] covered = {0};

        for (var candidate : scanner.findCandidateComponents("com.medical")) {
            Class<?> controllerType = Class.forName(candidate.getBeanClassName());
            RequestMapping classMapping = AnnotatedElementUtils.findMergedAnnotation(
                    controllerType, RequestMapping.class);
            if (classMapping == null) {
                continue;
            }
            for (Method method : controllerType.getDeclaredMethods()) {
                RequestMapping methodMapping = AnnotatedElementUtils.findMergedAnnotation(
                        method, RequestMapping.class);
                if (methodMapping == null) {
                    continue;
                }
                for (String basePath : mappingPaths(classMapping)) {
                    for (String methodPath : mappingPaths(methodMapping)) {
                        String path = normalizePath(basePath, methodPath);
                        if (isDeliberatelyExcluded(path)) {
                            continue;
                        }
                        boolean routeCovered = true;
                        for (Integer role : requiredRoles(controllerType, method)) {
                            if (!invoker.isAllowedCapability(path, role)) {
                                routeCovered = false;
                                uncovered.add(controllerType.getSimpleName() + "." + method.getName()
                                        + " " + path + " role=" + role);
                            }
                        }
                        if (routeCovered) {
                            covered[0]++;
                        }
                    }
                }
            }
        }

        assertThat(covered[0]).isGreaterThan(150);
        assertThat(uncovered).isEmpty();
    }

    private List<String> mappingPaths(RequestMapping mapping) {
        String[] paths = mapping.path().length > 0 ? mapping.path() : mapping.value();
        return paths.length == 0 ? List.of("") : Arrays.asList(paths);
    }

    private String normalizePath(String basePath, String methodPath) {
        String joined = (basePath + "/" + methodPath).replaceAll("/{2,}", "/");
        return joined.length() > 1 && joined.endsWith("/")
                ? joined.substring(0, joined.length() - 1)
                : joined;
    }

    private boolean isDeliberatelyExcluded(String path) {
        if (path.startsWith("/api/assistant")) {
            return true;
        }
        if (path.startsWith("/api/auth") && !path.equals("/api/auth/info")) {
            return true;
        }
        return path.endsWith("/stream");
    }

    private Set<Integer> requiredRoles(Class<?> controllerType, Method method) {
        RequireRole requirement = AnnotatedElementUtils.findMergedAnnotation(method, RequireRole.class);
        if (requirement == null) {
            requirement = AnnotatedElementUtils.findMergedAnnotation(controllerType, RequireRole.class);
        }
        if (requirement == null) {
            return Set.of(
                    AssistantPermissionService.ADMIN,
                    AssistantPermissionService.DOCTOR,
                    AssistantPermissionService.NURSE);
        }
        return Arrays.stream(requirement.value()).boxed().collect(java.util.stream.Collectors.toSet());
    }
}
