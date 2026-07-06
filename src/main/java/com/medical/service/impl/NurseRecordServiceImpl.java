package com.medical.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.NursingRecord;
import com.medical.mapper.NursingRecordMapper;
import com.medical.service.NurseRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class NurseRecordServiceImpl implements NurseRecordService {

    @Autowired
    private NursingRecordMapper nursingRecordMapper;

    @Override
    public Page<NursingRecord> list(Integer pageNum, Integer pageSize, Long elderId, Long nurseId,
                                     Integer recordType, Integer reportStatus, String startDate, String endDate) {
        Page<NursingRecord> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<NursingRecord> wrapper = new LambdaQueryWrapper<>();

        wrapper.eq(NursingRecord::getDeleted, 0);
        if (elderId != null) {
            wrapper.eq(NursingRecord::getElderId, elderId);
        }
        if (nurseId != null) {
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

        wrapper.orderByDesc(NursingRecord::getRecordDate)
               .orderByDesc(NursingRecord::getCreateTime);
        return nursingRecordMapper.selectPage(page, wrapper);
    }

    @Override
    public NursingRecord getById(Long id) {
        NursingRecord record = nursingRecordMapper.selectById(id);
        if (record == null || (record.getDeleted() != null && record.getDeleted() == 1)) {
            throw new BusinessException(404, "护理记录不存在");
        }
        return record;
    }

    @Override
    public Long create(NursingRecord record) {
        validateRequired(record);
        if (record.getDeleted() == null) {
            record.setDeleted(0);
        }
        if (record.getReportStatus() == null) {
            record.setReportStatus(0);
        }
        if (record.getIsAbnormal() == null) {
            record.setIsAbnormal(0);
        }
        if (record.getRecordDate() == null) {
            record.setRecordDate(LocalDateTime.now());
        }
        nursingRecordMapper.insert(record);
        return record.getId();
    }

    @Override
    public void update(Long id, NursingRecord record) {
        NursingRecord existing = getById(id);
        // 已上报的记录不能修改
        if (existing.getReportStatus() != null && existing.getReportStatus() == 1) {
            throw new BusinessException(400, "已上报的记录不能修改");
        }
        BeanUtil.copyProperties(record, existing, CopyOptions.create()
                .ignoreNullValue()
                .setIgnoreProperties("id", "createTime", "updateTime", "deleted", "reportStatus"));
        if (record.getIsAbnormal() != null && record.getIsAbnormal() == 1) {
            existing.setIsAbnormal(1);
            existing.setAbnormalDesc(record.getAbnormalDesc());
        }
        nursingRecordMapper.updateById(existing);
    }

    @Override
    public void delete(Long id) {
        NursingRecord record = nursingRecordMapper.selectById(id);
        if (record != null) {
            record.setDeleted(1);
            nursingRecordMapper.updateById(record);
        }
    }

    @Override
    public void reportAbnormal(Long id, String abnormalDesc) {
        NursingRecord record = getById(id);
        record.setIsAbnormal(1);
        record.setAbnormalDesc(abnormalDesc);
        record.setReportStatus(1);
        nursingRecordMapper.updateById(record);
    }

    @Override
    public Map<String, Object> getStats(Long nurseId) {
        Map<String, Object> stats = new HashMap<>();
        LambdaQueryWrapper<NursingRecord> baseQ = new LambdaQueryWrapper<NursingRecord>()
                .eq(NursingRecord::getNurseId, nurseId)
                .eq(NursingRecord::getDeleted, 0);

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

    private void validateRequired(NursingRecord record) {
        if (record == null) {
            throw new BusinessException(400, "护理记录不能为空");
        }
        if (record.getElderId() == null) {
            throw new BusinessException(400, "老人ID不能为空");
        }
        if (record.getNurseId() == null) {
            throw new BusinessException(400, "护士ID不能为空");
        }
        if (record.getRecordType() == null) {
            throw new BusinessException(400, "记录类型不能为空");
        }
        if (!StringUtils.hasText(record.getRecordTitle())) {
            throw new BusinessException(400, "记录标题不能为空");
        }
    }
}
