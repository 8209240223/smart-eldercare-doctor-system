package com.medical.service.impl;

import com.medical.common.exception.BusinessException;
import com.medical.entity.ElderInfo;
import com.medical.entity.ReferralOrder;
import com.medical.entity.SysUser;
import com.medical.mapper.PatientHandoffMapper;
import com.medical.mapper.ReferralOrderMapper;
import com.medical.service.DoctorNurseRelationService;
import com.medical.service.DoctorProfileService;
import com.medical.service.TimelineService;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReferralServiceImplTest {

    @Test
    void completingHandoffTransfersOpenWorkflowsThenPatientOwnership() {
        ReferralOrderMapper referralMapper = mock(ReferralOrderMapper.class);
        PatientHandoffMapper handoffMapper = mock(PatientHandoffMapper.class);
        TimelineService timelineService = mock(TimelineService.class);
        DoctorProfileService profileService = mock(DoctorProfileService.class);
        DoctorNurseRelationService relationService = mock(DoctorNurseRelationService.class);
        ReferralServiceImpl service = new ReferralServiceImpl(
                referralMapper, handoffMapper, timelineService, profileService, relationService);

        ReferralOrder order = acceptedOrder();
        ElderInfo elder = elder(42L, 2L, 5L);
        when(referralMapper.selectById(9L)).thenReturn(order);
        when(handoffMapper.selectElderForUpdate(42L)).thenReturn(elder);
        when(relationService.chooseNurseForDoctor(3L, "42", 5L)).thenReturn(6L);
        when(referralMapper.updateById(order)).thenReturn(1);
        when(handoffMapper.transferElderOwner(42L, 2L, 3L, 6L)).thenReturn(1);

        service.completeReferral(9L, "已核对资料并接续随访", 3L, 2);

        InOrder orderOfUpdates = inOrder(handoffMapper, referralMapper);
        orderOfUpdates.verify(handoffMapper).transferOpenWarnings(42L, 3L);
        orderOfUpdates.verify(handoffMapper).transferActiveFollowPlans(42L, 3L);
        orderOfUpdates.verify(handoffMapper).transferOpenFollowupTasks(42L, 3L);
        orderOfUpdates.verify(handoffMapper).transferActiveInterventions(42L, 3L);
        orderOfUpdates.verify(handoffMapper).transferActiveNursingPlans(42L, 3L, 6L);
        orderOfUpdates.verify(handoffMapper).transferOpenNursingRecords(42L, 3L, 6L);
        orderOfUpdates.verify(handoffMapper).transferDraftReports(42L, 3L);
        orderOfUpdates.verify(referralMapper).updateById(order);
        orderOfUpdates.verify(handoffMapper).transferElderOwner(42L, 2L, 3L, 6L);
        verify(timelineService).addEvent(any());
    }

    @Test
    void staleHandoffCannotOverwriteAChangedResponsibleDoctor() {
        ReferralOrderMapper referralMapper = mock(ReferralOrderMapper.class);
        PatientHandoffMapper handoffMapper = mock(PatientHandoffMapper.class);
        TimelineService timelineService = mock(TimelineService.class);
        DoctorProfileService profileService = mock(DoctorProfileService.class);
        DoctorNurseRelationService relationService = mock(DoctorNurseRelationService.class);
        ReferralServiceImpl service = new ReferralServiceImpl(
                referralMapper, handoffMapper, timelineService, profileService, relationService);

        ReferralOrder order = acceptedOrder();
        when(referralMapper.selectById(9L)).thenReturn(order);
        when(handoffMapper.selectElderForUpdate(42L)).thenReturn(elder(42L, 88L, 5L));

        assertThatThrownBy(() -> service.completeReferral(9L, "继续随访", 3L, 2))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("责任医生已变化");

        verify(handoffMapper, never()).transferElderOwner(any(), any(), any(), any());
    }

    private ReferralOrder acceptedOrder() {
        ReferralOrder order = new ReferralOrder();
        order.setId(9L);
        order.setElderId(42L);
        order.setFromDoctorId(2L);
        order.setFromDoctorName("张医生");
        order.setToDoctorId(3L);
        order.setToDoctorName("李医生");
        order.setStatus(1);
        return order;
    }

    private ElderInfo elder(Long id, Long doctorId, Long nurseId) {
        ElderInfo elder = new ElderInfo();
        elder.setId(id);
        elder.setDoctorId(doctorId);
        elder.setNurseId(nurseId);
        elder.setAccountStatus(1);
        elder.setDeleted(0);
        return elder;
    }
}
