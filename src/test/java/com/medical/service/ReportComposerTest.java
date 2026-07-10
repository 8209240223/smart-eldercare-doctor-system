package com.medical.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReportComposerTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    void composeIncludesSchemaAndDataCompletenessMetadata() throws Exception {
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("dataCompleteness", Map.of(
                "score", 60,
                "completedSections", 3,
                "totalSections", 5));
        context.put("dataCompletenessScore", 60);
        context.put("missingData", List.of("随访记录", "健康评估"));

        String reportJson = new ReportComposer().compose(Collections.emptyList(), context);
        JsonNode report = MAPPER.readTree(reportJson);

        assertEquals("2.0", report.path("schemaVersion").asText());
        assertEquals(60, report.path("dataCompletenessScore").asInt());
        assertEquals(60, report.path("dataCompleteness").path("score").asInt());
        assertTrue(report.path("missingData").isArray());
        assertEquals(2, report.path("missingData").size());
    }
}
