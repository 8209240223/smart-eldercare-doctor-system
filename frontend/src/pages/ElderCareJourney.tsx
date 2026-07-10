import { ArrowLeft, RefreshCw, Sparkles, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import EmptyState from "@/components/common/EmptyState";
import CareWorkflowStepper from "@/components/workflow/CareWorkflowStepper";
import WorkflowNavigationDialog, {
  type WorkflowNavigationOption,
} from "@/components/workflow/WorkflowNavigationDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCareWorkflowSummary,
  useGenerateCareWorkflow,
  workflowLink,
  type CareWorkflowSummary,
} from "@/hooks/useCareWorkflow";
import { getUserRole, useAuthStore } from "@/store/auth";

export default function ElderCareJourney() {
  const navigate = useNavigate();
  const params = useParams();
  const elderId = Number(params.elderId || 0);
  const userInfo = useAuthStore((state) => state.userInfo);
  const role = getUserRole(userInfo);
  const canGenerate = role === "doctor" || role === "admin";
  const {
    data: summary,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useCareWorkflowSummary(elderId || undefined);
  const generateWorkflow = useGenerateCareWorkflow();
  const [result, setResult] = useState<CareWorkflowSummary | null>(null);

  const navigationOptions = useMemo<WorkflowNavigationOption[]>(() => {
    if (!elderId) return [];
    const source = result || summary;
    return [
      {
        key: "risk",
        label: "查看风险画像",
        description: "核对风险等级、评分和风险因素",
        to: workflowLink(source, "risk", "/key-population", elderId),
      },
      {
        key: "plan",
        label: "查看随访计划",
        description: "查看为该老人生成或复用的计划",
        to: workflowLink(source, "plan", "/followup", elderId),
      },
      {
        key: "task",
        label: "查看随访任务",
        description: "进入该老人的任务执行列表",
        to: workflowLink(source, "task", "/followup-tasks", elderId),
      },
      {
        key: "report",
        label: "查看 AI 报告",
        description: "查看基于当前健康数据生成的报告",
        to: workflowLink(source, "report", "/ai-reports", elderId),
      },
      {
        key: "nursing",
        label: "查看护理计划",
        description: "进入护士端护理协同页面",
        to: workflowLink(source, "nursing", "/nurse-plans", elderId),
      },
    ];
  }, [elderId, result, summary]);

  const generate = async () => {
    if (!elderId) return;
    try {
      const next = await generateWorkflow.mutateAsync(elderId);
      setResult(next);
      toast.success("健康管理流程已生成并刷新");
    } catch (reason) {
      toast.error(
        reason instanceof Error ? reason.message : "生成健康管理流程失败",
      );
    }
  };

  const go = (key: string, fallback: string) => {
    navigate(summary?.links?.[key] || fallback);
  };

  return (
    <PageShell
      title="照护全流程"
      subtitle="以统一老人主档串联风险、随访、AI 报告和护理协同"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            className="w-fit rounded-xl"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              刷新状态
            </Button>
            {canGenerate && (
              <Button
                onClick={generate}
                disabled={generateWorkflow.isPending}
                className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                一键生成 / 刷新健康管理流程
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-7">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={index} className="h-48 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : error || !summary ? (
          <Card className="border-border/40 bg-white/85">
            <CardContent className="p-8">
              <EmptyState
                title="暂时无法读取照护全流程"
                description={
                  error instanceof Error
                    ? error.message
                    : "请确认老人档案存在并刷新页面"
                }
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="overflow-hidden border-medical-100 bg-white/90 shadow-card">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-medical-100 text-medical-700">
                    <UserRound className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words text-xl font-bold">
                        {summary.elder.name || "姓名未同步"}
                      </h2>
                      <Badge
                        variant="outline"
                        className="border-medical-200 bg-medical-50 text-medical-700"
                      >
                        主档 ID {summary.elder.id}
                      </Badge>
                    </div>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {summary.elder.idCard || "未填写身份证号"} ·{" "}
                      {summary.elder.phone || "未填写联系电话"} ·{" "}
                      {summary.elder.community || "未填写社区"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="w-fit border-sky-200 bg-sky-50 px-3 py-1.5 text-sky-700"
                >
                  {role === "nurse"
                    ? "护士只读视图"
                    : role === "admin"
                      ? "管理员全局视图"
                      : "责任医生视图"}
                </Badge>
              </CardContent>
            </Card>

            <CareWorkflowStepper summary={summary} onNavigate={go} />
          </>
        )}
      </div>

      <WorkflowNavigationDialog
        open={!!result}
        onOpenChange={(open) => !open && setResult(null)}
        title="健康管理流程生成完成"
        description="风险、随访、任务、AI 报告和护理协同状态已经汇总。请选择接下来要核对的页面。"
        options={navigationOptions}
        result={result}
      />
    </PageShell>
  );
}
