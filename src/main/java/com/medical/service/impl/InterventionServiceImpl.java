package com.medical.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.InterventionRecord;
import com.medical.mapper.InterventionRecordMapper;
import com.medical.service.InterventionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class InterventionServiceImpl implements InterventionService {

    @Autowired
    private InterventionRecordMapper interventionRecordMapper;

    @Override
    public Page<InterventionRecord> list(Integer pageNum, Integer pageSize, Long elderId, Long followRecordId, Integer type) {
        Page<InterventionRecord> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<InterventionRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(elderId != null, InterventionRecord::getElderId, elderId)
               .eq(followRecordId != null, InterventionRecord::getFollowRecordId, followRecordId)
               .eq(type != null, InterventionRecord::getInterventionType, type)
               .eq(InterventionRecord::getDeleted, 0)
               .orderByDesc(InterventionRecord::getInterventionDate)
               .orderByDesc(InterventionRecord::getCreateTime);
        return interventionRecordMapper.selectPage(page, wrapper);
    }

    @Override
    public InterventionRecord getById(Long id) {
        InterventionRecord record = interventionRecordMapper.selectById(id);
        if (record == null || (record.getDeleted() != null && record.getDeleted() == 1)) {
            throw new BusinessException(404, "干预记录不存在");
        }
        return record;
    }

    @Override
    public Long create(InterventionRecord record) {
        validateRequired(record);
        if (record.getStatus() == null) {
            record.setStatus(1);
        }
        if (record.getDeleted() == null) {
            record.setDeleted(0);
        }
        if (record.getInterventionDate() == null) {
            record.setInterventionDate(LocalDateTime.now());
        }
        interventionRecordMapper.insert(record);
        return record.getId();
    }

    @Override
    public void update(Long id, InterventionRecord record) {
        InterventionRecord existing = getById(id);
        validateRequired(record);
        BeanUtil.copyProperties(record, existing, CopyOptions.create()
                .ignoreNullValue()
                .setIgnoreProperties("id", "createTime", "updateTime", "deleted"));
        interventionRecordMapper.updateById(existing);
    }

    @Override
    public void delete(Long id) {
        InterventionRecord record = interventionRecordMapper.selectById(id);
        if (record != null) {
            record.setDeleted(1);
            interventionRecordMapper.updateById(record);
        }
    }

    @Override
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        LambdaQueryWrapper<InterventionRecord> base = new LambdaQueryWrapper<InterventionRecord>()
                .eq(InterventionRecord::getDeleted, 0);
        stats.put("total", interventionRecordMapper.selectCount(base));
        stats.put("medication", interventionRecordMapper.selectCount(new LambdaQueryWrapper<InterventionRecord>().eq(InterventionRecord::getDeleted, 0).eq(InterventionRecord::getInterventionType, 1)));
        stats.put("nonMedication", interventionRecordMapper.selectCount(new LambdaQueryWrapper<InterventionRecord>().eq(InterventionRecord::getDeleted, 0).eq(InterventionRecord::getInterventionType, 2)));
        stats.put("education", interventionRecordMapper.selectCount(new LambdaQueryWrapper<InterventionRecord>().eq(InterventionRecord::getDeleted, 0).eq(InterventionRecord::getInterventionType, 4)));
        stats.put("referral", interventionRecordMapper.selectCount(new LambdaQueryWrapper<InterventionRecord>().eq(InterventionRecord::getDeleted, 0).eq(InterventionRecord::getInterventionType, 3)));
        stats.put("evaluated", interventionRecordMapper.selectCount(new LambdaQueryWrapper<InterventionRecord>().eq(InterventionRecord::getDeleted, 0).isNotNull(InterventionRecord::getEffectEvaluation)));
        return stats;
    }

    private void validateRequired(InterventionRecord record) {
        if (record == null) {
            throw new BusinessException(400, "干预记录不能为空");
        }
        if (record.getElderId() == null) {
            throw new BusinessException(400, "老人ID不能为空");
        }
        if (record.getInterventionType() == null) {
            throw new BusinessException(400, "干预类型不能为空");
        }
        if (!StringUtils.hasText(record.getInterventionTitle())) {
            throw new BusinessException(400, "干预标题不能为空");
        }
        if (!StringUtils.hasText(record.getInterventionContent())) {
            throw new BusinessException(400, "干预内容不能为空");
        }
    }
}
