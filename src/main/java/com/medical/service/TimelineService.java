package com.medical.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.medical.entity.TimelineEvent;

import java.util.Map;

/**
 * 时间轴服务接口
 */
public interface TimelineService {

    Page<TimelineEvent> getTimeline(Long elderId, String startDate, String endDate, Integer eventType, Integer pageNum, Integer pageSize);

    Map<String, Object> getSummary(Long elderId);

    void addEvent(TimelineEvent event);
}
