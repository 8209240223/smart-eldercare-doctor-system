package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.common.exception.BusinessException;
import com.medical.entity.HealthWarning;
import com.medical.entity.TimelineEvent;
import com.medical.entity.WarningEventLog;
import com.medical.mapper.HealthWarningMapper;
import com.medical.mapper.WarningEventLogMapper;
import com.medical.service.ElderReferenceService;
import com.medical.service.SseService;
import com.medical.service.TimelineService;
import com.medical.service.WarningService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WarningServiceImpl implements WarningService {

    private static final Logger log = LoggerFactory.getLogger(WarningServiceImpl.class);

    @Autowired
    private HealthWarningMapper healthWarningMapper;

    @Autowired
    private WarningEventLogMapper warningEventLogMapper;

    @Autowired
    private SseService sseService;

    @Autowired
    private TimelineService timelineService;

    @Autowired
    private ElderReferenceService elderReferenceService;

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
    @Transactional
    public void handle(Long id, String handleResult, Long doctorId) {
        HealthWarning entity = healthWarningMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(404, "预警不存在");
        }
        elderReferenceService.requireActive(entity.getElderId());
        entity.setStatus(2);
        entity.setHandleTime(LocalDateTime.now());
        entity.setHandleResult(handleResult);
        entity.setDoctorId(doctorId);
        healthWarningMapper.updateById(entity);

        // 记录事件日志
        WarningEventLog eventLog = new WarningEventLog();
        eventLog.setWarningId(id);
        eventLog.setEventType(4); // 处理
        eventLog.setOperatorId(doctorId);
        eventLog.setOperatorName("医生-" + doctorId);
        eventLog.setEventDetail("处理预警：" + handleResult);
        warningEventLogMapper.insert(eventLog);
    }

    @Override
    @Transactional
    public void ignore(Long id, String handleResult) {
        HealthWarning entity = healthWarningMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(404, "预警不存在");
        }
        elderReferenceService.requireActive(entity.getElderId());
        entity.setStatus(3);
        entity.setHandleTime(LocalDateTime.now());
        entity.setHandleResult(handleResult);
        healthWarningMapper.updateById(entity);

        // 记录事件日志
        WarningEventLog eventLog = new WarningEventLog();
        eventLog.setWarningId(id);
        eventLog.setEventType(5); // 忽略
        eventLog.setEventDetail("忽略预警：" + (handleResult != null ? handleResult : "无原因"));
        warningEventLogMapper.insert(eventLog);
    }

    @Override
    @Transactional
    public void markProcessing(Long id, Long doctorId) {
        HealthWarning entity = healthWarningMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(404, "预警不存在");
        }
        elderReferenceService.requireActive(entity.getElderId());
        if (entity.getStatus() != null && entity.getStatus() != 0 && entity.getStatus() != 1) {
            throw new BusinessException(400, "只有待处理或处理中的预警可以标记为处理中");
        }
        entity.setStatus(1);
        entity.setDoctorId(doctorId);
        healthWarningMapper.updateById(entity);

        WarningEventLog eventLog = new WarningEventLog();
        eventLog.setWarningId(id);
        eventLog.setEventType(3);
        eventLog.setOperatorId(doctorId);
        eventLog.setOperatorName(doctorId != null ? "医生-" + doctorId : "系统");
        eventLog.setEventDetail("预警标记为处理中");
        warningEventLogMapper.insert(eventLog);
    }

    @Override
    @Transactional
    public Long create(HealthWarning warning) {
        if (warning == null) {
            throw new BusinessException(400, "预警信息不能为空");
        }
        elderReferenceService.requireActive(warning.getElderId());
        warning.setStatus(0);
        healthWarningMapper.insert(warning);
        Long warningId = warning.getId();

        // 记录事件日志
        WarningEventLog eventLog = new WarningEventLog();
        eventLog.setWarningId(warningId);
        eventLog.setEventType(1); // 生成
        eventLog.setEventDetail("预警生成：" + warning.getWarningTitle());
        warningEventLogMapper.insert(eventLog);

        // 构建推送数据
        addWarningTimeline(warning);
        Map<String, Object> pushData = new HashMap<>();
        pushData.put("id", warningId);
        pushData.put("warningId", warningId);
        pushData.put("elderId", warning.getElderId());
        pushData.put("warningType", warning.getWarningType());
        pushData.put("warningLevel", warning.getWarningLevel());
        pushData.put("warningTitle", warning.getWarningTitle());
        pushData.put("warningContent", warning.getWarningContent());
        pushData.put("warningValue", warning.getWarningValue());
        pushData.put("thresholdValue", warning.getThresholdValue());
        pushData.put("status", 0);
        pushData.put("createTime", warning.getCreateTime() != null ?
                warning.getCreateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) :
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        pushData.put("eventType", "NEW_WARNING");

        try {
            String jsonData = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(pushData);
            // 广播给所有在线医生
            sseService.broadcastWarning(jsonData);
            log.info("实时推送预警消息: warningId={}, title={}", warningId, warning.getWarningTitle());

            // 记录推送日志
            WarningEventLog pushLog = new WarningEventLog();
            pushLog.setWarningId(warningId);
            pushLog.setEventType(2); // 推送
            pushLog.setEventDetail("SSE实时推送预警");
            warningEventLogMapper.insert(pushLog);
        } catch (Exception e) {
            log.warn("SSE推送预警失败: {}", e.getMessage());
        }

        return warningId;
    }

    @Override
    @Transactional
    public void markAsRead(Long id, Long doctorId) {
        HealthWarning warning = healthWarningMapper.selectById(id);
        if (warning == null) {
            throw new BusinessException(404, "预警不存在");
        }
        elderReferenceService.requireActive(warning.getElderId());
        // 标记已读（不改变状态，只是记录已读事件）
        WarningEventLog eventLog = new WarningEventLog();
        eventLog.setWarningId(id);
        eventLog.setEventType(3); // 已读
        eventLog.setOperatorId(doctorId);
        eventLog.setEventDetail("医生查看预警详情");
        warningEventLogMapper.insert(eventLog);
    }

    @Override
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        long pending = healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().eq(HealthWarning::getStatus, 0));
        long processing = healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().eq(HealthWarning::getStatus, 1));
        long handled = healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().eq(HealthWarning::getStatus, 2));
        long ignored = healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().eq(HealthWarning::getStatus, 3));
        long red = healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().eq(HealthWarning::getWarningLevel, 3).eq(HealthWarning::getStatus, 0));
        long orange = healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().eq(HealthWarning::getWarningLevel, 2).eq(HealthWarning::getStatus, 0));
        long yellow = healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().eq(HealthWarning::getWarningLevel, 1).eq(HealthWarning::getStatus, 0));

        // 今日新增
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        long todayCount = healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().ge(HealthWarning::getCreateTime, todayStart));

        stats.put("pending", pending);
        stats.put("processing", processing);
        stats.put("handled", handled);
        stats.put("ignored", ignored);
        stats.put("total", pending + processing + handled + ignored);
        stats.put("red", red);
        stats.put("orange", orange);
        stats.put("yellow", yellow);
        stats.put("todayCount", todayCount);
        stats.put("onlineDoctors", 0); // 由前端SSE连接数决定
        return stats;
    }

    @Override
    public Map<String, Object> getRealtimeStats() {
        Map<String, Object> stats = new HashMap<>();

        // 1. 当前待处理数量（按等级）
        long redPending = healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().eq(HealthWarning::getStatus, 0).eq(HealthWarning::getWarningLevel, 3));
        long orangePending = healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().eq(HealthWarning::getStatus, 0).eq(HealthWarning::getWarningLevel, 2));
        long yellowPending = healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>().eq(HealthWarning::getStatus, 0).eq(HealthWarning::getWarningLevel, 1));

        // 2. 最近24小时趋势（按小时分组）
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime yesterday = now.minusHours(24);
        List<Map<String, Object>> hourlyTrend = new ArrayList<>();
        for (int i = 23; i >= 0; i--) {
            LocalDateTime hourStart = now.minusHours(i + 1);
            LocalDateTime hourEnd = now.minusHours(i);
            long count = healthWarningMapper.selectCount(
                    new LambdaQueryWrapper<HealthWarning>()
                            .ge(HealthWarning::getCreateTime, hourStart)
                            .lt(HealthWarning::getCreateTime, hourEnd));
            Map<String, Object> point = new HashMap<>();
            point.put("hour", hourStart.format(DateTimeFormatter.ofPattern("HH:mm")));
            point.put("count", count);
            hourlyTrend.add(point);
        }

        // 3. 最近预警列表
        Page<HealthWarning> page = new Page<>(1, 10);
        LambdaQueryWrapper<HealthWarning> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(HealthWarning::getStatus, 0)
               .orderByDesc(HealthWarning::getWarningLevel)
               .orderByDesc(HealthWarning::getCreateTime);
        List<HealthWarning> recent = healthWarningMapper.selectPage(page, wrapper).getRecords();

        stats.put("redPending", redPending);
        stats.put("orangePending", orangePending);
        stats.put("yellowPending", yellowPending);
        stats.put("totalPending", redPending + orangePending + yellowPending);
        stats.put("hourlyTrend", hourlyTrend);
        stats.put("recentWarnings", recent);
        stats.put("onlineDoctors", 0);
        return stats;
    }

    @Override
    public List<Map<String, Object>> getEventLogs(Long warningId) {
        List<WarningEventLog> logs = warningEventLogMapper.selectList(
                new LambdaQueryWrapper<WarningEventLog>()
                        .eq(WarningEventLog::getWarningId, warningId)
                        .orderByAsc(WarningEventLog::getCreateTime));

        return logs.stream().map(log -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", log.getId());
            map.put("eventType", log.getEventType());
            map.put("eventTypeText", getEventTypeText(log.getEventType()));
            map.put("operatorName", log.getOperatorName());
            map.put("eventDetail", log.getEventDetail());
            map.put("createTime", log.getCreateTime() != null ?
                    log.getCreateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : null);
            return map;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Long autoDetectAndCreate(Long elderId, Integer dataType, String dataValue) {
        elderReferenceService.requireActive(elderId);
        // 根据数据类型和值自动判断预警等级
        HealthWarning warning = new HealthWarning();
        warning.setElderId(elderId);
        warning.setWarningType(dataType);
        warning.setWarningValue(dataValue);
        warning.setStatus(0);

        // 根据数据类型设置预警标题、内容和等级
        switch (dataType) {
            case 1: // 收缩压
                double sbp = Double.parseDouble(dataValue);
                if (sbp >= 180) {
                    warning.setWarningLevel(3);
                    warning.setWarningTitle("收缩压异常偏高（红色预警）");
                    warning.setWarningContent("收缩压 " + dataValue + "mmHg，超过180mmHg红色预警阈值");
                    warning.setThresholdValue("≥180mmHg");
                } else if (sbp >= 160) {
                    warning.setWarningLevel(2);
                    warning.setWarningTitle("收缩压偏高（橙色预警）");
                    warning.setWarningContent("收缩压 " + dataValue + "mmHg，超过160mmHg橙色预警阈值");
                    warning.setThresholdValue("≥160mmHg");
                } else {
                    return null; // 未触发预警
                }
                break;
            case 2: // 舒张压
                double dbp = Double.parseDouble(dataValue);
                if (dbp >= 110) {
                    warning.setWarningLevel(3);
                    warning.setWarningTitle("舒张压异常偏高（红色预警）");
                    warning.setWarningContent("舒张压 " + dataValue + "mmHg，超过110mmHg红色预警阈值");
                    warning.setThresholdValue("≥110mmHg");
                } else if (dbp >= 100) {
                    warning.setWarningLevel(2);
                    warning.setWarningTitle("舒张压偏高（橙色预警）");
                    warning.setWarningContent("舒张压 " + dataValue + "mmHg，超过100mmHg橙色预警阈值");
                    warning.setThresholdValue("≥100mmHg");
                } else {
                    return null;
                }
                break;
            case 3: // 心率
                double hr = Double.parseDouble(dataValue);
                if (hr > 120) {
                    warning.setWarningLevel(2);
                    warning.setWarningTitle("心率过快（橙色预警）");
                    warning.setWarningContent("心率 " + dataValue + "次/分，超过120次/分预警阈值");
                    warning.setThresholdValue("＞120次/分");
                } else if (hr < 50) {
                    warning.setWarningLevel(2);
                    warning.setWarningTitle("心率过缓（橙色预警）");
                    warning.setWarningContent("心率 " + dataValue + "次/分，低于50次/分预警阈值");
                    warning.setThresholdValue("＜50次/分");
                } else {
                    return null;
                }
                break;
            case 4: // 空腹血糖
                double fbg = Double.parseDouble(dataValue);
                if (fbg >= 11.1) {
                    warning.setWarningLevel(3);
                    warning.setWarningTitle("空腹血糖异常偏高（红色预警）");
                    warning.setWarningContent("空腹血糖 " + dataValue + "mmol/L，超过11.1mmol/L红色预警阈值");
                    warning.setThresholdValue("≥11.1mmol/L");
                } else if (fbg >= 7.0) {
                    warning.setWarningLevel(2);
                    warning.setWarningTitle("空腹血糖偏高（橙色预警）");
                    warning.setWarningContent("空腹血糖 " + dataValue + "mmol/L，超过7.0mmol/L预警阈值");
                    warning.setThresholdValue("≥7.0mmol/L");
                } else {
                    return null;
                }
                break;
            case 7: // 体温
                double temp = Double.parseDouble(dataValue);
                if (temp >= 39.0) {
                    warning.setWarningLevel(3);
                    warning.setWarningTitle("体温异常偏高（红色预警）");
                    warning.setWarningContent("体温 " + dataValue + "℃，超过39.0℃红色预警阈值");
                    warning.setThresholdValue("≥39.0℃");
                } else if (temp >= 38.5) {
                    warning.setWarningLevel(2);
                    warning.setWarningTitle("体温偏高（橙色预警）");
                    warning.setWarningContent("体温 " + dataValue + "℃，超过38.5℃橙色预警阈值");
                    warning.setThresholdValue("≥38.5℃");
                } else if (temp >= 37.3) {
                    warning.setWarningLevel(1);
                    warning.setWarningTitle("体温偏高（黄色预警）");
                    warning.setWarningContent("体温 " + dataValue + "℃，超过37.3℃黄色预警阈值");
                    warning.setThresholdValue("≥37.3℃");
                } else {
                    return null;
                }
                break;
            default:
                return null; // 不支持的数据类型
        }

        // 检查是否已存在相同类型的待处理预警（去重）
        long existing = healthWarningMapper.selectCount(
                new LambdaQueryWrapper<HealthWarning>()
                        .eq(HealthWarning::getElderId, elderId)
                        .eq(HealthWarning::getWarningType, dataType)
                        .eq(HealthWarning::getStatus, 0));
        if (existing > 0) {
            log.info("该老人已有相同类型的待处理预警，跳过: elderId={}, dataType={}", elderId, dataType);
            return null;
        }

        return create(warning);
    }

    private void addWarningTimeline(HealthWarning warning) {
        TimelineEvent event = new TimelineEvent();
        event.setElderId(warning.getElderId());
        event.setEventType(2);
        event.setEventTitle(warning.getWarningTitle());
        event.setEventContent(warning.getWarningContent());
        event.setSourceType("warning");
        event.setSourceId(warning.getId());
        event.setDoctorId(warning.getDoctorId());
        event.setEventTime(warning.getCreateTime() != null ? warning.getCreateTime() : LocalDateTime.now());
        timelineService.addEvent(event);
    }

    private String getEventTypeText(Integer eventType) {
        switch (eventType) {
            case 1: return "生成";
            case 2: return "推送";
            case 3: return "已读";
            case 4: return "处理";
            case 5: return "忽略";
            case 6: return "超时";
            default: return "未知";
        }
    }
}
