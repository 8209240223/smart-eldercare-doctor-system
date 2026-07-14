import { useEffect, useRef, useState } from "react";
import { LogIn, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  clearPendingSessionReplacedMessage,
  getPendingSessionReplacedMessage,
  SESSION_REPLACED_EVENT,
  type SessionReplacedEventDetail,
} from "@/lib/sessionEvents";
import { useAuthStore } from "@/store/auth";

const DEFAULT_MESSAGE = "账号已在其他设备登录，当前会话已退出";

export default function SessionReplacedDialog() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const showingRef = useRef(false);

  useEffect(() => {
    const showDialog = (nextMessage?: string | null) => {
      logout();
      setMessage(nextMessage?.trim() || DEFAULT_MESSAGE);
      if (!showingRef.current) {
        showingRef.current = true;
        setOpen(true);
      }
    };

    const pendingMessage = getPendingSessionReplacedMessage();
    if (pendingMessage) showDialog(pendingMessage);

    const handleSessionReplaced = (event: Event) => {
      const detail = (event as CustomEvent<SessionReplacedEventDetail>).detail;
      showDialog(detail?.message);
    };
    window.addEventListener(SESSION_REPLACED_EVENT, handleSessionReplaced);
    return () => window.removeEventListener(SESSION_REPLACED_EVENT, handleSessionReplaced);
  }, [logout]);

  const returnToLogin = () => {
    clearPendingSessionReplacedMessage();
    showingRef.current = false;
    setOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => nextOpen && setOpen(true)}>
      <DialogContent
        className="max-w-md overflow-hidden rounded-lg border-0 p-0 shadow-2xl [&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="flex items-start gap-4 border-b border-amber-100 bg-amber-50 px-6 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-xl text-slate-900">账号已在其他设备登录</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-slate-600">
              为保护账号和患者数据安全，本页面的登录状态已自动失效。
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-3 px-6 py-5">
          <p className="text-sm font-medium leading-6 text-slate-800">{message}</p>
          <p className="text-sm leading-6 text-slate-500">
            如果这不是你本人的操作，请重新登录后尽快修改密码。
          </p>
        </div>
        <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button className="w-full gap-2 bg-teal-600 text-white hover:bg-teal-700 sm:w-auto" onClick={returnToLogin}>
            <LogIn className="h-4 w-4" />
            重新登录
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
