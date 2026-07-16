package com.medical.controller;

import com.medical.assistant.controller.AssistantController;
import com.medical.common.annotation.RequireRole;
import com.medical.controller.nurse.NurseDashboardController;
import com.medical.controller.nurse.NursePlanController;
import com.medical.controller.nurse.NurseRecordController;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RolePermissionMatrixTest {

    @Test
    void sharedReadControllersAllowAllThreeRoles() {
        assertClassRoles(AssistantController.class, 1, 2, 3);
        assertClassRoles(ElderController.class, 1, 2, 3);
        assertClassRoles(WarningController.class, 1, 2, 3);
        assertClassRoles(FollowupTaskController.class, 1, 2, 3);
        assertClassRoles(AssessmentController.class, 1, 2, 3);
        assertClassRoles(InterventionController.class, 1, 2, 3);
        assertClassRoles(ExamController.class, 1, 2, 3);
        assertClassRoles(VitalSignController.class, 1, 2, 3);
        assertClassRoles(NurseDashboardController.class, 1, 2, 3);
        assertClassRoles(NursePlanController.class, 1, 2, 3);
        assertClassRoles(NurseRecordController.class, 1, 2, 3);
    }

    @Test
    void doctorWorkflowControllersExcludeNurseRole() {
        assertClassRoles(FollowUpController.class, 1, 2);
        assertClassRoles(CareWorkflowController.class, 1, 2);
    }

    @Test
    void doctorOwnsMedicalWriteOperations() {
        assertMethodRoles(WarningController.class, 2,
                "handle", "ignore", "markProcessing", "markAsRead", "create");
        assertMethodRoles(WarningRuleController.class, 2,
                "create", "update", "delete", "toggle", "evaluate");
        assertMethodRoles(RiskProfileController.class, 2,
                "calculateAllRisk", "calculateRisk");
        assertMethodRoles(ReferralController.class, 2,
                "create", "accept", "complete", "reject", "cancel");
        assertMethodRoles(ReviewController.class, 2,
                "approveRecord", "rejectRecord", "approvePlan", "rejectPlan");
        assertMethodRoles(CareWorkflowController.class, 2, "generate");
        assertMethodRoles(FollowupTaskController.class, 2,
                "generateAutoTasks", "assignTask", "finishTask", "cancelTask");
    }

    @Test
    void nurseOwnsNursingWritesAndExamWritesAreSharedWithDoctor() {
        assertMethodRoles(NursePlanController.class, 3,
                "create", "update", "delete", "updateStatus", "incrementCompleted");
        assertMethodRoles(NurseRecordController.class, 3,
                "create", "update", "delete", "reportAbnormal");
        assertMethodRoles(ExamController.class, new int[]{2, 3}, "create", "update");
        assertMethodRoles(ExamController.class, 2, "delete");
        assertMethodRoles(VitalSignController.class, new int[]{2, 3},
                "bindDevice", "unbindDevice", "uploadData");
        assertMethodRoles(VitalSignController.class, 1,
                "generateMockData", "generateAbnormalMockData");
    }

    private void assertClassRoles(Class<?> controller, int... expectedRoles) {
        RequireRole annotation = controller.getAnnotation(RequireRole.class);
        assertNotNull(annotation, controller.getSimpleName() + " must declare class roles");
        assertArrayEquals(expectedRoles, annotation.value(), controller.getSimpleName());
    }

    private void assertMethodRoles(Class<?> controller, int expectedRole, String... methodNames) {
        assertMethodRoles(controller, new int[]{expectedRole}, methodNames);
    }

    private void assertMethodRoles(Class<?> controller, int[] expectedRoles, String... methodNames) {
        for (String methodName : methodNames) {
            Method method = Arrays.stream(controller.getDeclaredMethods())
                    .filter(candidate -> candidate.getName().equals(methodName))
                    .findFirst()
                    .orElseThrow(() -> new AssertionError(controller.getSimpleName() + "." + methodName));
            RequireRole annotation = method.getAnnotation(RequireRole.class);
            assertTrue(annotation != null,
                    controller.getSimpleName() + "." + methodName + " must declare method roles");
            assertArrayEquals(expectedRoles, annotation.value(),
                    controller.getSimpleName() + "." + methodName);
        }
    }
}
