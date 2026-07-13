package com.medical.admin.controller;

import com.medical.common.annotation.RequireRole;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class AdminControllerAuthorizationTest {

    @Test
    void administratorControllersRequireAdministratorRole() {
        assertAdministratorOnly(AdminUserController.class);
        assertAdministratorOnly(AdminOperationLogController.class);
    }

    private void assertAdministratorOnly(Class<?> controllerType) {
        RequireRole annotation = controllerType.getAnnotation(RequireRole.class);
        assertNotNull(annotation);
        assertArrayEquals(new int[]{1}, annotation.value());
    }
}
