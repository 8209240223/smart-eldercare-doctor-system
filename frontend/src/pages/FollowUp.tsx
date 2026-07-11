import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  Activity,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  Eye,
  HeartPulse,
  Pencil,
  Play,
  Plus,
  Stethoscope,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DetailDialog from "@/components/common/DetailDialog";
import FollowupPlanDialog from "@/components/followup/FollowupPlanDialog";
import FollowupRecordDialog from "@/components/followup/FollowupRecordDialog";
import ElderMasterSelect from "@/components/workflow/ElderMasterSelect";
import WorkflowNavigationDialog, {
  type WorkflowNavigationOption,
} from "@/components/workflow/WorkflowNavigationDialog";
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
  useChangeFollowupPlanStatus,
  useCreateFollowupPlan,
  useCreateFollowupRecord,
  useDeleteFollowupPlan,
  useDeleteGeneratedFollowupPlans,
  useElders,
  useFollowupPlans,
  useFollowupRecordDetail,
  useFollowupRecords,
  useFollowupStats,
  useGenerateRiskPlans,
  useUpdateFollowupPlan,
  type FollowupPlan,
  type FollowupRecord,
} from "@/hooks/useApi";
import { getUserRole, useAuthStore } from "@/store/auth";

function statusText(status?: number) {
  if (status === 1) return "进行中";
  if (status === 2) return "已完成";
  if (status === 3) return "已终止";
  return "暂停 / 待执行";
}

function statusClass(status?: number) {
  if (status === 1) return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === 2) return "border-medical-200 bg-medical-50 text-medical-700";
  if (status === 3) return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function canRecordFollowup(plan?: FollowupPlan | null) {
  if (!plan || plan.status === 2 || plan.status === 3) return false;
  return (
    plan.totalCount == null || (plan.completedCount || 0) < plan.totalCount
  );
}

function followTypeText(type?: number) {
  return (
    ["", "门诊随访", "电话随访", "上门随访", "远程视频"][type || 0] ||
    "其他方式"
  );
}

const diseaseLabels = [
  "",
  "高血压",
  "糖尿病",
  "冠心病",
  "脑卒中",
  "慢阻肺",
  "阿尔茨海默病",
  "其他",
];
const frequencyLabels = ["", "每周", "每月", "每季度", "每半年", "每年"];

