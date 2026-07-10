import { useState } from "react";
import { motion } from "motion/react";
import { ClipboardList, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DetailDialog from "@/components/common/DetailDialog";
import ExamDialog from "@/components/exams/ExamDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createElderNameMap, resolveElderName } from "@/lib/elderName";
import {
  useCreateExam,
  useDeleteExam,
  useElders,
  useExamCompare,
  useExamDetail,
  useExams,
  useExamStats,
  useUpdateExam,
  type PhysicalExam,
} from "@/hooks/useApi";

export default function Exams() {
  const [page, setPage] = useState(1);
  const [elderId, setElderId] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [compareElderId, setCompareElderId] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PhysicalExam | undefined>();
  const [detailId, setDetailId] = useState<number | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<PhysicalExam | null>(null);

  const { data, isLoading, refetch } = useExams(page, 10, elderId || undefined, startDate, endDate);
  const { data: stats } = useExamStats(elderId || undefined);
  const { data: eldersData } = useElders(1, 100);
  const { data: detail, isLoading: detailLoading } = useExamDetail(detailId);
  const { data: compareData, isLoading: compareLoading } = useExamCompare(compareElderId);
  const createExam = useCreateExam(); const updateExam = useUpdateExam(); const deleteExam = useDeleteExam();
  const records = data?.records || []; const totalPages = data?.pages || 1;
  const elderNames = createElderNameMap(eldersData?.records || []);

  const save = async (form: PhysicalExam) => { try { if (editing?.id) await updateExam.mutateAsync({ ...form, id: editing.id }); else await createExam.mutateAsync(form); setFormOpen(false); setEditing(undefined); toast.success(editing?.id ? "体检记录已更新" : "体检记录已新增"); refetch(); } catch (error) { toast.error(error instanceof Error ? error.message : "保存体检记录失败"); } };
  const remove = async () => { if (!deleteTarget?.id) return; try { await deleteExam.mutateAsync(deleteTarget.id); setDeleteTarget(null); toast.success("体检记录已删除"); refetch(); } catch (error) { toast.error(error instanceof Error ? error.message : "删除体检记录失败"); } };

  return (
    <PageShell title="体检管理" subtitle="查询、查看、维护和对比老人健康体检记录">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><StatCard title="体检记录" value={Number(stats?.total ?? data?.total ?? 0)} icon={ClipboardList} delay={0} /><StatCard title="本年体检" value={Number(stats?.thisYear || 0)} icon={Eye} iconClassName="from-sky-400 to-sky-500" delay={1} /><StatCard title="异常记录" value={Number(stats?.abnormal || 0)} icon={ClipboardList} iconClassName="from-amber-400 to-amber-500" delay={2} /></div>
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm"><CardContent className="flex flex-wrap items-end gap-3 p-4"><div className="min-w-[180px]"><label className="text-sm font-medium text-muted-foreground">老人</label><select className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm" value={elderId || ""} onChange={(event) => { setElderId(Number(event.target.value)); setPage(1); }}><option value="">全部老人</option>{eldersData?.records.map((elder) => <option key={elder.id} value={elder.id}>{elder.name}</option>)}</select></div><div><label className="text-sm font-medium text-muted-foreground">开始日期</label><Input type="date" className="mt-2 rounded-xl bg-white/70" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div><div><label className="text-sm font-medium text-muted-foreground">结束日期</label><Input type="date" className="mt-2 rounded-xl bg-white/70" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div><Button variant="outline" className="rounded-xl" onClick={() => refetch()}>查询</Button><select className="h-10 min-w-[210px] rounded-xl border border-border/60 bg-white/70 px-3 text-sm" value={compareElderId || ""} onChange={(event) => setCompareElderId(Number(event.target.value))}><option value="">选择老人进行体检对比</option>{eldersData?.records.map((elder) => <option key={elder.id} value={elder.id}>{elder.name}</option>)}</select><Button onClick={() => { setEditing(undefined); setFormOpen(true); }} className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white"><Plus className="mr-2 h-4 w-4" />新增体检记录</Button></CardContent></Card>
        {compareElderId > 0 && <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}><Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm"><CardHeader><CardTitle className="text-base font-bold">体检对比分析</CardTitle></CardHeader><CardContent>{compareLoading ? <Skeleton className="h-32 w-full" /> : !compareData?.length ? <EmptyState title="暂无对比数据" description="该老人暂无体检记录" /> : <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{compareData.slice(0, 9).map((item) => <div key={item.id} className="rounded-xl border border-border/40 bg-white/60 p-4"><p className="font-semibold">{item.examDate}</p><div className="mt-2 space-y-1 text-sm text-muted-foreground"><p>血压：{item.systolicPressure || "-"}/{item.diastolicPressure || "-"} mmHg</p><p>心率：{item.heartRate || "-"} bpm</p><p>BMI：{item.bmi || "-"}</p><p>空腹血糖：{item.bloodSugarFasting || "-"}</p></div></div>)}</div>}</CardContent></Card></motion.div>}
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm"><CardHeader><CardTitle className="text-base font-bold">体检记录列表</CardTitle></CardHeader><CardContent>{isLoading ? <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div> : records.length === 0 ? <EmptyState title="暂无体检记录" description="可新增体检记录" /> : <div className="space-y-3">{records.map((item, index) => <motion.div key={item.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }} className="rounded-xl border border-border/40 bg-white/60 p-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{resolveElderName(item.elderName, item.elderId, elderNames)}</h3><Badge variant="outline">{item.examDate}</Badge>{item.abnormalFlag === 1 && <Badge className="bg-amber-100 text-amber-700">异常</Badge>}</div><p className="mt-2 text-sm text-muted-foreground">血压 {item.systolicPressure || "-"}/{item.diastolicPressure || "-"} · 心率 {item.heartRate || "-"} · BMI {item.bmi || "-"}</p><p className="mt-1 text-sm text-muted-foreground">{item.examSummary || "-"}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setDetailId(item.id)}><Eye className="mr-1 h-4 w-4" />详情</Button><Button size="sm" variant="outline" onClick={() => { setEditing(item); setFormOpen(true); }}><Pencil className="mr-1 h-4 w-4" />编辑</Button><Button size="sm" variant="outline" className="text-red-600" onClick={() => setDeleteTarget(item)}><Trash2 className="mr-1 h-4 w-4" />删除</Button></div></div></motion.div>)}{totalPages > 1 && <div className="flex justify-end gap-2 pt-4"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>上一页</Button><span className="px-2 py-1 text-sm text-muted-foreground">{page} / {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>下一页</Button></div>}</div>}</CardContent></Card>
      </div>
      <ExamDialog open={formOpen} onOpenChange={setFormOpen} initialData={editing} elders={eldersData?.records || []} onSubmit={save} isSubmitting={createExam.isPending || updateExam.isPending} />
      <DetailDialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(undefined)} title="体检记录详情" loading={detailLoading} fields={detail ? [{ label: "老人", value: resolveElderName(detail.elderName, detail.elderId, elderNames) }, { label: "体检日期", value: detail.examDate }, { label: "身高", value: detail.height ? `${detail.height} cm` : "-" }, { label: "体重", value: detail.weight ? `${detail.weight} kg` : "-" }, { label: "BMI", value: detail.bmi || "-" }, { label: "血压", value: `${detail.systolicPressure || "-"}/${detail.diastolicPressure || "-"} mmHg` }, { label: "心率", value: detail.heartRate ? `${detail.heartRate} bpm` : "-" }, { label: "空腹血糖", value: detail.bloodSugarFasting || "-" }, { label: "随机血糖", value: detail.bloodSugarRandom || "-" }, { label: "体温", value: detail.temperature || "-" }, { label: "血氧", value: detail.bloodOxygen || "-" }, { label: "腰围", value: detail.waistline || "-" }, { label: "体检总结", value: detail.examSummary || "-", wide: true }, { label: "医生建议", value: detail.doctorAdvice || "-", wide: true }] : []} />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} title="删除体检记录" description="确定删除该体检记录吗？" confirmText="确认删除" destructive pending={deleteExam.isPending} onConfirm={remove} />
    </PageShell>
  );
}
