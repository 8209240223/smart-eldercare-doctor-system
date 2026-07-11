import { apiClient } from "@/lib/api";

const ASSISTANT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export interface AssistantStatus {
  available: boolean;
  message: string;
  model?: string;
}

export interface AssistantChatRequest {
  message: string;
  history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface AssistantChatReply {
  content: string;
  conversationId?: string;
}

interface AssistantStreamEvent {
  type?: "delta" | "done" | "error";
  content?: string;
  model?: string;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function unwrapPayload(value: unknown): unknown {
  if (!isRecord(value)) return value;

  const code = Number(value.code);
  if (Number.isFinite(code) && code !== 0 && code !== 200) {
    throw new Error(String(value.message || value.msg || "助手服务请求失败"));
  }

  return "data" in value ? value.data : value;
}

function firstString(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export async function getAssistantStatus(): Promise<AssistantStatus> {
  const response = await apiClient.get("/api/assistant/status");
  const payload = unwrapPayload(response.data);

  if (typeof payload === "boolean") {
    return {
      available: payload,
      message: payload ? "AI 服务在线" : "AI 服务暂不可用",
    };
  }

  if (!isRecord(payload)) {
    return { available: true, message: "AI 服务在线" };
  }

  const status = firstString(payload, ["status", "state"]);
  const explicitAvailable = payload.configured ?? payload.available ?? payload.enabled ?? payload.online;
  const available =
    typeof explicitAvailable === "boolean"
      ? explicitAvailable
      : !status || ["ok", "ready", "online", "available", "up"].includes(status.toLowerCase());

  return {
    available,
    message:
      firstString(payload, ["message", "msg", "description"]) ||
      (available ? "AI 服务在线" : "AI 服务暂不可用"),
    model: firstString(payload, ["model", "modelName"]),
  };
}

export async function sendAssistantMessage(
  request: AssistantChatRequest
): Promise<AssistantChatReply> {
  const response = await apiClient.post("/api/assistant/chat", request);
  const payload = unwrapPayload(response.data);

  if (typeof payload === "string" && payload.trim()) {
    return { content: payload.trim() };
  }

  if (!isRecord(payload)) {
    throw new Error("助手返回了无法识别的内容");
  }

  const nested = isRecord(payload.message) ? payload.message : undefined;
  const content =
    firstString(payload, ["content", "reply", "answer", "text", "message"]) ||
    (nested ? firstString(nested, ["content", "text"]) : undefined);

  if (!content) throw new Error("助手没有返回有效回答");

  return {
    content,
    conversationId: firstString(payload, ["conversationId", "sessionId", "chatId"]),
  };
}

export async function streamAssistantMessage(
  request: AssistantChatRequest,
  onDelta: (chunk: string) => void,
): Promise<AssistantChatReply> {
  const token = localStorage.getItem("token");
  const tokenId = localStorage.getItem("tokenId");
  const response = await fetch(`${ASSISTANT_API_BASE_URL}/api/assistant/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tokenId ? { "X-Token-Id": tokenId } : {}),
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const raw = await response.text();
    try {
      const payload = JSON.parse(raw) as UnknownRecord;
      throw new Error(firstString(payload, ["message", "msg", "error"]) || `助手请求失败（${response.status}）`);
    } catch (error) {
      if (error instanceof Error && !error.message.startsWith("Unexpected token")) throw error;
      throw new Error(raw.trim() || `助手请求失败（${response.status}）`);
    }
  }
  if (!response.body) throw new Error("当前浏览器无法读取流式回答");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let dataLines: string[] = [];
  let content = "";

  const handleEvent = () => {
    if (dataLines.length === 0) return;
    const raw = dataLines.join("\n");
    dataLines = [];
    const event = JSON.parse(raw) as AssistantStreamEvent;
    if (event.type === "error") throw new Error(event.content || "AI 助手流式回答失败");
    if (event.type === "delta" && event.content) {
      content += event.content;
      onDelta(event.content);
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex >= 0) {
      const line = buffer.slice(0, newlineIndex).replace(/\r$/, "");
      buffer = buffer.slice(newlineIndex + 1);
      if (line === "") {
        handleEvent();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
      newlineIndex = buffer.indexOf("\n");
    }
    if (done) break;
  }
  if (buffer.trim()) {
    const line = buffer.replace(/\r$/, "");
    if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  }
  handleEvent();
  if (!content.trim()) throw new Error("助手没有返回有效回答");
  return { content: content.trim() };
}
