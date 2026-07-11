package com.medical.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.PhysicalExam;
import com.medical.entity.TimelineEvent;
import com.medical.mapper.PhysicalExamMapper;
import com.medical.service.ElderReferenceService;
import com.medical.service.ExamService;
import com.medical.service.TimelineService;
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

    @Autowired
    private TimelineService timelineService;

    @Autowired
    private ElderReferenceService elderReferenceService;

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
        validateExam(exam);
        elderReferenceService.requireActive(exam.getElderId());
        if (exam.getExamDate() == null) {
            exam.setExamDate(LocalDate.now());
        }
        if (exam.getDeleted() == null) {
            exam.setDeleted(0);
        }
        recalculateDerivedFields(exam);
        physicalExamMapper.insert(exam);
        addExamTimeline(exam);
        return exam.getId();
    }

    @Override
    public void update(Long id, PhysicalExam exam) {
        PhysicalExam existing = getById(id);
        validateExam(exam);
        BeanUtil.copyProperties(exam, existing, CopyOptions.create()
                .ignoreNullValue()
                .setIgnoreProperties("id", "createTime", "updateTime", "deleted"));
        elderReferenceService.requireActive(existing.getElderId());
        recalculateDerivedFields(existing);
        physicalExamMapper.updateById(existing);
        addExamTimeline(existing);
    }

    @Override
    public void delete(Long id) {
        if (id == null || id <= 0) {
            throw new BusinessException(400, "体检记录ID不正确");
        }
        PhysicalExam exam = getById(id);
        int rows = physicalExamMapper.deleteById(exam.getId());
        if (rows <= 0) {
            throw new BusinessException(500, "体检记录删除失败");
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

    private void recalculateDerivedFields(PhysicalExam exam) {
        if (exam.getHeight() != null && exam.getWeight() != null && exam.getHeight().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal heightM = exam.getHeight().divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            exam.setBmi(exam.getWeight().divide(heightM.multiply(heightM), 1, RoundingMode.HALF_UP));
        }
        exam.setAbnormalFlag(hasAbnormalValue(exam) ? 1 : 0);
    }

    private boolean hasAbnormalValue(PhysicalExam exam) {
        return outside(exam.getBmi(), "18.5", "28")
                || outside(exam.getSystolicPressure(), 90, 139)
                || outside(exam.getDiastolicPressure(), 60, 89)
                || outside(exam.getHeartRate(), 60, 100)
                || outside(exam.getBloodSugarFasting(), "3.9", "6.1")
                || outside(exam.getBloodSugarRandom(), "0", "11.1")
                || outside(exam.getTemperature(), "36", "37.3")
                || below(exam.getBloodOxygen(), "95")
                || above(exam.getWaistline(), "90");
    }

    private void validateExam(PhysicalExam exam) {
        if (exam == null) {
            throw new BusinessException(400, "体检记录不能为空");
        }
        if (exam.getElderId() != null && exam.getElderId() <= 0) {
            throw new BusinessException(400, "老人ID必须为正整数");
        }
        checkRange(exam.getHeight(), "50", "230", "身高");
        checkRange(exam.getWeight(), "20", "200", "体重");
        checkRange(exam.getSystolicPressure(), 60, 240, "收缩压");
        checkRange(exam.getDiastolicPressure(), 40, 140, "舒张压");
        if (exam.getSystolicPressure() != null && exam.getDiastolicPressure() != null
                && exam.getSystolicPressure() <= exam.getDiastolicPressure()) {
            throw new BusinessException(400, "收缩压必须大于舒张压");
        }
        checkRange(exam.getHeartRate(), 30, 180, "心率");
        checkRange(exam.getBloodSugarFasting(), "2", "30", "空腹血糖");
        checkRange(exam.getBloodSugarRandom(), "2", "35", "随机血糖");
        checkRange(exam.getTemperature(), "34", "42", "体温");
        checkRange(exam.getBloodOxygen(), "50", "100", "血氧");
        checkRange(exam.getWaistline(), "40", "180", "腰围");
    }

    private boolean outside(Integer value, int min, int max) {
        return value != null && (value < min || value > max);
    }

    private boolean outside(BigDecimal value, String min, String max) {
        return value != null && (value.compareTo(new BigDecimal(min)) < 0 || value.compareTo(new BigDecimal(max)) > 0);
    }

    private boolean below(BigDecimal value, String min) {
        return value != null && value.compareTo(new BigDecimal(min)) < 0;
    }

    private boolean above(BigDecimal value, String max) {
        return value != null && value.compareTo(new BigDecimal(max)) > 0;
    }

    private void checkRange(Integer value, int min, int max, String fieldName) {
        if (value != null && (value < min || value > max)) {
            throw new BusinessException(400, fieldName + "必须在" + min + "到" + max + "之间");
        }
    }

    private void checkRange(BigDecimal value, String min, String max, String fieldName) {
        BigDecimal minValue = new BigDecimal(min);
        BigDecimal maxValue = new BigDecimal(max);
        if (value != null && (value.compareTo(minValue) < 0 || value.compareTo(maxValue) > 0)) {
            throw new BusinessException(400, fieldName + "必须在" + minValue.stripTrailingZeros().toPlainString() + "到" + maxValue.stripTrailingZeros().toPlainString() + "之间");
        }
    }

    private void addExamTimeline(PhysicalExam exam) {
        TimelineEvent event = new TimelineEvent();
        event.setElderId(exam.getElderId());
        event.setDoctorId(exam.getDoctorId());
        event.setEventType(2);
        event.setEventTitle("体检记录");
        event.setEventContent("BMI：" + (exam.getBmi() == null ? "-" : exam.getBmi())
                + "，血压：" + (exam.getSystolicPressure() == null ? "-" : exam.getSystolicPressure())
                + "/" + (exam.getDiastolicPressure() == null ? "-" : exam.getDiastolicPressure())
                + "，异常：" + (exam.getAbnormalFlag() != null && exam.getAbnormalFlag() == 1 ? "是" : "否"));
        event.setSourceType("physical_exam");
        event.setSourceId(exam.getId());
        event.setEventTime(exam.getExamDate() == null ? LocalDateTime.now() : exam.getExamDate().atStartOfDay());
        timelineService.addEvent(event);
    }
}
