package com.medical.service;

import com.medical.entity.ElderInfo;
import com.medical.entity.SysUser;
import com.medical.mapper.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserDemoDataServiceTest {
    @Test
    void createsTwoCompleteRealNameBundlesForNewDoctor() {
        Fixture fixture = fixture();
        when(fixture.elderMapper.selectCount(any())).thenReturn(0L);
        SysUser nurse = new SysUser();
        nurse.setId(9L);
        nurse.setUserType(3);
        nurse.setStatus(1);
        when(fixture.userMapper.selectOne(any())).thenReturn(nurse);
        AtomicLong elderIds = new AtomicLong(100L);
        when(fixture.elderMapper.insert(any())).thenAnswer(invocation -> {
            ((ElderInfo) invocation.getArgument(0)).setId(elderIds.getAndIncrement());
            return 1;
        });
        SysUser doctor = activeUser(21L, 2);

        fixture.service.ensureFor(doctor);

        ArgumentCaptor<ElderInfo> captor = ArgumentCaptor.forClass(ElderInfo.class);
        verify(fixture.elderMapper, times(2)).insert(captor.capture());
        assertThat(captor.getAllValues()).allSatisfy(elder -> {
            assertThat(elder.getName()).doesNotContainPattern("[0-9]");
            assertThat(elder.getDoctorId()).isEqualTo(21L);
            assertThat(elder.getNurseId()).isEqualTo(9L);
            assertThat(elder.getIdCard()).hasSize(18);
        });
        verify((HealthRecordMapper) ReflectionTestUtils.getField(fixture.service, "healthRecordMapper"), times(2))
                .insert(any());
        verify((AiHealthReportMapper) ReflectionTestUtils.getField(fixture.service, "aiHealthReportMapper"), times(2))
                .insert(any());
        verify((NursingPlanMapper) ReflectionTestUtils.getField(fixture.service, "nursingPlanMapper"), times(2))
                .insert(any());
    }

    @Test
    void existingOwnedEldersPreventDuplicateSeeding() {
        Fixture fixture = fixture();
        ElderInfo existing = new ElderInfo();
        existing.setId(88L);
        when(fixture.elderMapper.selectList(any())).thenReturn(List.of(existing));
        AiHealthReportMapper reportMapper = (AiHealthReportMapper) ReflectionTestUtils.getField(
                fixture.service, "aiHealthReportMapper");
        when(reportMapper.selectCount(any())).thenReturn(1L);

        fixture.service.ensureFor(activeUser(22L, 3));

        verify(fixture.elderMapper, never()).insert(any());
        verify(fixture.userMapper, never()).selectOne(any());
    }

    @Test
    void legacyOwnedEldersWithoutDemoMarkerStillReceiveCompleteBundles() {
        Fixture fixture = fixture();
        ElderInfo legacy = new ElderInfo();
        legacy.setId(77L);
        when(fixture.elderMapper.selectList(any())).thenReturn(List.of(legacy));
        SysUser doctor = activeUser(2L, 2);
        when(fixture.userMapper.selectOne(any())).thenReturn(doctor);
        AtomicLong elderIds = new AtomicLong(200L);
        when(fixture.elderMapper.insert(any())).thenAnswer(invocation -> {
            ((ElderInfo) invocation.getArgument(0)).setId(elderIds.getAndIncrement());
            return 1;
        });

        fixture.service.ensureFor(activeUser(7L, 3));

        verify(fixture.elderMapper, times(2)).insert(any());
        verify((NursingPlanMapper) ReflectionTestUtils.getField(fixture.service, "nursingPlanMapper"), times(2))
                .insert(any());
        verify((AiHealthReportMapper) ReflectionTestUtils.getField(fixture.service, "aiHealthReportMapper"), times(2))
                .insert(any());
    }

    private SysUser activeUser(Long id, Integer userType) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setUserType(userType);
        user.setStatus(1);
        user.setDeleted(0);
        return user;
    }

    private Fixture fixture() {
        UserDemoDataService service = new UserDemoDataService();
        ElderInfoMapper elderMapper = mock(ElderInfoMapper.class);
        SysUserMapper userMapper = mock(SysUserMapper.class);
        ReflectionTestUtils.setField(service, "elderInfoMapper", elderMapper);
        ReflectionTestUtils.setField(service, "sysUserMapper", userMapper);
        ReflectionTestUtils.setField(service, "healthRecordMapper", mock(HealthRecordMapper.class));
        ReflectionTestUtils.setField(service, "physicalExamMapper", mock(PhysicalExamMapper.class));
        ReflectionTestUtils.setField(service, "elderRiskProfileMapper", mock(ElderRiskProfileMapper.class));
        ReflectionTestUtils.setField(service, "followPlanMapper", mock(FollowPlanMapper.class));
        ReflectionTestUtils.setField(service, "followupTaskMapper", mock(FollowupTaskMapper.class));
        ReflectionTestUtils.setField(service, "assessmentRecordMapper", mock(AssessmentRecordMapper.class));
        ReflectionTestUtils.setField(service, "nursingPlanMapper", mock(NursingPlanMapper.class));
        ReflectionTestUtils.setField(service, "nursingRecordMapper", mock(NursingRecordMapper.class));
        ReflectionTestUtils.setField(service, "aiHealthReportMapper", mock(AiHealthReportMapper.class));
        return new Fixture(service, elderMapper, userMapper);
    }

    private record Fixture(UserDemoDataService service, ElderInfoMapper elderMapper, SysUserMapper userMapper) {
    }
}
