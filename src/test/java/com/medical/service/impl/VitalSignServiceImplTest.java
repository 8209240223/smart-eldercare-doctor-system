package com.medical.service.impl;

import com.medical.common.exception.BusinessException;
import com.medical.entity.ElderInfo;
import com.medical.entity.WearableDevice;
import com.medical.mapper.VitalSignDataMapper;
import com.medical.mapper.WearableDeviceMapper;
import com.medical.service.ElderReferenceService;
import com.medical.service.WarningRuleService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class VitalSignServiceImplTest {

    @Test
    void bindDeviceUsesSerializableTransactionForSerialNumberRangeLocking() throws Exception {
        Transactional transactional = VitalSignServiceImpl.class
                .getMethod("bindDevice", WearableDevice.class)
                .getAnnotation(Transactional.class);

        assertEquals(Isolation.SERIALIZABLE, transactional.isolation());
    }

    @Test
    void rejectsSerialNumberAlreadyBoundToAnotherElder() {
        WearableDeviceMapper mapper = mock(WearableDeviceMapper.class);
        VitalSignServiceImpl service = createService(mapper);
        WearableDevice active = device(10L, 1L, "DEVICE-001", 1);
        when(mapper.selectByDeviceSnForUpdate("DEVICE-001")).thenReturn(List.of(active));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.bindDevice(device(null, 2L, "device-001", 1)));

        assertEquals("该设备序列号已绑定其他老人，请先解绑后再操作", exception.getMessage());
        verify(mapper, never()).insert(any(WearableDevice.class));
    }

    @Test
    void reusesUnboundDeviceRecordInsteadOfCreatingDuplicate() {
        WearableDeviceMapper mapper = mock(WearableDeviceMapper.class);
        VitalSignServiceImpl service = createService(mapper);
        WearableDevice unbound = device(10L, 1L, "DEVICE-001", 0);
        when(mapper.selectByDeviceSnForUpdate("DEVICE-001"))
                .thenReturn(List.of(unbound), List.of(unbound));

        WearableDevice result = service.bindDevice(device(null, 2L, "device-001", 1));

        assertEquals(10L, result.getId());
        assertEquals(2L, result.getElderId());
        assertEquals(1, result.getBindStatus());
        verify(mapper).updateById(unbound);
        verify(mapper, never()).insert(any(WearableDevice.class));
        verify(mapper, times(2)).selectByDeviceSnForUpdate("DEVICE-001");
    }

    @Test
    void normalizesSerialNumberBeforeCreatingDevice() {
        WearableDeviceMapper mapper = mock(WearableDeviceMapper.class);
        VitalSignServiceImpl service = createService(mapper);
        WearableDevice input = device(null, 1L, " device-abc ", 1);
        when(mapper.selectByDeviceSnForUpdate("DEVICE-ABC"))
                .thenReturn(List.of(), List.of(input));

        service.bindDevice(input);

        assertEquals("DEVICE-ABC", input.getDeviceSn());
        verify(mapper).insert(input);
        verify(mapper, times(2)).selectByDeviceSnForUpdate("DEVICE-ABC");
    }

    @Test
    void rejectsBindingWhenSecondCheckFindsConcurrentActiveDevice() {
        WearableDeviceMapper mapper = mock(WearableDeviceMapper.class);
        VitalSignServiceImpl service = createService(mapper);
        WearableDevice input = device(null, 1L, "DEVICE-ABC", 1);
        WearableDevice competing = device(20L, 2L, "DEVICE-ABC", 1);
        when(mapper.selectByDeviceSnForUpdate("DEVICE-ABC"))
                .thenReturn(List.of(), List.of(input, competing));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.bindDevice(input));

        assertEquals("设备序列号绑定冲突，请稍后重试", exception.getMessage());
        verify(mapper).insert(input);
        verify(mapper, times(2)).selectByDeviceSnForUpdate("DEVICE-ABC");
    }

    private VitalSignServiceImpl createService(WearableDeviceMapper mapper) {
        VitalSignServiceImpl service = new VitalSignServiceImpl();
        ElderReferenceService elderReferenceService = mock(ElderReferenceService.class);
        when(elderReferenceService.requireActive(anyLong())).thenReturn(new ElderInfo());
        ReflectionTestUtils.setField(service, "wearableDeviceMapper", mapper);
        ReflectionTestUtils.setField(service, "vitalSignDataMapper", mock(VitalSignDataMapper.class));
        ReflectionTestUtils.setField(service, "warningRuleService", mock(WarningRuleService.class));
        ReflectionTestUtils.setField(service, "elderReferenceService", elderReferenceService);
        return service;
    }

    private WearableDevice device(Long id, Long elderId, String serial, Integer bindStatus) {
        WearableDevice device = new WearableDevice();
        device.setId(id);
        device.setElderId(elderId);
        device.setDeviceName("测试手环");
        device.setDeviceSn(serial);
        device.setDeviceType(1);
        device.setBindStatus(bindStatus);
        return device;
    }
}
