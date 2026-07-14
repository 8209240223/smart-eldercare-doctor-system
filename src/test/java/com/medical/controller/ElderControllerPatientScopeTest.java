package com.medical.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.ElderInfo;
import com.medical.service.ElderOnboardingService;
import com.medical.service.ElderService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ElderControllerPatientScopeTest {

    @Mock
    private ElderService elderService;

    @Mock
    private ElderOnboardingService elderOnboardingService;

    @InjectMocks
    private ElderController controller;

    @Test
    void doctorListAlwaysUsesCurrentDoctorInsteadOfRequestedDoctor() {
        when(elderService.listElders(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(new Page<>());

        controller.list(1, 100, null, null, null, 999L, null, doctorRequest(7L));

        verify(elderService).listElders(1, 100, null, null, null, 7L, null);
    }

    @Test
    void doctorCannotReadAnotherDoctorsElder() {
        ElderInfo elder = new ElderInfo();
        elder.setId(2L);
        elder.setDoctorId(8L);
        when(elderService.getDetail(2L)).thenReturn(elder);

        assertThatThrownBy(() -> controller.detail(2L, doctorRequest(7L)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("不属于当前责任医生");
    }

    @Test
    void doctorCreatedElderIsForcedToCurrentDoctor() {
        ElderInfo elder = new ElderInfo();
        elder.setDoctorId(999L);
        when(elderService.create(elder)).thenReturn(30L);

        controller.create(elder, doctorRequest(7L));

        verify(elderService).create(eq(elder));
        assertThat(elder.getDoctorId()).isEqualTo(7L);
    }

    private MockHttpServletRequest doctorRequest(Long doctorId) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("currentUserId", doctorId);
        request.setAttribute("currentUserType", 2);
        return request;
    }
}
