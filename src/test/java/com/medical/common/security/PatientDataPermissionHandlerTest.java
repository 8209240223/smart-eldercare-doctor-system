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
    void nurseOnlyReadsDirectlyAssignedElders() {
        bindUser(8L, 3);
        Table table = new Table("follow_plan");
        table.setAlias(new Alias("fp"));

        Expression expression = handler.getSqlSegment(table, null, "followPlanList");

        assertThat(expression.toString()).isEqualTo("fp.elder_id IN (SELECT e.id FROM elder_info e WHERE e.nurse_id = 8 AND e.deleted = 0)");
    }

    @Test
    void administratorRemainsUnscoped() {
        bindUser(1L, 1);

        Expression expression = handler.getSqlSegment(new Table("elder_info"), null, "elderList");

        assertThat(expression).isNull();
    }

    @Test
    void receivingDoctorCanSeeActiveIncomingHandoffBeforeOwningPatient() {
        bindUser(9L, 2);
        Table table = new Table("referral_order");
        table.setAlias(new Alias("ro"));

        Expression expression = handler.getSqlSegment(table, null, "referralList");

        assertThat(expression.toString())
                .contains("ro.elder_id IN")
                .contains("ro.status IN (0, 1, 2)")
                .contains("ro.from_doctor_id = 9")
                .contains("ro.to_doctor_id = 9");
    }

    private void bindUser(Long userId, Integer userType) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("currentUserId", userId);
        request.setAttribute("currentUserType", userType);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }
}
