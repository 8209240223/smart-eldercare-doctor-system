import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import EmptyState from "@/components/common/EmptyState";
import StatCard from "@/components/dashboard/StatCard";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ElderMasterSelect from "@/components/workflow/ElderMasterSelect";
import WorkflowNavigationDialog, {
  type WorkflowNavigationOption,
} from "@/components/workflow/WorkflowNavigationDialog";
import { useElderWorkflowTasks } from "@/hooks/useCareWorkflow";
import {
  useCancelFollowupTask,
  useFinishFollowupTask,
  useFollowupTasks,
  useGenerateFollowupTasks,
  useElders,
  useOverdueFollowupTasks,
  useTodayFollowupTasks,
  type FollowupTask,
} from "@/hooks/useApi";

function statusText(status?: number) {
  if (status === 1) return "执行中";
  if (status === 2) return "已完成";
  if (status === 3) return "已取消";
  return "待随访";
}

function statusClass(status?: number) {
  if (status === 1) return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === 2) return "border-medical-200 bg-medical-50 text-medical-700";
  if (status === 3) return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function FollowupTasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedElderId = Number(searchParams.get("elderId") || 0) || undefined;
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<number | undefined>(0);
  const [finishTarget, setFinishTarget] = useState<FollowupTask | null>(null);
  const [followRecordId, setFollowRecordId] = useState("");
  const [cancelTarget, setCancelTarget] = useState<FollowupTask | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [navigationState, setNavigationState] = useState<{
    title: string;
    description: string;
    options: WorkflowNavigationOption[];
  } | null>(null);

  const overdueScope = searchParams.get("scope") === "overdue";
  const {
    data,
    isLoading: taskListLoading,
    refetch: refetchTaskList,
  } = useFollowupTasks(page, 10, status);
  const {
    data: overdueTasks,
    isLoading: overdueLoading,
    refetch: refetchOverdue,
  } = useOverdueFollowupTasks(overdueScope);
  const { data: todayTasks } = useTodayFollowupTasks();
  const { data: eldersData } = useElders(1, 500);
  const {
    data: elderTaskData,
    isLoading: elderTasksLoading,
    refetch: refetchElderTasks,
  } = useElderWorkflowTasks(selectedElderId, status);
  const generateTasks = useGenerateFollowupTasks();
  const finishTask = useFinishFollowupTask();
  const cancelTask = useCancelFollowupTask();

  const elderNames = new Map(
    (eldersData?.records || []).map((elder) => [elder.id, elder.name]),
  );
  const sourceRecords = overdueScope
    ? overdueTasks || []
    : selectedElderId
      ? (elderTaskData?.records as FollowupTask[] | undefined) || []
      : data?.records || [];
  const records = selectedElderId
    ? sourceRecords.filter((task) => Number(task.elderId) === selectedElderId)
    : sourceRecords;
  const total =
    selectedElderId || overdueScope ? records.length : data?.total || 0;
  const totalPages = overdueScope ? 1 : data?.pages || 1;
  const isLoading = overdueScope
    ? overdueLoading
    : selectedElderId
      ? elderTasksLoading
      : taskListLoading;
  const refetch = overdueScope
    ? refetchOverdue
    : selectedElderId
      ? refetchElderTasks
      : refetchTaskList;

  const setScope = (scope: "all" | "overdue") => {
    const next = new URLSearchParams(searchParams);
    if (scope === "overdue") next.set("scope", "overdue");
    else next.delete("scope");
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const selectElder = (elderId?: number) => {
    const next = new URLSearchParams(searchParams);
    if (elderId) next.set("elderId", String(elderId));
    else next.delete("elderId");
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const nextOptions = (elderId?: number): WorkflowNavigationOption[] => [
    {
      key: "report",
      label: "查看 AI 健康报告",
      description: "继续查看或生成该老人的健康报告",
      to: elderId ? `/ai-reports?elderId=${elderId}` : "/ai-reports",
    },
    ...(elderId
      ? [
          {
            key: "journey",
            label: "查看照护全流程",
            description: "核对风险、计划、任务与护理协同",
            to: `/elders/${elderId}/care-journey`,
          },
          {
            key: "plan",
            label: "返回随访计划",
            description: "查看任务对应的随访计划",
            to: `/followup?elderId=${elderId}`,
          },
        ]
      : []),
  ];

  const generate = async () => {
    try {
      const count = await generateTasks.mutateAsync();
      toast.success(`已生成 ${count || 0} 条随访任务`);
      refetch();
      setNavigationState({
        title: "随访任务生成完成",
        description: `本次同步生成 ${count || 0} 条任务，是否继续查看 AI 报告或照护全流程？`,
        options: nextOptions(selectedElderId),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "生成随访任务失败");
    }
  };

  const submitFinish = async () => {
    if (!finishTarget?.id || !followRecordId) {
      toast.error("请填写关联随访记录ID");
      return;
    }
    try {
      await finishTask.mutateAsync({
        id: finishTarget.id,
        followRecordId: Number(followRecordId),
      });
      toast.success("随访任务已完成");
      setFinishTarget(null);
      setFollowRecordId("");
      refetch();
      setNavigationState({
        title: "随访任务已完成",
        description: "随访记录已经与任务关联，是否继续查看该老人的健康报告？",
        options: nextOptions(finishTarget.elderId),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "完成随访任务失败");
    }
  };

  const submitCancel = async () => {
    if (!cancelTarget?.id) return;
    try {
      await cancelTask.mutateAsync({
        id: cancelTarget.id,
        reason: cancelReason,
      });
      toast.success("随访任务已取消");
      setCancelTarget(null);
      setCancelReason("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "取消随访任务失败");
    }
  };

  return (
    <PageShell
      title="随访任务"
      subtitle="按风险和计划生成随访任务，跟踪今日、待办、完成和取消状态"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="今日任务"
            value={todayTasks?.length || 0}
            icon={CalendarClock}
            delay={0}
          />
          <StatCard
            title="当前列表"
            value={total}
            icon={Clock}
            iconClassName="from-sky-400 to-sky-500"
            delay={1}
          />
          <StatCard
            title={
              overdueScope
                ? "逾期任务"
                : status === undefined
                  ? "全部状态"
                  : statusText(status)
            }
            value={Number(total)}
            icon={CheckCircle2}
            delay={2}
          />
        </div>

        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                任务范围
              </label>
              <div className="mt-2 flex rounded-xl border border-border/60 bg-white/70 p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={!overdueScope ? "default" : "ghost"}
                  className="rounded-lg"
                  onClick={() => setScope("all")}
                >
                  全部任务
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={overdueScope ? "default" : "ghost"}
                  className="rounded-lg"
                  onClick={() => setScope("overdue")}
                >
                  逾期任务
                </Button>
              </div>
            </div>
            <div className="min-w-[180px]">
              <label className="text-sm font-medium text-muted-foreground">
                任务状态
              </label>
              <select
                value={status ?? ""}
                onChange={(event) => {
                  setStatus(
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                  );
                  setScope("all");
                }}
                className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm outline-none focus:border-medical-400"
              >
                <option value="">全部状态</option>
                <option value="0">待随访</option>
                <option value="1">执行中</option>
                <option value="2">已完成</option>
                <option value="3">已取消</option>
              </select>
            </div>
            <ElderMasterSelect
              className="min-w-[260px]"
              label="老人主档"
              elders={eldersData?.records || []}
              value={selectedElderId}
              onChange={selectElder}
            />
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="rounded-xl"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              查询
            </Button>
            <Button
              onClick={generate}
              disabled={generateTasks.isPending}
              className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white"
            >
              自动生成任务
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              {overdueScope ? "逾期任务列表" : "随访任务列表"}
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
                title={overdueScope ? "暂无逾期任务" : "暂无随访任务"}
                description={
                  overdueScope
                    ? "当前没有超过截止日期且仍待处理的随访任务"
                    : "可点击自动生成任务同步后端任务池"
                }
              />
            ) : (
              <div className="space-y-3">
                {records.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-border/40 bg-white/60 p-4"
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {task.elderName ||
                              elderNames.get(task.elderId) ||
                              "姓名未同步"}
                          </h3>
                          <Badge
                            variant="outline"
                            className={statusClass(task.status)}
                          >
                            {statusText(task.status)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-medical-200 bg-medical-50 text-medical-700"
                          >
                            优先级 {task.priority || "-"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          原因：{task.taskReason || "-"} · 截止：
                          {task.dueDate || "-"}
                        </p>
                      </div>
                      {task.status === 0 && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            onClick={() => setFinishTarget(task)}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            完成
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg text-red-600"
                            onClick={() => setCancelTarget(task)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            取消
                          </Button>
                        </div>
                      )}
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
        open={!!finishTarget}
        onOpenChange={(open) => !open && setFinishTarget(null)}
      >
        <DialogContent className="rounded-2xl bg-white/95">
          <DialogHeader>
            <DialogTitle>完成随访任务</DialogTitle>
          </DialogHeader>
          <Input
            value={followRecordId}
            onChange={(event) => setFollowRecordId(event.target.value)}
            placeholder="关联随访记录ID"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishTarget(null)}>
              取消
            </Button>
            <Button
              onClick={submitFinish}
              disabled={finishTask.isPending}
              className="bg-gradient-to-r from-medical-400 to-medical-600 text-white"
            >
              确认完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <DialogContent className="rounded-2xl bg-white/95">
          <DialogHeader>
            <DialogTitle>取消随访任务</DialogTitle>
          </DialogHeader>
          <textarea
            className="min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder="取消原因，可选"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              返回
            </Button>
            <Button
              onClick={submitCancel}
              disabled={cancelTask.isPending}
              className="bg-gradient-to-r from-medical-400 to-medical-600 text-white"
            >
              确认取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <WorkflowNavigationDialog
        open={!!navigationState}
        onOpenChange={(open) => !open && setNavigationState(null)}
        title={navigationState?.title || "操作完成"}
        description={navigationState?.description}
        options={navigationState?.options || []}
      />
    </PageShell>
  );
}
