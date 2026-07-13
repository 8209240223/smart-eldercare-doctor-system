package com.medical.assistant.agent;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;

@Component
public class AssistantRequestModeResolver {

    private static final List<String> EXPLICIT_SITE_SCOPES = List.of(
            "当前系统", "本系统", "站内", "数据库", "系统中", "网站中", "当前账号",
            "我的待办", "我的消息", "我的随访", "今日随访", "待处理", "未读消息",
            "今天有哪些重点健康事项", "当前有哪些", "现有数据");

    private static final List<String> SITE_ENTITIES = List.of(
            "老人", "老人档案", "随访", "护理计划", "护理记录", "预警", "转诊",
            "评估记录", "体检记录", "生命体征", "健康报告", "ai报告", "重点人群",
            "消息", "用户", "账号", "操作日志", "待办", "任务", "计划");

    private static final List<String> SITE_INTENTS = List.of(
            "查询", "查看", "统计", "列出", "显示", "告诉我", "帮我找", "整理", "多少",
            "新增", "添加", "创建", "修改", "更新", "编辑", "删除", "取消", "完成",
            "生成", "发送", "封禁", "解禁", "重置", "审核", "批准", "驳回", "标记",
            "处理", "执行", "导出", "下载", "跳转");

    private static final List<String> EXPLANATION_INTENTS = List.of(
            "是什么", "为什么", "请解释", "介绍一下", "如何使用", "怎么用", "怎样使用");

    public boolean requiresSiteTools(String message, String requestedMode) {
        String mode = StringUtils.hasText(requestedMode)
                ? requestedMode.trim().toLowerCase(Locale.ROOT)
                : "auto";
        if ("qa".equals(mode)) {
            return false;
        }
        if ("agent".equals(mode)) {
            return true;
        }
        return requiresSiteTools(message);
    }

    public boolean requiresSiteTools(String message) {
        if (!StringUtils.hasText(message)) {
            return false;
        }
        String normalized = message.toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
        if (containsAny(normalized, EXPLICIT_SITE_SCOPES)) {
            return true;
        }
        if (containsAny(normalized, EXPLANATION_INTENTS)) {
            return false;
        }
        return containsAny(normalized, SITE_ENTITIES) && containsAny(normalized, SITE_INTENTS);
    }

    private boolean containsAny(String message, List<String> keywords) {
        return keywords.stream().anyMatch(message::contains);
    }
}
