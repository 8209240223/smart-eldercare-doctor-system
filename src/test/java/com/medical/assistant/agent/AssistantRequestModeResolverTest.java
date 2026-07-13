package com.medical.assistant.agent;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AssistantRequestModeResolverTest {

    private final AssistantRequestModeResolver resolver = new AssistantRequestModeResolver();

    @Test
    void keepsHealthKnowledgeAndUsageExplanationsInOrdinaryQuestionMode() {
        assertThat(resolver.requiresSiteTools("高血压老人日常饮食需要注意什么？")).isFalse();
        assertThat(resolver.requiresSiteTools("随访计划是什么？")).isFalse();
        assertThat(resolver.requiresSiteTools("如何使用转诊协同功能？")).isFalse();
        assertThat(resolver.requiresSiteTools("请解释血氧饱和度的含义")).isFalse();
    }

    @Test
    void routesLiveDataQueriesAndWebsiteActionsToAgentTools() {
        assertThat(resolver.requiresSiteTools("查询当前系统中的老人档案总数")).isTrue();
        assertThat(resolver.requiresSiteTools("告诉我1号老人的随访计划")).isTrue();
        assertThat(resolver.requiresSiteTools("帮我整理高风险老人关注重点")).isTrue();
        assertThat(resolver.requiresSiteTools("给医生发送一条站内消息")).isTrue();
        assertThat(resolver.requiresSiteTools("今天有哪些重点健康事项？")).isTrue();
    }
}
