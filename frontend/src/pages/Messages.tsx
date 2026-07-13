import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Bell, CheckCheck, Mail, Megaphone, Send, Users } from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useBroadcastAllMessage,
  useBroadcastRoleMessage,
  useMarkAllCollaborationMessagesRead,
  useMarkCollaborationMessageRead,
  useMessageInbox,
  useMessageRecipients,
  useMessageUnreadCount,
  useSendDirectMessage,
  useSentMessages,
  type CollaborationMessage,
} from "@/hooks/useApi";
import { getUserRole, useAuthStore } from "@/store/auth";

const messageTypes: Record<number, string> = {
  1: "预警通知",
  2: "随访提醒",
  3: "协同消息",
  4: "转诊通知",
  5: "账号通知",
};

const roleNames: Record<number, string> = { 1: "管理员", 2: "医生", 3: "护士" };

function priorityClass(priority?: number) {
  if (priority === 3) return "border-rose-200 bg-rose-50 text-rose-700";
  if (priority === 2) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}

function priorityLabel(priority?: number) {
  if (priority === 3) return "紧急";
  if (priority === 2) return "重要";
  return "普通";
}

function MessageCard({
  item,
  sent,
  onOpen,
}: {
  item: CollaborationMessage;
  sent?: boolean;
  onOpen: (item: CollaborationMessage) => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(item)}
      className={`w-full rounded-lg border p-4 text-left transition-colors hover:border-medical-200 hover:bg-medical-50/40 ${
        !sent && item.isRead === 0 ? "border-medical-200 bg-medical-50/55" : "border-border/50 bg-white/75"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {!sent && item.isRead === 0 && <span className="h-2 w-2 rounded-full bg-medical-500" />}
            <h3 className="break-words text-sm font-semibold text-foreground">{item.title || "协同消息"}</h3>
            <Badge variant="outline">{messageTypes[item.msgType || 3] || "系统消息"}</Badge>
            <Badge variant="outline" className={priorityClass(item.priority)}>{priorityLabel(item.priority)}</Badge>
          </div>
          <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
            {item.content || "-"}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{item.createTime || "-"}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>{sent ? `收件人：${item.recipientName || "系统用户"}` : `发送人：${item.senderName || "系统"}`}</span>
        {item.actionUrl && <span className="text-medical-600">可跳转查看相关业务</span>}
        {sent && item.emailStatus === 1 && <span className="text-emerald-600">邮件已发送</span>}
      </div>
    </motion.button>
  );
}

export default function Messages() {
  const navigate = useNavigate();
  const userInfo = useAuthStore((state) => state.userInfo);
  const role = getUserRole(userInfo);
  const isAdmin = role === "admin";
  const [tab, setTab] = useState("inbox");
  const [page, setPage] = useState(1);
  const [isRead, setIsRead] = useState<number | undefined>();
  const [msgType, setMsgType] = useState<number | undefined>();
  const [composeOpen, setComposeOpen] = useState(false);
  const [targetMode, setTargetMode] = useState<"direct" | "role" | "all">("direct");
  const [recipientId, setRecipientId] = useState(0);
  const [targetRole, setTargetRole] = useState(2);
  const [form, setForm] = useState({ title: "", content: "", msgType: 3, priority: 1, actionUrl: "" });

  const inbox = useMessageInbox(page, 20, isRead, msgType);
  const sent = useSentMessages(page, 20);
  const unread = useMessageUnreadCount();
  const recipients = useMessageRecipients();
  const sendDirect = useSendDirectMessage();
  const broadcastRole = useBroadcastRoleMessage();
  const broadcastAll = useBroadcastAllMessage();
  const markRead = useMarkCollaborationMessageRead();
  const markAllRead = useMarkAllCollaborationMessagesRead();
  const currentData = tab === "inbox" ? inbox.data : sent.data;
  const loading = tab === "inbox" ? inbox.isLoading : sent.isLoading;
  const pending = sendDirect.isPending || broadcastRole.isPending || broadcastAll.isPending;

  const recipientOptions = useMemo(
    () => (recipients.data || []).filter((item) => Number(item.id) !== Number(userInfo?.userId || userInfo?.id || 0)),
    [recipients.data, userInfo?.id, userInfo?.userId],
  );

  const openMessage = async (item: CollaborationMessage) => {
    if (tab === "inbox" && item.isRead === 0) {
      try {
        await markRead.mutateAsync(item.id);
      } catch {
        toast.error("消息已打开，但标记已读失败");
      }
    }
    if (item.actionUrl?.startsWith("/")) navigate(item.actionUrl);
  };

  const submitMessage = async () => {
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      msgType: form.msgType,
      priority: form.priority,
      actionUrl: form.actionUrl.trim() || undefined,
    };
    if (!payload.title || !payload.content) return toast.error("请填写消息标题和内容");
    try {
      if (targetMode === "direct") {
        if (!recipientId) return toast.error("请选择收件人");
        await sendDirect.mutateAsync({ ...payload, recipientUserId: recipientId });
      } else if (targetMode === "role") {
        await broadcastRole.mutateAsync({ ...payload, targetUserType: targetRole });
      } else {
        await broadcastAll.mutateAsync(payload);
      }
      toast.success(targetMode === "direct" ? "消息已发送" : "公告已发布");
      setComposeOpen(false);
      setForm({ title: "", content: "", msgType: 3, priority: 1, actionUrl: "" });
      setRecipientId(0);
      setTab("sent");
      setPage(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发送失败");
    }
  };

  const markEverythingRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success("全部消息已标记为已读");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败");
    }
  };

  return (
    <PageShell title="消息协同" subtitle="管理员、医生与护士之间的站内通知、业务协作和邮件提醒">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="未读消息" value={Number(unread.data || 0)} icon={Bell} delay={0} />
          <StatCard title="收件总数" value={Number(inbox.data?.total || 0)} icon={Mail} iconClassName="from-sky-400 to-sky-500" delay={1} />
          <StatCard title="已发送" value={Number(sent.data?.total || 0)} icon={Send} iconClassName="from-emerald-400 to-emerald-500" delay={2} />
        </div>

        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardContent className="p-5">
            <Tabs value={tab} onValueChange={(value) => { setTab(value); setPage(1); }}>
              <div className="flex flex-col gap-3 border-b border-border/50 pb-4 lg:flex-row lg:items-center lg:justify-between">
                <TabsList className="w-fit bg-medical-50/70">
                  <TabsTrigger value="inbox">收件箱</TabsTrigger>
                  <TabsTrigger value="sent">已发送</TabsTrigger>
                </TabsList>
                <div className="flex flex-wrap items-center gap-2">
                  {tab === "inbox" && (
                    <>
                      <select value={isRead ?? ""} onChange={(event) => { setIsRead(event.target.value === "" ? undefined : Number(event.target.value)); setPage(1); }} className="h-9 rounded-md border border-input bg-white px-3 text-sm">
                        <option value="">全部状态</option>
                        <option value="0">仅未读</option>
                        <option value="1">仅已读</option>
                      </select>
                      <select value={msgType ?? ""} onChange={(event) => { setMsgType(event.target.value === "" ? undefined : Number(event.target.value)); setPage(1); }} className="h-9 rounded-md border border-input bg-white px-3 text-sm">
                        <option value="">全部类型</option>
                        {Object.entries(messageTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <Button variant="outline" onClick={() => void markEverythingRead()} disabled={markAllRead.isPending}><CheckCheck className="mr-2 h-4 w-4" />全部已读</Button>
                    </>
                  )}
                  <Button onClick={() => setComposeOpen(true)} className="bg-medical-500 text-white hover:bg-medical-600"><Send className="mr-2 h-4 w-4" />发送消息</Button>
                </div>
              </div>

              <TabsContent value="inbox" className="mt-5 space-y-3" />
              <TabsContent value="sent" className="mt-5 space-y-3" />
              <div className="mt-5 space-y-3">
                {loading ? (
                  <div className="space-y-3"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>
                ) : !currentData?.records?.length ? (
                  <EmptyState title={tab === "inbox" ? "暂无消息" : "尚未发送消息"} description="协同通知和业务提醒会显示在这里" />
                ) : (
                  currentData.records.map((item) => <MessageCard key={item.id} item={item} sent={tab === "sent"} onOpen={openMessage} />)
                )}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4 text-sm text-muted-foreground">
                <span>共 {Number(currentData?.total || 0)} 条</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</Button>
                  <span>第 {page} / {Math.max(1, Number(currentData?.pages || 1))} 页</span>
                  <Button variant="outline" size="sm" disabled={page >= Number(currentData?.pages || 1)} onClick={() => setPage((value) => value + 1)}>下一页</Button>
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-medical-500" />发送协同消息</DialogTitle>
            <DialogDescription>站内消息会立即进入收件箱，收件人配置邮箱后会同步收到邮件通知。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {isAdmin && (
              <div className="grid grid-cols-3 gap-2">
                {(["direct", "role", "all"] as const).map((mode) => (
                  <Button key={mode} type="button" variant={targetMode === mode ? "default" : "outline"} onClick={() => setTargetMode(mode)}>
                    {mode === "direct" ? <Users className="mr-2 h-4 w-4" /> : <Megaphone className="mr-2 h-4 w-4" />}
                    {mode === "direct" ? "指定人员" : mode === "role" ? "按角色" : "全员公告"}
                  </Button>
                ))}
              </div>
            )}
            {targetMode === "direct" && (
              <div className="space-y-2">
                <Label htmlFor="message-recipient">收件人</Label>
                <select id="message-recipient" value={recipientId} onChange={(event) => setRecipientId(Number(event.target.value))} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">
                  <option value={0}>请选择收件人</option>
                  {recipientOptions.map((item) => <option key={item.id} value={item.id}>{item.realName || item.username} · {roleNames[item.userType || 2]}</option>)}
                </select>
              </div>
            )}
            {targetMode === "role" && (
              <div className="space-y-2">
                <Label htmlFor="message-role">目标角色</Label>
                <select id="message-role" value={targetRole} onChange={(event) => setTargetRole(Number(event.target.value))} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">
                  <option value={1}>管理员</option><option value={2}>医生</option><option value={3}>护士</option>
                </select>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="message-type">消息类型</Label><select id="message-type" value={form.msgType} onChange={(event) => setForm({ ...form, msgType: Number(event.target.value) })} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">{Object.entries(messageTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div className="space-y-2"><Label htmlFor="message-priority">优先级</Label><select id="message-priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"><option value={1}>普通</option><option value={2}>重要</option><option value={3}>紧急</option></select></div>
            </div>
            <div className="space-y-2"><Label htmlFor="message-title">标题</Label><Input id="message-title" maxLength={200} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="请输入消息标题" /></div>
            <div className="space-y-2"><Label htmlFor="message-content">内容</Label><textarea id="message-content" maxLength={1000} rows={6} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className="w-full resize-y rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:border-medical-300 focus:ring-2 focus:ring-medical-100" placeholder="请输入需要协同处理的内容" /></div>
            <div className="space-y-2"><Label htmlFor="message-action">站内跳转地址</Label><Input id="message-action" maxLength={500} value={form.actionUrl} onChange={(event) => setForm({ ...form, actionUrl: event.target.value })} placeholder="例如 /warnings 或 /referrals" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)} disabled={pending}>取消</Button>
            <Button onClick={() => void submitMessage()} disabled={pending} className="bg-medical-500 text-white hover:bg-medical-600">{pending ? "正在发送" : "确认发送"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
