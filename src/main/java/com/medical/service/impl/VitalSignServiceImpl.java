package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.entity.VitalSignData;
import com.medical.entity.WearableDevice;
import com.medical.mapper.VitalSignDataMapper;
import com.medical.mapper.WearableDeviceMapper;
import com.medical.common.exception.BusinessException;
import com.medical.service.ElderReferenceService;
import com.medical.service.VitalSignService;
import com.medical.service.WarningRuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class VitalSignServiceImpl implements VitalSignService {

    @Autowired
    private WearableDeviceMapper wearableDeviceMapper;

    @Autowired
    private VitalSignDataMapper vitalSignDataMapper;

    @Autowired
    private WarningRuleService warningRuleService;

    @Autowired
    private ElderReferenceService elderReferenceService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public synchronized WearableDevice bindDevice(WearableDevice device) {
        if (device == null) {
            throw new BusinessException(400, "设备信息不能为空");
        }
        if (device.getElderId() == null) {
            throw new BusinessException(400, "请选择需要绑定设备的老人");
        }
        String deviceName = device.getDeviceName() == null ? "" : device.getDeviceName().trim();
        String deviceSn = device.getDeviceSn() == null ? "" : device.getDeviceSn().trim().toUpperCase(Locale.ROOT);
        if (deviceName.isEmpty() || deviceName.length() > 50) {
            throw new BusinessException(400, "设备名称不能为空且不能超过50个字符");
        }
        if (!deviceSn.matches("[A-Z0-9][A-Z0-9._:-]{2,63}")) {
            throw new BusinessException(400, "设备序列号必须为3到64位字母、数字或 . _ : -");
        }
        if (device.getDeviceType() == null || device.getDeviceType() < 1 || device.getDeviceType() > 4) {
            throw new BusinessException(400, "设备类型不受支持");
        }
        elderReferenceService.requireActive(device.getElderId());

        List<WearableDevice> sameSerialDevices = wearableDeviceMapper.selectList(
                new LambdaQueryWrapper<WearableDevice>()
                        .eq(WearableDevice::getDeviceSn, deviceSn)
                        .orderByDesc(WearableDevice::getBindTime)
                        .orderByDesc(WearableDevice::getCreateTime));
        WearableDevice activeDevice = sameSerialDevices.stream()
                .filter(item -> Integer.valueOf(1).equals(item.getBindStatus()))
                .findFirst()
                .orElse(null);
        if (activeDevice != null) {
            if (device.getElderId().equals(activeDevice.getElderId())) {
                throw new BusinessException(400, "该设备已绑定当前老人，无需重复绑定");
            }
            throw new BusinessException(400, "该设备序列号已绑定其他老人，请先解绑后再操作");
        }

        LocalDateTime now = LocalDateTime.now();
        WearableDevice reusable = sameSerialDevices.stream().findFirst().orElse(null);
        if (reusable != null) {
            reusable.setElderId(device.getElderId());
            reusable.setDeviceName(deviceName);
            reusable.setDeviceSn(deviceSn);
            reusable.setDeviceType(device.getDeviceType());
            reusable.setBindStatus(1);
            reusable.setBindTime(now);
            wearableDeviceMapper.updateById(reusable);
            return reusable;
        }

        device.setDeviceName(deviceName);
        device.setDeviceSn(deviceSn);
        device.setBindStatus(1);
        device.setBindTime(now);
        device.setCreateTime(now);
        wearableDeviceMapper.insert(device);
        return device;
    }

    @Override
    public void unbindDevice(Long id) {
        WearableDevice existing = wearableDeviceMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(404, "设备不存在");
        }
        elderReferenceService.requireActive(existing.getElderId());
        WearableDevice device = new WearableDevice();
        device.setId(id);
        device.setBindStatus(0);
        wearableDeviceMapper.updateById(device);
    }

    @Override
    public List<WearableDevice> listDevices(Long elderId) {
        LambdaQueryWrapper<WearableDevice> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(WearableDevice::getElderId, elderId);
        wrapper.orderByDesc(WearableDevice::getCreateTime);
        return wearableDeviceMapper.selectList(wrapper);
    }

    @Override
    public void uploadData(List<VitalSignData> dataList) {
        if (dataList == null || dataList.isEmpty()) return;

        Set<Long> elderIds = new HashSet<>();
        for (VitalSignData data : dataList) {
            if (data == null) {
                throw new BusinessException(400, "生命体征数据不能为空");
            }
            elderReferenceService.requireActive(data.getElderId());
            elderIds.add(data.getElderId());
        }
        if (elderIds.size() != 1) {
            throw new BusinessException(400, "一次只能上传同一位老人的生命体征数据");
        }
        Long elderId = elderIds.iterator().next();
        Map<String, BigDecimal> vitalMap = new HashMap<>();

        for (VitalSignData data : dataList) {
            if (data.getCreateTime() == null) data.setCreateTime(LocalDateTime.now());
            if (data.getMeasureTime() == null) data.setMeasureTime(LocalDateTime.now());
            vitalSignDataMapper.insert(data);

            // 构建体征数据Map供规则引擎评估
            String metricCode = getMetricCode(data.getDataType());
            if (metricCode != null) {
                vitalMap.put(metricCode, data.getDataValue());
            }
        }

        // 自动触发预警规则评估
        if (!vitalMap.isEmpty() && elderId != null) {
            warningRuleService.evaluateVitalSigns(elderId, vitalMap);
        }
    }

    @Override
    public List<VitalSignData> getTrendData(Long elderId, Integer dataType, String startDate, String endDate) {
        LambdaQueryWrapper<VitalSignData> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(VitalSignData::getElderId, elderId);
        if (dataType != null) {
            wrapper.eq(VitalSignData::getDataType, dataType);
        }
        if (startDate != null && !startDate.isEmpty()) {
            wrapper.ge(VitalSignData::getMeasureTime, LocalDateTime.parse(startDate + "T00:00:00"));
        }
        if (endDate != null && !endDate.isEmpty()) {
            wrapper.le(VitalSignData::getMeasureTime, LocalDateTime.parse(endDate + "T23:59:59"));
        }
        wrapper.orderByAsc(VitalSignData::getMeasureTime);
        return vitalSignDataMapper.selectList(wrapper);
    }

    @Override
    public Map<String, Object> getLatestVitals(Long elderId) {
        Map<String, Object> vitals = new HashMap<>();
        // 获取每种类型最新一条数据
        for (int type = 1; type <= 7; type++) {
            LambdaQueryWrapper<VitalSignData> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(VitalSignData::getElderId, elderId)
                   .eq(VitalSignData::getDataType, type)
                   .orderByDesc(VitalSignData::getMeasureTime)
                   .last("LIMIT 1");
            VitalSignData data = vitalSignDataMapper.selectOne(wrapper);
            if (data != null) {
                vitals.put(getMetricCode(type), data);
            }
        }
        return vitals;
    }

    @Override
    public void generateMockData(Long elderId, Integer days) {
        elderReferenceService.requireActive(elderId);
        if (days == null) days = 30;
        ThreadLocalRandom random = ThreadLocalRandom.current();
        LocalDateTime now = LocalDateTime.now();

        for (int d = days; d >= 0; d--) {
            LocalDateTime measureTime = now.minusDays(d).withHour(8).withMinute(0);

            // 收缩压 (正常110-140, 偶尔异常)
            insertMockVital(elderId, 1, randomValue(random, 115, 150), "mmHg", measureTime, 140);
            // 舒张压 (正常60-90)
            insertMockVital(elderId, 2, randomValue(random, 65, 95), "mmHg", measureTime, 90);
            // 心率 (正常60-100)
            insertMockVital(elderId, 3, randomValue(random, 62, 98), "bpm", measureTime, 100);
            // 空腹血糖 (正常3.9-6.1)
            insertMockVital(elderId, 4, randomDecimal(random, 4.0, 8.5), "mmol/L", measureTime, 7.0);
            // 血氧 (正常95-100)
            insertMockVital(elderId, 6, randomValue(random, 94, 100), "%", measureTime, 0);
            // 体温 (正常36.0-37.3)
            insertMockVital(elderId, 7, randomDecimal(random, 36.0, 37.5), "°C", measureTime, 37.3);
        }
    }

    @Override
    public void generateAbnormalMockData(Long elderId, Integer dataType) {
        elderReferenceService.requireActive(elderId);
        ThreadLocalRandom random = ThreadLocalRandom.current();
        LocalDateTime now = LocalDateTime.now();

        if (dataType != null) {
            // 生成指定类型的异常数据
            generateAbnormalByType(elderId, dataType, random, now);
        } else {
            // 生成多种类型的异常数据
            generateAbnormalByType(elderId, 1, random, now); // 收缩压异常
            generateAbnormalByType(elderId, 3, random, now); // 心率异常
            generateAbnormalByType(elderId, 4, random, now); // 血糖异常
            generateAbnormalByType(elderId, 7, random, now); // 体温异常
        }
    }

    private void generateAbnormalByType(Long elderId, int dataType, ThreadLocalRandom random, LocalDateTime now) {
        VitalSignData data = new VitalSignData();
        data.setElderId(elderId);
        data.setMeasureTime(now);
        data.setCreateTime(now);

        switch (dataType) {
            case 1: // 收缩压异常（>180mmHg）
                data.setDataType(1);
                data.setDataValue(BigDecimal.valueOf(random.nextDouble(185, 220)));
                data.setUnit("mmHg");
                data.setIsAbnormal(1);
                break;
            case 2: // 舒张压异常（>110mmHg）
                data.setDataType(2);
                data.setDataValue(BigDecimal.valueOf(random.nextDouble(115, 140)));
                data.setUnit("mmHg");
                data.setIsAbnormal(1);
                break;
            case 3: // 心率异常（>120bpm 或 <50bpm）
                data.setDataType(3);
                data.setDataValue(BigDecimal.valueOf(random.nextDouble(125, 160)));
                data.setUnit("bpm");
                data.setIsAbnormal(1);
                break;
            case 4: // 空腹血糖异常（>11.1mmol/L）
                data.setDataType(4);
                data.setDataValue(BigDecimal.valueOf(random.nextDouble(11.5, 16.0)));
                data.setUnit("mmol/L");
                data.setIsAbnormal(1);
                break;
            case 6: // 血氧过低（<90%）
                data.setDataType(6);
                data.setDataValue(BigDecimal.valueOf(random.nextDouble(80, 89)));
                data.setUnit("%");
                data.setIsAbnormal(1);
                break;
            case 7: // 体温异常（>39℃）
                data.setDataType(7);
                data.setDataValue(BigDecimal.valueOf(random.nextDouble(39.0, 41.0)));
                data.setUnit("°C");
                data.setIsAbnormal(1);
                break;
            default:
                return;
        }

        vitalSignDataMapper.insert(data);

        // 构建体征Map供规则引擎评估
        Map<String, BigDecimal> vitalMap = new HashMap<>();
        vitalMap.put(getMetricCode(dataType), data.getDataValue());
        if (elderId != null) {
            warningRuleService.evaluateVitalSigns(elderId, vitalMap);
        }
    }

    private void insertMockVital(Long elderId, int dataType, BigDecimal value, String unit, LocalDateTime measureTime, double abnormalThreshold) {
        VitalSignData data = new VitalSignData();
        data.setElderId(elderId);
        data.setDataType(dataType);
        data.setDataValue(value);
        data.setUnit(unit);
        data.setMeasureTime(measureTime);
        data.setIsAbnormal(abnormalThreshold > 0 && value.doubleValue() > abnormalThreshold ? 1 : 0);
        data.setCreateTime(measureTime);
        vitalSignDataMapper.insert(data);
    }

    private BigDecimal randomValue(ThreadLocalRandom random, int min, int max) {
        return BigDecimal.valueOf(random.nextInt(min, max + 1));
    }

    private BigDecimal randomDecimal(ThreadLocalRandom random, double min, double max) {
        double val = min + (max - min) * random.nextDouble();
        return BigDecimal.valueOf(Math.round(val * 10.0) / 10.0);
    }

    private String getMetricCode(Integer dataType) {
        if (dataType == null) return null;
        switch (dataType) {
            case 1: return "systolic";
            case 2: return "diastolic";
            case 3: return "heartRate";
            case 4: return "bloodSugarFasting";
            case 5: return "bloodSugarPostprandial";
            case 6: return "spo2";
            case 7: return "temperature";
            case 8: return "steps";
            case 9: return "sleep";
            default: return null;
        }
    }
}
