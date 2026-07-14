package com.medical.controller;

import com.medical.common.annotation.RequireRole;
import com.medical.common.annotation.OperationLog;
import com.medical.common.exception.BusinessException;
import com.medical.common.result.R;
import com.medical.entity.ElderInfo;
import com.medical.entity.HealthRecord;
import com.medical.dto.ElderOnboardRequest;
import com.medical.dto.ElderOnboardResult;
import com.medical.dto.ElderExportRow;
import com.medical.service.ElderService;
import com.medical.service.ElderOnboardingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.util.List;

/**
 * 老人健康档案控制器
 */
@RestController
@RequestMapping("/api/elders")
@RequireRole({1, 2, 3})
public class ElderController {

    @Autowired
    private ElderService elderService;

    @Autowired
    private ElderOnboardingService elderOnboardingService;

    @GetMapping
    public R<?> list(@RequestParam(defaultValue = "1") Integer pageNum,
                     @RequestParam(defaultValue = "10") Integer pageSize,
                     @RequestParam(required = false) Long elderId,
                     @RequestParam(required = false) String name,
                     @RequestParam(required = false) String community,
                     @RequestParam(required = false) Long doctorId,
                     @RequestParam(required = false) Integer diseaseType,
                     HttpServletRequest request) {
        return R.ok(elderService.listElders(pageNum, pageSize, elderId, name, community,
                scopedDoctorId(request, doctorId), diseaseType));
    }

    @GetMapping("/options/doctors")
    public R<?> doctorOptions() {
        return R.ok(elderService.listActiveDoctorOptions());
    }

    @RequireRole({2})
    @PostMapping("/onboard")
    @OperationLog(module = "老人档案", type = "统一建档", desc = "创建老人及健康管理全流程")
    public R<ElderOnboardResult> onboard(@Valid @RequestBody ElderOnboardRequest request,
                                         HttpServletRequest httpRequest) {
        return R.ok("统一建档成功", elderOnboardingService.onboard(
                request,
                (Long) httpRequest.getAttribute("currentUserId"),
                (Integer) httpRequest.getAttribute("currentUserType")));
    }

    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id, HttpServletRequest request) {
        return R.ok(requireElderAccess(id, request));
    }

    @RequireRole({2})
    @PostMapping
    @OperationLog(module = "老人档案", type = "新增", desc = "新增老人信息")
    public R<?> create(@Valid @RequestBody ElderInfo elderInfo, HttpServletRequest request) {
        if (isDoctor(request)) {
            elderInfo.setDoctorId(currentUserId(request));
        }
        return R.ok("新增成功", elderService.create(elderInfo));
    }

    @RequireRole({2})
    @PutMapping("/{id}")
    @OperationLog(module = "老人档案", type = "修改", desc = "修改老人信息")
    public R<?> update(@PathVariable Long id,
                       @Valid @RequestBody ElderInfo elderInfo,
                       HttpServletRequest request) {
        requireElderAccess(id, request);
        if (isDoctor(request)) {
            elderInfo.setDoctorId(currentUserId(request));
        }
        elderService.update(id, elderInfo);
        return R.ok("修改成功");
    }

    @RequireRole({2})
    @DeleteMapping("/{id}")
    @OperationLog(module = "老人档案", type = "删除", desc = "删除老人信息")
    public R<?> delete(@PathVariable Long id, HttpServletRequest request) {
        requireElderAccess(id, request);
        elderService.delete(id);
        return R.ok("删除成功");
    }

    @GetMapping("/{id}/record")
    public R<?> getRecord(@PathVariable Long id, HttpServletRequest request) {
        requireElderAccess(id, request);
        return R.ok(elderService.getHealthRecord(id));
    }

    @RequireRole({2})
    @PostMapping("/{id}/record")
    public R<?> saveRecord(@PathVariable Long id,
                           @RequestBody HealthRecord record,
                           HttpServletRequest request) {
        requireElderAccess(id, request);
        elderService.saveHealthRecord(id, record);
        return R.ok("保存成功");
    }

    @GetMapping("/stats")
    public R<?> stats(HttpServletRequest request) {
        return R.ok(elderService.getStats());
    }

    @GetMapping("/export")
    @OperationLog(module = "老人档案", type = "导出", desc = "导出Excel")
    public void export(@RequestParam(required = false) Long elderId,
                       @RequestParam(required = false) String name,
                       @RequestParam(required = false) String community,
                       @RequestParam(required = false) Long doctorId,
                       @RequestParam(required = false) Integer diseaseType,
                       HttpServletRequest request,
                       HttpServletResponse response) throws Exception {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment;filename=elders.xlsx");
        List<ElderExportRow> list = elderService.listElders(1, 10000, elderId, name, community,
                        scopedDoctorId(request, doctorId), diseaseType)
                .getRecords().stream()
                .map(elder -> ElderExportRow.from(elder, elderService.getHealthRecord(elder.getId())))
                .toList();
        com.alibaba.excel.EasyExcel.write(response.getOutputStream(), ElderExportRow.class).sheet("老人完整档案").doWrite(list);
    }

    private Long scopedDoctorId(HttpServletRequest request, Long requestedDoctorId) {
        return isDoctor(request) ? currentUserId(request) : requestedDoctorId;
    }

    private ElderInfo requireElderAccess(Long elderId, HttpServletRequest request) {
        ElderInfo elder = elderService.getDetail(elderId);
        if (isDoctor(request) && !currentUserId(request).equals(elder.getDoctorId())) {
            throw new BusinessException(403, "该老人不属于当前责任医生");
        }
        return elder;
    }

    private boolean isDoctor(HttpServletRequest request) {
        return Integer.valueOf(2).equals(request.getAttribute("currentUserType"));
    }

    private Long currentUserId(HttpServletRequest request) {
        Object userId = request.getAttribute("currentUserId");
        if (userId == null) {
            throw new BusinessException(401, "未获取到当前登录用户");
        }
        return Long.valueOf(userId.toString());
    }
}
