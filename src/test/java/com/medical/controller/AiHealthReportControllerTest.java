package com.medical.controller;

import com.medical.service.AiHealthReportService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiHealthReportControllerTest {

    @Test
    void confirmPrefersEditedReportJsonAndKeepsLegacyFallback() {
        AiHealthReportService service = mock(AiHealthReportService.class);
        AiHealthReportController controller = new AiHealthReportController();
        ReflectionTestUtils.setField(controller, "reportService", service);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getAttribute("currentUserId")).thenReturn(2L);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("editedReportJson", "{\"riskScore\":90}");
        body.put("editedJson", "{\"riskScore\":10}");

        controller.confirm(7L, body, request);

        verify(service).confirm(7L, 2L, "{\"riskScore\":90}");
    }
}
