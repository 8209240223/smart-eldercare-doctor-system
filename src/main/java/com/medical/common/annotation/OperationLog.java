package com.medical.common.annotation;

import java.lang.annotation.*;

/**
 * 操作日志注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface OperationLog {

    /** 操作模块 */
    String module() default "";

    /** 操作类型 */
    String type() default "";

    /** 操作描述 */
    String desc() default "";
}
