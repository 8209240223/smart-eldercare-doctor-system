package com.medical.service;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.assistant.service.KimiClient;
import com.medical.common.exception.BusinessException;
import com.medical.entity.AiHealthReport;
import com.medical.entity.ElderInfo;
import com.medical.entity.TimelineEvent;
import com.medical.mapper.AiHealthReportMapper;
import com.medical.mapper.ElderInfoMapper;
import com.medical.mapper.TimelineEventMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AiHealthReportService {

    private static final String PROMPT_VERSION = "v2.0-kimi";
    private static final Set<String> KIMI_TEXT_FIELDS = Set.of(
            "reportText", "aiComment", "aiAnalysis");
    private static final Set<String> KIMI_ARRAY_FIELDS = Set.of(
            "aiSuggestions", "encouragements");

    @Autowired private AiHealthReportMapper reportMapper;
    @Autowired private ElderInfoMapper elderInfoMapper;
    @Autowired private ContextAggregator aggregator;
    @Autowired private RuleEngineService ruleEngine;
    @Autowired private ReportComposer composer;
    @Autowired private KimiClient kimiClient;
    @Autowired private TimelineEventMapper timelineEventMapper;
    @Autowired(required = false) private TransactionTemplate transactionTemplate;

    public AiHealthReport generateByRule(Long elderId, Long doctorId) {
        return generateOrRefreshByRule(elderId, doctorId);
    }

    /**
     * 兼容旧方法名：规则引擎负责确定性评分，Kimi 负责结构化分析与建议。
     */
    public AiHealthReport generateOrRefreshByRule(Long elderId, Long doctorId) {
        ElderInfo elder = requireDoctorOwnsElder(elderId, doctorId);
        Map<String, Object> context = aggregator.gather(elderId);
        List<RuleEngineService.TriggeredRule> triggered = ruleEngine.evaluate(context);
        JSONObject baseline = parseObject(composer.compose(triggered, context), "规则报告JSON格式错误");

        int ruleRiskScore = baseline.getInt("riskScore", 0);
        String ruleRiskLevel = normalizeRiskLevel(baseline.getStr("riskLevel", "LOW"));
        JSONObject kimiAnalysis = requestKimiAnalysis(baseline, elder);
        JSONObject merged = mergeKimiAnalysis(baseline, kimiAnalysis, ruleRiskScore, ruleRiskLevel);

        return persistDraft(elderId, doctorId, merged, ruleRiskScore, ruleRiskLevel);
    }

    public AiHealthReport findRuleDraft(Long elderId) {
        return reportMapper.selectOne(new LambdaQueryWrapper<AiHealthReport>()
                .eq(AiHealthReport::getElderId, elderId)
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
     * 兼容历史规则报告和旧前端按钮，统一使用 Kimi 重新生成分析字段。
     */
    public AiHealthReport deepAnalysis(Long reportId, Long doctorId) {
        AiHealthReport report = requireDoctorReportAccess(reportId, doctorId);
        JSONObject current = parseObject(report.getReportJson(), "报告JSON格式错误，无法进行Kimi分析");
        int ruleRiskScore = report.getRiskScore() == null
                ? current.getInt("riskScore", 0)
                : report.getRiskScore();
        String ruleRiskLevel = normalizeRiskLevel(report.getRiskLevel() == null
                ? current.getStr("riskLevel", "LOW")
                : report.getRiskLevel());
        ElderInfo elder = requireActiveElder(report.getElderId());
        JSONObject merged = mergeKimiAnalysis(
                current, requestKimiAnalysis(current, elder), ruleRiskScore, ruleRiskLevel);

        report.setSource(2);
        report.setRiskScore(ruleRiskScore);
        report.setRiskLevel(ruleRiskLevel);
        report.setReportJson(merged.toString());
        report.setModelName(kimiClient.modelName());
        report.setPromptVersion(PROMPT_VERSION);
        reportMapper.updateById(report);
        return report;
    }

    public AiHealthReport getById(Long id) {
        AiHealthReport report = reportMapper.selectById(id);
        if (report == null) {
            throw new BusinessException(404, "报告不存在");
        }
        return report;
    }

    public AiHealthReport getByIdForUser(Long id, Long userId, Integer role) {
        AiHealthReport report = getById(id);
        requireReportReadAccess(report, userId, role);
        return report;
    }

    public void confirm(Long id, Long doctorId, String editedJson) {
        AiHealthReport report = requireDoctorReportAccess(id, doctorId);
        if (Integer.valueOf(1).equals(report.getStatus())) {
            throw new BusinessException(400, "报告已确认，无需重复操作");
        }

        JSONObject finalReport = parseObject(report.getReportJson(), "原始报告JSON格式错误，无法确认");
        if (StringUtils.hasText(editedJson)) {
            try {
                JSONUtil.parseObj(editedJson);
            } catch (Exception exception) {
                throw new BusinessException(400, "Edited report must be a valid JSON object");
            }
            JSONObject edited = parseObject(editedJson, "编辑后的报告必须是合法JSON对象");
            finalReport.putAll(edited);
            report.setEditedReportJson(edited.toString());
        }
        report.setReportJson(finalReport.toString());
        if (finalReport.containsKey("riskScore")) {
            report.setRiskScore(finalReport.getInt("riskScore"));
        }
        if (finalReport.containsKey("riskLevel")) {
            report.setRiskLevel(normalizeRiskLevel(finalReport.getStr("riskLevel")));
        }
        report.setStatus(1);
        report.setDoctorId(doctorId);
        report.setConfirmTime(LocalDateTime.now());
        reportMapper.updateById(report);
        writeTimeline(report, doctorId);
    }

    public void reject(Long id, Long doctorId, String reason) {
        AiHealthReport report = requireDoctorReportAccess(id, doctorId);
        if (Integer.valueOf(1).equals(report.getStatus())) {
            throw new BusinessException(400, "报告已确认，无法驳回");
        }
        report.setStatus(2);
        report.setRejectReason(reason);
        reportMapper.updateById(report);
    }

    public Page<AiHealthReport> listByElder(Long elderId, Integer pageNum, Integer pageSize) {
        Page<AiHealthReport> page = new Page<>(pageNum == null ? 1 : pageNum, boundedPageSize(pageSize));
        return reportMapper.selectPage(page, new LambdaQueryWrapper<AiHealthReport>()
                .eq(AiHealthReport::getElderId, elderId)
                .orderByDesc(AiHealthReport::getCreateTime));
    }

    public Page<AiHealthReport> listByElderForUser(Long elderId,
                                                   Integer pageNum,
                                                   Integer pageSize,
                                                   Long userId,
                                                   Integer role) {
        requireElderReadAccess(elderId, userId, role);
        Page<AiHealthReport> page = new Page<>(pageNum == null ? 1 : pageNum, boundedPageSize(pageSize));
        LambdaQueryWrapper<AiHealthReport> wrapper = new LambdaQueryWrapper<AiHealthReport>()
                .eq(AiHealthReport::getElderId, elderId)
                .orderByDesc(AiHealthReport::getCreateTime);
        return reportMapper.selectPage(page, wrapper);
    }

    private AiHealthReport persistDraft(Long elderId,
                                        Long doctorId,
                                        JSONObject reportJson,
                                        int riskScore,
                                        String riskLevel) {
        java.util.function.Supplier<AiHealthReport> persistence = () -> {
            AiHealthReport report = reportMapper.selectOne(new LambdaQueryWrapper<AiHealthReport>()
                    .eq(AiHealthReport::getElderId, elderId)
                    .eq(AiHealthReport::getStatus, 0)
                    .orderByDesc(AiHealthReport::getCreateTime)
                    .last("LIMIT 1"));
            boolean refresh = report != null;
            if (!refresh) {
                report = new AiHealthReport();
                report.setElderId(elderId);
                report.setStatus(0);
            }
            report.setDoctorId(doctorId);
            report.setSource(2);
            report.setRiskScore(riskScore);
            report.setRiskLevel(riskLevel);
            report.setReportJson(reportJson.toString());
            report.setStatus(0);
            report.setModelName(kimiClient.modelName());
            report.setPromptVersion(PROMPT_VERSION);
            report.setCreateTime(LocalDateTime.now());
            if (refresh) {
                reportMapper.updateById(report);
            } else {
                reportMapper.insert(report);
            }
            return report;
        };
        if (transactionTemplate == null) {
            return persistence.get();
        }
        return transactionTemplate.execute(status -> persistence.get());
    }

    private JSONObject requestKimiAnalysis(JSONObject baseline, ElderInfo elder) {
        String content = kimiClient.generateJson(reportSystemPrompt(), buildKimiPrompt(baseline, elder), 2200);
        return parseObject(cleanAiJsonPayload(content), "Kimi返回的报告不是合法JSON对象");
    }

    private JSONObject mergeKimiAnalysis(JSONObject baseline,
                                         JSONObject kimiAnalysis,
                                         int ruleRiskScore,
                                         String ruleRiskLevel) {
        JSONObject merged = JSONUtil.parseObj(baseline.toString());
        for (String field : KIMI_TEXT_FIELDS) {
            String value = kimiAnalysis.getStr(field);
            if (StringUtils.hasText(value)) {
                merged.set(field, value.trim());
            }
        }
        for (String field : KIMI_ARRAY_FIELDS) {
            JSONArray values = kimiAnalysis.getJSONArray(field);
            if (values != null) {
                merged.set(field, values);
            }
        }
        merged.set("riskScore", ruleRiskScore);
        merged.set("riskLevel", ruleRiskLevel);
        merged.set("aiGeneratedAt", LocalDateTime.now().toString());
        merged.set("aiModel", kimiClient.modelName());
        merged.set("schemaVersion", merged.getStr("schemaVersion", "2.0"));
        return merged;
    }

    private String reportSystemPrompt() {
        return String.join("\n",
                "你是老年医学与慢病管理报告生成助手。",
                "输入包含由服务端规则引擎计算的确定性健康报告。",
                "不得修改、重新计算或质疑riskScore和riskLevel。",
                "只输出严格JSON对象，不输出Markdown代码围栏。",
                "只允许输出reportText、aiComment、aiAnalysis、aiSuggestions、encouragements字段。",
                "建议必须基于输入事实，不能编造诊断、处方或检查结果。",
                "aiSuggestions和encouragements必须是字符串数组。"
        );
    }

    private String buildKimiPrompt(JSONObject baseline, ElderInfo elder) {
        return "请为该老人生成结构化健康分析。老人姓名仅用于报告称呼："
                + (elder.getName() == null ? "该老人" : elder.getName())
                + "。服务端规则报告如下：\n" + baseline;
    }

    private ElderInfo requireDoctorOwnsElder(Long elderId, Long doctorId) {
        if (doctorId == null) {
            throw new BusinessException(401, "未获取到当前医生");
        }
        ElderInfo elder = requireActiveElder(elderId);
        if (!doctorId.equals(elder.getDoctorId())) {
            throw new BusinessException(403, "该老人不属于当前责任医生");
        }
        return elder;
    }

    private AiHealthReport requireDoctorReportAccess(Long reportId, Long doctorId) {
        AiHealthReport report = getById(reportId);
        ElderInfo elder = requireDoctorOwnsElder(report.getElderId(), doctorId);
        if (report.getDoctorId() != null && !doctorId.equals(report.getDoctorId())
                && !doctorId.equals(elder.getDoctorId())) {
            throw new BusinessException(403, "无权操作其他医生的报告");
        }
        return report;
    }

    private void requireReportReadAccess(AiHealthReport report, Long userId, Integer role) {
        requireElderReadAccess(report.getElderId(), userId, role);
    }

    private void requireElderReadAccess(Long elderId, Long userId, Integer role) {
        if (userId == null || role == null) {
            throw new BusinessException(401, "未获取到当前登录用户");
        }
        ElderInfo elder = requireActiveElder(elderId);
        if (Integer.valueOf(1).equals(role)) {
            return;
        }
        if (Integer.valueOf(2).equals(role) && userId.equals(elder.getDoctorId())) {
            return;
        }
        if (Integer.valueOf(3).equals(role) && userId.equals(elder.getNurseId())) {
            return;
        }
        throw new BusinessException(403, "无权查看该老人的AI健康报告");
    }

    private ElderInfo requireActiveElder(Long elderId) {
        if (elderId == null || elderId <= 0) {
            throw new BusinessException(400, "老人ID必须为正整数");
        }
        ElderInfo elder = elderInfoMapper.selectById(elderId);
        if (elder == null || Integer.valueOf(1).equals(elder.getDeleted())) {
            throw new BusinessException(404, "老人不存在或已删除");
        }
        return elder;
    }

    private void writeTimeline(AiHealthReport report, Long doctorId) {
        try {
            TimelineEvent event = new TimelineEvent();
            event.setElderId(report.getElderId());
            event.setEventType(12);
            event.setEventTitle("AI健康评估报告（已确认）");
            event.setEventContent("风险等级: " + report.getRiskLevel()
                    + "，风险评分: " + report.getRiskScore() + "分，来源: Kimi");
            event.setSourceType("ai_health_report");
            event.setSourceId(report.getId());
            event.setEventTime(LocalDateTime.now());
            event.setDoctorId(doctorId);
            event.setCreateTime(LocalDateTime.now());
            timelineEventMapper.insert(event);
        } catch (Exception ignored) {
        }
    }

    private JSONObject parseObject(String json, String errorMessage) {
        try {
            return JSONUtil.parseObj(json);
        } catch (Exception exception) {
            throw new BusinessException(502, errorMessage);
        }
    }

    private String normalizeRiskLevel(String riskLevel) {
        String normalized = riskLevel == null ? "LOW" : riskLevel.trim().toUpperCase();
        if (!Set.of("LOW", "MEDIUM", "HIGH", "CRITICAL").contains(normalized)) {
            throw new BusinessException(500, "报告风险等级不合法");
        }
        return normalized;
    }

    private int boundedPageSize(Integer pageSize) {
        return pageSize == null ? 10 : Math.max(1, Math.min(pageSize, 100));
    }

    public static String cleanAiJsonPayload(String content) {
        if (content == null) return null;
        String cleaned = content.trim();
        if (!cleaned.startsWith("```")) return cleaned;
        int firstLineEnd = cleaned.indexOf('\n');
        cleaned = firstLineEnd >= 0 ? cleaned.substring(firstLineEnd + 1).trim() : cleaned.substring(3).trim();
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3).trim();
        }
        return cleaned;
    }
}
