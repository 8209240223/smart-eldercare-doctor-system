package com.medical.common.security;

import com.baomidou.mybatisplus.extension.plugins.handler.MultiDataPermissionHandler;
import net.sf.jsqlparser.expression.Expression;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.schema.Table;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.util.Locale;
import java.util.Set;

@Component
public class PatientDataPermissionHandler implements MultiDataPermissionHandler {
    private static final String ELDER_INFO = "elder_info";
    private static final String WARNING_LOG = "warning_event_log";
    private static final String REFERRAL_ORDER = "referral_order";
    private static final String DOCTOR_COLUMN = "doctor_id";
    private static final String NURSE_COLUMN = "nurse_id";
    private static final String OWNER_EQUALS = " = ";
    private static final String ELDER_SUBQUERY = ".elder_id IN (SELECT id FROM elder_info WHERE ";
    private static final String ACTIVE_ELDER_SUFFIX = " AND deleted = 0)";
    private static final Set<String> ELDER_TABLES = Set.of(
            "health_record", "health_warning", "follow_plan", "follow_record", "followup_task",
            "assessment_record", "timeline_event", "wearable_device",
            "intervention_record", "medical_history", "medication_record", "allergy_record",
            "family_history", "vital_sign_data", "nursing_record", "nursing_plan", "physical_exam",
            "ai_health_report", "elder_risk_profile");

    @Override
    public Expression getSqlSegment(Table table, Expression where, String mappedStatementId) {
        PatientScope scope = currentScope();
        if (scope == null || scope.userType() == 1) {
            return null;
        }
        String tableName = normalize(table.getName());
        String qualifier = table.getAlias() == null ? table.getName() : table.getAlias().getName();
        String ownerColumn = scope.userType() == 2 ? DOCTOR_COLUMN : NURSE_COLUMN;
        String condition = permissionCondition(tableName, qualifier, ownerColumn,
                scope.userId(), scope.userType());
        if (condition == null) {
            return null;
        }
        return parse(condition, mappedStatementId);
    }

    private String permissionCondition(String table, String qualifier, String ownerColumn,
                                       Long userId, Integer userType) {
        if (ELDER_INFO.equals(table)) {
            return qualifier + "." + ownerColumn + OWNER_EQUALS + userId;
        }
        if (ELDER_TABLES.contains(table)) {
            return qualifier + ELDER_SUBQUERY + ownerColumn + OWNER_EQUALS + userId + ACTIVE_ELDER_SUFFIX;
        }
        if (REFERRAL_ORDER.equals(table)) {
            String ownedPatient = qualifier + ELDER_SUBQUERY + ownerColumn + OWNER_EQUALS
                    + userId + ACTIVE_ELDER_SUFFIX;
            if (Integer.valueOf(2).equals(userType)) {
                return "(" + ownedPatient + " OR (" + qualifier + ".status IN (0, 1, 2) AND ("
                        + qualifier + ".from_doctor_id = " + userId + " OR "
                        + qualifier + ".to_doctor_id = " + userId + ")))";
            }
            return ownedPatient;
        }
        if (WARNING_LOG.equals(table)) {
            return qualifier + ".warning_id IN (SELECT id FROM health_warning WHERE elder_id IN "
                    + "(SELECT id FROM elder_info WHERE " + ownerColumn + OWNER_EQUALS + userId
                    + " AND deleted = 0))";
        }
        return null;
    }

    private Expression parse(String condition, String mappedStatementId) {
        try {
            return CCJSqlParserUtil.parseCondExpression(condition);
        } catch (Exception exception) {
            throw new IllegalStateException("构建患者数据权限失败: " + mappedStatementId, exception);
        }
    }

    private PatientScope currentScope() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (!(attributes instanceof ServletRequestAttributes servletAttributes)) {
            return null;
        }
        HttpServletRequest request = servletAttributes.getRequest();
        Long userId = toLong(request.getAttribute("currentUserId"));
        Integer userType = toInteger(request.getAttribute("currentUserType"));
        if (userId == null || userType == null || userType < 1 || userType > 3) {
            return null;
        }
        return new PatientScope(userId, userType);
    }

    private String normalize(String tableName) {
        String value = tableName == null ? "" : tableName.replace("`", "").toLowerCase(Locale.ROOT);
        int separator = value.lastIndexOf('.');
        return separator < 0 ? value : value.substring(separator + 1);
    }

    private Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Long.valueOf(value.toString());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private Integer toInteger(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Integer.valueOf(value.toString());
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private record PatientScope(Long userId, Integer userType) {
    }
}
