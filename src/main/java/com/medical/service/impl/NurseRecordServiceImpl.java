package com.medical.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.ElderInfo;
import com.medical.entity.NursingRecord;
import com.medical.entity.TimelineEvent;
import com.medical.mapper.NursingRecordMapper;
import com.medical.message.service.MessageService;
import com.medical.service.ElderReferenceService;
import com.medical.service.NurseRecordService;
import com.medical.service.TimelineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Service
public class NurseRecordServiceImpl implements NurseRecordService {

    @Autowired
    private NursingRecordMapper nursingRecordMapper;

    @Autowired
    private TimelineService timelineService;

    @Autowired
    private ElderReferenceService elderReferenceService;

    @Autowired(required = false)
    private MessageService messageService;

    @Override
    public Page<NursingRecord> list(Integer pageNum, Integer pageSize, Long elderId, Long nurseId,
                                     Integer recordType, Integer reportStatus, String startDate, String endDate,
                                     Long currentUserId, Integer currentUserType) {
        Page<NursingRecord> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<NursingRecord> wrapper = new LambdaQueryWrapper<>();

        wrapper.eq(NursingRecord::getDeleted, 0);
        if (elderId != null) {
            wrapper.eq(NursingRecord::getElderId, elderId);
        }
        if (!Integer.valueOf(3).equals(currentUserType) && nurseId != null) {
            wrapper.eq(NursingRecord::getNurseId, nurseId);
        }
        if (recordType != null) {
            wrapper.eq(NursingRecord::getRecordType, recordType);
        }
        if (reportStatus != null) {
            wrapper.eq(NursingRecord::getReportStatus, reportStatus);
        }
        if (StringUtils.hasText(startDate)) {
            wrapper.ge(NursingRecord::getRecordDate, LocalDate.parse(startDate).atStartOfDay());
        }
        if (StringUtils.hasText(endDate)) {
            wrapper.le(NursingRecord::getRecordDate, LocalDate.parse(endDate).atTime(LocalTime.MAX));
        }
        applyReadScope(wrapper, currentUserId, currentUserType);

        wrapper.orderByDesc(NursingRecord::getRecordDate)
               .orderByDesc(NursingRecord::getCreateTime);
        return nursingRecordMapper.selectPage(page, wrapper);
    }

    @Override
    public NursingRecord getById(Long id, Long currentUserId, Integer currentUserType) {
        NursingRecord record = requireExisting(id);
        requireReadAccess(record, currentUserId, currentUserType);
        return record;
    }

    private NursingRecord requireExisting(Long id) {
        NursingRecord record = nursingRecordMapper.selectById(id);
        if (record == null || (record.getDeleted() != null && record.getDeleted() == 1)) {
            throw new BusinessException(404, "护理记录不存在");
        }
        return record;
    }

    @Override
    public Long create(NursingRecord record) {
        validateRequired(record);
        ElderInfo elder = elderReferenceService.requireActive(record.getElderId());
        requireAssignedElder(elder, record.getNurseId());
        record.setDoctorId(requireResponsibleDoctor(elder, "创建护理记录"));
        record.setDeleted(0);
        record.setReportStatus(0);
        record.setDoctorReview(0);
        record.setReviewDoctorId(null);
        record.setReviewComment(null);
        record.setReviewTime(null);
        if (record.getIsAbnormal() == null) {
            record.setIsAbnormal(0);
        }
        if (record.getRecordDate() == null) {
            record.setRecordDate(LocalDateTime.now());
        }
        nursingRecordMapper.insert(record);
        addNursingRecordTimeline(record);
        notifyUser(record.getDoctorId(), "护理记录待审核",
                "护士提交了一条护理记录，请及时查看并完成审核。", 2, "/nurse-review");
        return record.getId();
    }

