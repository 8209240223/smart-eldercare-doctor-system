import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Activity,
  Brain,
  CalendarPlus,
  RefreshCw,
  ShieldAlert,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import RiskProfileCards from "@/components/workflow/RiskProfileCards";
import WorkflowNavigationDialog, {
  type WorkflowNavigationOption,
} from "@/components/workflow/WorkflowNavigationDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCalculateAllRisk,
  useCalculateElderRisk,
  useGenerateRiskPlans,
  useRiskDetail,
  useRiskElders,
  useRiskStats,
  type RiskProfile,
} from "@/hooks/useApi";
import { useAuthStore } from "@/store/auth";

function riskText(level?: number) {
  if (level === 4) return "高危";
  if (level === 3) return "重点";
  if (level === 2) return "关注";
  return "正常";
}

function riskClass(level?: number) {
  if (level === 4) return "border-red-200 bg-red-50 text-red-700";
  if (level === 3) return "border-amber-200 bg-amber-50 text-amber-700";
  if (level === 2) return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-medical-200 bg-medical-50 text-medical-700";
}

export default function KeyPopulation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedElderId =
    Number(searchParams.get("elderId") || 0) || undefined;
  const userInfo = useAuthStore((state) => state.userInfo);
  const currentDoctorId =
    Number(userInfo?.userId || userInfo?.id || 0) || undefined;
  const [page, setPage] = useState(1);
  const [riskLevel, setRiskLevel] = useState<number | undefined>();
  const [selected, setSelected] = useState<RiskProfile | null>(null);
  const [navigationState, setNavigationState] = useState<{
    title: string;
    description: string;
    options: WorkflowNavigationOption[];
    details?: string[];
  } | null>(null);

  const { data, isLoading, refetch } = useRiskElders(page, 10, riskLevel);
  const { data: stats } = useRiskStats();
  const { data: detail, isLoading: detailLoading } = useRiskDetail(
    selected?.elderId,
  );
  const calculateAll = useCalculateAllRisk();
  const calculateOne = useCalculateElderRisk();
  const generatePlans = useGenerateRiskPlans();

  const records = requestedElderId
    ? (data?.records || []).filter((item) => item.elderId === requestedElderId)
    : data?.records || [];
  const totalPages = data?.pages || 1;

  useEffect(() => {
    if (!requestedElderId) return;
    const matched = (data?.records || []).find(
      (item) => item.elderId === requestedElderId,
    );
    setSelected(matched || { elderId: requestedElderId });
  }, [data?.records, requestedElderId]);

  const handleCalculateAll = async () => {
    try {
      await calculateAll.mutateAsync();
      toast.success("风险分层已重新计算");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "风险计算失败");
    }
  };

  const handleCalculateOne = async (elderId: number) => {
    try {
      await calculateOne.mutateAsync(elderId);
      toast.success("老人风险画像已更新");
      refetch();
      setNavigationState({
        title: "风险画像已更新",
        description: "风险分层已经完成，是否继续为该老人建立随访和照护流程？",
        options: [
          {
            key: "plan",
            label: "进入随访计划",
            description: "继续为该老人生成或维护随访计划",
            to: `/followup?elderId=${elderId}`,
          },
          {
            key: "journey",
            label: "查看照护全流程",
            description: "核对风险、计划、任务、报告和护理协同",
            to: `/elders/${elderId}/care-journey`,
          },
        ],
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "单人风险计算失败");
    }
  };

  const handleGeneratePlan = async (elderId?: number) => {
    try {
      const result = await generatePlans.mutateAsync({
        elderId,
        doctorId: currentDoctorId,
      });
      if (Number(result?.createdCount || 0) > 0)
        toast.success(`已生成 ${result.createdCount} 条风险随访计划`);
      else
        toast.info(
          result?.message ||
            result?.skippedReasons?.[0] ||
            "当前没有可生成的新随访计划",
        );
      const targetElderId = elderId || result?.createdPlans?.[0]?.elderId;
      setNavigationState({
        title: "风险随访计划处理完成",
        description:
          result?.message ||
          result?.skippedReasons?.[0] ||
          "计划已生成或复用，是否继续进入下一环节？",
        details: [
          ...(result?.createdPlans || []).map(
            (plan) => `已生成：${plan.planName || `随访计划 #${plan.id}`}`,
          ),
          ...(result?.reusedPlans || []).map(
            (plan) => `已复用：${plan.planName || `随访计划 #${plan.id}`}`,
          ),
          ...(result?.skippedReasons || []).map(
            (reason) => `已跳过：${reason}`,
          ),
        ],
        options: [
          {
            key: "plan",
            label: "查看随访计划",
            description: "核对计划周期、频次和执行状态",
            to: targetElderId
              ? `/followup?elderId=${targetElderId}`
              : "/followup",
          },
          {
            key: "task",
            label: "继续生成任务",
            description: "进入随访任务页面同步任务池",
            to: targetElderId
              ? `/followup-tasks?elderId=${targetElderId}`
              : "/followup-tasks",
          },
          ...(targetElderId
            ? [
                {
                  key: "journey",
                  label: "查看照护全流程",
                  description: "查看该老人的完整数据链",
                  to: `/elders/${targetElderId}/care-journey`,
                },
              ]
            : []),
        ],
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "生成随访计划失败");
    }
  };

  return (
    <PageShell
      title="重点人群"
      subtitle="按风险分层识别重点老人，查看风险画像，并生成随访计划"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="高危老人"
            value={Number(stats?.highRisk || 0)}
            icon={ShieldAlert}
            iconClassName="from-red-400 to-red-500"
            delay={0}
          />
          <StatCard
            title="重点人群"
            value={Number(stats?.key || 0)}
            icon={Target}
            iconClassName="from-amber-400 to-amber-500"
            delay={1}
          />
          <StatCard
            title="关注对象"
            value={Number(stats?.attention || 0)}
            icon={Activity}
            iconClassName="from-sky-400 to-sky-500"
            delay={2}
          />
          <StatCard
            title="正常老人"
            value={Number(stats?.normal || 0)}
            icon={Brain}
            delay={3}
          />
        </div>

        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div className="min-w-[180px]">
              <label className="text-sm font-medium text-muted-foreground">
                风险等级
              </label>
              <select
                value={riskLevel ?? ""}
                onChange={(event) => {
                  setRiskLevel(
                    event.target.value ? Number(event.target.value) : undefined,
                  );
                  setPage(1);
                }}
                className="mt-2 h-10 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm outline-none focus:border-medical-400"
              >
                <option value="">全部等级</option>
                <option value="4">高危</option>
                <option value="3">重点</option>
                <option value="2">关注</option>
                <option value="1">正常</option>
              </select>
            </div>
            <Button
              onClick={handleCalculateAll}
              disabled={calculateAll.isPending}
              className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              全量计算
            </Button>
            <Button
              onClick={() => handleGeneratePlan()}
              disabled={generatePlans.isPending}
              variant="outline"
              className="rounded-xl"
            >
              <CalendarPlus className="mr-2 h-4 w-4" />
              生成随访计划
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              {requestedElderId
                ? "指定老人风险分层"
                : "风险分层列表"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : records.length === 0 ? (
              <EmptyState
                title="暂无重点人群数据"
                description="可先执行全量风险计算"
              />
            ) : (
              <div className="space-y-3">
                {records.map((item) => (
                  <div
                    key={item.elderId}
                    className="flex flex-col gap-3 rounded-xl border border-border/40 bg-white/60 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {item.elderName ||
                            item.name ||
                            "姓名未同步"}
                        </h3>
                        <Badge
                          variant="outline"
                          className={riskClass(item.riskLevel)}
                        >
                          {item.riskLevelText || riskText(item.riskLevel)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          评分 {item.riskScore ?? 0}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.riskTags || "暂无风险标签"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        最近计算：{item.lastCalculateTime || "-"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelected(item)}
                        className="rounded-lg"
                      >
                        查看画像
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCalculateOne(item.elderId)}
                        className="rounded-lg"
                      >
                        重新计算
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleGeneratePlan(item.elderId)}
                        className="rounded-lg bg-gradient-to-r from-medical-400 to-medical-600 text-white"
                      >
                        生成计划
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(`/elders/${item.elderId}/care-journey`)
                        }
                        className="rounded-lg"
                      >
                        照护全流程
                      </Button>
                    </div>
                  </div>
                ))}
                {totalPages > 1 && (
                  <div className="flex items-center justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                    >
                      上一页
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((value) => Math.min(totalPages, value + 1))
                      }
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
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-5xl overflow-hidden rounded-lg border-border/50 bg-slate-50/95 p-0 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-border/50 bg-white/95 px-5 py-4 sm:px-6">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-bold">
                    {selected?.elderName || selected?.name || "老人"} · 风险画像
                  </DialogTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    汇总风险评分、触发因素、健康概况和管理建议
                  </p>
                </div>
              </div>
            </DialogHeader>
          </div>
          <div className="max-h-[calc(90vh-82px)] overflow-y-auto p-4 sm:p-6">
            {detailLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-32 rounded-lg" />
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 rounded-lg" />
                  ))}
                </div>
              </div>
            ) : (
              <RiskProfileCards
                profile={
                  detail || (selected as unknown as Record<string, unknown>)
                }
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      <WorkflowNavigationDialog
        open={!!navigationState}
        onOpenChange={(open) => {
          if (!open) {
            setNavigationState(null);
          }
        }}
        title={navigationState?.title || "操作完成"}
        description={navigationState?.description}
        options={navigationState?.options || []}
        details={navigationState?.details}
      />
    </PageShell>
  );
}
