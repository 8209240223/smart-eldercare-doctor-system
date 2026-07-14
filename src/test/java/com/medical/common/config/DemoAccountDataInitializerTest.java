package com.medical.common.config;

import com.medical.entity.SysUser;
import com.medical.mapper.SysUserMapper;
import com.medical.service.UserDemoDataService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DemoAccountDataInitializerTest {
    @Test
    void seedsOnlyTheConfiguredActiveDemoAccountsReturnedByTheQuery() {
        SysUserMapper userMapper = mock(SysUserMapper.class);
        UserDemoDataService demoDataService = mock(UserDemoDataService.class);
        SysUser doctor = new SysUser();
        doctor.setId(3L);
        doctor.setUsername("doctor02");
        when(userMapper.selectList(any())).thenReturn(List.of(doctor));

        new DemoAccountDataInitializer(userMapper, demoDataService).run(null);

        verify(demoDataService).ensureFor(doctor);
        verifyNoMoreInteractions(demoDataService);
    }
}
