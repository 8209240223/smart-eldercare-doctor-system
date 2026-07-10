import { useState } from "react";
import { motion } from "motion/react";
import { Eye, Pencil, Plus, Stethoscope, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DetailDialog from "@/components/common/DetailDialog";
import InterventionDialog from "@/components/interventions/InterventionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createElderNameMap, resolveElderName } from "@/lib/elderName";
import {
  useCreateIntervention,
  useDeleteIntervention,
  useElders,
  useInterventionDetail,
  useInterventions,
  useInterventionStats,
  useUpdateIntervention,
  type Intervention,
} from "@/hooks/useApi";
import { useAuthStore } from "@/store/auth";

const typeLabels = ["", "药物干预", "非药物干预", "转诊处理", "健康教育"];
const effectLabels = ["未评价", "显著", "有效", "一般", "无效"];

export default function Interventions() {
  const userInfo = useAuthStore((state) => state.userInfo);
  const currentDoctorId = Number(userInfo?.userId || userInfo?.id || 0) || undefined;
  const [page, setPage] = useState(1);
  const [elderId, setElderId] = useState("");
  const [followRecordId, setFollowRecordId] = useState("");
  const [type, setType] = useState<number | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Intervention | undefined>();
  const [detailId, setDetailId] = useState<number | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Intervention | null>(null);

  const { data, isLoading, refetch } = useInterventions(page, 10, elderId ? Number(elderId) : undefined, type, followRecordId ? Number(followRecordId) : undefined);
  const { data: stats } = useInterventionStats();
  const { data: eldersData } = useElders(1, 100);
  const { data: detail, isLoading: detailLoading } = useInterventionDetail(detailId);
  const createIntervention = useCreateIntervention();
  const updateIntervention = useUpdateIntervention();
  const deleteIntervention = useDeleteIntervention();

  const records = data?.records || [];
  const totalPages = data?.pages || 1;
  const elderNames = createElderNameMap(eldersData?.records || []);

  const save = async (form: Intervention) => {
    const payload = {
      ...form,
      doctorId: form.doctorId || currentDoctorId,
      interventionDate: form.interventionDate
        ? (form.interventionDate.includes("T") ? form.interventionDate : `${form.interventionDate.slice(0, 10)}T00:00:00`)
        : undefined,
      status: form.status === 0 ? 0 : 1,
    };
    try {
      if (editing?.id) await updateIntervention.mutateAsync({ ...payload, id: editing.id });
      else await createIntervention.mutateAsync(payload);
      setFormOpen(false);
      setEditing(undefined);
      toast.success(editing?.id ? "干预记录已更新" : "干预记录已新增");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存干预记录失败");
    }
  };

  const remove = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteIntervention.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("干预记录已删除");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除干预记录失败");
    }
  };

  return (
    <PageShell title="干预管理" subtitle="关联随访记录，维护干预措施、效果评价和下次计划">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="干预记录" value={Number(stats?.total ?? data?.total ?? 0)} icon={Stethoscope} delay={0} />
          <StatCard title="当前列表" value={records.length} icon={Eye} iconClassName="from-sky-400 to-sky-500" delay={1} />
          <StatCard title="已评价" value={Number(stats?.evaluated || 0)} icon={Stethoscope} iconClassName="from-lavender-400 to-lavender-500" delay={2} />
        </div>
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm"><CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[150px]"><label className="text-sm font-medium text-muted-foreground">老人</label><select className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm" value={elderId} onChange={(event) => { setElderId(event.target.value); setPage(1); }}><option value="">全部老人</option>{eldersData?.records.map((elder) => <option key={elder.id} value={elder.id}>{elder.name}</option>)}</select></div>
          <div className="min-w-[170px]"><label className="text-sm font-medium text-muted-foreground">关联随访记录ID</label><Input className="mt-2 rounded-xl bg-white/70" value={followRecordId} onChange={(event) => setFollowRecordId(event.target.value)} /></div>
          <div className="min-w-[160px]"><label className="text-sm font-medium text-muted-foreground">干预类型</label><select className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm" value={type ?? ""} onChange={(event) => setType(event.target.value ? Number(event.target.value) : undefined)}><option value="">全部类型</option>{typeLabels.slice(1).map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select></div>
          <Button variant="outline" className="rounded-xl" onClick={() => refetch()}>查询</Button>
          <Button onClick={() => { setEditing(undefined); setFormOpen(true); }} className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white"><Plus className="mr-2 h-4 w-4" />新增干预记录</Button>
        </CardContent></Card>
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm"><CardHeader><CardTitle className="text-base font-bold">干预记录列表</CardTitle></CardHeader><CardContent>
          {isLoading ? <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div> : records.length === 0 ? <EmptyState title="暂无干预记录" description="可新增干预记录并关联随访结果" /> : <div className="space-y-3">{records.map((item, index) => <motion.div key={item.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }} className="rounded-xl border border-border/40 bg-white/60 p-4 transition-all hover:border-medical-300 hover:bg-white hover:shadow-soft"><div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{resolveElderName(item.elderName, item.elderId, elderNames)}</h3><Badge variant="outline">{typeLabels[item.interventionType] || "其他"}</Badge>{item.followRecordId && <Badge variant="outline">随访记录 #{item.followRecordId}</Badge>}</div><p className="mt-2 text-sm text-foreground">{item.interventionTitle}</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.interventionContent}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setDetailId(item.id)}><Eye className="mr-1 h-4 w-4" />详情</Button><Button size="sm" variant="outline" onClick={() => { setEditing(item); setFormOpen(true); }}><Pencil className="mr-1 h-4 w-4" />编辑</Button><Button size="sm" variant="outline" className="text-red-600" onClick={() => setDeleteTarget(item)}><Trash2 className="mr-1 h-4 w-4" />删除</Button></div></div></motion.div>)}{totalPages > 1 && <div className="flex justify-end gap-2 pt-4"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>上一页</Button><span className="px-2 py-1 text-sm text-muted-foreground">{page} / {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>下一页</Button></div>}</div>}
        </CardContent></Card>
      </div>
      <InterventionDialog open={formOpen} onOpenChange={setFormOpen} initialData={editing} elders={eldersData?.records || []} onSubmit={save} isSubmitting={createIntervention.isPending || updateIntervention.isPending} />
      <DetailDialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(undefined)} title="干预记录详情" loading={detailLoading} fields={detail ? [
        { label: "老人", value: resolveElderName(detail.elderName, detail.elderId, elderNames) }, { label: "干预类型", value: typeLabels[detail.interventionType] || "其他" }, { label: "关联随访记录", value: detail.followRecordId || "未关联" }, { label: "干预日期", value: detail.interventionDate || detail.createTime || "-" }, { label: "干预标题", value: detail.interventionTitle, wide: true }, { label: "干预内容", value: detail.interventionContent, wide: true }, { label: "用药调整", value: detail.medicationAdjust || "-", wide: true }, { label: "生活方式指导", value: detail.lifestyleGuidance || "-", wide: true }, { label: "健康教育", value: detail.healthEducation || "-", wide: true }, { label: "效果评价", value: effectLabels[detail.effectEvaluation || 0] }, { label: "效果说明", value: detail.effectDesc || "-", wide: true }, { label: "下次计划", value: detail.nextPlan || "-", wide: true },
      ] : []} />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} title="删除干预记录" description={`确定删除“${deleteTarget?.interventionTitle || "该干预记录"}”吗？`} confirmText="确认删除" destructive pending={deleteIntervention.isPending} onConfirm={remove} />
    </PageShell>
  );
}
