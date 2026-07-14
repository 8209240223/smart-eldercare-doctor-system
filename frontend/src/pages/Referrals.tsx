import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Ban, CheckCircle2, Eye, Plus, Repeat2, UserRoundCheck, XCircle } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { createElderNameMap, resolveElderName } from "@/lib/elderName";
import {
  useAcceptReferral,
  useCancelReferral,
  useCompleteReferral,
  useCreateReferral,
  useElders,
  useReferralDetail,
  useReferralDoctorOptions,
  useReferrals,
  useReferralStats,
  useRejectReferral,
  type Referral,
} from "@/hooks/useApi";
import { getUserRole, useAuthStore } from "@/store/auth";

type ReferralAction = "complete" | "reject" | "cancel";
const statusLabels = ["待接收", "已接收", "处理中", "已完成", "已拒绝", "已取消"];

function statusClass(status?: number) {
  if (status === 3) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === 4) return "border-red-200 bg-red-50 text-red-700";
  if (status === 5) return "border-slate-200 bg-slate-50 text-slate-600";
  if (status === 1 || status === 2) return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function Referrals() {
  const { userInfo } = useAuthStore();
  const role = getUserRole(userInfo);
  const currentUserId = Number(userInfo?.userId || userInfo?.id || 0);
  const currentDepartment = (userInfo as { department?: string } | null)?.department;
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<number | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | undefined>();
  const [actionTarget, setActionTarget] = useState<{ item: Referral; action: ReferralAction } | null>(null);

  const { data, isLoading, refetch } = useReferrals(page, 10, status);
  const { data: stats } = useReferralStats();
  const { data: eldersData } = useElders(1, 100);
  const { data: doctorOptions = [] } = useReferralDoctorOptions();
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
      toast.success("患者移交申请已创建");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建患者移交申请失败");
    }
  };

  const accept = async (id: number) => {
    try {
      await acceptReferral.mutateAsync(id);
      toast.success("已接收患者移交申请");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "接收申请失败");
    }
  };

  const submitAction = async (value: string) => {
    if (!actionTarget?.item.id) return;
    try {
      if (actionTarget.action === "complete") await completeReferral.mutateAsync({ id: actionTarget.item.id, dischargeSummary: value });
      if (actionTarget.action === "reject") await rejectReferral.mutateAsync({ id: actionTarget.item.id, reason: value });
      if (actionTarget.action === "cancel") await cancelReferral.mutateAsync({ id: actionTarget.item.id, reason: value });
      toast.success(actionTarget.action === "complete" ? "患者与相关工作流已完成移交" : actionTarget.action === "reject" ? "移交申请已拒绝" : "移交申请已取消");
      setActionTarget(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "处理患者移交失败");
    }
  };

  const canReceive = (item: Referral) => role === "doctor" && Number(item.toDoctorId) === currentUserId;
  const canCancel = (item: Referral) => role === "doctor" && Number(item.fromDoctorId) === currentUserId;

  return (
    <PageShell title="医生协作与患者移交" subtitle="由接收医生确认后，完整迁移患者归属和未完成工作流">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="待接收" value={Number(stats?.pending || 0)} icon={Repeat2} iconClassName="from-amber-400 to-amber-500" delay={0} />
          <StatCard title="处理中" value={Number(stats?.processing || 0)} icon={UserRoundCheck} iconClassName="from-sky-400 to-sky-500" delay={1} />
          <StatCard title="已完成" value={Number(stats?.completed || 0)} icon={CheckCircle2} delay={2} />
          <StatCard title="移交总量" value={Number(stats?.total || 0)} icon={Repeat2} iconClassName="from-lavender-400 to-lavender-500" delay={3} />
        </div>

        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardContent className="flex flex-wrap items-end justify-between gap-3 p-4">
            <div className="min-w-[180px]"><label className="text-sm font-medium text-muted-foreground">处理状态</label><select className="mt-2 h-10 w-full rounded-md border border-border/60 bg-white px-3 text-sm" value={status ?? ""} onChange={(event) => { setStatus(event.target.value ? Number(event.target.value) : undefined); setPage(1); }}><option value="">全部状态</option>{statusLabels.map((label, index) => <option key={label} value={index}>{label}</option>)}</select></div>
            {role === "doctor" && <Button onClick={() => setCreateOpen(true)} className="bg-medical-500 text-white hover:bg-medical-600"><Plus className="mr-2 h-4 w-4" />发起患者移交</Button>}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardHeader><CardTitle className="text-base font-bold">患者移交记录</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="space-y-3"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div> : records.length === 0 ? <EmptyState title="暂无患者移交记录" description="当前没有需要处理的医生协作申请" /> : <div className="space-y-3">
              {records.map((item, index) => <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="rounded-lg border border-border/50 bg-white p-4 transition-colors hover:border-medical-300">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{resolveElderName(item.elderName, item.elderId, elderNames)}</h3><Badge variant="outline" className={statusClass(item.status)}>{statusLabels[item.status || 0] || "未知"}</Badge>{item.urgencyLevel && item.urgencyLevel > 1 && <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">{item.urgencyLevel === 3 ? "危急" : "紧急"}</Badge>}</div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm"><span className="font-medium">{item.fromDoctorName || `医生 ${item.fromDoctorId}`}</span><span className="text-muted-foreground">{item.fromDept || "全科医学科"}</span><ArrowRight className="h-4 w-4 text-medical-500" /><span className="font-medium">{item.toDoctorName || `医生 ${item.toDoctorId}`}</span><span className="text-muted-foreground">{item.toDept || "全科医学科"}</span></div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.referralReason}</p>
                  </div>
                  <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setDetailId(item.id)}><Eye className="mr-1 h-4 w-4" />详情</Button>{item.status === 0 && canReceive(item) && <Button size="sm" onClick={() => accept(item.id!)} disabled={isMutating} className="bg-medical-500 text-white hover:bg-medical-600">接收</Button>}{[0, 1].includes(Number(item.status)) && canReceive(item) && <Button size="sm" variant="outline" className="text-red-600" onClick={() => setActionTarget({ item, action: "reject" })}><XCircle className="mr-1 h-4 w-4" />拒绝</Button>}{[1, 2].includes(Number(item.status)) && canReceive(item) && <Button size="sm" variant="outline" onClick={() => setActionTarget({ item, action: "complete" })}><CheckCircle2 className="mr-1 h-4 w-4" />完成移交</Button>}{[0, 1].includes(Number(item.status)) && canCancel(item) && <Button size="sm" variant="outline" onClick={() => setActionTarget({ item, action: "cancel" })}><Ban className="mr-1 h-4 w-4" />取消</Button>}</div>
                </div>
              </motion.div>)}
              {totalPages > 1 && <div className="flex justify-end gap-2 pt-4"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>上一页</Button><span className="px-2 py-1 text-sm text-muted-foreground">{page} / {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>下一页</Button></div>}
            </div>}
          </CardContent>
        </Card>
      </div>

      <ReferralDialog open={createOpen} onOpenChange={setCreateOpen} elders={eldersData?.records || []} targetDoctors={doctorOptions} currentUserName={userInfo?.realName || userInfo?.username || ""} currentDepartment={currentDepartment} onSubmit={create} isSubmitting={createReferral.isPending} />
      <TextActionDialog open={!!actionTarget} onOpenChange={(open) => !open && setActionTarget(null)} title={actionTarget?.action === "complete" ? "完成患者移交" : actionTarget?.action === "reject" ? "拒绝患者移交" : "取消患者移交"} description={actionTarget?.action === "complete" ? "请填写接收情况与后续管理安排，提交后患者将立即归属你。" : "请填写处理原因"} placeholder={actionTarget?.action === "complete" ? "接收情况、后续随访与管理安排" : "原因"} confirmText={actionTarget?.action === "complete" ? "确认完成移交" : "提交处理结果"} required pending={isMutating} destructive={actionTarget?.action !== "complete"} onConfirm={submitAction} />
      <DetailDialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(undefined)} title="患者移交详情" loading={detailLoading} fields={detail ? [{ label: "移交编号", value: detail.referralNo || "-" }, { label: "老人", value: resolveElderName(detail.elderName, detail.elderId, elderNames) }, { label: "状态", value: statusLabels[detail.status || 0] || "未知" }, { label: "发起医生", value: `${detail.fromDoctorName || detail.fromDoctorId || "-"} · ${detail.fromDept || "全科医学科"}` }, { label: "接收医生", value: `${detail.toDoctorName || detail.toDoctorId || "-"} · ${detail.toDept || "全科医学科"}` }, { label: "当前诊断", value: detail.diagnosis || "-", wide: true }, { label: "移交原因", value: detail.referralReason, wide: true }, { label: "拒绝原因", value: detail.rejectReason || "-", wide: true }, { label: "取消原因", value: detail.cancelReason || "-", wide: true }, { label: "接收与后续安排", value: detail.dischargeSummary || "-", wide: true }, { label: "创建时间", value: detail.createTime || "-" }] : []} />
    </PageShell>
  );
}
