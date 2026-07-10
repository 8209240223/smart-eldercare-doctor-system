package com.medical.controller;

import com.medical.common.annotation.RequireRole;
import com.medical.common.annotation.OperationLog;
import com.medical.common.result.R;
import com.medical.common.utils.JwtUtils;
import com.medical.entity.HealthWarning;
import com.medical.service.SseService;
import com.medical.service.WarningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.servlet.http.HttpServletRequest;

/**
 * 健康预警控制器（含实时推送）
 */
@RestController
@RequestMapping("/api/warnings")
@RequireRole({1, 2, 3})
public class WarningController {

    @Autowired
    private WarningService warningService;

    @Autowired
    private SseService sseService;

    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping
    public R<?> list(@RequestParam(defaultValue = "1") Integer pageNum,
                     @RequestParam(defaultValue = "10") Integer pageSize,
                     @RequestParam(required = false) Integer status,
                     @RequestParam(required = false) Integer warningLevel,
                     @RequestParam(required = false) Long elderId) {
        return R.ok(warningService.list(pageNum, pageSize, status, warningLevel, elderId));
    }

    @GetMapping("/{id}")
    public R<?> detail(@PathVariable Long id, HttpServletRequest request) {
        Integer userType = (Integer) request.getAttribute("currentUserType");
        Long currentUserId = (Long) request.getAttribute("currentUserId");
        if (Integer.valueOf(2).equals(userType) && currentUserId != null) {
            warningService.markAsRead(id, currentUserId);
        }
        return R.ok(warningService.getDetail(id));
    }

    @RequireRole({2})
    @PutMapping("/{id}/handle")
    @OperationLog(module = "健康预警", type = "处理", desc = "处理健康预警")
    public R<?> handle(@PathVariable Long id, @RequestBody HealthWarning warning,
                       HttpServletRequest request) {
        warningService.handle(id, warning.getHandleResult(), currentUserId(request));
        return R.ok("处理成功");
    }

    @RequireRole({2})
    @PutMapping("/{id}/ignore")
    public R<?> ignore(@PathVariable Long id, @RequestBody HealthWarning warning) {
        warningService.ignore(id, warning.getHandleResult());
        return R.ok("已忽略");
    }

    @RequireRole({2})
    @PutMapping("/{id}/processing")
    @OperationLog(module = "健康预警", type = "处理中", desc = "将健康预警标记为处理中")
    public R<?> markProcessing(@PathVariable Long id, HttpServletRequest request) {
        warningService.markProcessing(id, currentUserId(request));
        return R.ok("已标记为处理中");
    }

    @RequireRole({2})
    @PutMapping("/{id}/read")
    @OperationLog(module = "健康预警", type = "已读", desc = "标记预警已读")
    public R<?> markAsRead(@PathVariable Long id, HttpServletRequest request) {
        warningService.markAsRead(id, currentUserId(request));
        return R.ok("已标记已读");
    }

    @RequireRole({2})
    @PostMapping
    @OperationLog(module = "健康预警", type = "新增", desc = "手动添加预警")
    public R<?> create(@RequestBody HealthWarning warning) {
        return R.ok("预警已生成", warningService.create(warning));
    }

    @GetMapping("/stats")
    public R<?> stats() {
        return R.ok(warningService.getStats());
    }

    @GetMapping("/stats/realtime")
    public R<?> realtimeStats() {
        return R.ok(warningService.getRealtimeStats());
    }

    @GetMapping("/{id}/logs")
    public R<?> eventLogs(@PathVariable Long id) {
        return R.ok(warningService.getEventLogs(id));
    }

    /**
     * SSE 实时预警推送端点
     * 通过 EventSource 连接，接收实时预警推送
     * 需要传递 token 作为查询参数进行鉴权
     */
    @GetMapping("/stream")
    public SseEmitter stream(@RequestParam String token) {
        // 从 token 中解析 doctorId
        Long doctorId = null;
        if (token != null && jwtUtils.validateToken(token)) {
            doctorId = jwtUtils.getUserIdFromToken(token);
        }
        if (doctorId == null) {
            // 返回一个立即关闭的 emitter，表示鉴权失败
            SseEmitter emitter = new SseEmitter(0L);
            try {
                emitter.send(SseEmitter.event()
                        .name("error")
                        .data("{\"code\":401,\"message\":\"Token无效\"}"));
            } catch (Exception ignored) {}
            emitter.complete();
            return emitter;
        }
        return sseService.connect(doctorId, token);
    }

    private Long currentUserId(HttpServletRequest request) {
        return (Long) request.getAttribute("currentUserId");
    }
}
