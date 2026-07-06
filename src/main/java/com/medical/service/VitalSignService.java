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
}
