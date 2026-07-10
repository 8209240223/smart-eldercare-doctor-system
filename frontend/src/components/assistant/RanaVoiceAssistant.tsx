import * as Dialog from "@radix-ui/react-dialog";
import { Bot, CircleAlert, LoaderCircle, Mic, MicOff, Send, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AssistantPet, type PetAction } from "./AssistantPet";
import { useAssistantSpeech } from "@/hooks/useAssistantSpeech";
import { getAssistantStatus, sendAssistantMessage } from "@/lib/assistantClient";
import { useAuthStore } from "@/store/auth";
import "./ranaAssistant.css";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  error?: boolean;
}

const QUICK_QUESTIONS = ["今天有哪些重点健康事项？", "帮我整理高风险老人关注重点", "一次规范随访需要记录什么？"];
const IDLE_ACTIONS: PetAction[] = ["waving", "jumping", "review", "waiting", "runningLeft", "runningRight"];
const PET_WIDTH = 112;
const PET_HEIGHT = 122;
const PET_MARGIN = 8;

interface PetPosition {
  x: number;
  y: number;
}

function clampPetPosition(position: PetPosition): PetPosition {
  return {
    x: Math.min(Math.max(position.x, PET_MARGIN), Math.max(PET_MARGIN, window.innerWidth - PET_WIDTH - PET_MARGIN)),
    y: Math.min(Math.max(position.y, PET_MARGIN), Math.max(PET_MARGIN, window.innerHeight - PET_HEIGHT - PET_MARGIN)),
  };
}

