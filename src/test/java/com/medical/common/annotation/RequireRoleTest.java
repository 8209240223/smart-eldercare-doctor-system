package com.medical.common.annotation;

import org.junit.jupiter.api.Test;
import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

/**
 * RequireRole 注解测试
 */
class RequireRoleTest {

    @Test
    void testAnnotationRetention() {
        RequireRole annotation = AdminController.class.getAnnotation(RequireRole.class);
        assertNotNull(annotation, "类上应能读取到 @RequireRole 注解");
        assertArrayEquals(new int[]{1}, annotation.value());
    }

    @Test
    void testMethodAnnotation() throws NoSuchMethodException {
        Method method = AdminController.class.getDeclaredMethod("adminMethod");
        RequireRole annotation = method.getAnnotation(RequireRole.class);
        assertNotNull(annotation, "方法上应能读取到 @RequireRole 注解");
        assertArrayEquals(new int[]{1}, annotation.value());
    }

    @Test
    void testMultiRoleAnnotation() {
        RequireRole annotation = MultiController.class.getAnnotation(RequireRole.class);
        assertArrayEquals(new int[]{1, 2, 3}, annotation.value());
    }

    @RequireRole({1})
    static class AdminController {
        @RequireRole({1})
        public void adminMethod() {}
    }

    @RequireRole({1, 2, 3})
    static class MultiController {}
}
