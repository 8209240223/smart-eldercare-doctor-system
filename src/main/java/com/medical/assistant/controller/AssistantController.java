package com.medical.assistant.controller;

import com.medical.assistant.dto.AssistantActionResponse;
import com.medical.assistant.dto.AssistantChatRequest;
import com.medical.assistant.dto.AssistantChatResponse;
import com.medical.assistant.dto.AssistantStatusResponse;
import com.medical.assistant.service.KimiAssistantService;
import com.medical.common.annotation.RequireRole;
import com.medical.common.result.R;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicBoolean;

@Validated
@RestController
@RequestMapping("/api/assistant")
@RequireRole({1, 2, 3})
public class AssistantController {

    private final KimiAssistantService assistantService;
    private final Executor assistantExecutor;

    public AssistantController(KimiAssistantService assistantService,
                               @Qualifier("assistantExecutor") Executor assistantExecutor) {
        this.assistantService = assistantService;
        this.assistantExecutor = assistantExecutor;
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
                currentUserId(httpRequest),
                currentUserType(httpRequest),
                authorization(httpRequest),
                tokenId(httpRequest)));
    }

    @PostMapping(value = "/chat/stream", produces = "text/event-stream")
    public SseEmitter streamChat(@Valid @RequestBody AssistantChatRequest request,
                                 HttpServletRequest httpRequest,
                                 HttpServletResponse httpResponse) {
        Long userId = currentUserId(httpRequest);
        Integer userType = currentUserType(httpRequest);
        String authorization = authorization(httpRequest);
        String tokenId = tokenId(httpRequest);
        httpResponse.setHeader("Cache-Control", "no-cache, no-transform");
        httpResponse.setHeader("X-Accel-Buffering", "no");
        httpResponse.setHeader("Connection", "keep-alive");

        SseEmitter emitter = new SseEmitter(180_000L);
        AtomicBoolean closed = new AtomicBoolean(false);
        emitter.onCompletion(() -> closed.set(true));
        emitter.onTimeout(() -> closed.set(true));
        emitter.onError(error -> closed.set(true));

        assistantExecutor.execute(() -> {
            try {
                assistantService.streamChat(request, userId, userType, authorization, tokenId, (type, payload) -> {
                    if (!closed.get()) {
                        sendEvent(emitter, type, payload);
                    }
                });
                if (closed.compareAndSet(false, true)) {
                    emitter.complete();
                }
            } catch (Exception exception) {
                if (!closed.get()) {
                    try {
                        sendEvent(emitter, "error", Map.of(
                                "content", safeMessage(exception),
                                "code", errorCode(exception)));
                        closed.set(true);
                        emitter.complete();
                    } catch (Exception sendError) {
                        closed.set(true);
                        emitter.completeWithError(sendError);
                    }
                }
            }
        });
        return emitter;
    }

    @PostMapping("/actions/{token}/confirm")
    public R<AssistantActionResponse> confirmAction(@PathVariable String token,
                                                     HttpServletRequest request) {
        return R.ok("操作已执行", assistantService.confirmAction(
                token,
                currentUserId(request),
                currentUserType(request),
                authorization(request),
                tokenId(request)));
    }

    @DeleteMapping("/actions/{token}")
    public R<?> cancelAction(@PathVariable String token, HttpServletRequest request) {
        assistantService.cancelAction(token, currentUserId(request), currentUserType(request));
        return R.ok("已取消待确认操作");
    }

    private void sendEvent(SseEmitter emitter, String type, Map<String, Object> payload) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("type", type);
        if (payload != null) {
            event.putAll(payload);
        }
        try {
            emitter.send(SseEmitter.event().name(type).data(event));
        } catch (IOException exception) {
            throw new IllegalStateException("流式连接已断开", exception);
        }
    }

    private Long currentUserId(HttpServletRequest request) {
        return (Long) request.getAttribute("currentUserId");
    }

    private Integer currentUserType(HttpServletRequest request) {
        return (Integer) request.getAttribute("currentUserType");
    }

    private String authorization(HttpServletRequest request) {
        return request.getHeader("Authorization");
    }

    private String tokenId(HttpServletRequest request) {
        return request.getHeader("X-Token-Id");
    }

    private String safeMessage(Exception exception) {
        if (exception instanceof com.medical.common.exception.BusinessException businessException) {
            return businessException.getMessage();
        }
        return "AI 助手暂时不可用，请稍后重试";
    }

    private int errorCode(Exception exception) {
        if (exception instanceof com.medical.common.exception.BusinessException businessException) {
            return businessException.getCode();
        }
        return 500;
    }
}
