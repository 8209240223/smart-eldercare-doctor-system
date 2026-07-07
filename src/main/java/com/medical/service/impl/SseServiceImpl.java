package com.medical.service.impl;

import com.medical.common.utils.JwtUtils;
import com.medical.service.SseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * SSE 实时推送服务实现
 * 基于 SseEmitter + Redis Pub/Sub 实现跨实例实时推送
 */
@Service
public class SseServiceImpl implements SseService {

    private static final Logger log = LoggerFactory.getLogger(SseServiceImpl.class);

    /**
     * 在线医生SSE连接池 <doctorId, SseEmitter>
     */
    private final Map<Long, SseEmitter> emitterMap = new ConcurrentHashMap<>();

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private JwtUtils jwtUtils;

    /** Redis 预警推送频道 */
    private static final String WARNING_CHANNEL = "medical:warning:realtime";

    @Override
    public SseEmitter connect(Long doctorId, String token) {
        // 设置超时时间30分钟
        SseEmitter emitter = new SseEmitter(1800000L);

        // 保存连接
        SseEmitter old = emitterMap.put(doctorId, emitter);
        if (old != null) {
            // 关闭旧连接
            try { old.complete(); } catch (Exception ignored) {}
        }

        log.info("SSE连接建立: doctorId={}", doctorId);

        // 连接完成回调
        emitter.onCompletion(() -> {
            log.info("SSE连接完成: doctorId={}", doctorId);
            emitterMap.remove(doctorId, emitter);
        });

        // 连接超时回调
        emitter.onTimeout(() -> {
            log.info("SSE连接超时: doctorId={}", doctorId);
            emitterMap.remove(doctorId, emitter);
        });

        // 连接错误回调
        emitter.onError(e -> {
            log.error("SSE连接异常: doctorId={}, error={}", doctorId, e.getMessage());
            emitterMap.remove(doctorId, emitter);
        });

        try {
            // 发送初始连接确认消息
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("{\"code\":200,\"message\":\"连接成功\",\"doctorId\":" + doctorId + "}"));
        } catch (IOException e) {
            log.error("SSE发送初始消息失败: doctorId={}", doctorId);
            emitterMap.remove(doctorId, emitter);
        }

        return emitter;
    }

    @Override
    @Async
    public void sendWarning(Long doctorId, String eventData) {
        SseEmitter emitter = emitterMap.get(doctorId);
        if (emitter == null) {
            log.warn("医生不在线，无法推送预警: doctorId={}", doctorId);
            return;
        }

        try {
            emitter.send(SseEmitter.event()
                    .name("warning")
                    .data(eventData));
            log.debug("SSE推送预警成功: doctorId={}", doctorId);
        } catch (IOException e) {
            log.error("SSE推送预警失败，移除连接: doctorId={}", doctorId);
            emitterMap.remove(doctorId, emitter);
        }
    }

    @Override
    @Async
    public void broadcastWarning(String eventData) {
        if (emitterMap.isEmpty()) {
            log.debug("无在线医生，广播预警跳过");
            return;
        }

        // 发布到 Redis 频道，由所有实例（包含当前实例）的监听器统一下发，避免本地重复推送。
        redisTemplate.convertAndSend(WARNING_CHANNEL, eventData);
    }

    @Override
    public void removeConnection(Long doctorId) {
        SseEmitter emitter = emitterMap.remove(doctorId);
        if (emitter != null) {
            try { emitter.complete(); } catch (Exception ignored) {}
        }
    }

    /**
     * Redis 消息监听回调（接收其他实例发布的预警消息）
     * 由 MessageListenerAdapter 通过反射调用
     */
    @Override
    public void onWarningMessage(String message) {
        log.debug("收到Redis预警广播消息: {}", message);
        // 向本地所有在线医生推送
        for (Map.Entry<Long, SseEmitter> entry : emitterMap.entrySet()) {
            Long doctorId = entry.getKey();
            SseEmitter emitter = entry.getValue();
            try {
                emitter.send(SseEmitter.event()
                        .name("warning")
                        .data(message));
            } catch (IOException e) {
                log.error("Redis广播本地推送失败: doctorId={}", doctorId);
                emitterMap.remove(doctorId, emitter);
            }
        }
    }

    /**
     * 获取当前在线医生数量
     */
    public int getOnlineDoctorCount() {
        return emitterMap.size();
    }

    /**
     * 检查医生是否在线
     */
    public boolean isOnline(Long doctorId) {
        return emitterMap.containsKey(doctorId);
    }
}