export default function FollowUp() {
  const { userInfo } = useAuthStore();
  const canManageFollowup = getUserRole(userInfo) === "doctor";
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedElderId = searchParams.get("elderId") || "";
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<number | undefined>();
  const [diseaseType, setDiseaseType] = useState<number | undefined>();
  const [elderId, setElderId] = useState(requestedElderId);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FollowupPlan | undefined>();
  const [recordsPlan, setRecordsPlan] = useState<FollowupPlan | null>(null);
  const [recordPlan, setRecordPlan] = useState<FollowupPlan | null>(null);
  const [recordDetailId, setRecordDetailId] = useState<number | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<FollowupPlan | null>(null);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [navigationState, setNavigationState] = useState<{
    title: string;
    description: string;
    options: WorkflowNavigationOption[];
    details?: string[];
  } | null>(null);

  const { data, isLoading, refetch } = useFollowupPlans(
    page,
    10,
    status,
    diseaseType,
    elderId ? Number(elderId) : undefined,
  );
  const { data: stats } = useFollowupStats();
  const { data: eldersData } = useElders(1, 500);
  const {
    data: recordsData,
    isLoading: recordsLoading,
    refetch: refetchRecords,
  } = useFollowupRecords(1, 100, recordsPlan?.id);
  const { data: recordDetail, isLoading: recordDetailLoading } =
    useFollowupRecordDetail(recordDetailId);
  const createPlan = useCreateFollowupPlan();
  const updatePlan = useUpdateFollowupPlan();
  const deletePlan = useDeleteFollowupPlan();
  const cleanupGenerated = useDeleteGeneratedFollowupPlans();
  const changeStatus = useChangeFollowupPlanStatus();
  const generatePlans = useGenerateRiskPlans();
  const createRecord = useCreateFollowupRecord();

  const plans = data?.records || [];
  const totalPages = data?.pages || 1;
  const elderNames = new Map(
    (eldersData?.records || []).map((elder) => [elder.id, elder.name]),
  );

  useEffect(() => {
    setElderId(requestedElderId);
    setPage(1);
  }, [requestedElderId]);

  const selectElder = (value?: number) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("elderId", String(value));
    else next.delete("elderId");
    setSearchParams(next, { replace: true });
    setElderId(value ? String(value) : "");
    setPage(1);
  };

  const showNext = (
    title: string,
    description: string,
    targetElderId?: number,
    details?: string[],
  ) => {
    setNavigationState({
      title,
      description,
      details,
      options: [
        {
          key: "tasks",
          label: "查看随访任务",
          description: "继续生成或执行该老人的随访任务",
          to: targetElderId
            ? `/followup-tasks?elderId=${targetElderId}`
            : "/followup-tasks",
        },
        {
          key: "report",
          label: "查看 AI 健康报告",
          description: "查看该老人的健康分析与建议",
          to: targetElderId
            ? `/ai-reports?elderId=${targetElderId}`
            : "/ai-reports",
        },
        ...(targetElderId
          ? [
              {
                key: "journey",
                label: "查看照护全流程",
                description: "核对三端数据联动状态",
                to: `/elders/${targetElderId}/care-journey`,
              },
            ]
          : []),
      ],
    });
  };

  const savePlan = async (form: FollowupPlan) => {
    const doctorId = Number(userInfo?.userId || userInfo?.id || 0) || undefined;
    const payload = { ...form, doctorId: form.doctorId || doctorId };
    try {
      if (editingPlan?.id)
        await updatePlan.mutateAsync({ ...payload, id: editingPlan.id });
      else await createPlan.mutateAsync(payload);
      setPlanDialogOpen(false);
      setEditingPlan(undefined);
      toast.success(editingPlan?.id ? "随访计划已更新" : "随访计划已新增");
      refetch();
      showNext(
        editingPlan?.id ? "随访计划已更新" : "随访计划已新增",
        "计划已保存，是否继续进入随访任务或 AI 健康报告？",
        payload.elderId,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存随访计划失败");
    }
  };

  const generate = async () => {
    try {
      const selectedElderId = elderId ? Number(elderId) : undefined;
      const result = await generatePlans.mutateAsync({
        doctorId: Number(userInfo?.userId || userInfo?.id || 0) || undefined,
        elderId: selectedElderId,
      });
      if (Number(result?.createdCount || 0) > 0) {
        toast.success(`已生成 ${result.createdCount} 条风险随访计划`);
      } else {
        toast.info(
          result?.message ||
            result?.skippedReasons?.[0] ||
            "当前没有可生成的新随访计划",
        );
      }
      refetch();
      showNext(
        "随访计划生成完成",
        result?.message ||
          result?.skippedReasons?.[0] ||
          "计划已经生成或复用，是否继续生成随访任务？",
        selectedElderId || result?.createdPlans?.[0]?.elderId,
        [
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
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "生成随访计划失败");
    }
  };

  const cleanup = async () => {
    try {
      const count = await cleanupGenerated.mutateAsync();
      setCleanupOpen(false);
      toast.success(`已清理 ${count || 0} 条自动生成计划`);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "清理自动计划失败");
    }
  };

  const removePlan = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deletePlan.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("随访计划已删除");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除随访计划失败");
    }
  };

  const updateStatus = async (id: number, nextStatus: number) => {
    try {
      await changeStatus.mutateAsync({ id, status: nextStatus });
      toast.success("计划状态已更新");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新计划状态失败");
    }
  };

  const saveRecord = async (record: FollowupRecord) => {
    if (!canRecordFollowup(recordPlan)) {
      toast.error("该计划已完成、已终止或随访次数已用完，不能继续新增记录");
      setRecordPlan(null);
      return;
    }
    try {
      await createRecord.mutateAsync({
        ...record,
        doctorId:
          record.doctorId ||
          Number(userInfo?.userId || userInfo?.id || 0) ||
          undefined,
      });
      setRecordPlan(null);
      toast.success("随访结果已记录");
      refetch();
      refetchRecords();
      showNext(
        "随访结果已记录",
        "本次随访数据已进入老人健康链路，是否继续查看任务或生成 AI 报告？",
        record.elderId,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存随访结果失败");
    }
  };

  return (
    <PageShell
      title="随访计划"
      subtitle="管理随访计划、状态流转、历史记录和每次随访结果"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="计划总数"
            value={Number(stats?.totalPlans || 0)}
            icon={ClipboardList}
            delay={0}
          />
          <StatCard
            title="今日待随访"
            value={Number(stats?.dueTodayCount || 0)}
            icon={CalendarPlus}
            iconClassName="from-amber-400 to-amber-500"
            delay={1}
          />
          <StatCard
            title="进行中"
            value={Number(stats?.activePlans || 0)}
            icon={Play}
            iconClassName="from-sky-400 to-sky-500"
            delay={2}
          />
          <StatCard
            title="完成率"
            value={Number(stats?.completionRate || 0)}
            suffix="%"
            icon={CheckCircle2}
            delay={3}
          />
        </div>

        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div className="min-w-[150px]">
              <label className="text-sm font-medium text-muted-foreground">
                状态
              </label>
              <select
                value={status ?? ""}
                onChange={(event) => {
                  setStatus(
                    event.target.value ? Number(event.target.value) : undefined,
                  );
                  setPage(1);
                }}
                className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm"
              >
                <option value="">全部状态</option>
                <option value="0">暂停 / 待执行</option>
                <option value="1">进行中</option>
                <option value="2">已完成</option>
                <option value="3">已终止</option>
              </select>
            </div>
            <div className="min-w-[150px]">
              <label className="text-sm font-medium text-muted-foreground">
                疾病类型
              </label>
              <select
                value={diseaseType ?? ""}
                onChange={(event) => {
                  setDiseaseType(
                    event.target.value ? Number(event.target.value) : undefined,
                  );
                  setPage(1);
                }}
                className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm"
              >
                <option value="">全部病种</option>
                {diseaseLabels.slice(1).map((label, index) => (
                  <option key={label} value={index + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <ElderMasterSelect
              className="min-w-[260px]"
              label="老人主档"
              elders={eldersData?.records || []}
              value={elderId}
              onChange={selectElder}
            />
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => refetch()}
            >
              查询
            </Button>
            {canManageFollowup && (
              <>
                <Button variant="outline" className="rounded-xl" onClick={() => setCleanupOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  清理自动计划
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={generate} disabled={generatePlans.isPending}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  生成随访计划
                </Button>
                <Button onClick={() => { setEditingPlan(undefined); setPlanDialogOpen(true); }} className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  新增随访计划
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">随访计划列表</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : plans.length === 0 ? (
              <EmptyState
                title="暂无随访计划"
                description="可新增计划或按风险自动生成"
              />
            ) : (
              <div className="space-y-3">
                {plans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-xl border border-border/40 bg-white/60 p-4 transition-all hover:border-medical-300 hover:bg-white hover:shadow-soft"
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">
                            {plan.elderName ||
                              elderNames.get(plan.elderId) ||
                              "姓名未同步"}
                          </h3>
                          <Badge
                            variant="outline"
                            className={statusClass(plan.status)}
                          >
                            {statusText(plan.status)}
                          </Badge>
                          <Badge variant="outline">
                            {diseaseLabels[plan.diseaseType] || "其他"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {plan.planName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {plan.startDate} 至 {plan.endDate || "长期"} ·{" "}
                          {frequencyLabels[plan.frequencyType] || "频次未知"} ·
                          已完成 {plan.completedCount || 0}/{plan.totalCount}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRecordsPlan(plan)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          查看记录
                        </Button>
                        {canManageFollowup && canRecordFollowup(plan) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRecordPlan({
                              ...plan,
                              elderName: plan.elderName || elderNames.get(plan.elderId),
                            })}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            记录结果
                          </Button>
                        )}
                        {canManageFollowup && plan.status === 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(plan.id!, 1)}
                          >
                            开始
                          </Button>
                        )}
                        {canManageFollowup && plan.status === 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(plan.id!, 2)}
                          >
                            完成
                          </Button>
                        )}
                        {canManageFollowup && (plan.status === 0 || plan.status === 1) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(plan.id!, 3)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            终止
                          </Button>
                        )}
                        {canManageFollowup && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => { setEditingPlan(plan); setPlanDialogOpen(true); }}>
                              <Pencil className="mr-1 h-4 w-4" />
                              编辑
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => setDeleteTarget(plan)}>
                              <Trash2 className="mr-1 h-4 w-4" />
                              删除
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <FollowupPlanDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        initialData={editingPlan}
        elders={eldersData?.records || []}
        onSubmit={savePlan}
        isSubmitting={createPlan.isPending || updatePlan.isPending}
      />
      <FollowupRecordDialog
        open={!!recordPlan}
        onOpenChange={(open) => !open && setRecordPlan(null)}
        plan={recordPlan}
        onSubmit={saveRecord}
        pending={createRecord.isPending}
      />
      <Dialog
        open={!!recordsPlan}
        onOpenChange={(open) => !open && setRecordsPlan(null)}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-5xl overflow-hidden rounded-lg border-border/50 bg-slate-50/95 p-0 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-border/50 bg-white/95 px-5 py-4 sm:px-6">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-medical-100 text-medical-700">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="min-w-0">
            <DialogTitle className="truncate text-lg font-bold">
              {recordsPlan?.elderName ||
                elderNames.get(recordsPlan?.elderId) ||
                "姓名未同步"}{" "}
              · 随访历史
            </DialogTitle>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {recordsPlan?.planName || "随访计划"} · 已完成 {recordsPlan?.completedCount || 0}/
                  {recordsPlan?.totalCount || 0} 次
                </p>
              </div>
            </div>
          </DialogHeader>
          </div>
          <div className="max-h-[calc(90vh-150px)] overflow-y-auto p-4 sm:p-6">
          {recordsLoading ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Skeleton className="h-56 rounded-lg" />
              <Skeleton className="h-56 rounded-lg" />
            </div>
          ) : !recordsData?.records?.length ? (
            <EmptyState
              title="暂无随访记录"
              description={
                canRecordFollowup(recordsPlan)
                  ? "可点击下方按钮记录本次随访结果"
                  : "该计划已结束，不能再新增随访记录"
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {recordsData.records.map((record, index) => (
                <motion.article
                  key={record.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="overflow-hidden rounded-lg border border-border/50 bg-white shadow-sm transition-shadow hover:shadow-card"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-border/40 bg-medical-50/45 px-4 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-medical-700 shadow-sm">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {record.followDate || record.createTime || "随访记录"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          第 {index + 1} 次随访记录
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                      <Badge
                        variant="outline"
                        className="border-sky-200 bg-sky-50 text-sky-700"
                      >
                        {followTypeText(record.followType)}
                      </Badge>
                      {record.isOverdue === 1 && (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                          曾逾期
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <ClipboardList className="h-4 w-4 text-sky-600" />
                        随访结论
                      </div>
                      <p className="mt-2 line-clamp-3 min-h-12 text-sm leading-6 text-foreground">
                        {record.followResult || "本次随访暂未填写结论"}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 divide-x divide-border/50 rounded-lg border border-border/50 bg-slate-50/70">
                      <div className="min-w-0 px-2 py-3 text-center">
                        <Activity className="mx-auto h-4 w-4 text-rose-600" />
                        <p className="mt-1 text-[11px] text-muted-foreground">血压</p>
                        <p className="mt-0.5 truncate text-xs font-semibold">
                          {record.systolicPressure || "-"}/{record.diastolicPressure || "-"}
                        </p>
                      </div>
                      <div className="min-w-0 px-2 py-3 text-center">
                        <HeartPulse className="mx-auto h-4 w-4 text-medical-600" />
                        <p className="mt-1 text-[11px] text-muted-foreground">心率</p>
                        <p className="mt-0.5 truncate text-xs font-semibold">
                          {record.heartRate ? `${record.heartRate} bpm` : "-"}
                        </p>
                      </div>
                      <div className="min-w-0 px-2 py-3 text-center">
                        <Stethoscope className="mx-auto h-4 w-4 text-sky-600" />
                        <p className="mt-1 text-[11px] text-muted-foreground">空腹血糖</p>
                        <p className="mt-0.5 truncate text-xs font-semibold">
                          {record.bloodSugarFasting ?? "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-3">
                      <p className="truncate text-xs text-muted-foreground">
                        下次随访：{record.nextFollowDate || "待安排"}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 rounded-lg"
                        onClick={() => setRecordDetailId(record.id)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        查看详情
                      </Button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
          </div>
          <DialogFooter className="border-t border-border/50 bg-white px-5 py-3 sm:px-6">
            <Button variant="outline" onClick={() => setRecordsPlan(null)}>
              关闭
            </Button>
            {canManageFollowup && canRecordFollowup(recordsPlan) && (
              <Button
                onClick={() => {
                  const selectedPlan = recordsPlan;
                  if (!selectedPlan) return;
                  setRecordPlan({
                    ...selectedPlan,
                    elderName: selectedPlan.elderName || elderNames.get(selectedPlan.elderId),
                  });
                  setRecordsPlan(null);
                }}
                className="bg-gradient-to-r from-medical-400 to-medical-600 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                记录随访结果
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DetailDialog
        open={!!recordDetailId}
        onOpenChange={(open) => !open && setRecordDetailId(undefined)}
        title="随访记录详情"
        loading={recordDetailLoading}
        fields={
          recordDetail
            ? [
                {
                  label: "随访时间",
                  value: recordDetail.followDate || recordDetail.createTime,
                },
                {
                  label: "随访方式",
                  value:
                    ["", "门诊", "电话", "上门", "远程视频"][
                      recordDetail.followType || 0
                    ] || "-",
                },
                {
                  label: "血压",
                  value: `${recordDetail.systolicPressure || "-"}/${recordDetail.diastolicPressure || "-"} mmHg`,
                },
                {
                  label: "心率",
                  value: recordDetail.heartRate
                    ? `${recordDetail.heartRate} bpm`
                    : "-",
                },
                {
                  label: "空腹血糖",
                  value: recordDetail.bloodSugarFasting || "-",
                },
                { label: "体重", value: recordDetail.weight || "-" },
                {
                  label: "症状描述",
                  value: recordDetail.symptomDesc || "-",
                  wide: true,
                },
                {
                  label: "当前用药",
                  value: recordDetail.currentMedication || "-",
                  wide: true,
                },
                {
                  label: "随访结论",
                  value: recordDetail.followResult || "-",
                  wide: true,
                },
                {
                  label: "下次随访",
                  value: recordDetail.nextFollowDate || "-",
                },
                {
                  label: "备注",
                  value: recordDetail.remark || "-",
                  wide: true,
                },
              ]
            : []
        }
      />
      <ConfirmDialog
        open={cleanupOpen}
        onOpenChange={setCleanupOpen}
        title="清理自动生成计划"
        description="将删除系统按风险自动生成、且尚未执行的随访计划。手工计划不会被删除。"
        confirmText="确认清理"
        destructive
        pending={cleanupGenerated.isPending}
        onConfirm={cleanup}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="删除随访计划"
        description={`确定删除“${deleteTarget?.planName || "该计划"}”吗？`}
        confirmText="确认删除"
        destructive
        pending={deletePlan.isPending}
        onConfirm={removePlan}
      />
      <WorkflowNavigationDialog
        open={!!navigationState}
        onOpenChange={(open) => !open && setNavigationState(null)}
        title={navigationState?.title || "操作完成"}
        description={navigationState?.description}
        options={navigationState?.options || []}
        details={navigationState?.details}
      />
    </PageShell>
  );
}
