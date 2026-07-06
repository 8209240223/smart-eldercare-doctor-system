package com.medical.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.NursingPlan;
import com.medical.mapper.NursingPlanMapper;
import com.medical.service.NursePlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;

@Service
public class NursePlanServiceImpl implements NursePlanService {

    @Autowired
    private NursingPlanMapper nursingPlanMapper;

    @Override
    public Page<NursingPlan> list(Integer pageNum, Integer pageSize, Long elderId, Long nurseId,
                                   Integer planType, Integer status) {
        Page<NursingPlan> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<NursingPlan> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(NursingPlan::getDeleted, 0);
        if (elderId != null) {
            wrapper.eq(NursingPlan::getElderId, elderId);
        }
        if (nurseId != null) {
            wrapper.eq(NursingPlan::getNurseId, nurseId);
        }
        if (planType != null) {
            wrapper.eq(NursingPlan::getPlanType, planType);
        }
        if (status != null) {
            wrapper.eq(NursingPlan::getStatus, status);
        }
        wrapper.orderByDesc(NursingPlan::getStartDate)
               .orderByDesc(NursingPlan::getCreateTime);
        return nursingPlanMapper.selectPage(page, wrapper);
    }

    @Override
    public NursingPlan getById(Long id) {
        NursingPlan plan = nursingPlanMapper.selectById(id);
        if (plan == null || (plan.getDeleted() != null && plan.getDeleted() == 1)) {
            throw new BusinessException(404, "护理计划不存在");
        }
        return plan;
    }

    @Override
    public Long create(NursingPlan plan) {
        validateRequired(plan);
        if (plan.getDeleted() == null) {
            plan.setDeleted(0);
        }
        if (plan.getStatus() == null) {
            plan.setStatus(0);
        }
        if (plan.getDoctorApproval() == null) {
            plan.setDoctorApproval(0);
        }
        if (plan.getCompletedCount() == null) {
            plan.setCompletedCount(0);
        }
        nursingPlanMapper.insert(plan);
        return plan.getId();
    }

    @Override
    public void update(Long id, NursingPlan plan) {
        NursingPlan existing = getById(id);
        // 已完成或已终止的计划不能修改
        if (existing.getStatus() != null && (existing.getStatus() == 2 || existing.getStatus() == 3)) {
            throw new BusinessException(400, "已完成或已终止的计划不能修改");
        }
        BeanUtil.copyProperties(plan, existing, CopyOptions.create()
                .ignoreNullValue()
                .setIgnoreProperties("id", "createTime", "updateTime", "deleted", "completedCount"));
        nursingPlanMapper.updateById(existing);
    }

    @Override
    public void delete(Long id) {
        NursingPlan plan = nursingPlanMapper.selectById(id);
        if (plan != null) {
            plan.setDeleted(1);
            nursingPlanMapper.updateById(plan);
        }
    }

    @Override
    public void updateStatus(Long id, Integer status) {
        NursingPlan existing = getById(id);
        if (status == 2 && existing.getStatus() != null && existing.getStatus() == 1) {
            // 已完成 -> 设置完成的次数
            existing.setCompletedCount(existing.getTotalCount());
        }
        existing.setStatus(status);
        nursingPlanMapper.updateById(existing);
    }

    @Override
    public void incrementCompleted(Long id) {
        NursingPlan existing = getById(id);
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
    public Map<String, Object> getStats(Long nurseId) {
        Map<String, Object> stats = new HashMap<>();
        LambdaQueryWrapper<NursingPlan> baseQ = new LambdaQueryWrapper<NursingPlan>()
                .eq(NursingPlan::getNurseId, nurseId)
                .eq(NursingPlan::getDeleted, 0);

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
                .in(NursingPlan::getStatus, 1, 2)));

        return stats;
    }

    private void validateRequired(NursingPlan plan) {
        if (plan == null) {
            throw new BusinessException(400, "护理计划不能为空");
        }
        if (plan.getElderId() == null) {
            throw new BusinessException(400, "老人ID不能为空");
        }
        if (plan.getNurseId() == null) {
            throw new BusinessException(400, "护士ID不能为空");
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
    }
}
