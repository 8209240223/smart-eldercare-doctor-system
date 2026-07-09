package com.medical.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.TimelineEvent;
import com.medical.mapper.TimelineEventMapper;
import com.medical.service.TimelineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class TimelineServiceImpl implements TimelineService {

    @Autowired
    private TimelineEventMapper timelineEventMapper;

    @Override
    public Page<TimelineEvent> getTimeline(Long elderId, String startDate, String endDate, Integer eventType, Integer pageNum, Integer pageSize) {
        LambdaQueryWrapper<TimelineEvent> wrapper = buildQuery(elderId, startDate, endDate, eventType);
        wrapper.orderByDesc(TimelineEvent::getEventTime);
        return timelineEventMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public Map<String, Object> getSummary(Long elderId, String startDate, String endDate, Integer eventType) {
        Map<String, Object> summary = new HashMap<>();
        LambdaQueryWrapper<TimelineEvent> totalWrapper = buildQuery(elderId, startDate, endDate, eventType);
        summary.put("total", timelineEventMapper.selectCount(totalWrapper));

        Map<String, Object> typeCounts = new HashMap<>();
        for (int i = 1; i <= 9; i++) {
            if (eventType != null && eventType != i) {
                typeCounts.put(String.valueOf(i), 0);
                summary.put("type" + i, 0);
                continue;
            }
            LambdaQueryWrapper<TimelineEvent> typeWrapper = buildQuery(elderId, startDate, endDate, i);
            Long count = timelineEventMapper.selectCount(typeWrapper);
            typeCounts.put(String.valueOf(i), count);
            summary.put("type" + i, count);
        }
        summary.put("typeCounts", typeCounts);
        return summary;
    }

    @Override
    public void addEvent(TimelineEvent event) {
        if (event.getEventTime() == null) {
            event.setEventTime(LocalDateTime.now());
        }
        if (event.getCreateTime() == null) {
            event.setCreateTime(LocalDateTime.now());
        }
        timelineEventMapper.insert(event);
    }

    private LambdaQueryWrapper<TimelineEvent> buildQuery(Long elderId, String startDate, String endDate, Integer eventType) {
        LambdaQueryWrapper<TimelineEvent> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TimelineEvent::getElderId, elderId);
        if (eventType != null) {
            wrapper.eq(TimelineEvent::getEventType, eventType);
        }
        if (startDate != null && !startDate.isEmpty()) {
            wrapper.ge(TimelineEvent::getEventTime, LocalDateTime.parse(startDate + "T00:00:00"));
        }
        if (endDate != null && !endDate.isEmpty()) {
            wrapper.le(TimelineEvent::getEventTime, LocalDateTime.parse(endDate + "T23:59:59"));
        }
        return wrapper;
    }
}
