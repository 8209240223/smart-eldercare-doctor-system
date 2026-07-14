package com.medical.common.security;

import net.sf.jsqlparser.expression.Alias;
import net.sf.jsqlparser.expression.Expression;
import net.sf.jsqlparser.schema.Table;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import static org.assertj.core.api.Assertions.assertThat;

class PatientDataPermissionHandlerTest {
    private final PatientDataPermissionHandler handler = new PatientDataPermissionHandler();

    @AfterEach
    void clearRequest() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void doctorOnlyReadsEldersAssignedToCurrentDoctor() {
        bindUser(7L, 2);
        Table table = new Table("elder_info");
        table.setAlias(new Alias("e"));

        Expression expression = handler.getSqlSegment(table, null, "elderList");

        assertThat(expression.toString()).isEqualTo("e.doctor_id = 7");
    }

    @Test
    void nurseRelatedRecordsAreScopedThroughOwnedElders() {
        bindUser(8L, 3);
        Table table = new Table("follow_plan");
        table.setAlias(new Alias("fp"));

        Expression expression = handler.getSqlSegment(table, null, "followPlanList");

        assertThat(expression.toString()).contains("fp.elder_id IN")
                .contains("nurse_id = 8")
                .contains("deleted = 0");
    }

    @Test
    void administratorRemainsUnscoped() {
        bindUser(1L, 1);

        Expression expression = handler.getSqlSegment(new Table("elder_info"), null, "elderList");

        assertThat(expression).isNull();
    }

    private void bindUser(Long userId, Integer userType) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("currentUserId", userId);
        request.setAttribute("currentUserType", userType);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }
}
