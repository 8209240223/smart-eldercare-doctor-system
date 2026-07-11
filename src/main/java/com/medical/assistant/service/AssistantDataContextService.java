package com.medical.assistant.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medical.common.exception.BusinessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AssistantDataContextService {
    static final int MAX_CONTEXT_CHARS = 18000;
    private static final Pattern ELDER_ID_BEFORE = Pattern.compile("(?:\\u8001\\u4eba|\\u957f\\u8005|ID|id)\\s*[\\uFF1A:#\\u53F7\\u4E3A\\u662F-]*\\s*(\\d{1,10})");
    private static final Pattern ELDER_ID_AFTER = Pattern.compile("(\\d{1,10})\\s*\\u53F7?\\s*(?:\\u8001\\u4eba|\\u957f\\u8005)");
    private static final Set<String> TODAY_KEYWORDS = Set.of("\u4eca\u5929", "\u4eca\u65e5", "\u5f53\u5929", "\u5f85\u529e", "\u91cd\u70b9\u4e8b\u9879", "\u91cd\u70b9\u5065\u5eb7");
    private static final Set<String> DOCTOR_ONLY_KEYWORDS = Set.of("\u968f\u8bbf", "\u5e72\u9884", "\u8f6c\u8bca");
    private static final Set<String> NURSE_ONLY_KEYWORDS = Set.of("\u62a4\u7406\u8ba1\u5212", "\u62a4\u7406\u8bb0\u5f55");
    private static final Set<String> SENSITIVE_COLUMNS = Set.of("password", "id_card", "phone", "emergency_phone", "address", "emergency_contact");
    private static final List<String> CLINICAL_TABLES = List.of(
            "health_record", "medical_history", "medication_record", "allergy_record", "family_history",
            "physical_exam", "assessment_record", "health_warning", "vital_sign_data", "wearable_device",
            "ai_health_report");
    private static final List<String> DOCTOR_TABLES = List.of("follow_plan", "followup_task", "follow_record", "intervention_record", "referral_order", "timeline_event");
    private static final List<String> NURSING_TABLES = List.of("nursing_plan", "nursing_record");

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public AssistantDataContextService(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public String buildContext(String question, Long userId, Integer role) {
        if (userId == null || role == null || role < 1 || role > 3) {
            throw new BusinessException(401, "Unable to identify the current signed-in user");
        }
        String normalized = question == null ? "" : question.trim();
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("queriedAt", Timestamp.valueOf(java.time.LocalDateTime.now()));
        context.put("currentUser", Map.of("userId", userId, "role", roleName(role), "scope", roleScope(role)));
        context.put("statusCodebook", statusCodebook());
        Long elderId = findElderId(normalized);
        if (elderId == null) elderId = findElderIdByName(normalized);
        if (elderId != null) {
            context.put("queryType", "elder_full_record");
            context.put("elderRecord", buildElderContext(elderId, role));
        } else if (TODAY_KEYWORDS.stream().anyMatch(normalized::contains)) {
            context.put("queryType", "today_focus");
            context.put("today", buildTodayContext(role));
        } else if (!requestedTables(normalized, role).isEmpty()) {
            context.put("queryType", "module_records");
            context.put("moduleRecords", buildModuleContext(normalized, role));
        } else {
            context.put("queryType", "system_overview");
            context.put("overview", buildOverview(role));
        }
        return toBoundedJson(context);
    }

    public String permissionDeniedAnswer(String question, Integer role) {
        String normalized = question == null ? "" : question.trim();
        if (Integer.valueOf(3).equals(role) && DOCTOR_ONLY_KEYWORDS.stream().anyMatch(normalized::contains)) {
            return "\u5f53\u524d\u62a4\u58eb\u89d2\u8272\u65e0\u6743\u67e5\u770b\u968f\u8bbf\u8ba1\u5212\u3001\u968f\u8bbf\u4efb\u52a1\u3001\u5e72\u9884\u548c\u8f6c\u8bca\u6570\u636e\u3002\u5982\u9700\u67e5\u8be2\uff0c\u8bf7\u4f7f\u7528\u533b\u751f\u6216\u7ba1\u7406\u5458\u8d26\u53f7\u3002";
        }
        if (Integer.valueOf(2).equals(role) && NURSE_ONLY_KEYWORDS.stream().anyMatch(normalized::contains)) {
            return "\u5f53\u524d\u533b\u751f\u89d2\u8272\u65e0\u6743\u76f4\u63a5\u67e5\u770b\u62a4\u58eb\u5de5\u4f5c\u53f0\u4e2d\u7684\u62a4\u7406\u8ba1\u5212\u548c\u62a4\u7406\u8bb0\u5f55\u660e\u7ec6\u3002\u8bf7\u901a\u8fc7\u62a4\u58eb\u5ba1\u6838\u529f\u80fd\u67e5\u770b\u5f85\u5ba1\u5185\u5bb9\u3002";
        }
        return null;
    }

    private Map<String, Object> buildModuleContext(String question, Integer role) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("elderDirectory", query("SELECT id,name,gender,birth_date,community,doctor_id,account_status FROM elder_info WHERE deleted=0 ORDER BY id LIMIT 100"));
        for (String table : requestedTables(question, role)) {
            result.put(table, queryModuleTable(table));
        }
        return result;
    }

    private Set<String> requestedTables(String question, Integer role) {
        Set<String> tables = new LinkedHashSet<>();
        if (question.contains("\u968f\u8bbf") && (role == 1 || role == 2)) tables.addAll(List.of("follow_plan", "followup_task", "follow_record"));
        if (question.contains("\u5e72\u9884") && (role == 1 || role == 2)) tables.add("intervention_record");
        if (question.contains("\u8f6c\u8bca") && (role == 1 || role == 2)) tables.add("referral_order");
        if (question.contains("\u9884\u8b66")) tables.add("health_warning");
        if ((question.contains("\u62a4\u7406") || question.contains("\u62a4\u58eb")) && (role == 1 || role == 3)) tables.addAll(NURSING_TABLES);
        if (question.contains("\u8bc4\u4f30")) tables.add("assessment_record");
        if (question.contains("\u4f53\u68c0") || question.contains("\u68c0\u67e5")) tables.add("physical_exam");
        if (question.contains("\u751f\u547d\u4f53\u5f81") || question.contains("\u8840\u538b") || question.contains("\u8840\u7cd6")) tables.add("vital_sign_data");
        if (question.contains("AI\u62a5\u544a") || question.contains("\u5065\u5eb7\u62a5\u544a")) tables.add("ai_health_report");
        if (question.contains("\u75c5\u53f2") || question.contains("\u7528\u836f") || question.contains("\u8fc7\u654f")) {
            tables.addAll(List.of("health_record", "medical_history", "medication_record", "allergy_record", "family_history"));
        }
        return tables;
    }

    private List<Map<String, Object>> queryModuleTable(String table) {
        String orderColumn = tableHasColumn(table, "create_time") ? "create_time" : "id";
        String deletedFilter = tableHasColumn(table, "deleted") ? " AND t.deleted=0" : "";
        return query("SELECT t.*,e.name elder_name FROM " + table + " t JOIN elder_info e ON e.id=t.elder_id " +
                "WHERE e.deleted=0" + deletedFilter + " ORDER BY t." + orderColumn + " DESC LIMIT 50");
    }

    private Map<String, Object> buildElderContext(Long elderId, Integer role) {
        List<Map<String, Object>> elders = query("SELECT * FROM elder_info WHERE id=? AND deleted=0 LIMIT 1", elderId);
        if (elders.isEmpty()) return Map.of("elderId", elderId, "result", "elder_not_found");
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("elder_info", elders);
        if (role == 1 || role == 2) {
            for (String table : DOCTOR_TABLES) result.put(table, queryElderTable(table, elderId));
        } else {
            result.put("doctor_only_modules", "denied_for_nurse");
        }
        if (role == 1 || role == 3) {
            for (String table : NURSING_TABLES) result.put(table, queryElderTable(table, elderId));
        } else {
            result.put("nursing_modules", "not_in_doctor_scope");
        }
        for (String table : CLINICAL_TABLES) result.put(table, queryElderTable(table, elderId));
        return result;
    }

    private Map<String, Object> buildTodayContext(Integer role) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("date", LocalDate.now().toString());
        result.put("active_warnings", query("SELECT w.id,w.elder_id,e.name elder_name,w.warning_level,w.warning_title,w.warning_content,w.status,w.create_time FROM health_warning w JOIN elder_info e ON e.id=w.elder_id WHERE w.deleted=0 AND e.deleted=0 AND w.status IN (0,1) ORDER BY w.warning_level DESC,w.create_time DESC LIMIT 50"));
        result.put("today_exams", query("SELECT p.id,p.elder_id,e.name elder_name,p.exam_date,p.systolic_pressure,p.diastolic_pressure,p.heart_rate,p.blood_sugar_fasting,p.abnormal_flag FROM physical_exam p JOIN elder_info e ON e.id=p.elder_id WHERE p.deleted=0 AND e.deleted=0 AND p.exam_date=CURDATE() ORDER BY p.id DESC LIMIT 50"));
        if (role == 1 || role == 2) {
            result.put("due_followup_tasks", query("SELECT t.id,t.elder_id,e.name elder_name,t.plan_id,t.task_type,t.priority,t.due_date,t.status,t.task_reason FROM followup_task t JOIN elder_info e ON e.id=t.elder_id WHERE e.deleted=0 AND t.status IN (0,1) AND t.due_date<=CURDATE() ORDER BY t.priority DESC,t.due_date ASC LIMIT 50"));
            result.put("due_followup_plans", query("SELECT p.id,p.elder_id,e.name elder_name,p.plan_name,p.disease_type,p.next_follow_date,p.status,p.remark FROM follow_plan p JOIN elder_info e ON e.id=p.elder_id WHERE p.deleted=0 AND e.deleted=0 AND p.next_follow_date<=CURDATE() AND p.status IN (0,1) ORDER BY p.next_follow_date ASC LIMIT 50"));
            result.put("active_referrals", query("SELECT r.id,r.elder_id,e.name elder_name,r.referral_type,r.to_org,r.to_dept,r.urgency_level,r.status,r.create_time FROM referral_order r JOIN elder_info e ON e.id=r.elder_id WHERE e.deleted=0 AND r.status IN (0,1,2) ORDER BY r.urgency_level DESC,r.create_time ASC LIMIT 50"));
        }
        if (role == 1 || role == 3) {
            result.put("active_nursing_plans", query("SELECT p.id,p.elder_id,e.name elder_name,p.plan_name,p.plan_type,p.start_date,p.end_date,p.frequency,p.status,p.completed_count,p.total_count FROM nursing_plan p JOIN elder_info e ON e.id=p.elder_id WHERE p.deleted=0 AND e.deleted=0 AND p.status IN (0,1) AND CURDATE() BETWEEN p.start_date AND p.end_date ORDER BY p.end_date ASC LIMIT 50"));
            result.put("today_nursing_records", query("SELECT r.id,r.elder_id,e.name elder_name,r.record_type,r.record_title,r.record_date,r.is_abnormal,r.report_status,r.doctor_review FROM nursing_record r JOIN elder_info e ON e.id=r.elder_id WHERE r.deleted=0 AND e.deleted=0 AND DATE(r.record_date)=CURDATE() ORDER BY r.record_date DESC LIMIT 50"));
        }
        return result;
    }

    private Map<String, Object> buildOverview(Integer role) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("elderCount", scalar("SELECT COUNT(*) FROM elder_info WHERE deleted=0"));
        result.put("elders", query("SELECT id,name,gender,birth_date,community,doctor_id,account_status FROM elder_info WHERE deleted=0 ORDER BY id LIMIT 100"));
        result.put("activeWarningCount", scalar("SELECT COUNT(*) FROM health_warning WHERE deleted=0 AND status IN (0,1)"));
        if (role == 1 || role == 2) {
            result.put("pendingFollowupTaskCount", scalar("SELECT COUNT(*) FROM followup_task WHERE status IN (0,1)"));
            result.put("activeFollowupPlanCount", scalar("SELECT COUNT(*) FROM follow_plan WHERE deleted=0 AND status IN (0,1)"));
            result.put("activeReferralCount", scalar("SELECT COUNT(*) FROM referral_order WHERE status IN (0,1,2)"));
        }
        if (role == 1 || role == 3) {
            result.put("activeNursingPlanCount", scalar("SELECT COUNT(*) FROM nursing_plan WHERE deleted=0 AND status IN (0,1)"));
            result.put("pendingNursingReviewCount", scalar("SELECT COUNT(*) FROM nursing_record WHERE deleted=0 AND doctor_review=0"));
        }
        return result;
    }

    private List<Map<String, Object>> queryElderTable(String table, Long elderId) {
        String orderColumn = tableHasColumn(table, "create_time") ? "create_time" : "id";
        return query("SELECT * FROM " + table + " WHERE elder_id=? ORDER BY " + orderColumn + " DESC LIMIT 50", elderId);
    }

    private boolean tableHasColumn(String table, String column) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?", Integer.class, table, column);
        return count != null && count > 0;
    }

    private Long findElderId(String question) {
        Matcher before = ELDER_ID_BEFORE.matcher(question);
        if (before.find()) return Long.valueOf(before.group(1));
        Matcher after = ELDER_ID_AFTER.matcher(question);
        return after.find() ? Long.valueOf(after.group(1)) : null;
    }

    private Long findElderIdByName(String question) {
        if (!StringUtils.hasText(question)) return null;
        for (Map<String, Object> row : jdbcTemplate.queryForList("SELECT id,name FROM elder_info WHERE deleted=0 ORDER BY CHAR_LENGTH(name) DESC")) {
            String name = String.valueOf(row.get("name"));
            if (StringUtils.hasText(name) && question.contains(name)) return ((Number) row.get("id")).longValue();
        }
        return null;
    }

    private Object scalar(String sql) { return jdbcTemplate.queryForObject(sql, Object.class); }
    private List<Map<String, Object>> query(String sql, Object... args) { return sanitizeRows(jdbcTemplate.queryForList(sql, args)); }

    private List<Map<String, Object>> sanitizeRows(Collection<Map<String, Object>> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> sanitized = new LinkedHashMap<>();
            row.forEach((key, value) -> {
                if (!SENSITIVE_COLUMNS.contains(key.toLowerCase(Locale.ROOT))) sanitized.put(key, normalizeValue(value));
            });
            result.add(sanitized);
        }
        return result;
    }

    private Object normalizeValue(Object value) {
        if (value instanceof Date || value instanceof Timestamp) return value.toString();
        if (value instanceof byte[]) return "[binary omitted]";
        if (value instanceof String && ((String) value).length() > 1200) return ((String) value).substring(0, 1200) + "...[truncated]";
        return value;
    }

    private String toBoundedJson(Map<String, Object> context) {
        try {
            String json = objectMapper.writeValueAsString(context);
            return json.length() <= MAX_CONTEXT_CHARS ? json : json.substring(0, MAX_CONTEXT_CHARS) + "...[context truncated]";
        } catch (JsonProcessingException e) {
            throw new BusinessException(500, "Failed to build assistant data context");
        }
    }

    private String roleName(Integer role) { return switch (role) { case 1 -> "admin"; case 2 -> "doctor"; case 3 -> "nurse"; default -> "unknown"; }; }
    private Map<String, String> statusCodebook() {
        Map<String, String> codes = new LinkedHashMap<>();
        codes.put("follow_plan.status", "0=pending,1=active,2=completed,3=terminated");
        codes.put("followup_task.status", "0=pending,1=processing,2=completed,3=cancelled");
        codes.put("health_warning.status", "0=pending,1=processing,2=handled,3=ignored");
        codes.put("health_warning.warning_level", "1=yellow,2=orange,3=red");
        codes.put("nursing_plan.status", "0=pending,1=active,2=completed,3=terminated");
        codes.put("referral_order.status", "0=pending,1=accepted,2=processing,3=completed,4=rejected,5=cancelled");
        codes.put("ai_health_report.status", "0=draft,1=confirmed,2=rejected,3=archived");
        return codes;
    }
    private List<String> roleScope(Integer role) {
        List<String> scope = new ArrayList<>(List.of("elders", "health", "warnings", "assessments", "exams", "vitals", "ai_reports"));
        if (role == 1 || role == 2) scope.addAll(List.of("followup", "interventions", "referrals"));
        if (role == 1 || role == 3) scope.addAll(List.of("nursing_plans", "nursing_records"));
        return scope;
    }
}
