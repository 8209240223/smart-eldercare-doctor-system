package com.medical.controller.nurse;

import com.medical.common.annotation.RequireRole;
import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.entity.NursingRecord;
import com.medical.service.NurseRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 护理记录控制器
 */
@RestController
@RequestMapping("/api/nurse/records")
@RequireRole({1, 2, 3})
public class NurseRecordController {

    @Autowired
    private NurseRecordService nurseRecordService;

    @GetMapping
    public R<?> list(@RequestParam(defaultValue = "1") Integer pageNum,
                     @RequestParam(defaultValue = "10") Integer pageSize,
                     @RequestParam(required = false) Long elderId,
                     @RequestParam(required = false) Long nurseId,
                     @RequestParam(required = false) Integer recordType,
                     @RequestParam(required = false) Integer reportStatus,
                     @RequestParam(required = false) String startDate,
                     @RequestParam(required = false) String endDate,
                     @RequestAttribute("currentUserId") Long currentUserId,
                     @RequestAttribute("currentUserType") Integer currentUserType) {
        return R.ok(nurseRecordService.list(pageNum, pageSize, elderId, nurseId,
                recordType, reportStatus, startDate, endDate, currentUserId, currentUserType));
    }

    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id,
                       @RequestAttribute("currentUserId") Long currentUserId,
                       @RequestAttribute("currentUserType") Integer currentUserType) {
        return R.ok(nurseRecordService.getById(id, currentUserId, currentUserType));
    }

    @RequireRole({3})
    @PostMapping
    @OperationLog(module = "护理记录", type = "新增", desc = "新增护理记录")
    public R<?> create(@RequestBody NursingRecord record,
                       @RequestAttribute("currentUserId") Long currentUserId) {
        record.setNurseId(currentUserId);
        return R.ok("新增成功", nurseRecordService.create(record));
    }

    @RequireRole({3})
    @PutMapping("/{id}")
    @OperationLog(module = "护理记录", type = "修改", desc = "修改护理记录")
    public R<?> update(@PathVariable Long id,
                       @RequestBody NursingRecord record,
                       @RequestAttribute("currentUserId") Long currentUserId) {
        nurseRecordService.update(id, record, currentUserId);
        return R.ok("修改成功");
    }

    @RequireRole({3})
    @DeleteMapping("/{id}")
    @OperationLog(module = "护理记录", type = "删除", desc = "删除护理记录")
    public R<?> delete(@PathVariable Long id,
                       @RequestAttribute("currentUserId") Long currentUserId) {
        nurseRecordService.delete(id, currentUserId);
        return R.ok("删除成功");
    }

    @RequireRole({3})
    @PostMapping("/{id}/report")
    @OperationLog(module = "护理记录", type = "上报", desc = "上报异常护理记录")
    public R<?> reportAbnormal(@PathVariable Long id,
                               @RequestBody Map<String, String> body,
                               @RequestAttribute("currentUserId") Long currentUserId) {
        String abnormalDesc = body.getOrDefault("abnormalDesc", "");
        nurseRecordService.reportAbnormal(id, abnormalDesc, currentUserId);
        return R.ok("上报成功，已通知医生处理");
    }

    @GetMapping("/stats")
    public R<?> stats(@RequestAttribute("currentUserId") Long currentUserId,
                      @RequestAttribute("currentUserType") Integer currentUserType) {
        return R.ok(nurseRecordService.getStats(currentUserId, currentUserType));
    }
}
