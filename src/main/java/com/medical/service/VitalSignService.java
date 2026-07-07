package com.medical.service;

import com.medical.entity.VitalSignData;
import com.medical.entity.WearableDevice;

import java.util.List;
import java.util.Map;

/**
 * 体征数据服务接口
 */
public interface VitalSignService {

    WearableDevice bindDevice(WearableDevice device);

    void unbindDevice(Long id);

    List<WearableDevice> listDevices(Long elderId);

    void uploadData(List<VitalSignData> dataList);

    List<VitalSignData> getTrendData(Long elderId, Integer dataType, String startDate, String endDate);

    Map<String, Object> getLatestVitals(Long elderId);

    void generateMockData(Long elderId, Integer days);

    /**
     * 生成模拟异常体征数据（用于测试预警系统）
     * @param elderId 老人ID
     * @param dataType 数据类型（可选，不传则生成多种异常数据）
     */
    void generateAbnormalMockData(Long elderId, Integer dataType);
}
