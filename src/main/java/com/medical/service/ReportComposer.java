package com.medical.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.entity.ElderInfo;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 报告组装器 — 将触发的规则按 6 个板块组装成结构化 JSON
 */
@Service
public class ReportComposer {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    // 板块排序
    private static final List<String> CATEGORY_ORDER = Arrays.asList(
            "血压", "血糖", "心率", "血氧", "体温", "BMI", "腰围",
            "病史", "过敏", "家族史", "用药",
            "生活方式", "生活能力",
            "预警", "随访", "干预", "评估", "护理", "转诊", "设备"
    );

    // 随机鼓励语
    private static final List<String> ENCOURAGEMENTS = Arrays.asList(
            "保持良好的心态是健康的第一要素，您已经做得很好了！",
            "坚持定期检查，是对自己最好的关爱。",
            "健康管理是一场马拉松，每一步都算数，继续保持！",
            "您对健康的重视，就是晚年幸福生活的最好保障。",
            "每一天的坚持，都是对生命最好的投资。",
            "身体是革命的本钱，照顾好自己比什么都重要。",
            "积极面对，科学管理，健康长寿不是梦！",
            "有专业的医疗团队守护您的健康，请放心。",
            "您的健康数据整体趋势向好，继续保持好习惯！",
            "生活规律、心态平和，就是最好的养生之道。",
            "每个认真对待健康的日子，都值得被点赞！",
            "您的积极配合让健康管理事半功倍，感谢信任！",
            "养成好习惯，改掉坏习惯，健康自然来。",
            "医养结合，守护最美夕阳红！",
            "照顾好自己，就是对家人最好的爱。"
    );

    /**
     * 组装结构化报告 JSON
     */
    public String compose(List<RuleEngineService.TriggeredRule> triggered, Map<String, Object> ctx) {
        Map<String, Object> report = new LinkedHashMap<>();

        // ===== 风险评分 =====
        int riskScore = 0;
        for (RuleEngineService.TriggeredRule tr : triggered) {
            riskScore += tr.severity * 10;
        }
        riskScore = Math.min(riskScore, 100);
        String riskLevel;
        if (riskScore <= 15) riskLevel = "LOW";
        else if (riskScore <= 40) riskLevel = "MEDIUM";
        else if (riskScore <= 70) riskLevel = "HIGH";
        else riskLevel = "CRITICAL";

        report.put("riskScore", riskScore);
        report.put("riskLevel", riskLevel);

        // ===== 风险原因（severity >= 2 的发现） =====
        List<String> riskReasons = triggered.stream()
                .filter(tr -> tr.severity >= 2)
                .map(tr -> tr.renderedFinding)
                .collect(Collectors.toList());
        report.put("riskReasons", riskReasons);

        // ===== 老人基本信息摘要 =====
        ElderInfo elder = (ElderInfo) ctx.get("elder");
        Map<String, Object> elderBrief = new LinkedHashMap<>();
        if (elder != null) {
            elderBrief.put("name", elder.getName());
            elderBrief.put("gender", elder.getGender() == 1 ? "男" : "女");
            elderBrief.put("age", ctx.getOrDefault("age", ""));
        }
        report.put("elderBrief", elderBrief);

        // ===== 按板块组织发现和建议 =====
        // 按 category 分组
        Map<String, List<RuleEngineService.TriggeredRule>> grouped = new LinkedHashMap<>();
        for (RuleEngineService.TriggeredRule tr : triggered) {
            grouped.computeIfAbsent(tr.getCategory(), k -> new ArrayList<>()).add(tr);
        }

        List<Map<String, Object>> findings = new ArrayList<>();
        for (String category : CATEGORY_ORDER) {
            List<RuleEngineService.TriggeredRule> items = grouped.get(category);
            if (items == null || items.isEmpty()) continue;
            for (RuleEngineService.TriggeredRule tr : items) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("category", category);
                item.put("severity", tr.severity);
                item.put("finding", tr.renderedFinding);
                item.put("advice", tr.renderedAdvice);
                findings.add(item);
            }
        }
        report.put("findings", findings);

        // ===== 慢病管理建议 =====
        List<Map<String, String>> chronicAdvice = buildChronicAdvice(ctx);
        report.put("chronicAdvice", chronicAdvice);

        // ===== 随访建议 =====
        List<String> followUpAdvice = buildFollowUpAdvice(ctx);
        report.put("followUpAdvice", followUpAdvice);

        // ===== 干预建议 =====
        List<Map<String, String>> interventionAdvice = buildInterventionAdvice(ctx);
        report.put("interventionAdvice", interventionAdvice);

        // ===== 注意事项 =====
        List<String> notices = buildNotices(ctx, triggered);
        report.put("notices", notices);

