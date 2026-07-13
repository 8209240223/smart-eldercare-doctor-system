package com.medical.message.controller;

import com.medical.common.annotation.RequireRole;
import com.medical.message.dto.DirectMessageRequest;
import com.medical.message.dto.MessageContentRequest;
import com.medical.message.dto.RoleBroadcastRequest;
import com.medical.message.service.MessageService;
import com.medical.message.service.MessageSseService;
import org.junit.jupiter.api.Test;

import javax.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MessageControllerTest {

    @Test
    void senderIdentityAlwaysComesFromAuthenticatedRequest() {
        MessageService service = mock(MessageService.class);
        MessageController controller = new MessageController(service, mock(MessageSseService.class));
        HttpServletRequest servletRequest = mock(HttpServletRequest.class);
        when(servletRequest.getAttribute("currentUserId")).thenReturn(2L);
        DirectMessageRequest body = new DirectMessageRequest();
        body.setRecipientUserId(3L);
        body.setTitle("协同消息");
        body.setContent("请处理护理计划");

        controller.send(body, servletRequest);

        verify(service).sendToUser(2L, body);
    }

    @Test
    void allRolesCanUseMessageControllerButBroadcastRequiresAdmin() throws Exception {
        RequireRole classRoles = MessageController.class.getAnnotation(RequireRole.class);
        assertNotNull(classRoles);
        assertArrayEquals(new int[]{1, 2, 3}, classRoles.value());

        Method roleBroadcast = MessageController.class.getMethod(
                "broadcastRole", RoleBroadcastRequest.class, HttpServletRequest.class);
        Method allBroadcast = MessageController.class.getMethod(
                "broadcastAll", MessageContentRequest.class, HttpServletRequest.class);
        assertArrayEquals(new int[]{1}, roleBroadcast.getAnnotation(RequireRole.class).value());
        assertArrayEquals(new int[]{1}, allBroadcast.getAnnotation(RequireRole.class).value());
    }

    @Test
    void allReadUsesCurrentUserOnly() {
        MessageService service = mock(MessageService.class);
        when(service.markAllRead(3L)).thenReturn(4);
        MessageController controller = new MessageController(service, mock(MessageSseService.class));
        HttpServletRequest servletRequest = mock(HttpServletRequest.class);
        when(servletRequest.getAttribute("currentUserId")).thenReturn(3L);

        Object data = controller.markAllRead(servletRequest).getData();

        assertEquals(4, data);
        verify(service).markAllRead(3L);
    }

    @Test
    void inboxSentUnreadAndSseAreScopedToCurrentUser() {
        MessageService service = mock(MessageService.class);
        MessageSseService sseService = mock(MessageSseService.class);
        MessageController controller = new MessageController(service, sseService);
        HttpServletRequest servletRequest = mock(HttpServletRequest.class);
        when(servletRequest.getAttribute("currentUserId")).thenReturn(4L);

        controller.inbox(1, 20, 0, 5, servletRequest);
        controller.sent(1, 20, servletRequest);
        controller.unreadCount(servletRequest);
        controller.stream(servletRequest);

        verify(service).inbox(4L, 1, 20, 0, 5);
        verify(service).sent(4L, 1, 20);
        verify(service).unreadCount(4L);
        verify(sseService).connect(4L);
    }
}
