import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import type { CollaborationMessage } from "@/hooks/useApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function MessageRealtimeBridge() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, tokenId, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !token || !tokenId) return;
    const controller = new AbortController();
    let reconnectTimer: number | undefined;

    const connect = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/messages/stream`, {
          headers: {
            Accept: "text/event-stream",
            Authorization: `Bearer ${token}`,
            "X-Token-Id": tokenId,
          },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error("消息实时连接失败");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let eventName = "message";
        let dataLines: string[] = [];

        const dispatch = () => {
          if (!dataLines.length) return;
          const raw = dataLines.join("\n");
          dataLines = [];
          if (eventName !== "message") return;
          try {
            const message = JSON.parse(raw) as CollaborationMessage;
            queryClient.invalidateQueries({ queryKey: ["messages"] });
            toast.info(message.title || "收到新的协同消息", {
              description: message.content,
              action: { label: "查看", onClick: () => navigate("/messages") },
            });
          } catch {
            // 忽略连接心跳和无法解析的非消息事件。
          }
        };

        while (!controller.signal.aborted) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let newline = buffer.indexOf("\n");
          while (newline >= 0) {
            const line = buffer.slice(0, newline).replace(/\r$/, "");
            buffer = buffer.slice(newline + 1);
            if (!line) dispatch();
            else if (line.startsWith("event:")) eventName = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
            newline = buffer.indexOf("\n");
          }
        }
        if (!controller.signal.aborted) reconnectTimer = window.setTimeout(connect, 3000);
      } catch {
        if (!controller.signal.aborted) reconnectTimer = window.setTimeout(connect, 5000);
      }
    };

    void connect();
    return () => {
      controller.abort();
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
    };
  }, [isAuthenticated, navigate, queryClient, token, tokenId]);

  return null;
}
