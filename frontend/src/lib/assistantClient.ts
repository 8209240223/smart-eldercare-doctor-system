import { apiClient } from "@/lib/api";

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
