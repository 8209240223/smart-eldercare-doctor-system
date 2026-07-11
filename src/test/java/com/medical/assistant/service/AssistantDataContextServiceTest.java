package com.medical.assistant.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Date;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import org.mockito.Answers;

import static org.mockito.Mockito.mock;

class AssistantDataContextServiceTest {

    @Test
    void doctorCanRetrieveFollowupDataForNumberedElderWithoutSensitiveFields() {
        JdbcTemplate jdbc = fixtureJdbc();
        AssistantDataContextService service = new AssistantDataContextService(jdbc, new ObjectMapper());

        String context = service.buildContext("\u544a\u8bc9\u6211\u6240\u6709\u5173\u4e8e1\u53f7\u8001\u4eba\u7684\u968f\u8bbf\u8ba1\u5212", 2L, 2);

        assertThat(context).contains("elder_full_record", "follow_plan", "Hypertension followup");
        assertThat(context).doesNotContain("\"id_card\":", "\"phone\":", "\"password\":", "\"nursing_plan\":[");
    }

    @Test
    void nurseCannotReceiveDoctorOnlyFollowupOrReferralRows() {
        JdbcTemplate jdbc = fixtureJdbc();
        AssistantDataContextService service = new AssistantDataContextService(jdbc, new ObjectMapper());

        String context = service.buildContext("elder id 1", 6L, 3);

        assertThat(context).contains("denied_for_nurse", "nursing_plan");
        assertThat(context).doesNotContain("Hypertension followup", "\"referral_order\":[", "\"timeline_event\":[");
        assertThat(service.permissionDeniedAnswer("\u67e5\u770b1\u53f7\u8001\u4eba\u7684\u968f\u8bbf\u8ba1\u5212", 3))
                .contains("\u65e0\u6743\u67e5\u770b", "\u533b\u751f\u6216\u7ba1\u7406\u5458");
    }

    @Test
    void doctorCanRequestAllRecordsForAnAuthorizedModule() {
        JdbcTemplate jdbc = fixtureJdbc();
        AssistantDataContextService service = new AssistantDataContextService(jdbc, new ObjectMapper());

        String context = service.buildContext("\u67e5\u770b\u6240\u6709\u968f\u8bbf\u8ba1\u5212", 2L, 2);

        assertThat(context).contains("module_records", "follow_plan", "Hypertension followup");
    }

    private JdbcTemplate fixtureJdbc() {
        return mock(JdbcTemplate.class, invocation -> {
            if ("queryForObject".equals(invocation.getMethod().getName())
                    && invocation.getArguments().length > 1
                    && Integer.class.equals(invocation.getArgument(1))) {
                return 1;
            }
            if (!"queryForList".equals(invocation.getMethod().getName())) {
                return Answers.RETURNS_DEFAULTS.answer(invocation);
            }
            String sql = invocation.getArgument(0);
            if (sql.contains("FROM elder_info WHERE id")) {
                return List.of(Map.of(
                        "id", 1L,
                        "name", "Elder One",
                        "id_card", "secret-card",
                        "phone", "13900000000",
                        "birth_date", Date.valueOf("1945-03-15")
                ));
            }
            if (sql.contains("FROM follow_plan")) {
                return List.of(Map.of("id", 10L, "elder_id", 1L, "plan_name", "Hypertension followup"));
            }
            if (sql.contains("FROM nursing_plan")) {
                return List.of(Map.of("id", 20L, "elder_id", 1L, "plan_name", "Daily nursing"));
            }
            return List.of();
        });
    }
}
