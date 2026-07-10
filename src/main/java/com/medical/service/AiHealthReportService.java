package com.medical.service;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.common.utils.RedisUtils;
import com.medical.entity.AiHealthReport;
import com.medical.entity.ElderInfo;
import com.medical.mapper.AiHealthReportMapper;
import com.medical.mapper.ElderInfoMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * AI 健康评估报告服务 — 规则引擎生成 + 确认/驳回 + AI 深度分析
 */
@Service
public class AiHealthReportService {

    @Autowired private AiHealthReportMapper reportMapper;
    @Autowired private ElderInfoMapper elderInfoMapper;
    @Autowired private ContextAggregator aggregator;
    @Autowired private RuleEngineService ruleEngine;
    @Autowired private ReportComposer composer;
    @Autowired private AiConfigService aiConfig;
    @Autowired private RedisUtils redisUtils;
    @Autowired private com.medical.mapper.TimelineEventMapper timelineEventMapper;

    /**
     * 生成规则引擎评估报告
     */
    @Transactional
    public AiHealthReport generateByRule(Long elderId, Long doctorId) {
        return generateOrRefreshByRule(elderId, doctorId);
    }

    /**
     * 生成或刷新规则引擎草稿。同一老人只保留一个活动中的规则草稿。
     */
    @Transactional
    public AiHealthReport generateOrRefreshByRule(Long elderId, Long doctorId) {
        // 1. 聚合上下文
        Map<String, Object> ctx = aggregator.gather(elderId);
        if (ctx.containsKey("error")) {
            throw new BusinessException(404, (String) ctx.get("error"));
        }

        // 2. 规则匹配
        List<RuleEngineService.TriggeredRule> triggered = ruleEngine.evaluate(ctx);

        // 3. 组装报告
        String reportJson = composer.compose(triggered, ctx);

        // 4. 解析风险评分和等级
        JSONObject reportObj = JSONUtil.parseObj(reportJson);
        int riskScore = reportObj.getInt("riskScore", 0);
        String riskLevel = reportObj.getStr("riskLevel", "LOW");

        // 5. 存库
        AiHealthReport report = reportMapper.selectRuleDraftForUpdate(elderId);
        boolean refresh = report != null;
        if (!refresh) {
            report = new AiHealthReport();
            report.setElderId(elderId);
            report.setSource(1);
            report.setStatus(0);
        }
        report.setElderId(elderId);
        report.setDoctorId(doctorId);
        report.setSource(1);  // 规则引擎
        report.setRiskScore(riskScore);
        report.setRiskLevel(riskLevel);
        report.setReportJson(reportJson);
        report.setStatus(0);  // 草稿
        report.setModelName("rule-engine");
        report.setPromptVersion("v1.0");
        report.setCreateTime(LocalDateTime.now());
        if (refresh) {
            reportMapper.updateById(report);
        } else {
            reportMapper.insert(report);
        }

        return report;
    }

    public AiHealthReport findRuleDraft(Long elderId) {
        return reportMapper.selectOne(new LambdaQueryWrapper<AiHealthReport>()
                .eq(AiHealthReport::getElderId, elderId)
                .eq(AiHealthReport::getSource, 1)
                .eq(AiHealthReport::getStatus, 0)
                .orderByDesc(AiHealthReport::getCreateTime)
                .last("LIMIT 1"));
    }

    public AiHealthReport getLatestByElder(Long elderId) {
        return reportMapper.selectOne(new LambdaQueryWrapper<AiHealthReport>()
                .eq(AiHealthReport::getElderId, elderId)
                .orderByDesc(AiHealthReport::getCreateTime)
                .last("LIMIT 1"));
    }

