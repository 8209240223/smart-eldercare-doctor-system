package com.medical.service.impl;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.mapper.ElderRiskProfileMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RiskProfileServiceImplTest {

    @Test
    void keyPopulationSearchFiltersByNameOrExactIdBeforePagination() {
        ElderRiskProfileMapper mapper = mock(ElderRiskProfileMapper.class);
        when(mapper.selectCount(any())).thenReturn(2L);
        when(mapper.selectAllWithElder()).thenReturn(List.of(
                riskRecord(1L, "王大爷"),
                riskRecord(2L, "李奶奶")));

        RiskProfileServiceImpl service = new RiskProfileServiceImpl();
        ReflectionTestUtils.setField(service, "elderRiskProfileMapper", mapper);

        Page<Map<String, Object>> byName = service.getKeyPopulationList(
                1, 1, null, null, null, "奶");
        Page<Map<String, Object>> byId = service.getKeyPopulationList(
                1, 1, null, null, null, "2");

        assertEquals(1, byName.getTotal());
        assertEquals("李奶奶", byName.getRecords().get(0).get("name"));
        assertEquals(1, byId.getTotal());
        assertEquals(2L, byId.getRecords().get(0).get("elderId"));
    }

    private Map<String, Object> riskRecord(Long elderId, String name) {
        Map<String, Object> record = new LinkedHashMap<>();
        record.put("elder_id", elderId);
        record.put("name", name);
        record.put("risk_level", 3);
        record.put("risk_score", 70);
        return record;
    }
}
