package com.medical.service.impl;

import com.medical.common.exception.BusinessException;
import com.medical.entity.NursingPlan;
import com.medical.mapper.NursingPlanMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NursePlanServiceImplTest {

    @Test
    void deleteUsesMybatisPlusLogicalDeleteWhenPlanExists() {
        NursingPlanMapper mapper = mock(NursingPlanMapper.class);
        NursePlanServiceImpl service = new NursePlanServiceImpl();
        ReflectionTestUtils.setField(service, "nursingPlanMapper", mapper);
        NursingPlan plan = new NursingPlan();
        plan.setId(10L);

        when(mapper.selectById(10L)).thenReturn(plan);
        when(mapper.deleteById(10L)).thenReturn(1);

        assertDoesNotThrow(() -> service.delete(10L));

        verify(mapper).deleteById(10L);
        verify(mapper, never()).updateById(any(NursingPlan.class));
    }

    @Test
    void deleteRejectsMissingPlan() {
        NursingPlanMapper mapper = mock(NursingPlanMapper.class);
        NursePlanServiceImpl service = new NursePlanServiceImpl();
        ReflectionTestUtils.setField(service, "nursingPlanMapper", mapper);

        when(mapper.selectById(404L)).thenReturn(null);

        assertThrows(BusinessException.class, () -> service.delete(404L));

        verify(mapper, never()).deleteById(404L);
    }

    @Test
    void deleteFailsWhenMapperDeletesNoRows() {
        NursingPlanMapper mapper = mock(NursingPlanMapper.class);
        NursePlanServiceImpl service = new NursePlanServiceImpl();
        ReflectionTestUtils.setField(service, "nursingPlanMapper", mapper);
        NursingPlan plan = new NursingPlan();
        plan.setId(11L);

        when(mapper.selectById(11L)).thenReturn(plan);
        when(mapper.deleteById(11L)).thenReturn(0);

        assertThrows(BusinessException.class, () -> service.delete(11L));
    }
}
