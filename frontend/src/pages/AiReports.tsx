import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle2, Eye, FileText, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import TextActionDialog from "@/components/common/TextActionDialog";
import AiHealthReportView from "@/components/reports/AiHealthReportView";
import {
  asText,
  asTextList,
  getAiReportSummary,
  parseAiHealthReport,
  parseNestedReport,
  riskLevelText,
  riskTone,
} from "@/components/reports/reportParsing";
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
import {
  useAiReportDetail,
  useAiReports,
  useConfirmAiReport,
  useDeepAnalysisAiReport,
  useElders,
  useGenerateAiReport,
  useRejectAiReport,
  type AiHealthReport,
  type AiHealthReportDocument,
} from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { getUserRole, useAuthStore } from "@/store/auth";

const statusLabels = ["草稿", "已确认", "已驳回", "已归档"];

interface ReportEditForm {
  reportText: string;
  aiAnalysis: string;
  riskReasons: string;
  aiSuggestions: string;
}

const emptyEditForm: ReportEditForm = {
  reportText: "",
  aiAnalysis: "",
  riskReasons: "",
  aiSuggestions: "",
};

export default function AiReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedElderId = Number(searchParams.get("elderId") || 0) || 0;
  const userInfo = useAuthStore((state) => state.userInfo);
  const role = getUserRole(userInfo);
  const canOperateReports = role === "doctor" || role === "admin";
  const [selectedElderId, setSelectedElderId] = useState(requestedElderId);
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<number | undefined>();
  const [confirmTarget, setConfirmTarget] = useState<AiHealthReport | null>(
    null,
  );
  const [editForm, setEditForm] = useState<ReportEditForm>(emptyEditForm);
  const [editDocument, setEditDocument] =
    useState<AiHealthReportDocument | null>(null);
  const [editNotice, setEditNotice] = useState("");
  const [rejectTarget, setRejectTarget] = useState<AiHealthReport | null>(null);
  const { data: eldersData, isLoading: eldersLoading } = useElders(1, 100);
  const { data, isLoading, refetch } = useAiReports(selectedElderId, page, 10);
  const { data: detail, isLoading: detailLoading } =
    useAiReportDetail(detailId);
  const generateReport = useGenerateAiReport();
  const deepAnalysis = useDeepAnalysisAiReport();
  const confirmReport = useConfirmAiReport();
  const rejectReport = useRejectAiReport();
  const records = data?.records || [];
  const totalPages = data?.pages || 1;
  const elderNames = useMemo(
    () =>
      new Map(
        (eldersData?.records || []).map((elder) => [elder.id, elder.name]),
      ),
    [eldersData?.records],
  );

  useEffect(() => {
    setSelectedElderId(requestedElderId);
    setPage(1);
  }, [requestedElderId]);

  const selectElder = (elderId: number) => {
    const next = new URLSearchParams(searchParams);
    if (elderId) next.set("elderId", String(elderId));
    else next.delete("elderId");
    setSearchParams(next, { replace: true });
    setSelectedElderId(elderId);
    setPage(1);
  };

  useEffect(() => {
    if (!confirmTarget) {
      setEditForm(emptyEditForm);
      setEditDocument(null);
      setEditNotice("");
      return;
    }

    const parsed = parseAiHealthReport(confirmTarget);
    if (!parsed.document) {
      setEditForm(emptyEditForm);
      setEditDocument(null);
      setEditNotice(parsed.error || "报告解析失败，无法进行结构化编辑。");
      return;
    }

    setEditDocument(parsed.document);
    setEditForm({
      reportText: asText(parsed.document.reportText),
      aiAnalysis: asText(parsed.document.aiAnalysis),
      riskReasons: asTextList(parsed.document.riskReasons).join("\n"),
      aiSuggestions: asTextList(parsed.document.aiSuggestions).join("\n"),
    });
    setEditNotice(parsed.warning || "");
  }, [confirmTarget]);
  const generate = async () => {
    if (!selectedElderId) return toast.error("请先选择老人");
    try {
      await generateReport.mutateAsync(selectedElderId);
      toast.success("规则评估报告已生成");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "生成报告失败");
    }
  };
  const deep = async (id: number) => {
    try {
      await deepAnalysis.mutateAsync(id);
      toast.success("AI 深度分析完成");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI 分析失败");
    }
  };
  const confirm = async () => {
    if (!confirmTarget || !editDocument) {
      toast.error("报告解析失败，暂时无法确认");
      return;
    }

    const reportText = editForm.reportText.trim();
    const aiAnalysis = editForm.aiAnalysis.trim();
    const riskReasons = editForm.riskReasons
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    const aiSuggestions = editForm.aiSuggestions
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!reportText) {
      toast.error("综合摘要不能为空");
      return;
    }
    if (reportText.length > 4000 || aiAnalysis.length > 8000) {
      toast.error("综合摘要或 AI 分析内容过长");
      return;
    }
    if (
      riskReasons.length > 50 ||
      aiSuggestions.length > 50 ||
      [...riskReasons, ...aiSuggestions].some((item) => item.length > 500)
    ) {
      toast.error("逐行内容最多 50 条，每条不能超过 500 个字符");
      return;
    }

    let editedReportJson = "";
    try {
      editedReportJson = JSON.stringify({
        ...editDocument,
        reportText,
        aiAnalysis,
        riskReasons,
        aiSuggestions,
      });
      const verified =
        parseNestedReport<AiHealthReportDocument>(editedReportJson);
      if (!verified.document) throw new Error(verified.error);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "报告内容无法组装为合法 JSON",
      );
      return;
    }

    try {
      await confirmReport.mutateAsync({
        id: confirmTarget.id,
        editedReportJson,
      });
      setConfirmTarget(null);
      toast.success("报告已确认保存");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "确认报告失败");
    }
  };
  const reject = async (reason: string) => {
    if (!rejectTarget) return;
    try {
      await rejectReport.mutateAsync({ id: rejectTarget.id, reason });
      setRejectTarget(null);
      toast.success("报告已驳回");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "驳回报告失败");
    }
  };

  return (
    <PageShell
      title="AI 健康报告"
      subtitle="生成、查看、AI 深度分析、编辑确认和驳回健康评估报告"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="报告总数"
            value={Number(data?.total || 0)}
            icon={FileText}
            delay={0}
          />
          <StatCard
            title="当前列表"
            value={records.length}
            icon={Sparkles}
            iconClassName="from-sky-400 to-sky-500"
            delay={1}
          />
          <StatCard
            title="待确认"
            value={records.filter((item) => item.status === 0).length}
            icon={CheckCircle2}
            iconClassName="from-amber-400 to-amber-500"
            delay={2}
          />
        </div>
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div className="min-w-[260px]">
              <label className="text-sm font-medium text-muted-foreground">
                老人
              </label>
              {eldersLoading ? (
                <Skeleton className="mt-2 h-9 w-full" />
              ) : (
                <select
                  className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm"
                  value={selectedElderId || ""}
                  onChange={(event) => selectElder(Number(event.target.value))}
                >
                  <option value="">请选择老人</option>
                  {eldersData?.records.map((elder) => (
                    <option key={elder.id} value={elder.id}>
                      {elder.name}（{elder.idCard}）
                    </option>
                  ))}
                </select>
              )}
            </div>
            {canOperateReports && (
              <Button
                onClick={generate}
                disabled={!selectedElderId || generateReport.isPending}
                className="rounded-xl bg-gradient-to-r from-lavender-400 to-sky-400 text-white"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                生成基础报告
              </Button>
            )}
            {!canOperateReports && (
              <Badge
                variant="outline"
                className="h-9 border-sky-200 bg-sky-50 px-3 text-sky-700"
              >
                护士只读视图
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <FileText className="h-5 w-5 text-medical-500" />
              AI 报告列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedElderId ? (
              <EmptyState
                title="请选择老人"
                description="选择老人后查询和生成健康评估报告"
              />
            ) : isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : records.length === 0 ? (
              <EmptyState
                title="暂无 AI 报告"
                description="可生成基础报告后再进行 AI 深度分析"
              />
            ) : (
              <div className="space-y-3">
                {records.map((item, index) => {
                  const summary = getAiReportSummary(item);
                  const elderName =
                    item.elderName || elderNames.get(item.elderId);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="min-w-0 rounded-lg border border-border/40 bg-white/60 p-4"
                    >
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words font-semibold">
                              {elderName
                                ? `${elderName} · 健康评估报告`
                                : `健康评估报告 #${item.id}`}
                            </h3>
                            <Badge variant="outline">
                              {statusLabels[item.status] || "未知"}
                            </Badge>
                            {summary.riskLevel && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "border",
                                  riskTone(summary.riskLevel),
                                )}
                              >
                                {riskLevelText(summary.riskLevel)} ·{" "}
                                {summary.riskScore ?? "-"} 分
                              </Badge>
                            )}
                          </div>
                          <p className="mt-2 line-clamp-2 break-words text-sm text-muted-foreground">
                            {summary.summary ||
                              summary.error ||
                              "暂无结构化摘要"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.modelName ||
                              (item.source === 2 ? "AI 引擎" : "规则引擎")}{" "}
                            · {item.createTime}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailId(item.id)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            查看
                          </Button>
                          {canOperateReports &&
                            item.source === 1 &&
                            item.status === 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deep(item.id)}
                                disabled={deepAnalysis.isPending}
                              >
                                <Sparkles className="mr-1 h-4 w-4" />
                                AI 增强分析
                              </Button>
                            )}
                          {canOperateReports && item.status === 0 && (
                            <Button
                              size="sm"
                              onClick={() => setConfirmTarget(item)}
                              className="bg-gradient-to-r from-medical-400 to-medical-600 text-white"
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              确认保存
                            </Button>
                          )}
                          {canOperateReports && item.status === 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => setRejectTarget(item)}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              驳回
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {totalPages > 1 && (
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((value) => value - 1)}
                    >
                      上一页
                    </Button>
                    <span className="px-2 py-1 text-sm">
                      {page}/{totalPages}
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(undefined)}
      >
        <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-5xl overflow-y-auto rounded-lg bg-white/95 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>AI 健康报告详情</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-52 w-full" />
            </div>
          ) : detail ? (
            <>
              <AiHealthReportView report={detail} />
              {detail.rejectReason && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  驳回原因：{detail.rejectReason}
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="报告加载失败"
              description="请关闭后重新打开报告"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailId(undefined)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {canOperateReports && (
        <Dialog
          open={!!confirmTarget}
          onOpenChange={(open) => !open && setConfirmTarget(null)}
        >
          <DialogContent
            data-testid="structured-report-editor"
            className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-4xl overflow-y-auto rounded-lg bg-white/95 p-4 sm:p-6"
          >
            <DialogHeader>
              <DialogTitle>编辑并确认健康报告</DialogTitle>
            </DialogHeader>
            <p className="text-sm leading-6 text-muted-foreground">
              按报告结构修改可读内容，系统会自动组装并校验结构化数据，不需要直接编辑
              JSON。
            </p>
            {editNotice && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {editNotice}
              </div>
            )}
            {editDocument ? (
              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                <label className="min-w-0 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">
                    综合摘要 <span className="text-rose-500">*</span>
                  </span>
                  <textarea
                    data-testid="report-edit-summary"
                    className="mt-2 min-h-28 w-full resize-y rounded-lg border border-input bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
                    maxLength={4000}
                    value={editForm.reportText}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        reportText: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="min-w-0 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">
                    AI 深度分析
                  </span>
                  <textarea
                    data-testid="report-edit-analysis"
                    className="mt-2 min-h-28 w-full resize-y rounded-lg border border-input bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    maxLength={8000}
                    placeholder="尚未进行 AI 深度分析时可留空"
                    value={editForm.aiAnalysis}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        aiAnalysis: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="min-w-0">
                  <span className="text-sm font-medium text-slate-700">
                    风险原因
                  </span>
                  <span className="ml-2 text-xs text-slate-400">每行一条</span>
                  <textarea
                    data-testid="report-edit-risk-reasons"
                    className="mt-2 min-h-40 w-full resize-y rounded-lg border border-input bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    placeholder="血压控制不稳定\n近期随访存在逾期"
                    value={editForm.riskReasons}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        riskReasons: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="min-w-0">
                  <span className="text-sm font-medium text-slate-700">
                    AI 建议
                  </span>
                  <span className="ml-2 text-xs text-slate-400">每行一条</span>
                  <textarea
                    data-testid="report-edit-ai-suggestions"
                    className="mt-2 min-h-40 w-full resize-y rounded-lg border border-input bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="增加血压监测频率\n按计划完成复诊"
                    value={editForm.aiSuggestions}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        aiSuggestions: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            ) : (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                当前报告无法解析，不能直接确认。请先重新生成报告或联系管理员检查数据。
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmTarget(null)}>
                取消
              </Button>
              <Button
                onClick={confirm}
                disabled={!editDocument || confirmReport.isPending}
                className="bg-gradient-to-r from-medical-400 to-medical-600 text-white"
              >
                确认保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {canOperateReports && (
        <TextActionDialog
          open={!!rejectTarget}
          onOpenChange={(open) => !open && setRejectTarget(null)}
          title="驳回 AI 健康报告"
          description="请填写驳回原因"
          placeholder="驳回原因"
          confirmText="确认驳回"
          required
          destructive
          pending={rejectReport.isPending}
          onConfirm={reject}
        />
      )}
    </PageShell>
  );
}
