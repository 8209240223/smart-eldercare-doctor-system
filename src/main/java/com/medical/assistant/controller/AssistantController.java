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

import javax.validation.Valid;
import javax.servlet.http.HttpServletRequest;

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
}
