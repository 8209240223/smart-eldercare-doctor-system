package com.medical.service;

import com.medical.entity.DoctorNurseRelation;
import com.medical.entity.SysUser;
import com.medical.mapper.DoctorNurseRelationMapper;
import com.medical.mapper.SysUserMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DoctorNurseRelationServiceTest {

    @Test
    void newDoctorAutomaticallyReceivesTwoNurseRelations() {
        DoctorNurseRelationMapper relationMapper = mock(DoctorNurseRelationMapper.class);
        SysUserMapper userMapper = mock(SysUserMapper.class);
        DoctorProfileService profileService = mock(DoctorProfileService.class);
        DoctorNurseRelationService service = new DoctorNurseRelationService(
                relationMapper, userMapper, profileService);

        SysUser doctor = activeUser(20L, 2, "doctor20");
        SysUser nurse1 = activeUser(31L, 3, "nurse31");
        SysUser nurse2 = activeUser(32L, 3, "nurse32");
        when(relationMapper.selectList(any())).thenReturn(List.of());
        when(userMapper.selectList(any())).thenReturn(List.of(nurse1, nurse2));
        when(relationMapper.selectCount(any())).thenReturn(0L);
        when(relationMapper.selectOne(any())).thenReturn(null);

        service.ensureFor(doctor);

        verify(relationMapper, times(2)).insert(any(DoctorNurseRelation.class));
    }

    private SysUser activeUser(Long id, Integer userType, String username) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setUserType(userType);
        user.setUsername(username);
        user.setRealName(username);
        user.setStatus(1);
        user.setDeleted(0);
        return user;
    }
}
