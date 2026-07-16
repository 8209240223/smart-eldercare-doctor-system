package com.medical.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.NursingPlan;
import com.medical.entity.ElderInfo;
import com.medical.mapper.NursingPlanMapper;
import com.medical.service.ElderReferenceService;
import com.medical.service.NursePlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Service
public class NursePlanServiceImpl implements NursePlanService {

    @Autowired
    private NursingPlanMapper nursingPlanMapper;

    @Autowired
    private ElderReferenceService elderReferenceService;

    @Override
    public Page<NursingPlan> list(Integer pageNum, Integer pageSize, Long elderId, Long nurseId,
                                   Integer planType, Integer status, Long currentUserId,
                                   Integer currentUserType) {
        Page<NursingPlan> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<NursingPlan> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(NursingPlan::getDeleted, 0);
        if (elderId != null) {
            wrapper.eq(NursingPlan::getElderId, elderId);
        }
        if (!Integer.valueOf(3).equals(currentUserType) && nurseId != null) {
            wrapper.eq(NursingPlan::getNurseId, nurseId);
        }
        if (planType != null) {
            wrapper.eq(NursingPlan::getPlanType, planType);
        }
        if (status != null) {
            wrapper.eq(NursingPlan::getStatus, status);
        }
        applyReadScope(wrapper, currentUserId, currentUserType);
        wrapper.orderByDesc(NursingPlan::getStartDate)
               .orderByDesc(NursingPlan::getCreateTime);
        return nursingPlanMapper.selectPage(page, wrapper);
    }

    @Override
    public NursingPlan getById(Long id, Long currentUserId, Integer currentUserType) {
        NursingPlan plan = requireExisting(id);
        requireReadAccess(plan, currentUserId, currentUserType);
        return plan;
    }

    private NursingPlan requireExisting(Long id) {
        NursingPlan plan = nursingPlanMapper.selectById(id);
        if (plan == null || (plan.getDeleted() != null && plan.getDeleted() == 1)) {
            throw new BusinessException(404, "护理计划不存在");
        }
        return plan;
    }

    @Override
    public Long create(NursingPlan plan) {
        validateRequired(plan);
        ElderInfo elder = elderReferenceService.requireActive(plan.getElderId());
        if (elder.getDoctorId() == null) {
            throw new BusinessException(400, "该老人尚未分配责任医生，不能创建待审核护理计划");
        }
        elderReferenceService.requireActiveDoctor(elder.getDoctorId());
        requireAssignedElder(elder, plan.getNurseId());
        plan.setDoctorId(elder.getDoctorId());
        plan.setDeleted(0);
        plan.setStatus(0);
        plan.setDoctorApproval(0);
        plan.setCompletedCount(0);
        nursingPlanMapper.insert(plan);
        return plan.getId();
    }

    @Override
    public void update(Long id, NursingPlan plan, Long currentNurseId) {
        NursingPlan existing = requireExisting(id);
        requireNurseOwner(existing.getNurseId(), currentNurseId);
        // 已完成或已终止的计划不能修改
        if (existing.getStatus() != null && (existing.getStatus() == 2 || existing.getStatus() == 3)) {
            throw new BusinessException(400, "已完成或已终止的计划不能修改");
        }
        validateRequired(plan);
        ElderInfo elder = elderReferenceService.requireActive(plan.getElderId());
        if (elder.getDoctorId() == null) {
            throw new BusinessException(400, "该老人尚未分配责任医生，不能更新护理计划");
        }
        elderReferenceService.requireActiveDoctor(elder.getDoctorId());
        requireAssignedElder(elder, currentNurseId);
        existing.setDoctorId(elder.getDoctorId());
        BeanUtil.copyProperties(plan, existing, CopyOptions.create()
                .ignoreNullValue()
                .setIgnoreProperties("id", "nurseId", "createTime", "updateTime", "deleted",
                        "status", "completedCount", "doctorApproval"));
        nursingPlanMapper.updateById(existing);
    }

    @Override
    public void delete(Long id, Long currentNurseId) {
        NursingPlan plan = nursingPlanMapper.selectById(id);
        if (plan == null) {
            throw new BusinessException(404, "护理计划不存在或已删除");
        }
        requireNurseOwner(plan.getNurseId(), currentNurseId);
        int affectedRows = nursingPlanMapper.deleteById(id);
        if (affectedRows <= 0) {
            throw new BusinessException(500, "护理计划删除失败");
        }
    }

    @Override
    public void updateStatus(Long id, Integer status, Long currentNurseId) {
        NursingPlan existing = requireExisting(id);
        requireNurseOwner(existing.getNurseId(), currentNurseId);
        elderReferenceService.requireActive(existing.getElderId());
        validateStatus(status);
        if (status == 2 && existing.getStatus() != null && existing.getStatus() == 1) {
            // 已完成 -> 设置完成的次数
            existing.setCompletedCount(existing.getTotalCount());
        }
        existing.setStatus(status);
        nursingPlanMapper.updateById(existing);
    }

