import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Download,
  Eye,
  FileText,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DetailDialog from "@/components/common/DetailDialog";
import AssessmentDialog from "@/components/assessments/AssessmentDialog";
import ComprehensiveHealthReportView from "@/components/reports/ComprehensiveHealthReportView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { createElderNameMap, resolveElderName } from "@/lib/elderName";
import {
  useAssessmentDetail,
  useAssessmentReport,
  useAssessments,
  useAssessmentStats,
  useCreateAssessment,
  useDeleteAssessment,
  useElders,
  useGenerateAiReport,
  useUpdateAssessment,
  type Assessment,
} from "@/hooks/useApi";
import { useAuthStore } from "@/store/auth";

const typeLabels = [
  "",
  "日常生活能力",
  "认知功能",
  "情绪/心理",
  "营养状况",
  "跌倒风险",
  "压疮风险",
  "疼痛",
  "社会功能",
  "综合",
];

export default function Assessments() {
  const { userInfo } = useAuthStore();
  const currentDoctorId =
    Number(userInfo?.userId || userInfo?.id || 0) || undefined;
  const [page, setPage] = useState(1);
  const [elderId, setElderId] = useState("");
  const [assessType, setAssessType] = useState<number | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Assessment | undefined>();
  const [detailId, setDetailId] = useState<number | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Assessment | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportElderId, setReportElderId] = useState(0);

  const { data, isLoading, refetch } = useAssessments(
    page,
    8,
    elderId ? Number(elderId) : undefined,
    assessType,
  );
  const { data: stats } = useAssessmentStats(
    elderId ? Number(elderId) : undefined,
  );
  const { data: eldersData } = useElders(1, 100);
  const { data: detail, isLoading: detailLoading } =
    useAssessmentDetail(detailId);
  const { data: report, isLoading: reportLoading } =
    useAssessmentReport(reportElderId);
  const createAssessment = useCreateAssessment();
  const updateAssessment = useUpdateAssessment();
  const deleteAssessment = useDeleteAssessment();
  const generateAi = useGenerateAiReport();

  const records = data?.records || [];
  const totalPages = data?.pages || 1;
  const elderNames = createElderNameMap(eldersData?.records || []);

  const save = async (form: Assessment) => {
    try {
      if (editing?.id)
        await updateAssessment.mutateAsync({ ...form, id: editing.id });
      else await createAssessment.mutateAsync(form);
      setFormOpen(false);
      setEditing(undefined);
      toast.success(editing?.id ? "评估记录已更新" : "评估记录已新增");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存评估记录失败");
    }
  };

  const remove = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteAssessment.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("评估记录已删除");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除评估记录失败");
    }
  };

  const generate = async (targetElderId: number) => {
    try {
      await generateAi.mutateAsync(targetElderId);
      toast.success("AI 健康评估报告已生成");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "生成 AI 报告失败");
    }
  };

  const openReport = (target?: number) => {
    setReportElderId(target || Number(elderId) || 0);
    setReportOpen(true);
  };

  const exportReport = () => {
    if (!report || !reportElderId) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `health-assessment-${reportElderId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell
      title="评估记录"
      subtitle="维护健康评估、查看详情、生成综合报告和 AI 报告"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="评估总数"
            value={Number(stats?.total || data?.total || 0)}
            icon={FileText}
            delay={0}
          />
          <StatCard
            title="当前列表"
            value={records.length}
            icon={Eye}
            iconClassName="from-sky-400 to-sky-500"
            delay={1}
          />
          <StatCard
            title="评估类型"
            value={6}
            icon={Sparkles}
            iconClassName="from-lavender-400 to-lavender-500"
            delay={2}
          />
        </div>
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div className="min-w-[160px]">
              <label className="text-sm font-medium text-muted-foreground">
                老人
              </label>
              <select
                className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm"
                value={elderId}
                onChange={(event) => {
                  setElderId(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">全部老人</option>
                {eldersData?.records.map((elder) => (
                  <option key={elder.id} value={elder.id}>
                    {elder.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[160px]">
              <label className="text-sm font-medium text-muted-foreground">
                评估类型
              </label>
              <select
                className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm"
                value={assessType ?? ""}
                onChange={(event) =>
                  setAssessType(
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
              >
                <option value="">全部类型</option>
                {typeLabels.slice(1).map((label, index) => (
                  <option key={label} value={index + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => refetch()}
            >
              查询
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => openReport()}
            >
              <FileText className="mr-2 h-4 w-4" />
              综合健康报告
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/ai-reports">
                <Sparkles className="mr-2 h-4 w-4" />
                查看 AI 评估记录
              </Link>
            </Button>
            <Button
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
              className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              新增评估记录
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">评估记录列表</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : records.length === 0 ? (
              <EmptyState
                title="暂无评估记录"
                description="可新增老人健康评估记录"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {records.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-xl border border-border/40 bg-white/60 p-5 transition-all hover:border-medical-300 hover:bg-white hover:shadow-soft"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {resolveElderName(
                            item.elderName,
                            item.elderId,
                            elderNames,
                          )}
                        </p>
                        <Badge variant="outline" className="mt-2">
                          {typeLabels[item.assessType || 0] || "未知评估"}
                        </Badge>
                      </div>
                      <span className="text-3xl font-bold text-medical-600">
                        {item.score}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {item.result || "暂无评估结果"}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDetailId(item.id)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        详情
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(item);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generate(item.elderId)}
                        disabled={generateAi.isPending}
                      >
                        <Sparkles className="mr-1 h-4 w-4" />
                        AI 报告
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        删除
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex justify-end gap-2 pt-5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  上一页
                </Button>
                <span className="px-2 py-1 text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  下一页
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <AssessmentDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={editing}
        elders={eldersData?.records || []}
        defaultDoctorId={currentDoctorId}
        onSubmit={save}
        isSubmitting={createAssessment.isPending || updateAssessment.isPending}
      />
      <DetailDialog
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(undefined)}
        title="评估记录详情"
        loading={detailLoading}
        fields={
          detail
            ? [
                {
                  label: "老人",
                  value: resolveElderName(
                    detail.elderName,
                    detail.elderId,
                    elderNames,
                  ),
                },
                {
                  label: "评估类型",
                  value: typeLabels[detail.assessType || 0] || "未知",
                },
                {
                  label: "评估日期",
                  value: detail.assessDate || detail.createTime || "-",
                },
                { label: "评分", value: detail.score },
                { label: "等级", value: detail.level || "-" },
                { label: "评估结果", value: detail.result || "-", wide: true },
                { label: "建议", value: detail.suggestion || "-", wide: true },
              ]
            : []
        }
      />
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-5xl overflow-y-auto rounded-lg bg-white/95 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>综合健康评估报告</DialogTitle>
          </DialogHeader>
          <select
            value={reportElderId || ""}
            onChange={(event) => setReportElderId(Number(event.target.value))}
            className="h-9 w-full max-w-sm rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="">请选择老人</option>
            {eldersData?.records.map((elder) => (
              <option key={elder.id} value={elder.id}>
                {elder.name}
              </option>
            ))}
          </select>
          {reportLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-56 w-full" />
            </div>
          ) : report ? (
            <ComprehensiveHealthReportView report={report} />
          ) : (
            <EmptyState
              title="请选择老人"
              description="选择老人后加载综合健康评估报告"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              关闭
            </Button>
            <Button
              onClick={exportReport}
              disabled={!report}
              className="bg-gradient-to-r from-medical-400 to-medical-600 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              导出报告
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="删除评估记录"
        description="确定删除该评估记录吗？"
        confirmText="确认删除"
        destructive
        pending={deleteAssessment.isPending}
        onConfirm={remove}
      />
    </PageShell>
  );
}
