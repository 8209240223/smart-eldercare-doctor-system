package com.medical.service.impl;

import com.medical.entity.SysUser;
import com.medical.mapper.SysUserMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ElderServiceImplTest {

    @Test
    void doctorOptionsExposeOnlySafeDisplayFields() {
        SysUserMapper userMapper = mock(SysUserMapper.class);
        ElderServiceImpl service = new ElderServiceImpl();
        ReflectionTestUtils.setField(service, "sysUserMapper", userMapper);
        SysUser doctor = new SysUser();
        doctor.setId(2L);
        doctor.setUsername("doctor01");
        doctor.setRealName("张医生");
        doctor.setPassword("should-not-leak");
        when(userMapper.selectList(any())).thenReturn(List.of(doctor));

        List<Map<String, Object>> options = service.listActiveDoctorOptions();

        assertEquals(1, options.size());
        assertEquals(2L, options.get(0).get("id"));
        assertEquals("张医生", options.get(0).get("realName"));
        assertEquals("doctor01", options.get(0).get("username"));
        assertFalse(options.get(0).containsKey("password"));
    }
}
