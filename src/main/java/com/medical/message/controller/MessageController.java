package com.medical.message.controller;

import com.medical.common.annotation.RequireRole;
import com.medical.common.exception.BusinessException;
import com.medical.common.result.R;
import com.medical.message.dto.DirectMessageRequest;
import com.medical.message.dto.MessageContentRequest;
import com.medical.message.dto.RoleBroadcastRequest;
import com.medical.message.service.MessageService;
import com.medical.message.service.MessageSseService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

@RestController
@RequestMapping("/api/messages")
@RequireRole({1, 2, 3})
public class MessageController {

    private final MessageService messageService;
    private final MessageSseService sseService;

    public MessageController(MessageService messageService, MessageSseService sseService) {
        this.messageService = messageService;
        this.sseService = sseService;
    }

    @GetMapping("/inbox")
    public R<?> inbox(@RequestParam(defaultValue = "1") int pageNum,
                      @RequestParam(defaultValue = "20") int pageSize,
                      @RequestParam(required = false) Integer isRead,
                      @RequestParam(required = false) Integer msgType,
                      HttpServletRequest request) {
        return R.ok(messageService.inbox(currentUserId(request), pageNum, pageSize, isRead, msgType));
    }

    @GetMapping("/sent")
    public R<?> sent(@RequestParam(defaultValue = "1") int pageNum,
                     @RequestParam(defaultValue = "20") int pageSize,
                     HttpServletRequest request) {
        return R.ok(messageService.sent(currentUserId(request), pageNum, pageSize));
    }

    @GetMapping("/unread-count")
    public R<?> unreadCount(HttpServletRequest request) {
        return R.ok(messageService.unreadCount(currentUserId(request)));
    }

    @GetMapping("/recipients")
    public R<?> recipients(@RequestParam(required = false) Integer userType,
                           @RequestParam(required = false) String keyword) {
        return R.ok(messageService.listRecipients(userType, keyword));
    }

    @PostMapping("/send")
    public R<?> send(@Valid @RequestBody DirectMessageRequest body, HttpServletRequest request) {
        return R.ok("消息已发送", messageService.sendToUser(currentUserId(request), body));
    }

    @PostMapping("/broadcast/role")
    @RequireRole({1})
    public R<?> broadcastRole(@Valid @RequestBody RoleBroadcastRequest body, HttpServletRequest request) {
        return R.ok("角色消息已发送",
                messageService.broadcastToRole(currentUserId(request), body.getTargetUserType(), body));
    }

    @PostMapping("/broadcast/all")
    @RequireRole({1})
    public R<?> broadcastAll(@Valid @RequestBody MessageContentRequest body, HttpServletRequest request) {
        return R.ok("全员消息已发送", messageService.broadcastToAll(currentUserId(request), body));
    }

    @PutMapping("/{id}/read")
    public R<?> markRead(@PathVariable Long id, HttpServletRequest request) {
        messageService.markRead(currentUserId(request), id);
        return R.ok("已标记为已读", null);
    }

    @PutMapping("/read-all")
    public R<?> markAllRead(HttpServletRequest request) {
        return R.ok("全部消息已标记为已读", messageService.markAllRead(currentUserId(request)));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(HttpServletRequest request) {
        return sseService.connect(currentUserId(request));
    }

    private Long currentUserId(HttpServletRequest request) {
        Object userId = request.getAttribute("currentUserId");
        if (userId == null) {
            throw new BusinessException(401, "未登录或Token无效");
        }
        return Long.valueOf(userId.toString());
    }
}
