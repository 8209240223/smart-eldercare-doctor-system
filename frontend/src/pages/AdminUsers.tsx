import { useMemo, useState } from "react";
import { Ban, CheckCircle2, KeyRound, LogOut, Plus, Search, ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useAdminApproveUser,
  useAdminBanUser,
  useAdminCreateUser,
  useAdminForceLogout,
  useAdminRejectUser,
  useAdminResetPassword,
  useAdminUnbanUser,
  useAdminUsers,
  useAdminUserStatistics,
  type AdminUserRecord,
} from "@/hooks/useApi";
import { useAuthStore } from "@/store/auth";

const roleNames: Record<number, string> = { 1: "管理员", 2: "医生", 3: "护士" };
const statusNames: Record<number, string> = { 0: "已封禁", 1: "正常", 2: "待审核" };

const emptyCreateForm = {
  username: "",
  realName: "",
  phone: "",
  email: "",
  userType: 2,
  password: "",
  confirmPassword: "",
};

function statusClass(status?: number) {
  if (status === 1) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === 2) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

export default function AdminUsers() {
  const currentUser = useAuthStore((state) => state.userInfo);
  const currentUserId = Number(currentUser?.userId || currentUser?.id || 0);
  const [page, setPage] = useState(1);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [userType, setUserType] = useState<number | undefined>();
  const [status, setStatus] = useState<number | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [resetTarget, setResetTarget] = useState<AdminUserRecord | null>(null);
  const [resetPassword, setResetPassword] = useState({ newPassword: "", confirmPassword: "" });
  const [confirmAction, setConfirmAction] = useState<{ kind: "approve" | "reject" | "ban" | "unban" | "logout"; user: AdminUserRecord } | null>(null);

  const users = useAdminUsers(page, 10, keyword, userType, status);
  const stats = useAdminUserStatistics();
  const createUser = useAdminCreateUser();
  const approveUser = useAdminApproveUser();
  const rejectUser = useAdminRejectUser();
  const banUser = useAdminBanUser();
  const unbanUser = useAdminUnbanUser();
  const forceLogout = useAdminForceLogout();
  const resetUserPassword = useAdminResetPassword();
  const records = users.data?.records || [];
  const totalPages = Math.max(1, Number(users.data?.pages || 1));
  const actionPending = approveUser.isPending || rejectUser.isPending || banUser.isPending || unbanUser.isPending || forceLogout.isPending;

  const confirmText = useMemo(() => {
    if (!confirmAction) return { title: "确认操作", description: "", button: "确认", destructive: false };
    const name = confirmAction.user.realName || confirmAction.user.username || `账号 ${confirmAction.user.id}`;
    if (confirmAction.kind === "approve") return { title: "通过账号审核", description: `通过 ${name} 的注册申请后，该账号可以立即登录系统。`, button: "通过审核", destructive: false };
    if (confirmAction.kind === "reject") return { title: "驳回账号审核", description: `驳回 ${name} 的注册申请后，该账号将保持不可登录状态。`, button: "驳回申请", destructive: true };
    if (confirmAction.kind === "ban") return { title: "封禁账号", description: `封禁 ${name} 后会立即撤销其当前会话，已关联的老人档案和业务记录不会删除。`, button: "确认封禁", destructive: true };
    if (confirmAction.kind === "unban") return { title: "解封账号", description: `解封 ${name} 后，该账号可以重新登录系统。`, button: "确认解封", destructive: false };
    return { title: "强制下线", description: `撤销 ${name} 当前登录会话，不修改账号状态和任何业务数据。`, button: "强制下线", destructive: true };
  }, [confirmAction]);

  const submitCreate = async () => {
    if (!createForm.username.trim() || !createForm.realName.trim() || !createForm.phone.trim()) return toast.error("请完整填写用户名、姓名和手机号");
    if (createForm.password !== createForm.confirmPassword) return toast.error("两次输入的密码不一致");
    try {
      await createUser.mutateAsync({ ...createForm, username: createForm.username.trim(), realName: createForm.realName.trim(), phone: createForm.phone.trim(), email: createForm.email.trim() || undefined });
      toast.success("账号已创建并启用");
      setCreateOpen(false);
      setCreateForm(emptyCreateForm);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建账号失败");
    }
  };

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.kind === "approve") await approveUser.mutateAsync(confirmAction.user.id);
      else if (confirmAction.kind === "reject") await rejectUser.mutateAsync(confirmAction.user.id);
      else if (confirmAction.kind === "ban") await banUser.mutateAsync(confirmAction.user.id);
      else if (confirmAction.kind === "unban") await unbanUser.mutateAsync(confirmAction.user.id);
      else await forceLogout.mutateAsync(confirmAction.user.id);
      toast.success(confirmText.button + "成功");
      setConfirmAction(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败");
    }
  };

  const submitResetPassword = async () => {
    if (!resetTarget) return;
    if (resetPassword.newPassword !== resetPassword.confirmPassword) return toast.error("两次输入的密码不一致");
    try {
      await resetUserPassword.mutateAsync({ id: resetTarget.id, ...resetPassword });
      toast.success("密码已重置，目标账号当前会话已失效");
      setResetTarget(null);
      setResetPassword({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "重置密码失败");
    }
  };

  return (
    <PageShell title="用户治理" subtitle="管理管理员、医生和护士账号，审核注册并控制登录状态">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="全部账号" value={Number(stats.data?.total || 0)} icon={Users} delay={0} />
          <StatCard title="正常账号" value={Number(stats.data?.normal || 0)} icon={UserCheck} iconClassName="from-emerald-400 to-emerald-500" delay={1} />
          <StatCard title="待审核" value={Number(stats.data?.pending || 0)} icon={ShieldCheck} iconClassName="from-amber-400 to-amber-500" delay={2} />
          <StatCard title="已封禁" value={Number(stats.data?.banned || 0)} icon={UserX} iconClassName="from-rose-400 to-rose-500" delay={3} />
        </div>

        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 border-b border-border/50 pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-wrap gap-2">
                <div className="relative min-w-[220px] flex-1 lg:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { setKeyword(keywordInput); setPage(1); } }} className="pl-9" placeholder="搜索用户名、姓名或手机号" /></div>
                <select value={userType ?? ""} onChange={(event) => { setUserType(event.target.value === "" ? undefined : Number(event.target.value)); setPage(1); }} className="h-10 rounded-md border border-input bg-white px-3 text-sm"><option value="">全部角色</option><option value={1}>管理员</option><option value={2}>医生</option><option value={3}>护士</option></select>
                <select value={status ?? ""} onChange={(event) => { setStatus(event.target.value === "" ? undefined : Number(event.target.value)); setPage(1); }} className="h-10 rounded-md border border-input bg-white px-3 text-sm"><option value="">全部状态</option><option value={1}>正常</option><option value={2}>待审核</option><option value={0}>已封禁</option></select>
                <Button variant="outline" onClick={() => { setKeyword(keywordInput); setPage(1); }}><Search className="mr-2 h-4 w-4" />查询</Button>
              </div>
              <Button onClick={() => setCreateOpen(true)} className="bg-medical-500 text-white hover:bg-medical-600"><Plus className="mr-2 h-4 w-4" />创建账号</Button>
            </div>

            <div className="mt-4">
              {users.isLoading ? <Skeleton className="h-72 w-full" /> : !records.length ? <EmptyState title="没有匹配账号" description="调整筛选条件或创建新的工作账号" /> : (
                <Table>
                  <TableHeader><TableRow><TableHead>账号</TableHead><TableHead>角色</TableHead><TableHead>状态</TableHead><TableHead>联系方式</TableHead><TableHead>最近登录</TableHead><TableHead className="min-w-[300px]">操作</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {records.map((user) => {
                      const self = user.id === currentUserId;
                      return (
                        <TableRow key={user.id}>
                          <TableCell><div className="font-semibold text-foreground">{user.realName || user.username}</div><div className="text-xs text-muted-foreground">{user.username} · ID {user.id}</div></TableCell>
                          <TableCell>{roleNames[user.userType || 2]}</TableCell>
                          <TableCell><Badge variant="outline" className={statusClass(user.status)}>{statusNames[user.status ?? 0]}</Badge></TableCell>
                          <TableCell><div>{user.phone || "-"}</div><div className="text-xs text-muted-foreground">{user.email || "未填写邮箱"}</div></TableCell>
                          <TableCell><div>{user.lastLoginTime || "尚未登录"}</div><div className="text-xs text-muted-foreground">{user.lastLoginIp || "-"}</div></TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {user.status === 2 && <><Button size="sm" onClick={() => setConfirmAction({ kind: "approve", user })}><CheckCircle2 className="mr-1 h-4 w-4" />通过</Button><Button size="sm" variant="outline" className="text-rose-600" onClick={() => setConfirmAction({ kind: "reject", user })}><UserX className="mr-1 h-4 w-4" />驳回</Button></>}
                              {user.status === 1 && !self && <Button size="sm" variant="outline" className="text-rose-600" onClick={() => setConfirmAction({ kind: "ban", user })}><Ban className="mr-1 h-4 w-4" />封禁</Button>}
                              {user.status === 0 && <Button size="sm" variant="outline" onClick={() => setConfirmAction({ kind: "unban", user })}><UserCheck className="mr-1 h-4 w-4" />解封</Button>}
                              <Button size="sm" variant="outline" onClick={() => setResetTarget(user)}><KeyRound className="mr-1 h-4 w-4" />重置密码</Button>
                              {!self && <Button size="sm" variant="outline" onClick={() => setConfirmAction({ kind: "logout", user })}><LogOut className="mr-1 h-4 w-4" />下线</Button>}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4 text-sm text-muted-foreground"><span>共 {Number(users.data?.total || 0)} 个账号</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</Button><span>第 {page} / {totalPages} 页</span><Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>下一页</Button></div></div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-lg bg-white">
          <DialogHeader><DialogTitle>创建工作账号</DialogTitle><DialogDescription>管理员创建的账号会直接启用；公开注册的账号仍需在列表中审核。</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="admin-create-username">用户名</Label><Input id="admin-create-username" value={createForm.username} onChange={(event) => setCreateForm({ ...createForm, username: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="admin-create-name">真实姓名</Label><Input id="admin-create-name" value={createForm.realName} onChange={(event) => setCreateForm({ ...createForm, realName: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="admin-create-phone">手机号</Label><Input id="admin-create-phone" maxLength={11} value={createForm.phone} onChange={(event) => setCreateForm({ ...createForm, phone: event.target.value.replace(/\D/g, "") })} /></div>
            <div className="space-y-2"><Label htmlFor="admin-create-email">邮箱</Label><Input id="admin-create-email" type="email" value={createForm.email} onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="admin-create-role">角色</Label><select id="admin-create-role" value={createForm.userType} onChange={(event) => setCreateForm({ ...createForm, userType: Number(event.target.value) })} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"><option value={1}>管理员</option><option value={2}>医生</option><option value={3}>护士</option></select></div>
            <div />
            <div className="space-y-2"><Label htmlFor="admin-create-password">初始密码</Label><Input id="admin-create-password" type="password" value={createForm.password} onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="admin-create-confirm">确认密码</Label><Input id="admin-create-confirm" type="password" value={createForm.confirmPassword} onChange={(event) => setCreateForm({ ...createForm, confirmPassword: event.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createUser.isPending}>取消</Button><Button onClick={() => void submitCreate()} disabled={createUser.isPending} className="bg-medical-500 text-white hover:bg-medical-600">确认创建</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent className="max-w-md rounded-lg bg-white">
          <DialogHeader><DialogTitle>重置账号密码</DialogTitle><DialogDescription>重置后会立即撤销该账号的当前登录会话。</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2"><div className="space-y-2"><Label htmlFor="admin-reset-password">新密码</Label><Input id="admin-reset-password" type="password" value={resetPassword.newPassword} onChange={(event) => setResetPassword({ ...resetPassword, newPassword: event.target.value })} /></div><div className="space-y-2"><Label htmlFor="admin-reset-confirm">确认新密码</Label><Input id="admin-reset-confirm" type="password" value={resetPassword.confirmPassword} onChange={(event) => setResetPassword({ ...resetPassword, confirmPassword: event.target.value })} /></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setResetTarget(null)} disabled={resetUserPassword.isPending}>取消</Button><Button onClick={() => void submitResetPassword()} disabled={resetUserPassword.isPending} className="bg-medical-500 text-white hover:bg-medical-600">确认重置</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)} title={confirmText.title} description={confirmText.description} confirmText={confirmText.button} destructive={confirmText.destructive} pending={actionPending} onConfirm={runConfirmedAction} />
    </PageShell>
  );
}
