import { useState } from "react";
import { motion } from "motion/react";
import { Ban, CheckCircle2, Eye, Plus, Repeat, XCircle } from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import DetailDialog from "@/components/common/DetailDialog";
import TextActionDialog from "@/components/common/TextActionDialog";
import ReferralDialog from "@/components/referrals/ReferralDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createElderNameMap, resolveElderName } from "@/lib/elderName";
import {
  useAcceptReferral,
  useCancelReferral,
  useCompleteReferral,
  useCreateReferral,
  useElders,
  useReferralDetail,
  useReferrals,
  useReferralStats,
  useRejectReferral,
  type Referral,
} from "@/hooks/useApi";
import { getUserRole, useAuthStore } from "@/store/auth";

type ReferralAction = "complete" | "reject" | "cancel";
const statusLabels = ["待接收", "已接收", "处理中", "已完成", "已拒绝", "已取消"];

function statusClass(status?: number) {
  if (status === 3) return "border-medical-200 bg-medical-50 text-medical-700";
  if (status === 4) return "border-red-200 bg-red-50 text-red-700";
  if (status === 5) return "border-slate-200 bg-slate-50 text-slate-600";
  if (status === 1 || status === 2) return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function Referrals() {
  const { userInfo } = useAuthStore();
  const role = getUserRole(userInfo);
  const currentUserId = Number(userInfo?.userId || userInfo?.id || 0);
  const [page, setPage] = useState(1);
  const [doctorId, setDoctorId] = useState("");
  const [status, setStatus] = useState<number | undefined>();
  const [referralType, setReferralType] = useState<number | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | undefined>();
  const [actionTarget, setActionTarget] = useState<{ item: Referral; action: ReferralAction } | null>(null);

  const { data, isLoading, refetch } = useReferrals(page, 10, status, referralType, doctorId ? Number(doctorId) : undefined);
  const { data: stats } = useReferralStats();
  const { data: eldersData } = useElders(1, 100);
  const { data: detail, isLoading: detailLoading } = useReferralDetail(detailId);
  const createReferral = useCreateReferral();
  const acceptReferral = useAcceptReferral();
  const completeReferral = useCompleteReferral();
  const rejectReferral = useRejectReferral();
  const cancelReferral = useCancelReferral();

  const records = data?.records || [];
  const elderNames = createElderNameMap(eldersData?.records || []);
  const totalPages = data?.pages || 1;
  const isMutating = acceptReferral.isPending || completeReferral.isPending || rejectReferral.isPending || cancelReferral.isPending;

  const create = async (form: Referral) => {
    try {
      await createReferral.mutateAsync(form);
      setCreateOpen(false);
      toast.success("转诊申请已创建");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建转诊失败");
    }
  };

  const accept = async (id: number) => {
    try {
      await acceptReferral.mutateAsync(id);
      toast.success("转诊已接收");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "接收转诊失败");
    }
  };

  const submitAction = async (value: string) => {
    if (!actionTarget?.item.id) return;
    try {
      if (actionTarget.action === "complete") await completeReferral.mutateAsync({ id: actionTarget.item.id, dischargeSummary: value });
      if (actionTarget.action === "reject") await rejectReferral.mutateAsync({ id: actionTarget.item.id, reason: value });
      if (actionTarget.action === "cancel") await cancelReferral.mutateAsync({ id: actionTarget.item.id, reason: value });
      toast.success(actionTarget.action === "complete" ? "转诊已完成" : actionTarget.action === "reject" ? "转诊已拒绝" : "转诊已取消");
      setActionTarget(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "处理转诊失败");
    }
  };

  const canReceive = (item: Referral) => role === "admin" || (role === "doctor" && Number(item.toDoctorId) === currentUserId);
  const canCancel = (item: Referral) => role === "admin" || (role === "doctor" && Number(item.fromDoctorId) === currentUserId);

  return (
    <PageShell title="转诊协同" subtitle="按角色和状态完成转诊接收、拒绝、完成、取消及详情查看">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard title="待接收" value={Number(stats?.pending || 0)} icon={Repeat} iconClassName="from-amber-400 to-amber-500" delay={0} /><StatCard title="处理中" value={Number(stats?.processing || 0)} icon={Repeat} iconClassName="from-sky-400 to-sky-500" delay={1} /><StatCard title="已完成" value={Number(stats?.completed || 0)} icon={CheckCircle2} delay={2} /><StatCard title="转诊总量" value={Number(stats?.upCount || 0) + Number(stats?.downCount || 0)} icon={Repeat} iconClassName="from-lavender-400 to-lavender-500" delay={3} /></div>
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm"><CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[160px]"><label className="text-sm font-medium text-muted-foreground">责任医生ID</label><Input className="mt-2 rounded-xl bg-white/70" value={doctorId} onChange={(event) => setDoctorId(event.target.value)} /></div>
          <div className="min-w-[150px]"><label className="text-sm font-medium text-muted-foreground">状态</label><select className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm" value={status ?? ""} onChange={(event) => setStatus(event.target.value ? Number(event.target.value) : undefined)}><option value="">全部状态</option>{statusLabels.map((label, index) => <option key={label} value={index}>{label}</option>)}</select></div>
          <div className="min-w-[150px]"><label className="text-sm font-medium text-muted-foreground">转诊类型</label><select className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm" value={referralType ?? ""} onChange={(event) => setReferralType(event.target.value ? Number(event.target.value) : undefined)}><option value="">全部类型</option><option value="1">上转</option><option value="2">下转</option></select></div>
          <Button variant="outline" className="rounded-xl" onClick={() => refetch()}>查询</Button>
          <Button onClick={() => setCreateOpen(true)} className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white"><Plus className="mr-2 h-4 w-4" />新建转诊</Button>
        </CardContent></Card>
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm"><CardHeader><CardTitle className="text-base font-bold">转诊记录列表</CardTitle></CardHeader><CardContent>
          {isLoading ? <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div> : records.length === 0 ? <EmptyState title="暂无转诊记录" description="可创建新的转诊申请" /> : <div className="space-y-3">{records.map((item, index) => <motion.div key={item.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }} className="rounded-xl border border-border/40 bg-white/60 p-4 transition-all hover:border-medical-300 hover:bg-white hover:shadow-soft"><div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{resolveElderName(item.elderName, item.elderId, elderNames)}</h3><Badge variant="outline">{item.referralType === 1 ? "上转" : "下转"}</Badge><Badge variant="outline" className={statusClass(item.status)}>{statusLabels[item.status || 0] || "未知"}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{item.fromOrg || "-"} → {item.toOrg || "-"}</p><p className="mt-1 text-sm text-muted-foreground">{item.referralReason}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setDetailId(item.id)}><Eye className="mr-1 h-4 w-4" />详情</Button>{item.status === 0 && canReceive(item) && <Button size="sm" onClick={() => accept(item.id!)} disabled={isMutating} className="bg-gradient-to-r from-medical-400 to-medical-600 text-white">接收</Button>}{[0, 1].includes(Number(item.status)) && canReceive(item) && <Button size="sm" variant="outline" className="text-red-600" onClick={() => setActionTarget({ item, action: "reject" })}><XCircle className="mr-1 h-4 w-4" />拒绝</Button>}{[1, 2].includes(Number(item.status)) && canReceive(item) && <Button size="sm" variant="outline" onClick={() => setActionTarget({ item, action: "complete" })}><CheckCircle2 className="mr-1 h-4 w-4" />完成</Button>}{[0, 1].includes(Number(item.status)) && canCancel(item) && <Button size="sm" variant="outline" onClick={() => setActionTarget({ item, action: "cancel" })}><Ban className="mr-1 h-4 w-4" />取消</Button>}</div></div></motion.div>)}{totalPages > 1 && <div className="flex justify-end gap-2 pt-4"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>上一页</Button><span className="px-2 py-1 text-sm text-muted-foreground">{page} / {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>下一页</Button></div>}</div>}
        </CardContent></Card>
      </div>
      <ReferralDialog open={createOpen} onOpenChange={setCreateOpen} elders={eldersData?.records || []} currentUserId={currentUserId || undefined} currentUserName={userInfo?.realName || userInfo?.username || ""} onSubmit={create} isSubmitting={createReferral.isPending} />
      <TextActionDialog open={!!actionTarget} onOpenChange={(open) => !open && setActionTarget(null)} title={actionTarget?.action === "complete" ? "完成转诊" : actionTarget?.action === "reject" ? "拒绝转诊" : "取消转诊"} description={actionTarget?.action === "complete" ? "请填写出院小结" : "请填写处理原因"} placeholder={actionTarget?.action === "complete" ? "出院小结" : "原因"} confirmText="提交处理结果" required pending={isMutating} destructive={actionTarget?.action !== "complete"} onConfirm={submitAction} />
      <DetailDialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(undefined)} title="转诊详情" loading={detailLoading} fields={detail ? [{ label: "转诊编号", value: detail.referralNo || "-" }, { label: "老人", value: resolveElderName(detail.elderName, detail.elderId, elderNames) }, { label: "转诊类型", value: detail.referralType === 1 ? "上转" : "下转" }, { label: "状态", value: statusLabels[detail.status || 0] || "未知" }, { label: "转出机构", value: detail.fromOrg || "-" }, { label: "接收机构", value: detail.toOrg || "-" }, { label: "转出医生", value: detail.fromDoctorName || detail.fromDoctorId || "-" }, { label: "接收医生", value: detail.toDoctorName || detail.toDoctorId || "-" }, { label: "诊断", value: detail.diagnosis || "-", wide: true }, { label: "转诊原因", value: detail.referralReason, wide: true }, { label: "拒绝原因", value: detail.rejectReason || "-", wide: true }, { label: "取消原因", value: detail.cancelReason || "-", wide: true }, { label: "出院小结", value: detail.dischargeSummary || "-", wide: true }, { label: "创建时间", value: detail.createTime || "-" }] : []} />
    </PageShell>
  );
}
