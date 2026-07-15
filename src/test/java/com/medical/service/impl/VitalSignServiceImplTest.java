package com.medical.service.impl;

import com.medical.common.exception.BusinessException;
import com.medical.entity.ElderInfo;
import com.medical.entity.VitalSignData;
import com.medical.entity.WearableDevice;
import com.medical.mapper.VitalSignDataMapper;
import com.medical.mapper.WearableDeviceMapper;
import com.medical.service.ElderReferenceService;
import com.medical.service.WarningRuleService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
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
    void uploadDataRunsInTransactionSoInvalidRuleEvaluationRollsBackInserts() throws Exception {
        Transactional transactional = VitalSignServiceImpl.class
                .getMethod("uploadData", List.class)
                .getAnnotation(Transactional.class);

        assertEquals(Exception.class, transactional.rollbackFor()[0]);
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

    @Test
    void uploadsDataFromBoundCompatibleDeviceAndReturnsWarningCount() {
        WearableDeviceMapper deviceMapper = mock(WearableDeviceMapper.class);
        VitalSignDataMapper dataMapper = mock(VitalSignDataMapper.class);
        WarningRuleService warningRuleService = mock(WarningRuleService.class);
        VitalSignServiceImpl service = createService(deviceMapper, dataMapper, warningRuleService);
        WearableDevice bloodPressureMonitor = device(10L, 1L, "BP-DEVICE-001", 1);
        bloodPressureMonitor.setDeviceType(2);
        when(deviceMapper.selectById(10L)).thenReturn(bloodPressureMonitor);
        when(warningRuleService.evaluateVitalSigns(eq(1L), any())).thenReturn(2);

        VitalSignData systolic = vital(1L, 10L, 1, 190);
        VitalSignData diastolic = vital(1L, 10L, 2, 120);

        int warningCount = service.uploadData(List.of(systolic, diastolic));

        assertEquals(2, warningCount);
        assertEquals("mmHg", systolic.getUnit());
        assertEquals("mmHg", diastolic.getUnit());
        verify(dataMapper).insert(systolic);
        verify(dataMapper).insert(diastolic);
        verify(warningRuleService).evaluateVitalSigns(eq(1L), any());
    }

    @Test
    void rejectsUploadWithoutBoundDevice() {
        WearableDeviceMapper deviceMapper = mock(WearableDeviceMapper.class);
        VitalSignDataMapper dataMapper = mock(VitalSignDataMapper.class);
        WarningRuleService warningRuleService = mock(WarningRuleService.class);
        VitalSignServiceImpl service = createService(deviceMapper, dataMapper, warningRuleService);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.uploadData(List.of(vital(1L, null, 1, 180))));

        assertEquals("请先绑定设备后再录入生命体征数据", exception.getMessage());
        verify(dataMapper, never()).insert(any(VitalSignData.class));
    }

    @Test
    void rejectsMetricThatDoesNotMatchDeviceType() {
        WearableDeviceMapper deviceMapper = mock(WearableDeviceMapper.class);
        VitalSignDataMapper dataMapper = mock(VitalSignDataMapper.class);
        WarningRuleService warningRuleService = mock(WarningRuleService.class);
        VitalSignServiceImpl service = createService(deviceMapper, dataMapper, warningRuleService);
        WearableDevice bloodPressureMonitor = device(10L, 1L, "BP-DEVICE-001", 1);
        bloodPressureMonitor.setDeviceType(2);
        when(deviceMapper.selectById(10L)).thenReturn(bloodPressureMonitor);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.uploadData(List.of(vital(1L, 10L, 3, 130))));

        assertEquals("该设备不支持所选生命体征指标", exception.getMessage());
        verify(dataMapper, never()).insert(any(VitalSignData.class));
    }

    private VitalSignServiceImpl createService(WearableDeviceMapper mapper) {
        return createService(mapper, mock(VitalSignDataMapper.class), mock(WarningRuleService.class));
    }

    private VitalSignServiceImpl createService(WearableDeviceMapper mapper,
                                               VitalSignDataMapper dataMapper,
                                               WarningRuleService warningRuleService) {
        VitalSignServiceImpl service = new VitalSignServiceImpl();
        ElderReferenceService elderReferenceService = mock(ElderReferenceService.class);
        when(elderReferenceService.requireActive(anyLong())).thenReturn(new ElderInfo());
        ReflectionTestUtils.setField(service, "wearableDeviceMapper", mapper);
        ReflectionTestUtils.setField(service, "vitalSignDataMapper", dataMapper);
        ReflectionTestUtils.setField(service, "warningRuleService", warningRuleService);
        ReflectionTestUtils.setField(service, "elderReferenceService", elderReferenceService);
        return service;
    }

    private VitalSignData vital(Long elderId, Long deviceId, int dataType, double value) {
        VitalSignData data = new VitalSignData();
        data.setElderId(elderId);
        data.setDeviceId(deviceId);
        data.setDataType(dataType);
        data.setDataValue(BigDecimal.valueOf(value));
        return data;
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