    /**
     * AI 深度分析（在规则报告基础上，调用大模型生成增强建议）
     */
    @Transactional
    public AiHealthReport deepAnalysis(Long reportId, Long doctorId) {
        AiHealthReport existing = reportMapper.selectById(reportId);
        if (existing == null) {
            throw new BusinessException(404, "报告不存在");
        }
        if (existing.getSource() != 1) {
            throw new BusinessException(400, "只能对规则引擎报告发起深度分析");
        }

        // 检查频率限制（每个医生每天最多 N 次）
        if (!aiConfig.isMockEnabled()) {
            String rateKey = "ai:rate:" + doctorId + ":" + LocalDate.now();
            long count = redisUtils.increment(rateKey);
            if (count == 1) redisUtils.expire(rateKey, 24, TimeUnit.HOURS);
            if (count > aiConfig.getMaxPerDay()) {
                throw new BusinessException(429, "今日 AI 深度分析次数已用完（" + aiConfig.getMaxPerDay() + "次/天），请明天再试");
            }
        }

        // 组装 AI 结果
        JSONObject existingReport = JSONUtil.parseObj(existing.getReportJson());
        String aiResultJson;

        if (aiConfig.isMockEnabled()) {
            aiResultJson = mockAiAnalysis(existingReport);
        } else {
            aiResultJson = callDeepSeek(existingReport);
        }

        // 合并 AI 结果到原报告
        JSONObject merged = JSONUtil.parseObj(cleanAiJsonPayload(aiResultJson));
        // 用 AI 的风险评分覆盖（如果 AI 返回了不同的评分）
        if (merged.containsKey("riskScore")) {
            existingReport.set("riskScore", merged.getInt("riskScore"));
        }
        if (merged.containsKey("riskLevel")) {
            existingReport.set("riskLevel", merged.getStr("riskLevel"));
        }
        // AI 额外字段
        existingReport.set("aiComment", merged.getStr("aiComment", ""));
        existingReport.set("aiSuggestions", merged.get("aiSuggestions"));
        existingReport.set("aiAnalysis", merged.getStr("aiAnalysis", ""));
        existingReport.set("aiGeneratedAt", LocalDateTime.now().toString());

        // 更新报告
        existing.setSource(2);  // 升级为 AI 引擎
        existing.setRiskScore(existingReport.getInt("riskScore", existing.getRiskScore()));
        existing.setRiskLevel(existingReport.getStr("riskLevel", existing.getRiskLevel()));
        existing.setReportJson(existingReport.toString());
        existing.setModelName(aiConfig.getModel());
        existing.setPromptVersion("v1.0");
        reportMapper.updateById(existing);

        return existing;
    }

    /**
     * 查看报告
     */
    public AiHealthReport getById(Long id) {
        AiHealthReport report = reportMapper.selectById(id);
        if (report == null) {
            throw new BusinessException(404, "报告不存在");
        }
        return report;
    }

    /**
     * 确认报告（只有确认后才进入时间轴）
     */
    @Transactional
    public void confirm(Long id, Long doctorId, String editedJson) {
        AiHealthReport report = reportMapper.selectById(id);
        if (report == null) throw new BusinessException(404, "报告不存在");
        if (Integer.valueOf(1).equals(report.getStatus())) {
            throw new BusinessException(400, "报告已确认，无需重复操作");
        }

        JSONObject finalReport;
        try {
            finalReport = JSONUtil.parseObj(report.getReportJson());
        } catch (Exception e) {
            throw new BusinessException(500, "原始报告JSON格式错误，无法确认");
        }
        if (editedJson != null && !editedJson.trim().isEmpty()) {
            try {
                JSONObject edited = JSONUtil.parseObj(editedJson);
                finalReport.putAll(edited);
                report.setEditedReportJson(edited.toString());
            } catch (Exception e) {
                throw new BusinessException(400, "编辑后的报告必须是合法JSON对象");
            }
        }
        report.setReportJson(finalReport.toString());
        if (finalReport.containsKey("riskScore")) {
            report.setRiskScore(finalReport.getInt("riskScore"));
        }
        if (finalReport.containsKey("riskLevel")) {
            String riskLevel = finalReport.getStr("riskLevel");
            report.setRiskLevel(riskLevel == null ? null : riskLevel.trim().toUpperCase());
        }
        report.setStatus(1);
        report.setConfirmTime(LocalDateTime.now());
        reportMapper.updateById(report);

        // 写入时间轴
        try {
            com.medical.entity.TimelineEvent event = new com.medical.entity.TimelineEvent();
            event.setElderId(report.getElderId());
            event.setEventType(12);  // 12=AI健康报告
            event.setEventTitle("AI健康评估报告（已确认）");
            String riskLevel = report.getRiskLevel();
            event.setEventContent("风险等级: " + (riskLevel != null ? riskLevel : "-")
                    + "，风险评分: " + report.getRiskScore() + "分"
                    + "，来源: " + (report.getSource() == 1 ? "规则引擎" : "AI引擎"));
            event.setSourceType("ai_health_report");
            event.setSourceId(report.getId());
            event.setEventTime(LocalDateTime.now());
            event.setDoctorId(doctorId);
            event.setCreateTime(LocalDateTime.now());
            timelineEventMapper.insert(event);
        } catch (Exception e) {
            System.err.println("[AI评估] 写入时间轴失败: " + e.getMessage());
        }
    }

