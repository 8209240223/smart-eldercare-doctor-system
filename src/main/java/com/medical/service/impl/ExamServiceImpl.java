package com.medical.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.PhysicalExam;
import com.medical.mapper.PhysicalExamMapper;
import com.medical.service.ExamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExamServiceImpl implements ExamService {

    @Autowired
    private PhysicalExamMapper physicalExamMapper;

    @Override
    public Page<PhysicalExam> list(Integer pageNum, Integer pageSize, Long elderId, String startDate, String endDate) {
        Page<PhysicalExam> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<PhysicalExam> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(elderId != null, PhysicalExam::getElderId, elderId)
               .eq(PhysicalExam::getDeleted, 0);
        if (StringUtils.hasText(startDate)) {
            wrapper.ge(PhysicalExam::getExamDate, LocalDate.parse(startDate));
        }
        if (StringUtils.hasText(endDate)) {
            wrapper.le(PhysicalExam::getExamDate, LocalDate.parse(endDate));
        }
        wrapper.orderByDesc(PhysicalExam::getExamDate)
               .orderByDesc(PhysicalExam::getCreateTime);
        return physicalExamMapper.selectPage(page, wrapper);
    }

    @Override
    public PhysicalExam getById(Long id) {
        PhysicalExam exam = physicalExamMapper.selectById(id);
        if (exam == null || (exam.getDeleted() != null && exam.getDeleted() == 1)) {
            throw new BusinessException(404, "体检记录不存在");
        }
        return exam;
    }

    @Override
    public Long create(PhysicalExam exam) {
        if (exam.getElderId() == null) {
            throw new BusinessException(400, "老人ID不能为空");
        }
        if (exam.getExamDate() == null) {
            exam.setExamDate(LocalDate.now());
        }
        if (exam.getDeleted() == null) {
            exam.setDeleted(0);
        }
        if (exam.getAbnormalFlag() == null) {
            exam.setAbnormalFlag(0);
        }
        // 自动计算BMI
        if (exam.getHeight() != null && exam.getWeight() != null && exam.getHeight().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal heightM = exam.getHeight().divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal bmi = exam.getWeight().divide(heightM.multiply(heightM), 1, RoundingMode.HALF_UP);
            exam.setBmi(bmi);
            // 自动标记异常
            if (bmi.compareTo(BigDecimal.valueOf(18.5)) < 0 || bmi.compareTo(BigDecimal.valueOf(28)) >= 0) {
                exam.setAbnormalFlag(1);
            }
        }
        physicalExamMapper.insert(exam);
        return exam.getId();
    }

    @Override
    public void update(Long id, PhysicalExam exam) {
        PhysicalExam existing = getById(id);
        BeanUtil.copyProperties(exam, existing, CopyOptions.create()
                .ignoreNullValue()
                .setIgnoreProperties("id", "createTime", "updateTime", "deleted"));
        // 重新计算BMI
        if (exam.getHeight() != null && exam.getWeight() != null && exam.getHeight().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal heightM = exam.getHeight().divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            existing.setBmi(exam.getWeight().divide(heightM.multiply(heightM), 1, RoundingMode.HALF_UP));
        }
        physicalExamMapper.updateById(existing);
    }

    @Override
    public void delete(Long id) {
        PhysicalExam exam = physicalExamMapper.selectById(id);
        if (exam != null) {
            exam.setDeleted(1);
            physicalExamMapper.updateById(exam);
        }
    }

    @Override
    public List<PhysicalExam> getCompareData(Long elderId, String startDate, String endDate) {
        LambdaQueryWrapper<PhysicalExam> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PhysicalExam::getElderId, elderId)
               .eq(PhysicalExam::getDeleted, 0);
        if (StringUtils.hasText(startDate)) {
            wrapper.ge(PhysicalExam::getExamDate, LocalDate.parse(startDate));
        }
        if (StringUtils.hasText(endDate)) {
            wrapper.le(PhysicalExam::getExamDate, LocalDate.parse(endDate));
        }
        wrapper.orderByAsc(PhysicalExam::getExamDate);
        return physicalExamMapper.selectList(wrapper);
    }

    @Override
    public Map<String, Object> getStats(Long elderId) {
        Map<String, Object> stats = new HashMap<>();
        LambdaQueryWrapper<PhysicalExam> baseQ = new LambdaQueryWrapper<PhysicalExam>()
                .eq(PhysicalExam::getDeleted, 0);
        if (elderId != null) {
            baseQ.eq(PhysicalExam::getElderId, elderId);
        }
        long total = physicalExamMapper.selectCount(baseQ);
        stats.put("total", total);

        long abnormal = physicalExamMapper.selectCount(baseQ.clone()
                .eq(PhysicalExam::getAbnormalFlag, 1));
        stats.put("abnormal", abnormal);

        // 今年的体检数
        LocalDate yearStart = LocalDate.of(LocalDate.now().getYear(), 1, 1);
        long thisYear = physicalExamMapper.selectCount(baseQ.clone()
                .ge(PhysicalExam::getExamDate, yearStart));
        stats.put("thisYear", thisYear);

        return stats;
    }
}
