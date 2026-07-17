package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.NursingPlan;
import com.medical.entity.NursingRecord;
import com.medical.mapper.NursingPlanMapper;
import com.medical.mapper.NursingRecordMapper;
import com.medical.message.service.MessageService;
import com.medical.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class ReviewServiceImpl implements ReviewService {

    @Autowired
    private NursingRecordMapper nursingRecordMapper;

    @Autowired
    private NursingPlanMapper nursingPlanMapper;

    @Autowired(required = false)
    private MessageService messageService;

    @Override
    public Page<NursingRecord> listPendingRecords(Integer pageNum, Integer pageSize, Long doctorId) {
        Page<NursingRecord> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<NursingRecord> wrapper = new LambdaQueryWrapper<NursingRecord>()
                .eq(NursingRecord::getDeleted, 0)
                .eq(doctorId != null, NursingRecord::getDoctorId, doctorId)
                .orderByDesc(NursingRecord::getRecordDate)
                .orderByDesc(NursingRecord::getCreateTime);
        applyPendingRecordReviewFilter(wrapper);
        return nursingRecordMapper.selectPage(page, wrapper);
    }

    @Override
    public Page<NursingRecord> listReviewedRecords(Integer pageNum, Integer pageSize, Long doctorId) {
        Page<NursingRecord> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<NursingRecord> wrapper = new LambdaQueryWrapper<NursingRecord>()
                .in(NursingRecord::getDoctorReview, 1, 2)
                .eq(NursingRecord::getDeleted, 0)
                .eq(doctorId != null, NursingRecord::getDoctorId, doctorId)
                .orderByDesc(NursingRecord::getReviewTime)
                .orderByDesc(NursingRecord::getCreateTime);
        return nursingRecordMapper.selectPage(page, wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void reviewRecord(Long id, Long doctorId, String comment, Integer action) {
        NursingRecord record = nursingRecordMapper.selectById(id);
        if (record == null || (record.getDeleted() != null && record.getDeleted() == 1)) {
            throw new BusinessException(404, "护理记录不存在");
        }
        if (record.getDoctorReview() != null && record.getDoctorReview() != 0) {
            throw new BusinessException(400, "该记录无需审核或已被处理");
        }
        if (record.getDoctorId() == null) {
            throw new BusinessException(400, "该护理记录尚未分配目标医生");
        }
        if (!record.getDoctorId().equals(doctorId)) {
            throw new BusinessException(403, "只能审核分配给当前医生的护理记录");
        }
        // action: 1=通过(已处理)  2=驳回(退回)
        boolean hasAbnormalReport = Integer.valueOf(1).equals(record.getReportStatus());
        if (action == 1) {
            record.setReportStatus(2);  // 已处理
            record.setDoctorReview(2);
        } else if (action == 2) {
            record.setReportStatus(0);  // 退回未上报状态
            record.setDoctorReview(1);
        } else {
            throw new BusinessException(400, "审核操作类型不正确");
        }
        if (!hasAbnormalReport) {
            record.setReportStatus(0);
        }
        record.setReviewDoctorId(doctorId);
        record.setReviewComment(comment);
        record.setReviewTime(LocalDateTime.now());
        nursingRecordMapper.updateById(record);
        notifyNurse(record.getNurseId(),
                action == 1 ? "护理记录审核通过" : "护理记录已退回",
                action == 1 ? "医生已处理你上报的护理记录。" : "医生已退回护理记录，请根据审核意见修改后重新上报。",
                action == 1 ? 1 : 2,
                "/nurse-records");
    }

    @Override
    public Page<NursingPlan> listPendingPlans(Integer pageNum, Integer pageSize, Long doctorId) {
        Page<NursingPlan> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<NursingPlan> wrapper = new LambdaQueryWrapper<NursingPlan>()
                .eq(NursingPlan::getDoctorApproval, 0)
                .in(NursingPlan::getStatus, 0, 1)
                .eq(NursingPlan::getDeleted, 0)
                .eq(doctorId != null, NursingPlan::getDoctorId, doctorId)
                .orderByDesc(NursingPlan::getCreateTime);
        return nursingPlanMapper.selectPage(page, wrapper);
    }

    @Override
    public Page<NursingPlan> listReviewedPlans(Integer pageNum, Integer pageSize, Long doctorId) {
        Page<NursingPlan> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<NursingPlan> wrapper = new LambdaQueryWrapper<NursingPlan>()
                .in(NursingPlan::getDoctorApproval, 1, 2)
                .eq(NursingPlan::getDeleted, 0)
                .eq(doctorId != null, NursingPlan::getDoctorId, doctorId)
                .orderByDesc(NursingPlan::getUpdateTime)
                .orderByDesc(NursingPlan::getCreateTime);
        return nursingPlanMapper.selectPage(page, wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void reviewPlan(Long id, Long doctorId, Integer action) {
        NursingPlan plan = nursingPlanMapper.selectById(id);
        if (plan == null || (plan.getDeleted() != null && plan.getDeleted() == 1)) {
            throw new BusinessException(404, "护理计划不存在");
        }
        if (plan.getDoctorApproval() == null || plan.getDoctorApproval() != 0) {
            throw new BusinessException(400, "该计划已被审核");
        }
        if (plan.getDoctorId() == null) {
            throw new BusinessException(400, "该护理计划尚未分配目标医生");
        }
        if (!plan.getDoctorId().equals(doctorId)) {
            throw new BusinessException(403, "只能审核分配给当前医生的护理计划");
        }
        // action: 1=通过  2=驳回
        if (action == 1) {
            plan.setDoctorApproval(1);
            // 如果计划还是待执行状态，自动开始执行
            if (plan.getStatus() == null || plan.getStatus() == 0) {
                plan.setStatus(1);
            }
        } else if (action == 2) {
            plan.setDoctorApproval(2);
            plan.setStatus(3); // 驳回后终止
        } else {
            throw new BusinessException(400, "审核操作类型不正确");
        }
        nursingPlanMapper.updateById(plan);
        notifyNurse(plan.getNurseId(),
                action == 1 ? "护理计划审核通过" : "护理计划审核未通过",
                action == 1 ? "医生已通过护理计划，可以按计划执行。" : "医生未通过护理计划，请调整后重新提交。",
                action == 1 ? 1 : 2,
                "/nurse-plans");
    }

    private void notifyNurse(Long nurseId, String title, String content, int priority, String actionUrl) {
        if (messageService == null || nurseId == null) {
            return;
        }
        try {
            messageService.sendSystemNotification(nurseId, title, content, 3, priority, actionUrl);
        } catch (Exception ignored) {
            // 协同通知失败不能回滚审核业务。
        }
    }

    @Override
    public Map<String, Object> getReviewStats(Long doctorId) {
        Map<String, Object> stats = new HashMap<>();

        long pendingRecords = nursingRecordMapper.selectCount(
                pendingRecordQuery(doctorId));
        stats.put("pendingRecords", pendingRecords);

        long pendingPlans = nursingPlanMapper.selectCount(
                new LambdaQueryWrapper<NursingPlan>()
                        .eq(NursingPlan::getDoctorApproval, 0)
                        .in(NursingPlan::getStatus, 0, 1)
                        .eq(doctorId != null, NursingPlan::getDoctorId, doctorId)
                        .eq(NursingPlan::getDeleted, 0));
        stats.put("pendingPlans", pendingPlans);

        long reviewedRecords = nursingRecordMapper.selectCount(
                new LambdaQueryWrapper<NursingRecord>()
                        .in(NursingRecord::getDoctorReview, 1, 2)
                        .eq(doctorId != null, NursingRecord::getDoctorId, doctorId)
                        .eq(NursingRecord::getDeleted, 0));
        stats.put("reviewedRecords", reviewedRecords);

        long reviewedPlans = nursingPlanMapper.selectCount(
                new LambdaQueryWrapper<NursingPlan>()
                        .in(NursingPlan::getDoctorApproval, 1, 2)
                        .eq(doctorId != null, NursingPlan::getDoctorId, doctorId)
                        .eq(NursingPlan::getDeleted, 0));
        stats.put("reviewedPlans", reviewedPlans);

        long approvedPlans = nursingPlanMapper.selectCount(
                new LambdaQueryWrapper<NursingPlan>()
                        .eq(NursingPlan::getDoctorApproval, 1)
                        .eq(doctorId != null, NursingPlan::getDoctorId, doctorId)
                        .eq(NursingPlan::getDeleted, 0));
        stats.put("approvedPlans", approvedPlans);

        return stats;
    }

    private LambdaQueryWrapper<NursingRecord> pendingRecordQuery(Long doctorId) {
        LambdaQueryWrapper<NursingRecord> wrapper = new LambdaQueryWrapper<NursingRecord>()
                .eq(NursingRecord::getDeleted, 0)
                .eq(doctorId != null, NursingRecord::getDoctorId, doctorId);
        applyPendingRecordReviewFilter(wrapper);
        return wrapper;
    }

    private void applyPendingRecordReviewFilter(LambdaQueryWrapper<NursingRecord> wrapper) {
        wrapper.and(condition -> condition
                .eq(NursingRecord::getDoctorReview, 0)
                .or()
                .isNull(NursingRecord::getDoctorReview));
    }
}
