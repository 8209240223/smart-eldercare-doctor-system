package com.medical.common.constant;

/**
 * Redis Key 常量定义
 * 命名规范：项目前缀:业务模块:数据类型:唯一标识
 */
public interface RedisKeyConstant {

    /** 项目前缀 */
    String PREFIX = "medical";

    /** 分隔符 */
    String SEP = ":";

    // ==================== Token 相关 ====================
    /** 登录 Token 存储 */
    String TOKEN_KEY = PREFIX + SEP + "token" + SEP;
    /** Token 过期时间（秒） */
    long TOKEN_TTL = 7200;

    // ==================== 验证码相关 ====================
    /** 验证码存储 */
    String CAPTCHA_KEY = PREFIX + SEP + "captcha" + SEP;
    /** 验证码过期时间（秒） */
    long CAPTCHA_TTL = 300;

    // ==================== 用户相关 ====================
    /** 用户信息缓存 */
    String USER_KEY = PREFIX + SEP + "user" + SEP;
    /** 用户信息缓存过期时间（秒） */
    long USER_TTL = 1800;

    // ==================== 权限相关 ====================
    /** 用户权限列表缓存 */
    String PERMISSION_KEY = PREFIX + SEP + "permission" + SEP;
    /** 权限缓存过期时间（秒） */
    long PERMISSION_TTL = 1800;

    // ==================== 预警规则相关 ====================
    /** 预警规则列表缓存 */
    String WARNING_RULES_KEY = PREFIX + SEP + "warning" + SEP + "rules";
    /** 预警规则缓存过期时间（秒） */
    long WARNING_RULES_TTL = 3600;

    // ==================== 登录锁定相关 ====================
    /** 登录错误次数 */
    String LOGIN_ERROR_KEY = PREFIX + SEP + "login" + SEP + "error" + SEP;
    /** 登录错误次数过期时间（秒） */
    long LOGIN_ERROR_TTL = 1800;
    /** 最大登录错误次数 */
    int LOGIN_MAX_ATTEMPTS = 5;

    // ==================== 老人档案相关 ====================
    /** 老人详情缓存 */
    String ELDER_DETAIL_KEY = PREFIX + SEP + "elder" + SEP + "detail" + SEP;
    /** 老人详情缓存过期时间（秒） */
    long ELDER_DETAIL_TTL = 600;

    // ==================== 数据字典相关 ====================
    /** 数据字典缓存 */
    String DICT_KEY = PREFIX + SEP + "dict" + SEP;
    /** 数据字典缓存过期时间（秒） */
    long DICT_TTL = 86400;

    /**
     * 拼接完整的 Token Key
     */
    static String buildTokenKey(String uuid) {
        return TOKEN_KEY + uuid;
    }

    /**
     * 拼接完整的验证码 Key
     */
    static String buildCaptchaKey(String key) {
        return CAPTCHA_KEY + key;
    }

    /**
     * 拼接完整的用户信息 Key
     */
    static String buildUserKey(Long userId) {
        return USER_KEY + userId;
    }

    /**
     * 拼接完整的权限 Key
     */
    static String buildPermissionKey(Long userId) {
        return PERMISSION_KEY + userId;
    }

    /**
     * 拼接登录错误 Key
     */
    static String buildLoginErrorKey(String username) {
        return LOGIN_ERROR_KEY + username;
    }

    /**
     * 拼接老人详情 Key
     */
    static String buildElderDetailKey(Long elderId) {
        return ELDER_DETAIL_KEY + elderId;
    }
}
