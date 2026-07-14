package com.medical.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * SSE 实时推送服务接口
 */
public interface SseService {

    /**
     * 建立 SSE 连接
     * @param doctorId 医生ID
     * @param token JWT Token（用于鉴权）
     * @return SseEmitter
     */
    SseEmitter connect(Long doctorId, String token);

    /**
     * 向指定医生推送预警事件
     * @param doctorId 医生ID
     * @param eventData 事件数据（JSON字符串）
     */
    void sendWarning(Long doctorId, String eventData);

    /**
     * 广播预警给所有在线医生
     * @param eventData 事件数据（JSON字符串）
     */
    void broadcastWarning(String eventData);

    /**
     * 移除断开的连接
     * @param doctorId 医生ID
     */
    void removeConnection(Long doctorId);

    void notifySessionReplaced(Long doctorId);

    /**
     * Redis 消息监听回调（接收其他实例发布的预警广播消息）
     * 由 MessageListenerAdapter 通过反射调用；声明在接口上以便 @Async 生成的
     * JDK 动态代理对象也能暴露该方法。
     * @param message 预警事件数据（JSON字符串）
     */
    void onWarningMessage(String message);
}
