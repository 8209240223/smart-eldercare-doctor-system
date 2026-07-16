package com.medical.service.impl;

import com.medical.common.exception.BusinessException;
import com.medical.entity.NursingPlan;
import com.medical.entity.ElderInfo;
import com.medical.mapper.NursingPlanMapper;
import com.medical.service.ElderReferenceService;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NursePlanServiceImplTest {

    @Test
    void createResetsWorkflowFieldsControlledByTheServer() {
        NursingPlanMapper mapper = mock(NursingPlanMapper.class);
        ElderReferenceService elderReferenceService = mock(ElderReferenceService.class);
        NursePlanServiceImpl service = createService(mapper, elderReferenceService);
        NursingPlan plan = validPlan();
        plan.setDeleted(1);
        plan.setStatus(2);
        plan.setCompletedCount(8);
        plan.setDoctorApproval(2);

        service.create(plan);

        assertEquals(0, plan.getDeleted());
        assertEquals(0, plan.getStatus());
        assertEquals(0, plan.getCompletedCount());
        assertEquals(0, plan.getDoctorApproval());
        assertEquals(2L, plan.getDoctorId());
        verify(elderReferenceService).requireActiveDoctor(2L);
        verify(mapper).insert(plan);
    }

    @Test
    void updateCannotReplaceNurseOrDoctorApprovalFields() {
        NursingPlanMapper mapper = mock(NursingPlanMapper.class);
        ElderReferenceService elderReferenceService = mock(ElderReferenceService.class);
        NursePlanServiceImpl service = createService(mapper, elderReferenceService);
        NursingPlan existing = validPlan();
        existing.setId(20L);
        existing.setNurseId(3L);
        existing.setStatus(0);
        existing.setCompletedCount(1);
        existing.setDoctorApproval(0);
        when(mapper.selectById(20L)).thenReturn(existing);

        NursingPlan update = validPlan();
        update.setNurseId(99L);
        update.setStatus(2);
        update.setCompletedCount(10);
        update.setDoctorApproval(2);

        service.update(20L, update, 3L);

        assertEquals(3L, existing.getNurseId());
        assertEquals(0, existing.getStatus());
        assertEquals(1, existing.getCompletedCount());
        assertEquals(0, existing.getDoctorApproval());
        verify(mapper).updateById(existing);
    }

    @Test
    void deleteUsesMybatisPlusLogicalDeleteWhenPlanExists() {
        NursingPlanMapper mapper = mock(NursingPlanMapper.class);
        NursePlanServiceImpl service = new NursePlanServiceImpl();
        ReflectionTestUtils.setField(service, "nursingPlanMapper", mapper);
        NursingPlan plan = new NursingPlan();
        plan.setId(10L);
        plan.setNurseId(3L);

        when(mapper.selectById(10L)).thenReturn(plan);
        when(mapper.deleteById(10L)).thenReturn(1);

        assertDoesNotThrow(() -> service.delete(10L, 3L));

        verify(mapper).deleteById(10L);
        verify(mapper, never()).updateById(any(NursingPlan.class));
    }

    @Test
    void deleteRejectsMissingPlan() {
        NursingPlanMapper mapper = mock(NursingPlanMapper.class);
        NursePlanServiceImpl service = new NursePlanServiceImpl();
        ReflectionTestUtils.setField(service, "nursingPlanMapper", mapper);

        when(mapper.selectById(404L)).thenReturn(null);

        assertThrows(BusinessException.class, () -> service.delete(404L, 3L));

        verify(mapper, never()).deleteById(404L);
    }

    @Test
    void deleteFailsWhenMapperDeletesNoRows() {
        NursingPlanMapper mapper = mock(NursingPlanMapper.class);
        NursePlanServiceImpl service = new NursePlanServiceImpl();
        ReflectionTestUtils.setField(service, "nursingPlanMapper", mapper);
        NursingPlan plan = new NursingPlan();
        plan.setId(11L);
        plan.setNurseId(3L);

        when(mapper.selectById(11L)).thenReturn(plan);
        when(mapper.deleteById(11L)).thenReturn(0);

        assertThrows(BusinessException.class, () -> service.delete(11L, 3L));
    }

    @Test
    void nurseListAlwaysUsesCurrentNurseInsteadOfRequestedNurse() {
        initializeTableInfo();
        NursingPlanMapper mapper = mock(NursingPlanMapper.class);
        NursePlanServiceImpl service = new NursePlanServiceImpl();
        ReflectionTestUtils.setField(service, "nursingPlanMapper", mapper);
        when(mapper.selectPage(any(Page.class), any(Wrapper.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.list(1, 10, null, 99L, null, null, 3L, 3);

        ArgumentCaptor<LambdaQueryWrapper<NursingPlan>> captor = ArgumentCaptor.forClass(LambdaQueryWrapper.class);
        verify(mapper).selectPage(any(Page.class), captor.capture());
        assertTrue(captor.getValue().getSqlSegment().contains("nurse_id"));
        var values = captor.getValue().getParamNameValuePairs().values().stream()
                .map(String::valueOf)
                .toList();
        assertTrue(values.contains("3"));
        assertFalse(values.contains("99"));
    }

    @Test
    void nurseCannotReadOrUpdateAnotherNursesPlan() {
        NursingPlanMapper mapper = mock(NursingPlanMapper.class);
        NursePlanServiceImpl service = new NursePlanServiceImpl();
        ReflectionTestUtils.setField(service, "nursingPlanMapper", mapper);
        NursingPlan plan = validPlan();
        plan.setId(30L);
        plan.setNurseId(5L);
        plan.setDeleted(0);
        when(mapper.selectById(30L)).thenReturn(plan);

        BusinessException readError = assertThrows(BusinessException.class,
                () -> service.getById(30L, 3L, 3));
        BusinessException updateError = assertThrows(BusinessException.class,
                () -> service.update(30L, validPlan(), 3L));

        assertEquals(403, readError.getCode());
        assertEquals(403, updateError.getCode());
        verify(mapper, never()).updateById(any(NursingPlan.class));
    }

    private void initializeTableInfo() {
        TableInfoHelper.initTableInfo(
                new MapperBuilderAssistant(new MybatisConfiguration(), "nurse-plan-scope-test"),
                NursingPlan.class);
    }

    private NursePlanServiceImpl createService(NursingPlanMapper mapper,
                                               ElderReferenceService elderReferenceService) {
        NursePlanServiceImpl service = new NursePlanServiceImpl();
        ReflectionTestUtils.setField(service, "nursingPlanMapper", mapper);
        ReflectionTestUtils.setField(service, "elderReferenceService", elderReferenceService);
        ElderInfo elder = new ElderInfo();
        elder.setId(1L);
        elder.setDoctorId(2L);
        elder.setNurseId(3L);
        when(elderReferenceService.requireActive(1L)).thenReturn(elder);
        return service;
    }

    private NursingPlan validPlan() {
        NursingPlan plan = new NursingPlan();
        plan.setElderId(1L);
        plan.setNurseId(3L);
        plan.setPlanName("基础护理计划");
        plan.setPlanType(1);
        plan.setStartDate(LocalDate.now());
        plan.setTotalCount(12);
        return plan;
    }
}
