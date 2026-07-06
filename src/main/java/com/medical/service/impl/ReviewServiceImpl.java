package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.NursingPlan;
import com.medical.entity.NursingRecord;
import com.medical.mapper.NursingPlanMapper;
import com.medical.mapper.NursingRecordMapper;
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

    @Override
    public Page<NursingRecord> listPendingRecords(Integer pageNum, Integer pageSize) {
        Page<NursingRecord> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<NursingRecord> wrapper = new LambdaQueryWrapper<NursingRecord>()
                .eq(NursingRecord::getReportStatus, 1)
                .eq(NursingRecord::getDeleted, 0)
                .orderByDesc(NursingRecord::getRecordDate)
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
        if (record.getReportStatus() == null || record.getReportStatus() != 1) {
            throw new BusinessException(400, "该记录无需审核或已被处理");
        }
        // action: 1=通过(已处理)  2=驳回(退回)
        if (action == 1) {
            record.setReportStatus(2);  // 已处理
            record.setDoctorReview(2);
        } else if (action == 2) {
            record.setReportStatus(0);  // 退回未上报状态
            record.setDoctorReview(1);
        } else {
            throw new BusinessException(400, "审核操作类型不正确");
        }
        record.setReviewDoctorId(doctorId);
        record.setReviewComment(comment);
        record.setReviewTime(LocalDateTime.now());
        nursingRecordMapper.updateById(record);
    }

    @Override
    public Page<NursingPlan> listPendingPlans(Integer pageNum, Integer pageSize) {
        Page<NursingPlan> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<NursingPlan> wrapper = new LambdaQueryWrapper<NursingPlan>()
                .eq(NursingPlan::getDoctorApproval, 0)
                .in(NursingPlan::getStatus, 0, 1)
                .eq(NursingPlan::getDeleted, 0)
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
    }

    @Override
    public Map<String, Object> getReviewStats() {
        Map<String, Object> stats = new HashMap<>();

        long pendingRecords = nursingRecordMapper.selectCount(
                new LambdaQueryWrapper<NursingRecord>()
                        .eq(NursingRecord::getReportStatus, 1)
                        .eq(NursingRecord::getDeleted, 0));
        stats.put("pendingRecords", pendingRecords);

        long pendingPlans = nursingPlanMapper.selectCount(
                new LambdaQueryWrapper<NursingPlan>()
                        .eq(NursingPlan::getDoctorApproval, 0)
                        .in(NursingPlan::getStatus, 0, 1)
                        .eq(NursingPlan::getDeleted, 0));
        stats.put("pendingPlans", pendingPlans);

        long reviewedRecords = nursingRecordMapper.selectCount(
                new LambdaQueryWrapper<NursingRecord>()
                        .eq(NursingRecord::getDoctorReview, 2)
                        .eq(NursingRecord::getDeleted, 0));
        stats.put("reviewedRecords", reviewedRecords);

        long approvedPlans = nursingPlanMapper.selectCount(
                new LambdaQueryWrapper<NursingPlan>()
                        .eq(NursingPlan::getDoctorApproval, 1)
                        .eq(NursingPlan::getDeleted, 0));
        stats.put("approvedPlans", approvedPlans);

        return stats;
    }
}
