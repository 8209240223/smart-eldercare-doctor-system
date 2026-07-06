package com.medical.controller;

import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.service.TimelineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 时间轴控制器
 */
@RestController
@RequestMapping("/api/timeline")
public class TimelineController {

    @Autowired
    private TimelineService timelineService;

    @GetMapping("/{elderId}")
    public R<?> getTimeline(@PathVariable Long elderId,
                            @RequestParam(required = false) String startDate,
                            @RequestParam(required = false) String endDate,
                            @RequestParam(required = false) Integer eventType,
                            @RequestParam(defaultValue = "1") Integer pageNum,
                            @RequestParam(defaultValue = "20") Integer pageSize) {
        return R.ok(timelineService.getTimeline(elderId, startDate, endDate, eventType, pageNum, pageSize));
    }

    @GetMapping("/{elderId}/summary")
    public R<?> getSummary(@PathVariable Long elderId) {
        return R.ok(timelineService.getSummary(elderId));
    }
}
