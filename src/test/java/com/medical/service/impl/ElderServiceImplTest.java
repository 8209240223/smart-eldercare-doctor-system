package com.medical.service.impl;

import com.medical.common.exception.BusinessException;
import com.medical.entity.ElderInfo;
import com.medical.entity.SysUser;
import com.medical.mapper.ElderInfoMapper;
import com.medical.mapper.HealthRecordMapper;
import com.medical.mapper.SysUserMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
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

    @Test
    void createDerivesBirthDateFromIdCardWhenMissing() {
        ElderInfoMapper elderMapper = mock(ElderInfoMapper.class);
        ElderServiceImpl service = createService(elderMapper);
        ElderInfo elder = validElder();

        service.create(elder);

        assertEquals(LocalDate.of(1949, 12, 31), elder.getBirthDate());
        verify(elderMapper).insert(elder);
    }

    @Test
    void createRejectsBirthDateThatConflictsWithIdCard() {
        ElderServiceImpl service = createService(mock(ElderInfoMapper.class));
        ElderInfo elder = validElder();
        elder.setBirthDate(LocalDate.of(1950, 1, 1));

        BusinessException exception = assertThrows(BusinessException.class, () -> service.create(elder));

        assertEquals("出生日期必须与身份证号中的出生日期一致", exception.getMessage());
    }

    private ElderServiceImpl createService(ElderInfoMapper elderMapper) {
        ElderServiceImpl service = new ElderServiceImpl();
        ReflectionTestUtils.setField(service, "elderInfoMapper", elderMapper);
        ReflectionTestUtils.setField(service, "healthRecordMapper", mock(HealthRecordMapper.class));
        return service;
    }

    private ElderInfo validElder() {
        ElderInfo elder = new ElderInfo();
        elder.setName("测试老人");
        elder.setGender(1);
        elder.setIdCard("11010519491231002X");
        elder.setPhone("13800138000");
        return elder;
    }
}