        // ===== 报告正文（自然语言摘要） =====
        String reportText = buildReportText(riskLevel, triggered, ctx);
        report.put("reportText", reportText);

        // ===== 随机鼓励语（2条） =====
        Collections.shuffle(ENCOURAGEMENTS);
        report.put("encouragements", ENCOURAGEMENTS.subList(0, 2));

        // ===== 元数据 =====
        report.put("triggeredRuleCount", triggered.size());
        report.put("generatedAt", java.time.LocalDateTime.now().toString());

        try {
            return MAPPER.writeValueAsString(report);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    /**
     * 构建慢病管理建议
     */
    private List<Map<String, String>> buildChronicAdvice(Map<String, Object> ctx) {
        List<Map<String, String>> list = new ArrayList<>();

        // 从病史中提取慢病
        @SuppressWarnings("unchecked")
        List<com.medical.entity.MedicalHistory> histories =
                (List<com.medical.entity.MedicalHistory>) ctx.get("medicalHistories");
        if (histories != null) {
            Map<String, String> diseaseAdviceMap = new LinkedHashMap<>();
            diseaseAdviceMap.put("高血压", "低盐饮食（<5g/天），每周监测血压≥2次，遵医嘱规律服药，避免情绪激动。定期复查心电图和肾功能");
            diseaseAdviceMap.put("糖尿病", "控制碳水化合物摄入（主食定量），定时定量进餐，每周≥150分钟中等强度运动。定期检查糖化血红蛋白、眼底和足部");
            diseaseAdviceMap.put("冠心病", "低脂饮食，戒烟限酒，遵医嘱服用抗血小板药物。注意胸闷、胸痛等警示症状，随身携带急救药物");
            diseaseAdviceMap.put("脑卒中", "严格控制血压，遵医嘱服用抗凝药物。进行康复训练，注意防跌倒。定期复查头颅CT");
            diseaseAdviceMap.put("COPD", "戒烟，避免粉尘和刺激性气体。坚持缩唇呼吸和腹式呼吸训练。秋冬季节接种流感疫苗");
            diseaseAdviceMap.put("骨质疏松", "补充钙剂和维生素D，适度负重运动。注意防跌倒，定期检测骨密度");
            diseaseAdviceMap.put("慢性肾病", "低蛋白饮食，严格控制血压和血糖。避免使用肾毒性药物（如NSAIDs），定期复查肾功能");

            Set<String> seen = new HashSet<>();
            for (com.medical.entity.MedicalHistory mh : histories) {
                if (mh.getIsCured() != null && mh.getIsCured() == 1) continue;
                String disease = mh.getDiseaseName();
                if (disease == null || seen.contains(disease)) continue;
                seen.add(disease);

                // 模糊匹配
                String advice = null;
                for (Map.Entry<String, String> entry : diseaseAdviceMap.entrySet()) {
                    if (disease.contains(entry.getKey())) {
                        advice = entry.getValue();
                        break;
                    }
                }
                if (advice == null) {
                    advice = "遵医嘱定期复查，保持健康生活方式，关注疾病进展";
                }

                Map<String, String> item = new LinkedHashMap<>();
                item.put("disease", disease);
                item.put("advice", advice);
                list.add(item);
            }
        }
        return list;
    }

    /**
     * 构建随访建议
     */
    private List<String> buildFollowUpAdvice(Map<String, Object> ctx) {
        List<String> list = new ArrayList<>();
        @SuppressWarnings("unchecked")
        List<com.medical.entity.FollowPlan> plans =
                (List<com.medical.entity.FollowPlan>) ctx.get("activeFollowPlans");
        if (plans != null) {
            for (com.medical.entity.FollowPlan plan : plans) {
                String info = "「" + plan.getPlanName() + "」随访计划进行中";
                if (plan.getNextFollowDate() != null) {
                    info += "（下次随访：" + plan.getNextFollowDate() + "）";
                }
                if (plan.getTotalCount() != null && plan.getCompletedCount() != null) {
                    info += "，完成 " + plan.getCompletedCount() + "/" + plan.getTotalCount() + " 次";
                }
                list.add(info);
            }
        }
        if (list.isEmpty()) {
            list.add("暂无进行中的随访计划，建议根据老人健康状况建立个性化随访方案");
        }
        return list;
    }

    /**
     * 构建干预建议
     */
    private List<Map<String, String>> buildInterventionAdvice(Map<String, Object> ctx) {
        List<Map<String, String>> list = new ArrayList<>();
        @SuppressWarnings("unchecked")
        List<com.medical.entity.InterventionRecord> interventions =
                (List<com.medical.entity.InterventionRecord>) ctx.get("recentInterventions");
        if (interventions != null) {
            for (com.medical.entity.InterventionRecord ir : interventions) {
                Map<String, String> item = new LinkedHashMap<>();
                String type = "";
                if (ir.getInterventionType() != null) {
                    switch (ir.getInterventionType()) {
                        case 1: type = "药物干预"; break;
                        case 2: type = "非药物干预"; break;
                        case 3: type = "转诊处理"; break;
                        case 4: type = "健康教育"; break;
                        default: type = "干预";
                    }
                }
                item.put("type", type);
                item.put("content", ir.getInterventionContent() != null ?
                        ir.getInterventionContent() : ir.getInterventionTitle());
                if (ir.getEffectEvaluation() != null) {
                    String effect;
                    switch (ir.getEffectEvaluation()) {
                        case 1: effect = "效果显著"; break;
                        case 2: effect = "有效"; break;
                        case 3: effect = "效果一般"; break;
                        case 4: effect = "效果不理想"; break;
                        default: effect = "";
                    }
                    if (!effect.isEmpty()) item.put("effect", effect);
                }
                list.add(item);
            }
        }
        if (list.isEmpty()) {
            Map<String, String> item = new LinkedHashMap<>();
            item.put("type", "提示");
            item.put("content", "暂无近期干预记录。建议针对随访中发现的问题及时进行干预");
            list.add(item);
        }
        return list;
    }

    /**
     * 构建注意事项
     */
    private List<String> buildNotices(Map<String, Object> ctx, List<RuleEngineService.TriggeredRule> triggered) {
        List<String> list = new ArrayList<>();

        // 过敏
        Object allergens = ctx.get("allergens");
        if (allergens != null && !allergens.toString().isEmpty()) {
            list.add("⚠️ 过敏史：" + allergens + "，处方及用药时需严格规避");
        }

        // 多重用药
        int medCount = (int) ctx.getOrDefault("medicationCount", 0);
        if (medCount >= 3) {
            list.add("⚠️ 多重用药（" + medCount + "种），注意药物相互作用及肝肾功能监测");
        }

        // 跌倒风险
        int fallRisk = (int) ctx.getOrDefault("fallRisk", 0);
        if (fallRisk == 1) {
            list.add("⚠️ 跌倒高风险，建议居家安全改造（扶手、防滑垫、夜灯），起床遵循三部曲");
        }

        // 设备
        int hasDevice = (int) ctx.getOrDefault("hasDevice", 0);
        String deviceNames = (String) ctx.getOrDefault("deviceNames", "");
        if (hasDevice == 1) {
            list.add("📡 已绑定设备：" + deviceNames + "，请定期查看监测数据");
        }

        // 预警
        int warningUnhandled = (int) ctx.getOrDefault("warningUnhandled", 0);
        if (warningUnhandled > 0) {
            list.add("🔔 " + warningUnhandled + " 条待处理预警，请尽快查看和处理");
        }

        // 转诊
        int hasActiveReferral = (int) ctx.getOrDefault("hasActiveReferral", 0);
        if (hasActiveReferral == 1) {
            list.add("📋 有进行中的转诊，请关注转诊进展并及时更新档案");
        }

        if (list.isEmpty()) {
            list.add("✅ 暂无明显需要特别关注的事项，请保持现有健康管理方案");
        }
        return list;
    }

    /**
     * 生成自然语言摘要
     */
    private String buildReportText(String riskLevel, List<RuleEngineService.TriggeredRule> triggered,
                                    Map<String, Object> ctx) {
        StringBuilder sb = new StringBuilder();
        ElderInfo elder = (ElderInfo) ctx.get("elder");

        String name = elder != null ? elder.getName() : "该老人";
        sb.append(name);

        switch (riskLevel) {
            case "LOW":    sb.append("整体健康状况良好"); break;
            case "MEDIUM": sb.append("存在若干健康风险因素，需持续管理"); break;
            case "HIGH":   sb.append("健康风险较高，需重点关注和积极干预"); break;
            case "CRITICAL": sb.append("存在危急健康风险，需立即采取行动"); break;
        }

        sb.append("。本次评估共检测 ").append(triggered.size()).append(" 项需关注事项");

        // 列出最严重的 3 项
        List<RuleEngineService.TriggeredRule> sorted = triggered.stream()
                .sorted((a, b) -> b.severity - a.severity)
                .collect(Collectors.toList());
        if (!sorted.isEmpty()) {
            sb.append("，其中较为突出的包括：");
            int count = 0;
            for (RuleEngineService.TriggeredRule tr : sorted) {
                if (count >= 3) break;
                if (count > 0) sb.append("；");
                // 简化发现文本（取第一句）
                String finding = tr.renderedFinding;
                int dot = finding.indexOf("，");
                if (dot == -1) dot = finding.indexOf("。");
                sb.append(dot > 0 ? finding.substring(0, dot) : finding);
                count++;
            }
        }
        sb.append("。建议按照报告中的各项建议逐项落实，定期复查。");

        return sb.toString();
    }
}
