package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.HealthWarning;
import com.medical.mapper.HealthWarningMapper;
import com.medical.service.WarningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class WarningServiceImpl implements WarningService {

    @Autowired
    private HealthWarningMapper healthWarningMapper;

    @Override
    public Page<HealthWarning> list(Integer pageNum, Integer pageSize, Integer status, Integer warningLevel, Long elderId) {
        Page<HealthWarning> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<HealthWarning> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(status != null, HealthWarning::getStatus, status)
               .eq(warningLevel != null, HealthWarning::getWarningLevel, warningLevel)
               .eq(elderId != null, HealthWarning::getElderId, elderId)
               .orderByDesc(HealthWarning::getWarningLevel)
               .orderByDesc(HealthWarning::getCreateTime);
        return healthWarningMapper.selectPage(page, wrapper);
    }

    @Override
    public HealthWarning getDetail(Long id) {
        HealthWarning warning = healthWarningMapper.selectById(id);
        if (warning == null) {
            throw new BusinessException(404, "预警不存在");
        }
        return warning;
    }

    @Override
    public void handle(Long id, String handleResult, Long doctorId) {
        HealthWarning entity = healthWarningMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(404, "预警不存在");
        }
        entity.setStatus(2);
        entity.setHandleTime(LocalDateTime.now());
        entity.setHandleResult(handleResult);
        entity.setDoctorId(doctorId);
        healthWarningMapper.updateById(entity);
    }

    @Override
    public void ignore(Long id, String handleResult) {
        HealthWarning entity = healthWarningMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(404, "预警不存在");
        }
        entity.setStatus(3);
        entity.setHandleTime(LocalDateTime.now());
        entity.setHandleResult(handleResult);
        healthWarningMapper.updateById(entity);
    }

    @Override
    public Long create(HealthWarning warning) {
        warning.setStatus(0);
        healthWarningMapper.insert(warning);
        return warning.getId();
    }

    @Override
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("pending", healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().eq(HealthWarning::getStatus, 0)));
        stats.put("handled", healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().eq(HealthWarning::getStatus, 2)));
        stats.put("red", healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().eq(HealthWarning::getWarningLevel, 3).eq(HealthWarning::getStatus, 0)));
        stats.put("orange", healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().eq(HealthWarning::getWarningLevel, 2).eq(HealthWarning::getStatus, 0)));
        stats.put("yellow", healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().eq(HealthWarning::getWarningLevel, 1).eq(HealthWarning::getStatus, 0)));
        return stats;
    }
}
