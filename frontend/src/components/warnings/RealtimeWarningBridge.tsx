import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BellRing, Siren } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useElderDetail } from "@/hooks/useApi";
import { resolveElderName } from "@/lib/elderName";
import { notifySessionReplaced } from "@/lib/sessionEvents";
import { useAuthStore } from "@/store/auth";

interface RealtimeWarning {
  id?: number;
  warningId?: number;
  elderId?: number;
  elderName?: string;
  warningLevel?: number;
  warningTitle?: string;
  warningContent?: string;
  warningValue?: string | number;
  thresholdValue?: string | number;
  createTime?: string;
  [key: string]: unknown;
}

function levelLabel(level = 1) {
  if (level >= 3) return "高危";
  if (level === 2) return "中危";
  return "低危";
}

function playWarningTone(level = 1) {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = level >= 3 ? "square" : "sine";
    oscillator.frequency.value = level >= 3 ? 880 : level === 2 ? 660 : 520;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.32);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.34);
    oscillator.onended = () => context.close().catch(() => undefined);
  } catch {
    // 浏览器可能在用户首次交互前禁止播放声音，弹窗仍会正常显示。
  }
}

export default function RealtimeWarningBridge() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, tokenId, isAuthenticated } = useAuthStore();
  const [warningQueue, setWarningQueue] = useState<RealtimeWarning[]>([]);
  const warning = warningQueue[0] || null;
  const { data: warningElder } = useElderDetail(warning?.elderId);
  const seenIds = useRef(new Set<string>());
  const closeTimer = useRef<number | null>(null);

  const dismissCurrent = useCallback(() => {
    setWarningQueue((current) => current.slice(1));
  }, []);

  useEffect(() => {
    if (!warning) return;
    playWarningTone(Number(warning.warningLevel || 1));
    toast.warning(
      `${levelLabel(Number(warning.warningLevel || 1))}预警：${warning.warningTitle || "健康指标异常"}`,
    );
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(dismissCurrent, 10000);
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, [dismissCurrent, warning]);

  useEffect(() => {
    if (!isAuthenticated || !token || !tokenId || typeof EventSource === "undefined") return;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const source = new EventSource(`${baseUrl}/api/warnings/stream?token=${encodeURIComponent(token)}&tokenId=${encodeURIComponent(tokenId)}`);

    const receiveWarning = (event: MessageEvent) => {
      try {
        let payload: unknown = JSON.parse(event.data);
        if (typeof payload === "string") payload = JSON.parse(payload);
        const next = payload as RealtimeWarning;
        if (!next || (!next.id && !next.warningId && !next.warningTitle && !next.elderId)) return;
        const key = String(next.id || next.warningId || `${next.elderId}-${next.warningTitle}-${next.warningValue}`);
        if (seenIds.current.has(key)) return;
        seenIds.current.add(key);
        if (seenIds.current.size > 500) seenIds.current = new Set(Array.from(seenIds.current).slice(-300));

        setWarningQueue((current) => [...current, next].slice(-50));
        queryClient.invalidateQueries({ queryKey: ["warnings"] });
      } catch {
        // 忽略无法解析的心跳或非预警事件。
      }
    };

    const receiveSessionReplaced = (event: MessageEvent) => {
      try {
        let payload: unknown = JSON.parse(event.data);
        if (typeof payload === "string") payload = JSON.parse(payload);
        const messagePayload = payload as { message?: unknown; msg?: unknown };
        const message = messagePayload.msg ?? messagePayload.message;
        notifySessionReplaced(typeof message === "string" ? message : undefined);
      } catch {
        notifySessionReplaced();
      }
      source.close();
    };

    source.addEventListener("warning", receiveWarning as EventListener);
    source.addEventListener("session-replaced", receiveSessionReplaced as EventListener);
    return () => {
      source.removeEventListener("warning", receiveWarning as EventListener);
      source.removeEventListener("session-replaced", receiveSessionReplaced as EventListener);
      source.close();
    };
  }, [isAuthenticated, queryClient, token, tokenId]);

  const viewNow = () => {
    const warningId = warning?.id || warning?.warningId;
    dismissCurrent();
    navigate(warningId ? `/warnings?handle=${warningId}` : "/warnings");
  };

  return (
    <Dialog open={!!warning} onOpenChange={(open) => !open && dismissCurrent()}>
      <DialogContent className="max-w-md rounded-2xl border-red-200 bg-white/96 shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700"><Siren className="h-5 w-5" />收到实时健康预警</DialogTitle>
        </DialogHeader>
        <div className="rounded-xl border border-red-100 bg-red-50/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">{levelLabel(Number(warning?.warningLevel || 1))}</span>
            <BellRing className="h-5 w-5 text-red-500" />
          </div>
          <h3 className="mt-3 font-semibold text-foreground">{warning?.warningTitle || "健康指标异常"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">老人：{resolveElderName(warning?.elderName || warningElder?.name, warning?.elderId)}</p>
          {warning?.warningContent && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/80">{warning.warningContent}</p>}
          {(warning?.warningValue !== undefined || warning?.thresholdValue !== undefined) && <p className="mt-2 text-xs text-muted-foreground">预警值：{String(warning?.warningValue ?? "-")} · 阈值：{String(warning?.thresholdValue ?? "-")}</p>}
          {warning?.createTime && <p className="mt-1 text-xs text-muted-foreground">发生时间：{warning.createTime}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={dismissCurrent}>稍后处理</Button>
          <Button onClick={viewNow} className="bg-red-500 text-white hover:bg-red-600">立即查看</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
