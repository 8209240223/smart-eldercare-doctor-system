package com.medical.controller;

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
        // 获取当前医生ID（可选）
        try {
            String token = getTokenFromRequest(request);
            if (token != null) {
                Long doctorId = jwtUtils.getUserIdFromToken(token);
                if (doctorId != null) {
                    warningService.markAsRead(id, doctorId);
                }
            }
        } catch (Exception ignored) {}
        return R.ok(warningService.getDetail(id));
    }

    @PutMapping("/{id}/handle")
    @OperationLog(module = "健康预警", type = "处理", desc = "处理健康预警")
    public R<?> handle(@PathVariable Long id, @RequestBody HealthWarning warning) {
        warningService.handle(id, warning.getHandleResult(), warning.getDoctorId());
        return R.ok("处理成功");
    }

    @PutMapping("/{id}/ignore")
    public R<?> ignore(@PathVariable Long id, @RequestBody HealthWarning warning) {
        warningService.ignore(id, warning.getHandleResult());
        return R.ok("已忽略");
    }

    @PutMapping("/{id}/processing")
    @OperationLog(module = "健康预警", type = "处理中", desc = "将健康预警标记为处理中")
    public R<?> markProcessing(@PathVariable Long id, @RequestBody(required = false) HealthWarning warning) {
        Long doctorId = warning != null ? warning.getDoctorId() : null;
        warningService.markProcessing(id, doctorId);
        return R.ok("已标记为处理中");
    }

    @PutMapping("/{id}/read")
    @OperationLog(module = "健康预警", type = "已读", desc = "标记预警已读")
    public R<?> markAsRead(@PathVariable Long id, @RequestBody(required = false) HealthWarning warning) {
        Long doctorId = warning != null ? warning.getDoctorId() : null;
        warningService.markAsRead(id, doctorId);
        return R.ok("已标记已读");
    }

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

    /**
     * 从请求中提取 Token
     */
    private String getTokenFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
}