function initialPetPosition(): PetPosition {
  const fallback = {
    x: window.innerWidth - PET_WIDTH - 24,
    y: window.innerHeight - PET_HEIGHT - 18,
  };
  try {
    const stored = window.localStorage.getItem("rana-assistant-position");
    if (!stored) return clampPetPosition(fallback);
    const parsed = JSON.parse(stored) as Partial<PetPosition>;
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return clampPetPosition(fallback);
    return clampPetPosition({ x: parsed.x, y: parsed.y });
  } catch {
    return clampPetPosition(fallback);
  }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

function messageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function RanaVoiceAssistant() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<PetAction>("idle");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [statusText, setStatusText] = useState("医疗工作助手");
  const [error, setError] = useState<string | null>(null);
  const [petPosition, setPetPosition] = useState<PetPosition>(initialPetPosition);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "你好，我是乐奈助手。今天需要我帮你处理什么？" },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const openAfterWave = useRef(false);
  const petPositionRef = useRef(petPosition);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const speech = useAssistantSpeech({
    onTranscript: setInput,
    onListeningChange: (listening) => setAction(listening ? "waiting" : "idle"),
    onRecognitionError: (message) => {
      setError(message);
      setAction("failed");
    },
  });

  const checkStatus = useCallback(async () => {
    setStatusText("正在连接");
    try {
      const status = await getAssistantStatus();
      setOnline(status.available);
      setStatusText(status.message);
    } catch {
      setOnline(false);
      setStatusText("AI 服务暂时无法连接");
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void checkStatus();
  }, [checkStatus, isAuthenticated]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reducedMotion ? "auto" : "smooth" });
  }, [messages, open, reducedMotion, sending]);

  useEffect(() => {
    if (!isAuthenticated || open || reducedMotion || action !== "idle") return;
    const timer = window.setTimeout(() => {
      setAction(IDLE_ACTIONS[Math.floor(Math.random() * IDLE_ACTIONS.length)]);
    }, 12000 + Math.random() * 10000);
    return () => window.clearTimeout(timer);
  }, [action, isAuthenticated, open, reducedMotion]);

  useEffect(() => {
    if (action !== "runningLeft" && action !== "runningRight") return;
    if (dragRef.current) return;
    const timer = window.setTimeout(() => setAction("idle"), 1050);
    return () => window.clearTimeout(timer);
  }, [action]);

  useEffect(() => {
    petPositionRef.current = petPosition;
    window.localStorage.setItem("rana-assistant-position", JSON.stringify(petPosition));
  }, [petPosition]);

  useEffect(() => {
    const handleResize = () => setPetPosition((current) => clampPetPosition(current));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePetPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePetPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;
    drag.moved = true;
    setAction(deltaX < 0 ? "runningLeft" : "runningRight");
    setPetPosition(clampPetPosition({ x: drag.originX + deltaX, y: drag.originY + deltaY }));
  };

  const finishPetDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    if (drag.moved) {
      suppressClickRef.current = true;
      window.localStorage.setItem("rana-assistant-position", JSON.stringify(petPositionRef.current));
      setAction("idle");
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
  };

  const completeAction = useCallback(() => {
    if (openAfterWave.current) {
      openAfterWave.current = false;
      setOpen(true);
      void checkStatus();
    }
    setAction("idle");
  }, [checkStatus]);

  const submit = async (raw: string) => {
    const text = raw.trim();
    if (!text || sending) return;
    speech.stopListening();
    setInput("");
    setError(null);
    setSending(true);
    setAction("running");
    setMessages((current) => [...current, { id: messageId(), role: "user", content: text }]);
    try {
      const history = messages.slice(-12).map(({ role, content }) => ({
        role,
        content: content.slice(0, 1000),
      }));
      const reply = await sendAssistantMessage({ message: text, history });
      setMessages((current) => [...current, { id: messageId(), role: "assistant", content: reply.content }]);
      setOnline(true);
      setStatusText("AI 服务在线");
      setAction(Math.random() > 0.5 ? "review" : "jumping");
      speech.speak(reply.content);
    } catch (requestError) {
      const textMessage = requestError instanceof Error ? requestError.message : "助手暂时无法回答";
      setError(textMessage);
      setMessages((current) => [...current, { id: messageId(), role: "assistant", content: textMessage, error: true }]);
      setOnline(false);
      setStatusText("AI 服务暂时无法连接");
      setAction("failed");
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <button
        type="button"
        className="rana-pet-button"
        data-pet-action={action}
        style={{ left: petPosition.x, top: petPosition.y }}
        aria-label="打开乐奈语音助手"
        title="乐奈助手"
        onPointerDown={handlePetPointerDown}
        onPointerMove={handlePetPointerMove}
        onPointerUp={finishPetDrag}
        onPointerCancel={finishPetDrag}
        onClick={() => {
          if (suppressClickRef.current) return;
          openAfterWave.current = true;
          setAction("waving");
        }}
      >
        <span className="rana-pet-halo" />
        <AssistantPet action={action} reducedMotion={reducedMotion} onActionComplete={completeAction} />
        <span className="rana-pet-online" />
      </button>

      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            speech.stopListening();
            setAction("idle");
            setError(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="rana-assistant-overlay" />
          <Dialog.Content className="rana-assistant-dialog" aria-describedby={undefined}>
            <header className="rana-assistant-header">
              <div>
                <Dialog.Title className="text-base font-semibold text-white">乐奈助手</Dialog.Title>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-white/85">
                  <span className={`h-1.5 w-1.5 rounded-full ${online === false ? "bg-rose-200" : "bg-emerald-200"}`} />
                  {statusText}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rana-icon-button"
                  onClick={speech.toggleSpeech}
                  disabled={!speech.synthesisSupported}
                  aria-label={speech.speechEnabled ? "关闭语音播报" : "开启语音播报"}
                  title={speech.speechEnabled ? "关闭语音播报" : "开启语音播报"}
                >
                  {speech.speechEnabled ? <Volume2 /> : <VolumeX />}
                </button>
                <Dialog.Close asChild>
                  <button type="button" className="rana-icon-button" aria-label="关闭助手" title="关闭"><X /></button>
                </Dialog.Close>
              </div>
            </header>

            <div ref={listRef} className="rana-message-list" aria-live="polite">
              {messages.map((message) => (
                <div key={message.id} className={`flex items-end gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && (
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${message.error ? "border-rose-100 bg-rose-50 text-rose-500" : "border-medical-100 bg-medical-50 text-medical-600"}`}>
                      {message.error ? <CircleAlert className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </span>
                  )}
                  <div className={`max-w-[82%] whitespace-pre-wrap break-words rounded-lg px-3.5 py-2.5 text-sm leading-6 shadow-sm ${message.role === "user" ? "rounded-br-sm bg-medical-500 text-white" : message.error ? "rounded-bl-sm border border-rose-100 bg-rose-50 text-rose-700" : "rounded-bl-sm border border-slate-100 bg-white text-slate-700"}`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex items-end gap-2 text-xs text-slate-500">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-medical-100 bg-medical-50 text-medical-600"><Bot className="h-3.5 w-3.5" /></span>
                  <span className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3.5 py-3"><LoaderCircle className="h-3.5 w-3.5 animate-spin text-medical-500" />正在思考</span>
                </div>
              )}
            </div>

            <footer className="border-t border-slate-100 bg-white p-4 pt-3">
              <div className="rana-quick-list mb-3 flex gap-2 overflow-x-auto pb-1">
                {QUICK_QUESTIONS.map((question) => (
                  <button key={question} type="button" className="shrink-0 rounded-full border border-medical-100 bg-medical-50 px-3 py-1.5 text-xs text-medical-700 hover:bg-medical-100 disabled:opacity-50" onClick={() => void submit(question)} disabled={sending}>
                    {question}
                  </button>
                ))}
              </div>
              {error && <div className="mb-2 flex items-center gap-2 truncate text-xs text-rose-600"><CircleAlert className="h-3.5 w-3.5 shrink-0" />{error}</div>}
              <div className="flex items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 focus-within:border-medical-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-medical-100">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void submit(input);
                    }
                  }}
                  rows={1}
                  className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-slate-700 outline-none"
                  placeholder={speech.isListening ? "正在聆听..." : "输入消息"}
                  disabled={sending}
                />
                <button type="button" className={`rana-composer-button ${speech.isListening ? "bg-rose-500 text-white" : "bg-white text-slate-600"}`} onClick={speech.isListening ? speech.stopListening : speech.startListening} disabled={!speech.recognitionSupported || sending} aria-label={speech.isListening ? "停止语音输入" : "开始语音输入"} title="语音输入">
                  {speech.recognitionSupported ? <Mic /> : <MicOff />}
                </button>
                <button type="button" className="rana-composer-button bg-medical-500 text-white hover:bg-medical-600 disabled:bg-slate-200" onClick={() => void submit(input)} disabled={!input.trim() || sending} aria-label="发送消息" title="发送">
                  {sending ? <LoaderCircle className="animate-spin" /> : <Send />}
                </button>
              </div>
            </footer>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