    /**
     * 驳回报告
     */
    @Transactional
    public void reject(Long id, Long doctorId, String reason) {
        AiHealthReport report = reportMapper.selectById(id);
        if (report == null) throw new BusinessException(404, "报告不存在");
        if (report.getStatus() == 1) throw new BusinessException(400, "报告已确认，无法驳回");

        report.setStatus(2);
        report.setRejectReason(reason);
        reportMapper.updateById(report);
    }

    /**
     * 报告列表（按老人）
     */
    public Page<AiHealthReport> listByElder(Long elderId, Integer pageNum, Integer pageSize) {
        Page<AiHealthReport> page = new Page<>(pageNum != null ? pageNum : 1, pageSize != null ? pageSize : 10);
        LambdaQueryWrapper<AiHealthReport> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiHealthReport::getElderId, elderId)
               .orderByDesc(AiHealthReport::getCreateTime);
        return reportMapper.selectPage(page, wrapper);
    }

    // ========== AI 调用 ==========

    /**
     * Mock AI 分析 — 返回模拟的增强分析结果
     */
    private String mockAiAnalysis(JSONObject report) {
        String riskLevel = report.getStr("riskLevel", "LOW");
        int riskScore = report.getInt("riskScore", 0);

        JSONObject aiResult = new JSONObject();

        // Mock 场景下稍微调整评分（模拟 AI 的独立判断）
        int adjusted = Math.min(100, riskScore + (int)(Math.random() * 10 - 5));
        aiResult.set("riskScore", Math.max(0, adjusted));

        String adjustedLevel;
        if (adjusted <= 15) adjustedLevel = "LOW";
        else if (adjusted <= 40) adjustedLevel = "MEDIUM";
        else if (adjusted <= 70) adjustedLevel = "HIGH";
        else adjustedLevel = "CRITICAL";
        aiResult.set("riskLevel", adjustedLevel);

        aiResult.set("aiComment", buildMockComment(riskLevel));
        aiResult.set("aiSuggestions", buildMockSuggestions());
        aiResult.set("aiAnalysis", "（Mock 模式）基于现有健康数据的综合分析，AI 建议重点关注多因素交叉风险。"
                + "在实际部署中，此处将由 DeepSeek 大模型生成个性化深度分析报告。");

        return aiResult.toString();
    }

    private String buildMockComment(String riskLevel) {
        switch (riskLevel) {
            case "LOW":
                return "老人整体健康状况良好，各项指标基本处于可控范围。建议继续保持现有健康管理方案，"
                        + "重点关注生活方式的维持和定期监测。AI 未发现需要紧急干预的风险因素。";
            case "MEDIUM":
                return "老人存在若干中度风险因素，建议在规则评估的基础上，综合考量各项指标之间的关联性。"
                        + "特别关注血压与血糖的协同管理，以及用药方案的合理性评估。建议安排多学科会诊。";
            case "HIGH":
                return "AI 分析确认老人健康风险较高，存在多个相互关联的风险因素。建议立即制定综合干预方案，"
                        + "优先处理可能引发急性事件的风险项（如血压控制、血糖管理），并加强随访频率。";
            case "CRITICAL":
                return "⚠️ AI 深度分析提示：老人存在危急级别的健康风险，建议立即采取医疗干预措施。"
                        + "请医生结合临床经验，优先排查急性心脑血管事件的可能性，必要时安排住院治疗。";
            default:
                return "AI 已完成深度分析，请查看详细建议。";
        }
    }

    private List<String> buildMockSuggestions() {
        String[] suggestions = {
                "建议将血压监测频率提升至每日2次（早晚各一次），记录变化趋势",
                "血糖管理建议采用少量多餐模式，每餐间隔4-5小时",
                "建议增加适度的户外活动，每天晒太阳15-20分钟以促进维生素D合成",
                "关注用药依从性，建议使用药盒分装或设置手机用药提醒",
                "定期进行心理健康评估，关注老人的情绪和社交状态",
                "建议每季度进行一次综合性的健康评估复评"
        };
        java.util.Collections.shuffle(java.util.Arrays.asList(suggestions));
        return java.util.Arrays.asList(java.util.Arrays.copyOf(suggestions, 3 + (int)(Math.random() * 2)));
    }

    /**
     * 调用兼容 OpenAI Chat Completions 协议的 AI API。
     */
    private String callDeepSeek(JSONObject report) {
        String apiKey = aiConfig.getApiKey();
        if (apiKey.isEmpty()) {
            throw new BusinessException(500, "AI API Key 未配置，请在管理页面设置");
        }

        String baseUrl = aiConfig.getBaseUrl();
        String model = aiConfig.getModel();
        int timeout = aiConfig.getTimeoutSeconds() * 1000;
        int maxRetries = aiConfig.getMaxRetries();

        String prompt = buildAiPrompt(report);

        JSONObject body = new JSONObject();
        body.set("model", model);
        body.set("messages", new Object[]{
                new JSONObject() {{ set("role", "system"); set("content", systemPrompt()); }},
                new JSONObject() {{ set("role", "user"); set("content", prompt); }}
        });
        body.set("temperature", 0.3);
        body.set("max_tokens", 1500);

        // baseUrl 应包含完整路径（如 https://open.bigmodel.cn/api/paas/v4/chat/completions）
        // 如果配置时没加/chat/completions 则自动补上
        String normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String fullUrl = normalizedBaseUrl.endsWith("/chat/completions") ? normalizedBaseUrl : normalizedBaseUrl + "/chat/completions";
        System.out.println("[AI] 请求: " + fullUrl);

        Exception lastError = null;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                java.net.URL url = new java.net.URL(fullUrl);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Authorization", "Bearer " + apiKey);
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setConnectTimeout(timeout);
                conn.setReadTimeout(timeout);
                conn.setDoOutput(true);

                byte[] bodyBytes = body.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
                conn.getOutputStream().write(bodyBytes);
                conn.getOutputStream().flush();
                conn.getOutputStream().close();

                int status = conn.getResponseCode();
                java.io.InputStream is = (status >= 200 && status < 300) ? conn.getInputStream() : conn.getErrorStream();
                String respBody = new String(is.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                is.close();
                conn.disconnect();

                if (status == 200) {
                    JSONObject respObj = JSONUtil.parseObj(respBody);
                    String content = respObj.getJSONArray("choices").getJSONObject(0)
                            .getJSONObject("message").getStr("content");
                    return cleanAiJsonPayload(content);
                } else {
                    lastError = new BusinessException(500, "AI API 返回错误: " + status + " " + respBody);
                }
            } catch (Exception e) {
                lastError = e;
                if (attempt < maxRetries) {
                    try { Thread.sleep(attempt * 1000L); } catch (InterruptedException ignored) {}
                }
            }
        }
        throw new BusinessException(500, "AI 服务暂时不可用: " +
                (lastError != null ? lastError.getMessage() : "未知错误"));
    }

    static String cleanAiJsonPayload(String content) {
        if (content == null) {
            return null;
        }
        String cleaned = content.trim();
        if (!cleaned.startsWith("```")) {
            return cleaned;
        }
        int firstLineEnd = cleaned.indexOf('\n');
        if (firstLineEnd >= 0) {
            cleaned = cleaned.substring(firstLineEnd + 1).trim();
        } else {
            cleaned = cleaned.substring(3).trim();
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3).trim();
        }
        return cleaned;
    }

    private String systemPrompt() {
        return "你是一位资深的老年医学和慢性病管理专家。你的任务是基于老人的健康数据，"
                + "进行深度综合分析，输出结构化的 JSON 格式评估结果。\n\n"
                + "输出格式要求（严格 JSON，不输出任何其他内容）：\n"
                + "{\n"
                + "  \"riskScore\": 0-100的整数,\n"
                + "  \"riskLevel\": \"LOW\"或\"MEDIUM\"或\"HIGH\"或\"CRITICAL\",\n"
                + "  \"aiComment\": \"2-3句话的综合评价，包含人性化的关心\",\n"
                + "  \"aiAnalysis\": \"详细的深度分析（200-300字），说明各项指标的关联性和可能的健康趋势\",\n"
                + "  \"aiSuggestions\": [\"具体建议1\", \"具体建议2\", \"具体建议3\"]\n"
                + "}\n\n"
                + "注意事项：\n"
                + "1. 数据已经过脱敏处理，不包含任何个人身份信息\n"
                + "2. 建议要具体、可操作，避免泛泛而谈\n"
                + "3. 综合评价要体现人性化关怀，语气温和、鼓励\n"
                + "4. 如果发现多因素交叉风险，请在 aiAnalysis 中重点说明";
    }

    private String buildAiPrompt(JSONObject report) {
        StringBuilder sb = new StringBuilder();
        sb.append("请基于以下老人健康评估数据进行深度分析：\n\n");

        sb.append("【基本信息】\n");
        JSONObject elderBrief = report.getJSONObject("elderBrief");
        if (elderBrief != null) {
            sb.append("性别：").append(elderBrief.getStr("gender")).append("，");
            sb.append("年龄：").append(elderBrief.getStr("age")).append("岁\n");
        }

        sb.append("\n【规则引擎评估结果】\n");
        sb.append("风险评分：").append(report.getInt("riskScore")).append(" 分，");
        sb.append("风险等级：").append(report.getStr("riskLevel")).append("\n");

        // 风险原因
        sb.append("\n【发现的风险项】\n");
        List<?> riskReasons = report.getJSONArray("riskReasons");
        if (riskReasons != null) {
            for (Object r : riskReasons) {
                sb.append("- ").append(r).append("\n");
            }
        }

        // 发现详情
        sb.append("\n【详细发现及建议】\n");
        List<?> findings = report.getJSONArray("findings");
        if (findings != null) {
            for (Object f : findings) {
                JSONObject item = (JSONObject) f;
                sb.append("[").append(item.getStr("category")).append("] ");
                sb.append(item.getStr("finding")).append(" → ");
                sb.append(item.getStr("advice")).append("\n");
            }
        }

        // 慢病
        sb.append("\n【慢病情况】\n");
        List<?> chronic = report.getJSONArray("chronicAdvice");
        if (chronic != null) {
            for (Object c : chronic) {
                JSONObject ci = (JSONObject) c;
                sb.append("- ").append(ci.getStr("disease")).append("\n");
            }
        }

        sb.append("\n请输出 JSON 格式的深度分析结果。");
        return sb.toString();
    }
}
