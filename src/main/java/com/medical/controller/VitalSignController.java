package com.medical.controller;

import com.medical.common.annotation.OperationLog;
import com.medical.common.annotation.RequireRole;
import com.medical.common.result.R;
import com.medical.entity.VitalSignData;
import com.medical.entity.WearableDevice;
import com.medical.service.VitalSignService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 体征监测与设备管理控制器
 */
@RestController
@RequestMapping("/api/vitals")
@RequireRole({1, 2, 3})
public class VitalSignController {

    @Autowired
    private VitalSignService vitalSignService;

    // ========== 设备管理 ==========

    @GetMapping("/devices/{elderId}")
    public R<?> listDevices(@PathVariable Long elderId) {
        return R.ok(vitalSignService.listDevices(elderId));
    }

    @PostMapping("/devices")
    @OperationLog(module = "体征监测", type = "绑定", desc = "绑定设备")
    @RequireRole({2, 3})
    public R<?> bindDevice(@RequestBody WearableDevice device) {
        return R.ok("绑定成功", vitalSignService.bindDevice(device));
    }

    @PutMapping("/devices/{id}/unbind")
    @OperationLog(module = "体征监测", type = "解绑", desc = "解绑设备")
    @RequireRole({2, 3})
    public R<?> unbindDevice(@PathVariable Long id) {
        vitalSignService.unbindDevice(id);
        return R.ok("解绑成功");
    }

    // ========== 数据上传与查询 ==========

    @PostMapping("/upload")
    @RequireRole({2, 3})
    public R<?> uploadData(@RequestBody List<VitalSignData> dataList) {
        vitalSignService.uploadData(dataList);
        return R.ok("上传成功");
    }

    @GetMapping("/trend/{elderId}")
    public R<?> getTrendData(@PathVariable Long elderId,
                             @RequestParam(required = false) Integer dataType,
                             @RequestParam(required = false) String startDate,
                             @RequestParam(required = false) String endDate) {
        return R.ok(vitalSignService.getTrendData(elderId, dataType, startDate, endDate));
    }

    @GetMapping("/latest/{elderId}")
    public R<?> getLatestVitals(@PathVariable Long elderId) {
        return R.ok(vitalSignService.getLatestVitals(elderId));
    }

    // ========== 模拟数据 ==========

    @PostMapping("/mock/{elderId}")
    @RequireRole({1})
    public R<?> generateMockData(@PathVariable Long elderId, @RequestParam(defaultValue = "30") Integer days) {
        vitalSignService.generateMockData(elderId, days);
        return R.ok("已生成" + days + "天模拟数据");
    }

    @PostMapping("/mock/{elderId}/abnormal")
    @OperationLog(module = "体征监测", type = "模拟", desc = "生成模拟异常体征数据（测试预警推送）")
    @RequireRole({1})
    public R<?> generateAbnormalMockData(@PathVariable Long elderId,
                                          @RequestParam(required = false) Integer dataType) {
        vitalSignService.generateAbnormalMockData(elderId, dataType);
        String typeDesc = dataType != null ? getDataTypeText(dataType) : "多种类型";
        return R.ok("已生成" + typeDesc + "异常体征数据，预警系统已触发检测");
    }

    private String getDataTypeText(Integer dataType) {
        if (dataType == null) return "";
        String[] types = {"", "收缩压", "舒张压", "心率", "空腹血糖", "餐后血糖", "血氧", "体温"};
        return dataType >= 1 && dataType < types.length ? types[dataType] : "未知";
    }
}
