package com.medical.assistant.controller;

import com.medical.common.annotation.RequireRole;
import com.medical.assistant.dto.AssistantChatRequest;
import com.medical.assistant.dto.AssistantChatResponse;
import com.medical.assistant.dto.AssistantStatusResponse;
import com.medical.assistant.service.KimiAssistantService;
import com.medical.common.result.R;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.validation.Valid;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Validated
@RestController
@RequestMapping("/api/assistant")
@RequireRole({1, 2, 3})
public class AssistantController {
    private final KimiAssistantService assistantService;

    public AssistantController(KimiAssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @GetMapping("/status")
    public R<AssistantStatusResponse> status() {
        return R.ok(assistantService.status());
    }

    @PostMapping("/chat")
    public R<AssistantChatResponse> chat(@Valid @RequestBody AssistantChatRequest request,
                                         HttpServletRequest httpRequest) {
        return R.ok(assistantService.chat(
                request,
                (Long) httpRequest.getAttribute("currentUserId"),
                (Integer) httpRequest.getAttribute("currentUserType")));
    }

    @PostMapping(value = "/chat/stream", produces = "text/event-stream")
    public SseEmitter streamChat(@Valid @RequestBody AssistantChatRequest request,
                                 HttpServletRequest httpRequest,
                                 HttpServletResponse httpResponse) {
        Long userId = (Long) httpRequest.getAttribute("currentUserId");
        Integer userType = (Integer) httpRequest.getAttribute("currentUserType");
        httpResponse.setHeader("Cache-Control", "no-cache, no-transform");
        httpResponse.setHeader("X-Accel-Buffering", "no");
        httpResponse.setHeader("Connection", "keep-alive");
        SseEmitter emitter = new SseEmitter(180_000L);
        CompletableFuture.runAsync(() -> {
            try {
                assistantService.streamChat(request, userId, userType,
                        chunk -> sendEvent(emitter, "delta", chunk, null));
                sendEvent(emitter, "done", null, assistantService.status().getModel());
                emitter.complete();
            } catch (Exception e) {
                try {
                    sendEvent(emitter, "error", e.getMessage(), null);
                    emitter.complete();
                } catch (Exception ignored) {
                    emitter.completeWithError(e);
                }
            }
        });
        return emitter;
    }

    private void sendEvent(SseEmitter emitter, String type, String content, String model) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", type);
        if (content != null) {
            payload.put("content", content);
        }
        if (model != null) {
            payload.put("model", model);
        }
        try {
            emitter.send(SseEmitter.event().data(payload));
        } catch (IOException e) {
            throw new IllegalStateException("流式连接已断开", e);
        }
    }
}
