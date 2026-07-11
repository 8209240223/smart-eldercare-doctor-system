import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Bell, Camera, CheckCircle2, ClipboardList, Lock, Mail, Phone, Save, Shield } from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useChangeProfilePassword,
  useMarkAllProfileMessagesRead,
  useMarkProfileMessageRead,
  useProfileLogs,
  useProfileInfo,
  useProfileMessages,
  useProfileUnreadCount,
  useUpdateProfileInfo,
  useUploadProfileAvatar,
  type ProfileInfo,
} from "@/hooks/useApi";
import { getUserRole, useAuthStore } from "@/store/auth";

function roleLabel(role: string) {
  if (role === "admin") return "管理员";
  if (role === "nurse") return "护士";
  return "医生";
}

const phonePattern = /^1[3-9]\d{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&._-]{8,20}$/;
const allowedAvatarTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export default function Profile() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { token, userInfo, setAuth, logout } = useAuthStore();
  const role = getUserRole(userInfo);
  const userId = Number(userInfo?.userId || userInfo?.id || 0) || undefined;
  const [profile, setProfile] = useState<ProfileInfo>({
    realName: userInfo?.realName || "",
    phone: userInfo?.phone || "",
    email: String(userInfo?.email || ""),
    avatar: userInfo?.avatar || "",
  });
  const [password, setPassword] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [activeTab, setActiveTab] = useState("info");

  const { data: serverProfile } = useProfileInfo();
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useProfileMessages(1, 10, userId);
  const { data: unreadCount, refetch: refetchUnread } = useProfileUnreadCount(userId);
  const { data: logs, isLoading: logsLoading } = useProfileLogs(1, 10, userId);
  const updateInfo = useUpdateProfileInfo();
  const uploadAvatar = useUploadProfileAvatar();
  const changePassword = useChangeProfilePassword();
  const markRead = useMarkProfileMessageRead();
  const markAllRead = useMarkAllProfileMessagesRead();

  useEffect(() => {
    const source = serverProfile || userInfo;
    setProfile({
      realName: source?.realName || "",
      phone: source?.phone || "",
      email: String(source?.email || ""),
      avatar: source?.avatar || "",
    });
  }, [serverProfile, userInfo]);

  const saveProfile = async () => {
    if (!phonePattern.test(profile.phone || "")) {
      toast.error("手机号必须为11位中国大陆手机号");
      return;
    }
    if (profile.email && !emailPattern.test(profile.email)) {
      toast.error("请输入有效的邮箱地址");
      return;
    }
    try {
      await updateInfo.mutateAsync(profile);
      if (token && userInfo) {
        setAuth(token, { ...userInfo, ...profile });
      }
      toast.success("个人资料已保存");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存个人资料失败");
    }
  };

  const handleAvatarFile = async (file?: File) => {
    if (!file) return;
    if (!allowedAvatarTypes.has(file.type)) {
      toast.error("头像只支持 JPG、PNG、GIF 或 WebP 图片");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("头像文件不能超过 2MB");
      return;
    }
    try {
      const result = await uploadAvatar.mutateAsync(file);
      const nextProfile = { ...profile, avatar: result.avatar };
      setProfile(nextProfile);
      if (token && userInfo) {
        setAuth(token, { ...userInfo, avatar: result.avatar });
      }
      toast.success("头像已上传");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "头像上传失败");
    }
  };

  const clearAvatar = async () => {
    try {
      await updateInfo.mutateAsync({ avatar: "" });
      setProfile((value) => ({ ...value, avatar: "" }));
      if (token && userInfo) setAuth(token, { ...userInfo, avatar: "" });
      toast.success("头像已清除");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "清除头像失败");
    }
  };

  const submitPassword = async () => {
    if (!password.oldPassword || !password.newPassword || !password.confirmPassword) {
      toast.error("请完整填写密码信息");
      return;
    }
    if (!strongPasswordPattern.test(password.newPassword)) {
      toast.error("新密码必须为8-20位，至少包含字母和数字，可使用常见安全符号");
      return;
    }
    if (password.newPassword !== password.confirmPassword) {
      toast.error("两次输入的新密码不一致");
      return;
    }
    if (password.oldPassword === password.newPassword) {
      toast.error("新密码不能与当前密码相同");
      return;
    }
    try {
      await changePassword.mutateAsync(password);
      setPassword({ oldPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("密码已修改，请重新登录");
      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "修改密码失败");
    }
  };

  const markMessageRead = async (id?: number) => {
    if (!id) return;
    try {
      await markRead.mutateAsync(id);
      await Promise.all([refetchMessages(), refetchUnread()]);
      toast.success("消息已标记为已读");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "标记消息失败");
    }
  };

  const markAllMessages = async () => {
    try {
      await markAllRead.mutateAsync({ userId });
      await Promise.all([refetchMessages(), refetchUnread()]);
      toast.success("消息已全部标记为已读");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "标记全部消息失败");
    }
  };

  return (
    <PageShell title="个人中心" subtitle="查看和管理个人账户信息、头像、密码、操作日志和系统消息">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="未读消息" value={Number(unreadCount || 0)} icon={Bell} delay={0} onClick={() => setActiveTab("messages")} />
          <StatCard title="操作日志" value={Number(logs?.total || 0)} icon={ClipboardList} iconClassName="from-sky-400 to-sky-500" delay={1} onClick={() => setActiveTab("logs")} />
          <StatCard title="资料状态" value={profile.phone ? 1 : 0} icon={CheckCircle2} delay={2} onClick={() => setActiveTab("info")} />
          <StatCard title="账号权限" value={role === "admin" ? 3 : role === "nurse" ? 2 : 1} icon={Shield} iconClassName="from-lavender-400 to-lavender-500" delay={3} onClick={() => setActiveTab("info")} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
              <CardContent className="flex flex-col items-center p-8">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-glow">
                    <AvatarImage src={profile.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-medical-400 to-sky-400 text-3xl font-bold text-white">
                      {profile.realName?.[0] || userInfo?.username?.[0] || "用"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full bg-gradient-to-r from-medical-400 to-medical-600 p-0 text-white"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadAvatar.isPending}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(event) => handleAvatarFile(event.target.files?.[0])} />
                </div>
                {profile.avatar && <Button variant="ghost" size="sm" className="mt-3 text-red-600" onClick={clearAvatar} disabled={updateInfo.isPending}>清除头像</Button>}
                <h3 className="mt-4 text-xl font-bold text-foreground">{profile.realName || userInfo?.username || "医养用户"}</h3>
                <p className="text-sm text-muted-foreground">{roleLabel(role)}</p>
                <div className="mt-6 w-full space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-medical-500" />
                    <span className="truncate text-muted-foreground">{profile.email || userInfo?.username || "-"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-medical-500" />
                    <span className="text-muted-foreground">{profile.phone || "-"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="h-4 w-4 text-medical-500" />
                    <span className="text-muted-foreground">已登录认证</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="mb-5 bg-medical-50/70">
                    <TabsTrigger value="info">基本信息</TabsTrigger>
                    <TabsTrigger value="password">修改密码</TabsTrigger>
                    <TabsTrigger value="messages">系统消息</TabsTrigger>
                    <TabsTrigger value="logs">操作日志</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>真实姓名</Label>
                        <Input value={profile.realName || ""} onChange={(event) => setProfile((value) => ({ ...value, realName: event.target.value }))} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>手机号</Label>
                        <Input value={profile.phone || ""} onChange={(event) => setProfile((value) => ({ ...value, phone: event.target.value }))} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>邮箱</Label>
                        <Input value={profile.email || ""} onChange={(event) => setProfile((value) => ({ ...value, email: event.target.value }))} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>用户名</Label>
                        <Input value={String(userInfo?.username || "")} className="rounded-xl" disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>{role === "doctor" ? "医生ID" : role === "nurse" ? "护士ID" : "管理员ID"}</Label>
                        <Input value={userId ? String(userId) : "未分配"} className="rounded-xl bg-muted/40" readOnly />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="outline" className="rounded-xl" onClick={() => setProfile({ realName: userInfo?.realName || "", phone: userInfo?.phone || "", email: String(userInfo?.email || ""), avatar: userInfo?.avatar || "" })}>
                        重置
                      </Button>
                      <Button onClick={saveProfile} disabled={updateInfo.isPending} className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white shadow-soft hover:shadow-glow">
                        <Save className="mr-2 h-4 w-4" />
                        保存修改
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="password" className="space-y-5">
                    <div className="grid grid-cols-1 gap-5">
                      <Input type="password" value={password.oldPassword} onChange={(event) => setPassword((value) => ({ ...value, oldPassword: event.target.value }))} placeholder="旧密码" className="rounded-xl" />
                      <Input type="password" value={password.newPassword} onChange={(event) => setPassword((value) => ({ ...value, newPassword: event.target.value }))} placeholder="新密码，8-20位且至少包含字母和数字" className="rounded-xl" />
                      <Input type="password" value={password.confirmPassword} onChange={(event) => setPassword((value) => ({ ...value, confirmPassword: event.target.value }))} placeholder="确认新密码" className="rounded-xl" />
                    </div>
                    <Button onClick={submitPassword} disabled={changePassword.isPending} className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white">
                      <Lock className="mr-2 h-4 w-4" />
                      确认修改密码
                    </Button>
                  </TabsContent>

                  <TabsContent value="messages" className="space-y-4">
                    <div className="flex justify-end">
                      <Button variant="outline" className="rounded-xl" onClick={markAllMessages} disabled={markAllRead.isPending}>全部标记已读</Button>
                    </div>
                    {messagesLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : !messages?.records?.length ? (
                      <EmptyState title="暂无系统消息" description="系统通知和资料变更提醒会出现在这里" />
                    ) : (
                      <div className="space-y-3">
                        {messages.records.map((item) => (
                          <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-border/40 bg-white/60 p-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="font-semibold text-foreground">{item.title || "系统消息"}</div>
                              <p className="mt-1 text-sm text-muted-foreground">{item.content || "-"}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{item.createTime || "-"}</p>
                            </div>
                            {item.isRead === 0 && (
                              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => markMessageRead(item.id)}>标记已读</Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="logs" className="space-y-4">
                    {logsLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : !logs?.records?.length ? (
                      <EmptyState title="暂无操作日志" description="登录后产生的个人操作记录会展示在这里" />
                    ) : (
                      <div className="space-y-3">
                        {logs.records.map((item) => (
                          <div key={item.id} className="rounded-xl border border-border/40 bg-white/60 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-foreground">{item.module || "操作模块"}</span>
                              <span className="rounded-full bg-medical-50 px-2 py-1 text-xs text-medical-700">{item.operationType || item.type || "操作"}</span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{item.description || item.desc || "-"}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.createTime || "-"}{item.requestIp || item.ip ? ` · IP：${item.requestIp || item.ip}` : ""}{item.duration !== undefined ? ` · ${item.duration} ms` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageShell>
  );
}