    @Override
    public void update(Long id, NursingRecord record, Long currentNurseId) {
        NursingRecord existing = requireExisting(id);
        requireNurseOwner(existing.getNurseId(), currentNurseId);
        if (record == null) {
            throw new BusinessException(400, "护理记录不能为空");
        }
        Long elderId = record.getElderId() != null ? record.getElderId() : existing.getElderId();
        ElderInfo elder = elderReferenceService.requireActive(elderId);
        requireAssignedElder(elder, currentNurseId);
        // 已上报的记录不能修改
        if (existing.getReportStatus() != null && existing.getReportStatus() == 1) {
            throw new BusinessException(400, "已上报的记录不能修改");
        }
        BeanUtil.copyProperties(record, existing, CopyOptions.create()
                .ignoreNullValue()
                .setIgnoreProperties("id", "nurseId", "createTime", "updateTime", "deleted",
                        "doctorId", "reportStatus", "doctorReview", "reviewDoctorId", "reviewComment", "reviewTime"));
        existing.setDoctorId(requireResponsibleDoctor(elder, "更新护理记录"));
        if (record.getIsAbnormal() != null && record.getIsAbnormal() == 1) {
            existing.setIsAbnormal(1);
            existing.setAbnormalDesc(record.getAbnormalDesc());
        }
        nursingRecordMapper.updateById(existing);
        addNursingRecordTimeline(existing);
    }

    @Override
    public void delete(Long id, Long currentNurseId) {
        if (id == null || id <= 0) {
            throw new BusinessException(400, "护理记录ID不正确");
        }
        NursingRecord record = requireExisting(id);
        requireNurseOwner(record.getNurseId(), currentNurseId);
        int rows = nursingRecordMapper.deleteById(record.getId());
        if (rows <= 0) {
            throw new BusinessException(500, "护理记录删除失败");
        }
    }

    @Override
    public void reportAbnormal(Long id, String abnormalDesc, Long currentNurseId) {
        NursingRecord record = requireExisting(id);
        requireNurseOwner(record.getNurseId(), currentNurseId);
        ElderInfo elder = elderReferenceService.requireActive(record.getElderId());
        requireAssignedElder(elder, currentNurseId);
        record.setDoctorId(requireResponsibleDoctor(elder, "上报护理记录"));
        record.setIsAbnormal(1);
        record.setAbnormalDesc(abnormalDesc);
        record.setReportStatus(1);
        nursingRecordMapper.updateById(record);
        notifyUser(record.getDoctorId(), "收到护理异常上报",
                "护士上报了一条异常护理记录，请及时查看并完成审核。", 3, "/nurse-review");
    }

    private void notifyUser(Long userId, String title, String content, int priority, String actionUrl) {
        if (messageService == null || userId == null) {
            return;
        }
        try {
            messageService.sendSystemNotification(userId, title, content, 3, priority, actionUrl);
        } catch (Exception ignored) {
            // 协同通知失败不能回滚护理记录业务。
        }
    }

    @Override
    public Map<String, Object> getStats(Long currentUserId, Integer currentUserType) {
        Map<String, Object> stats = new HashMap<>();
        LambdaQueryWrapper<NursingRecord> baseQ = new LambdaQueryWrapper<NursingRecord>()
                .eq(NursingRecord::getDeleted, 0);
        applyReadScope(baseQ, currentUserId, currentUserType);

        stats.put("total", nursingRecordMapper.selectCount(baseQ));

        // 各类型数量
        for (int type = 1; type <= 5; type++) {
            int finalType = type;
            long count = nursingRecordMapper.selectCount(baseQ.clone()
                    .eq(NursingRecord::getRecordType, finalType));
            String key;
            switch (type) {
                case 1: key = "basicCare"; break;
                case 2: key = "specialistCare"; break;
                case 3: key = "dailyCare"; break;
                case 4: key = "psychCare"; break;
                case 5: key = "rehabCare"; break;
                default: key = "type" + type;
            }
            stats.put(key, count);
        }

        // 异常上报统计
        stats.put("abnormal", nursingRecordMapper.selectCount(baseQ.clone()
                .eq(NursingRecord::getIsAbnormal, 1)));
        stats.put("reported", nursingRecordMapper.selectCount(baseQ.clone()
                .eq(NursingRecord::getReportStatus, 1)));
        stats.put("pendingReport", nursingRecordMapper.selectCount(baseQ.clone()
                .eq(NursingRecord::getIsAbnormal, 1).eq(NursingRecord::getReportStatus, 0)));

        // 今日记录数
        LocalDate today = LocalDate.now();
        stats.put("todayCount", nursingRecordMapper.selectCount(baseQ.clone()
                .ge(NursingRecord::getCreateTime, today.atStartOfDay())
                .le(NursingRecord::getCreateTime, today.atTime(LocalTime.MAX))));

        return stats;
    }

