package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.medical.entity.VitalSignData;
import com.medical.entity.WearableDevice;
import com.medical.mapper.VitalSignDataMapper;
import com.medical.mapper.WearableDeviceMapper;
import com.medical.service.VitalSignService;
import com.medical.service.WarningRuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    @Override
    public WearableDevice bindDevice(WearableDevice device) {
        device.setBindStatus(1);
        device.setBindTime(LocalDateTime.now());
        device.setCreateTime(LocalDateTime.now());
        wearableDeviceMapper.insert(device);
        return device;
    }

    @Override
    public void unbindDevice(Long id) {
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

        Long elderId = dataList.get(0).getElderId();
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
