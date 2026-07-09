package com.medical.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * 异步任务配置
 * 启用 @Async 支持，用于 SSE 推送等异步操作
 */
@Configuration
@EnableAsync
public class AsyncConfig {
}