    private void applyReadScope(LambdaQueryWrapper<NursingRecord> wrapper,
                                Long currentUserId,
                                Integer currentUserType) {
        requireSupportedRole(currentUserId, currentUserType);
        if (Integer.valueOf(2).equals(currentUserType)) {
            wrapper.eq(NursingRecord::getDoctorId, currentUserId);
        } else if (Integer.valueOf(3).equals(currentUserType)) {
            wrapper.eq(NursingRecord::getNurseId, currentUserId);
        }
    }

    private void requireReadAccess(NursingRecord record, Long currentUserId, Integer currentUserType) {
        requireSupportedRole(currentUserId, currentUserType);
        if (Integer.valueOf(1).equals(currentUserType)) {
            return;
        }
        boolean allowed = Integer.valueOf(2).equals(currentUserType)
                ? Objects.equals(record.getDoctorId(), currentUserId)
                : Objects.equals(record.getNurseId(), currentUserId);
        if (!allowed) {
            throw new BusinessException(403, "无权访问该护理记录");
        }
    }

    private void requireSupportedRole(Long currentUserId, Integer currentUserType) {
        if (currentUserId == null || currentUserId <= 0
                || currentUserType == null || currentUserType < 1 || currentUserType > 3) {
            throw new BusinessException(401, "登录状态无效");
        }
    }

    private void requireNurseOwner(Long ownerNurseId, Long currentNurseId) {
        if (currentNurseId == null || currentNurseId <= 0
                || !Objects.equals(ownerNurseId, currentNurseId)) {
            throw new BusinessException(403, "只能操作当前护士本人创建的护理记录");
        }
    }

    private void requireAssignedElder(ElderInfo elder, Long nurseId) {
        if (!Objects.equals(elder.getNurseId(), nurseId)) {
            throw new BusinessException(403, "只能为明确分配给当前护士的老人创建或修改护理记录");
        }
    }

    private void validateRequired(NursingRecord record) {
        if (record == null) {
            throw new BusinessException(400, "护理记录不能为空");
        }
        if (record.getElderId() == null) {
            throw new BusinessException(400, "老人ID不能为空");
        }
        if (record.getElderId() <= 0) {
            throw new BusinessException(400, "老人ID必须为正整数");
        }
        if (record.getNurseId() == null) {
            throw new BusinessException(400, "护士ID不能为空");
        }
        if (record.getNurseId() <= 0) {
            throw new BusinessException(400, "护士ID必须为正整数");
        }
        if (record.getRecordType() == null) {
            throw new BusinessException(400, "记录类型不能为空");
        }
        if (!StringUtils.hasText(record.getRecordTitle())) {
            throw new BusinessException(400, "记录标题不能为空");
        }
    }

    private Long requireResponsibleDoctor(ElderInfo elder, String action) {
        if (elder.getDoctorId() == null) {
            throw new BusinessException(400, "该老人尚未分配责任医生，不能" + action);
        }
        elderReferenceService.requireActiveDoctor(elder.getDoctorId());
        return elder.getDoctorId();
    }

    private void addNursingRecordTimeline(NursingRecord record) {
        TimelineEvent event = new TimelineEvent();
        event.setElderId(record.getElderId());
        event.setDoctorId(record.getDoctorId());
        event.setEventType(5);
        event.setEventTitle("护理记录：" + record.getRecordTitle());
        event.setEventContent((record.getRecordContent() == null ? "" : record.getRecordContent())
                + (record.getIsAbnormal() != null && record.getIsAbnormal() == 1
                ? "；异常：" + (record.getAbnormalDesc() == null ? "-" : record.getAbnormalDesc())
                : ""));
        event.setSourceType("nursing_record");
        event.setSourceId(record.getId());
        event.setEventTime(record.getRecordDate());
        timelineService.addEvent(event);
    }
}
