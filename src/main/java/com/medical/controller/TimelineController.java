package com.medical.controller;

import com.medical.common.annotation.OperationLog;
import com.medical.common.annotation.RequireRole;
import com.medical.common.result.R;
import com.medical.service.TimelineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.regex.Pattern;

/**
 * 时间轴控制器
 */
@RestController
@RequestMapping("/api/timeline")
@RequireRole({1, 2, 3})
public class TimelineController {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Pattern DATE_PATTERN = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");

    @Autowired
    private TimelineService timelineService;

    @GetMapping("/{elderId}")
    public R<?> getTimeline(@PathVariable Long elderId,
                            @RequestParam(required = false) String startDate,
                            @RequestParam(required = false) String endDate,
                            @RequestParam(required = false) Integer eventType,
                            @RequestParam(defaultValue = "1") Integer pageNum,
                            @RequestParam(defaultValue = "20") Integer pageSize) {
        if (elderId == null || elderId <= 0) {
            return R.fail(400, "老人ID不合法");
        }
        if (pageNum == null || pageNum <= 0) pageNum = 1;
        if (pageSize == null || pageSize <= 0) pageSize = 20;
        if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;
        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            return R.fail(400, "日期格式必须为 yyyy-MM-dd");
        }
        return R.ok(timelineService.getTimeline(elderId, startDate, endDate, eventType, pageNum, pageSize));
    }

    @GetMapping("/{elderId}/summary")
    public R<?> getSummary(@PathVariable Long elderId,
                           @RequestParam(required = false) String startDate,
                           @RequestParam(required = false) String endDate,
                           @RequestParam(required = false) Integer eventType) {
        if (elderId == null || elderId <= 0) {
            return R.fail(400, "老人ID不合法");
        }
        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            return R.fail(400, "日期格式必须为 yyyy-MM-dd");
        }
        return R.ok(timelineService.getSummary(elderId, startDate, endDate, eventType));
    }

    private boolean isValidDate(String date) {
        return date == null || date.isEmpty() || DATE_PATTERN.matcher(date).matches();
    }
}
