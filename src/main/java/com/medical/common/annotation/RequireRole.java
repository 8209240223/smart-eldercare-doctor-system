package com.medical.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 角色权限注解。可贴在 Controller 类上（整类生效）或方法上（方法覆盖类）。
 * value 写允许访问的 userType：1=管理员 2=医生 3=护士。
 * 例：@RequireRole({2}) 仅医生；@RequireRole({1,2}) 管理员和医生。
 * 不贴 = 只要登录就能访问（保持旧行为）。
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {
    int[] value();
}