    @Override
    public void incrementCompleted(Long id, Long currentNurseId) {
        NursingPlan existing = requireExisting(id);
        requireNurseOwner(existing.getNurseId(), currentNurseId);
        elderReferenceService.requireActive(existing.getElderId());
        if (existing.getStatus() == null || existing.getStatus() != 1) {
            throw new BusinessException(400, "只有进行中的计划才能增加完成次数");
        }
        int newCount = (existing.getCompletedCount() == null ? 0 : existing.getCompletedCount()) + 1;
        existing.setCompletedCount(newCount);
        if (existing.getTotalCount() != null && newCount >= existing.getTotalCount()) {
            existing.setStatus(2);
        }
        nursingPlanMapper.updateById(existing);
    }

    @Override
    public Map<String, Object> getStats(Long currentUserId, Integer currentUserType) {
        Map<String, Object> stats = new HashMap<>();
        LambdaQueryWrapper<NursingPlan> baseQ = new LambdaQueryWrapper<NursingPlan>()
                .eq(NursingPlan::getDeleted, 0);
        applyReadScope(baseQ, currentUserId, currentUserType);

        stats.put("total", nursingPlanMapper.selectCount(baseQ));
        stats.put("pending", nursingPlanMapper.selectCount(baseQ.clone()
                .eq(NursingPlan::getStatus, 0)));
        stats.put("active", nursingPlanMapper.selectCount(baseQ.clone()
                .eq(NursingPlan::getStatus, 1)));
        stats.put("completed", nursingPlanMapper.selectCount(baseQ.clone()
                .eq(NursingPlan::getStatus, 2)));
        stats.put("terminated", nursingPlanMapper.selectCount(baseQ.clone()
                .eq(NursingPlan::getStatus, 3)));

        // 待医生审核数
        stats.put("pendingApproval", nursingPlanMapper.selectCount(baseQ.clone()
                .eq(NursingPlan::getDoctorApproval, 0)
                .in(NursingPlan::getStatus, 0, 1)));

        return stats;
    }

    private void applyReadScope(LambdaQueryWrapper<NursingPlan> wrapper,
                                Long currentUserId,
                                Integer currentUserType) {
        requireSupportedRole(currentUserId, currentUserType);
        if (Integer.valueOf(2).equals(currentUserType)) {
            wrapper.eq(NursingPlan::getDoctorId, currentUserId);
        } else if (Integer.valueOf(3).equals(currentUserType)) {
            wrapper.eq(NursingPlan::getNurseId, currentUserId);
        }
    }

    private void requireReadAccess(NursingPlan plan, Long currentUserId, Integer currentUserType) {
        requireSupportedRole(currentUserId, currentUserType);
        if (Integer.valueOf(1).equals(currentUserType)) {
            return;
        }
        boolean allowed = Integer.valueOf(2).equals(currentUserType)
                ? Objects.equals(plan.getDoctorId(), currentUserId)
                : Objects.equals(plan.getNurseId(), currentUserId);
        if (!allowed) {
            throw new BusinessException(403, "无权访问该护理计划");
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
            throw new BusinessException(403, "只能操作当前护士本人创建的护理计划");
        }
    }

    private void requireAssignedElder(ElderInfo elder, Long nurseId) {
        if (!Objects.equals(elder.getNurseId(), nurseId)) {
            throw new BusinessException(403, "只能为明确分配给当前护士的老人创建或修改护理计划");
        }
    }

    private void validateRequired(NursingPlan plan) {
        if (plan == null) {
            throw new BusinessException(400, "护理计划不能为空");
        }
        if (plan.getElderId() == null) {
            throw new BusinessException(400, "老人ID不能为空");
        }
        if (plan.getElderId() <= 0) {
            throw new BusinessException(400, "老人ID必须为正整数");
        }
        if (plan.getNurseId() == null) {
            throw new BusinessException(400, "护士ID不能为空");
        }
        if (plan.getNurseId() <= 0) {
            throw new BusinessException(400, "护士ID必须为正整数");
        }
        if (!StringUtils.hasText(plan.getPlanName())) {
            throw new BusinessException(400, "计划名称不能为空");
        }
        if (plan.getPlanType() == null) {
            throw new BusinessException(400, "计划类型不能为空");
        }
        if (plan.getStartDate() == null) {
            throw new BusinessException(400, "开始日期不能为空");
        }
        if (plan.getEndDate() != null && plan.getEndDate().isBefore(plan.getStartDate())) {
            throw new BusinessException(400, "结束日期不能早于开始日期");
        }
        if (plan.getTotalCount() != null && plan.getTotalCount() < 1) {
            throw new BusinessException(400, "总次数必须为正整数");
        }
        if (plan.getCompletedCount() != null && plan.getCompletedCount() < 0) {
            throw new BusinessException(400, "已完成次数不能为负数");
        }
        if (plan.getEffectScore() != null && (plan.getEffectScore() < 1 || plan.getEffectScore() > 5)) {
            throw new BusinessException(400, "效果评分必须在1到5之间");
        }
        if (plan.getDoctorApproval() != null && (plan.getDoctorApproval() < 0 || plan.getDoctorApproval() > 2)) {
            throw new BusinessException(400, "医生审核状态不正确");
        }
        if (plan.getStatus() != null) {
            validateStatus(plan.getStatus());
        }
    }

    private void validateStatus(Integer status) {
        if (status == null || status < 0 || status > 3) {
            throw new BusinessException(400, "护理计划状态必须是待执行、进行中、已完成或已终止");
        }
    }
}
