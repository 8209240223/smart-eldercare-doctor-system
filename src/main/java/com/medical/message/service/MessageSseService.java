package com.medical.message.service;

import com.medical.message.config.MessageNotificationProperties;
import com.medical.message.dto.MessageView;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Slf4j
@Service
public class MessageSseService {

    private final Map<Long, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();
    private final MessageNotificationProperties properties;

    public MessageSseService(MessageNotificationProperties properties) {
        this.properties = properties;
    }

    public SseEmitter connect(Long userId) {
        SseEmitter emitter = new SseEmitter(properties.getSse().getTimeoutMs());
        emitters.computeIfAbsent(userId, ignored -> new CopyOnWriteArraySet<>()).add(emitter);
        emitter.onCompletion(() -> remove(userId, emitter));
        emitter.onTimeout(() -> remove(userId, emitter));
        emitter.onError(error -> remove(userId, emitter));
        try {
            emitter.send(SseEmitter.event().name("connected").data(Map.of("userId", userId)));
        } catch (IOException exception) {
            remove(userId, emitter);
        }
        return emitter;
    }

    public void sendToUser(Long userId, MessageView message) {
        Set<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null || userEmitters.isEmpty()) {
            return;
        }
        for (SseEmitter emitter : userEmitters) {
            try {
                SseEmitter.SseEventBuilder event = SseEmitter.event()
                        .name("message")
                        .data(message);
                if (message.getId() != null) {
                    event.id(String.valueOf(message.getId()));
                }
                emitter.send(event);
            } catch (IOException exception) {
                log.debug("站内消息SSE连接已失效: userId={}", userId);
                remove(userId, emitter);
            }
        }
    }

    private void remove(Long userId, SseEmitter emitter) {
        Set<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null) {
            return;
        }
        userEmitters.remove(emitter);
        if (userEmitters.isEmpty()) {
            emitters.remove(userId, userEmitters);
        }
    }
}
