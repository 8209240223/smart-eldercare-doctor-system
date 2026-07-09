package com.medical.common.annotation;

import com.medical.controller.AiConfigController;
import com.medical.controller.DashboardEnhancedController;
import com.medical.controller.ProfileController;
import com.medical.controller.RiskProfileController;
import com.medical.controller.TimelineController;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 管理员端 Controller 角色权限注解校验测试。
 * <p>
 * 验证范围：
 * 1. 5 个管理员归属的 Controller 均正确贴了 @RequireRole 注解。
 * 2. AiConfigController 仅管理员（{1}）。
 * 3. DashboardEnhancedController、TimelineController、ProfileController 三角色通用（{1,2,3}）。
 * 4. RiskProfileController 类级 {1,2,3}，写方法收窄到 {2}。
 * <p>
 * 注：运行时行为（越权返回 403）由 RoleInterceptorTest 覆盖，
 * 本类只做静态元数据校验，确保注解在代码层面正确。
 */
class AdminControllerAnnotationTest {

    // ===== 1. AiConfigController 仅管理员 =====

    @Test
    void aiConfigController_classLevel_AdminOnly() {
        RequireRole ann = AiConfigController.class.getAnnotation(RequireRole.class);
        assertNotNull(ann, "AiConfigController 必须有类级 @RequireRole 注解");
        assertArrayEquals(new int[]{1}, ann.value(),
                "AiConfigController 仅管理员可访问（{1}）");
    }

    // ===== 2. DashboardEnhancedController 三角色通用 =====

    @Test
    void dashboardController_classLevel_AllRoles() {
        RequireRole ann = DashboardEnhancedController.class.getAnnotation(RequireRole.class);
        assertNotNull(ann, "DashboardEnhancedController 必须有类级 @RequireRole 注解");
        assertArrayEquals(new int[]{1, 2, 3}, ann.value(),
                "DashboardEnhancedController 三角色通用（{1,2,3}）");
    }

    // ===== 3. TimelineController 三角色通用 =====

    @Test
    void timelineController_classLevel_AllRoles() {
        RequireRole ann = TimelineController.class.getAnnotation(RequireRole.class);
        assertNotNull(ann, "TimelineController 必须有类级 @RequireRole 注解");
        assertArrayEquals(new int[]{1, 2, 3}, ann.value(),
                "TimelineController 三角色通用（{1,2,3}）");
    }

    // ===== 4. ProfileController 三角色通用 =====

    @Test
    void profileController_classLevel_AllRoles() {
        RequireRole ann = ProfileController.class.getAnnotation(RequireRole.class);
        assertNotNull(ann, "ProfileController 必须有类级 @RequireRole 注解");
        assertArrayEquals(new int[]{1, 2, 3}, ann.value(),
                "ProfileController 三角色通用（{1,2,3}）");
    }

    // ===== 5. RiskProfileController 类级三角色通用，写方法收窄到医生 =====

    @Test
    void riskProfileController_classLevel_AllRoles() {
        RequireRole ann = RiskProfileController.class.getAnnotation(RequireRole.class);
        assertNotNull(ann, "RiskProfileController 必须有类级 @RequireRole 注解");
        assertArrayEquals(new int[]{1, 2, 3}, ann.value(),
                "RiskProfileController 类级三角色通用（{1,2,3}）");
    }

    @Test
    void riskProfileController_calculateAll_DoctorOnly() throws NoSuchMethodException {
        Method method = RiskProfileController.class.getDeclaredMethod("calculateAllRisk");
        RequireRole methodAnn = method.getAnnotation(RequireRole.class);
        assertNotNull(methodAnn, "calculateAllRisk 必须有方法级 @RequireRole 注解");
        assertArrayEquals(new int[]{2}, methodAnn.value(),
                "全量风险计算应仅医生可触发（{2}）");
    }

    @Test
    void riskProfileController_calculateSingle_DoctorOnly() throws NoSuchMethodException {
        Method method = RiskProfileController.class.getDeclaredMethod("calculateRisk", Long.class);
        RequireRole methodAnn = method.getAnnotation(RequireRole.class);
        assertNotNull(methodAnn, "calculateRisk 必须有方法级 @RequireRole 注解");
        assertArrayEquals(new int[]{2}, methodAnn.value(),
                "单人风险计算应仅医生可触发（{2}）");
    }

    @Test
    void riskProfileController_listMethods_NoMethodLevelOverride() throws NoSuchMethodException {
        // 列表方法不应有方法级 @RequireRole（继承类级 {1,2,3}）
        Method list = RiskProfileController.class.getDeclaredMethod("getKeyPopulationList",
                Integer.class, Integer.class, Integer.class, Long.class, String.class);
        assertNull(list.getAnnotation(RequireRole.class),
                "列表方法不应覆盖类级注解");

        Method detail = RiskProfileController.class.getDeclaredMethod("getRiskProfileDetail", Long.class);
        assertNull(detail.getAnnotation(RequireRole.class),
                "详情方法不应覆盖类级注解");

        Method stats = RiskProfileController.class.getDeclaredMethod("getRiskLevelStats");
        assertNull(stats.getAnnotation(RequireRole.class),
                "统计方法不应覆盖类级注解");
    }

    // ===== 6. 校验全部 admin Controller 不依赖默认放行行为 =====

    @Test
    void allAdminControllers_HaveRequireRoleAnnotation() {
        Class<?>[] adminControllers = {
                AiConfigController.class,
                DashboardEnhancedController.class,
                TimelineController.class,
                ProfileController.class,
                RiskProfileController.class
        };
        for (Class<?> controller : adminControllers) {
            RequireRole ann = controller.getAnnotation(RequireRole.class);
            assertNotNull(ann,
                    controller.getSimpleName() + " 必须有 @RequireRole 类级注解（避免依赖默认放行）");
            assertTrue(ann.value().length > 0,
                    controller.getSimpleName() + " @RequireRole 必须指定至少一个 userType");
        }
    }

    // ===== 7. 校验 AiConfigController 写方法的安全约束（key/value 长度）=====

    @Test
    void aiConfigController_HasInputLengthValidation() throws Exception {
        // 通过反射读常量字段验证安全限制
        try {
            java.lang.reflect.Field maxKey = AiConfigController.class.getDeclaredField("MAX_KEY_LENGTH");
            maxKey.setAccessible(true);
            int keyLimit = (int) maxKey.get(null);
            assertTrue(keyLimit > 0 && keyLimit <= 128,
                    "AI 配置 key 长度限制应在 1-128 之间，实际: " + keyLimit);

            java.lang.reflect.Field maxValue = AiConfigController.class.getDeclaredField("MAX_VALUE_LENGTH");
            maxValue.setAccessible(true);
            int valueLimit = (int) maxValue.get(null);
            assertTrue(valueLimit > 0 && valueLimit <= 4096,
                    "AI 配置 value 长度限制应在 1-4096 之间，实际: " + valueLimit);
        } catch (NoSuchFieldException e) {
            fail("AiConfigController 必须定义 MAX_KEY_LENGTH 和 MAX_VALUE_LENGTH 常量: " + e.getMessage());
        }
    }
}
