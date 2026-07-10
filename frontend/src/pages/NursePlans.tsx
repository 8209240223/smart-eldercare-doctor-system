import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarCheck,
  CheckCircle2,
  Eye,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DetailDialog from "@/components/common/DetailDialog";
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
import {
  useChangeNursePlanStatus,
  useCreateNursePlan,
  useDeleteNursePlan,
  useElders,
  useIncrementNursePlan,
  useNursePlanDetail,
  useNursePlans,
  useNursePlanStats,
  useUpdateNursePlan,
  type NursingPlan,
} from "@/hooks/useApi";
import { useAuthStore } from "@/store/auth";

const emptyPlan: NursingPlan = {
  elderId: 0,
  planName: "",
  planType: 1,
  startDate: "",
  endDate: "",
  frequency: "",
  nursingGoal: "",
  nursingContent: "",
  status: 0,
  totalCount: 1,
  completedCount: 0,
  effectScore: 3,
  remark: "",
};
const typeLabels = ["", "基础护理", "康复护理", "专科护理", "心理护理"];
const statusLabels = ["待执行", "进行中", "已完成", "已终止"];

function statusClass(status?: number) {
  if (status === 1) return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === 2) return "border-medical-200 bg-medical-50 text-medical-700";
  if (status === 3) return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function NursePlans() {
  const userInfo = useAuthStore((state) => state.userInfo);
  const currentNurseId = Number(userInfo?.userId || userInfo?.id || 0);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedElderId = searchParams.get("elderId") || "";
  const [page, setPage] = useState(1);
  const [elderId, setElderId] = useState(requestedElderId);
  const [planType, setPlanType] = useState<number | undefined>();
  const [status, setStatus] = useState<number | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<NursingPlan>(emptyPlan);
  const [detailId, setDetailId] = useState<number | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<NursingPlan | null>(null);
  const [navigationState, setNavigationState] = useState<{
    title: string;
    description: string;
    options: WorkflowNavigationOption[];
  } | null>(null);
  const { data, isLoading, refetch } = useNursePlans(
    page,
    10,
    elderId ? Number(elderId) : undefined,
    planType,
    status,
  );
  const { data: stats } = useNursePlanStats();
  const { data: eldersData } = useElders(1, 500);
  const { data: detail, isLoading: detailLoading } =
    useNursePlanDetail(detailId);
  const createPlan = useCreateNursePlan();
  const updatePlan = useUpdateNursePlan();
  const deletePlan = useDeleteNursePlan();
  const changeStatus = useChangeNursePlanStatus();
  const incrementPlan = useIncrementNursePlan();
  const records = data?.records || [];
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
  const updateForm = (field: keyof NursingPlan, value: string | number) =>
    setForm((current) => ({ ...current, [field]: value }));
  const save = async () => {
    const payload = {
      ...form,
      nurseId: form.nurseId || currentNurseId,
    };
    if (!payload.elderId || !payload.planName.trim())
      return toast.error("老人和计划名称不能为空");
    if (!payload.nurseId)
      return toast.error("无法识别当前护士账号，请重新登录");
    try {
      if (payload.id)
        await updatePlan.mutateAsync({
          ...payload,
          status: undefined,
          completedCount: undefined,
        });
      else await createPlan.mutateAsync(payload);
      setFormOpen(false);
      toast.success(form.id ? "护理计划已更新" : "护理计划已新增");
      refetch();
      setNavigationState({
        title: form.id ? "护理计划已更新" : "护理计划已新增",
        description:
          "护理计划已关联到统一老人主档，是否继续记录护理执行情况或查看全流程？",
        options: [
          {
            key: "records",
            label: "新增护理记录",
            description: "进入该老人的护理记录页面",
            to: `/nurse-records?elderId=${payload.elderId}`,
          },
          {
            key: "journey",
            label: "查看照护全流程",
            description: "核对医生、护士和管理员端联动",
            to: `/elders/${payload.elderId}/care-journey`,
          },
          {
            key: "report",
            label: "查看 AI 健康报告",
            description: "查看健康分析和护理建议",
            to: `/ai-reports?elderId=${payload.elderId}`,
          },
        ],
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存护理计划失败");
    }
  };
  const setPlanStatus = async (id: number, nextStatus: number) => {
    try {
      await changeStatus.mutateAsync({ id, status: nextStatus });
      toast.success("计划状态已更新");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新计划状态失败");
    }
  };
  const increment = async (id: number) => {
    try {
      await incrementPlan.mutateAsync(id);
      toast.success("已记录一次护理执行");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "记录执行失败");
    }
  };
  const remove = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deletePlan.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("护理计划已删除");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除护理计划失败");
    }
  };

  return (
    <PageShell
      title="护理计划"
      subtitle="维护护理计划、详情、审核状态和执行进度"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="计划总数"
            value={Number(stats?.total || 0)}
            icon={CalendarCheck}
            delay={0}
          />
          <StatCard
            title="进行中"
            value={Number(stats?.active || stats?.running || 0)}
            icon={PlayCircle}
            iconClassName="from-sky-400 to-sky-500"
            delay={1}
          />
          <StatCard
            title="已完成"
            value={Number(stats?.finished || stats?.completed || 0)}
            icon={CheckCircle2}
            delay={2}
          />
          <StatCard
            title="待审核"
            value={Number(stats?.pendingApproval || 0)}
            icon={Eye}
            iconClassName="from-lavender-400 to-lavender-500"
            delay={3}
          />
        </div>
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <ElderMasterSelect
              className="min-w-[260px]"
              label="老人主档"
              elders={eldersData?.records || []}
              value={elderId}
              onChange={selectElder}
            />
            <div className="min-w-[150px]">
              <label className="text-sm font-medium text-muted-foreground">
                计划类型
              </label>
              <select
                className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm"
                value={planType ?? ""}
                onChange={(event) =>
                  setPlanType(
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
            <div className="min-w-[150px]">
              <label className="text-sm font-medium text-muted-foreground">
                计划状态
              </label>
              <select
                className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm"
                value={status ?? ""}
                onChange={(event) =>
                  setStatus(
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
              >
                <option value="">全部状态</option>
                {statusLabels.map((label, index) => (
                  <option key={label} value={index}>
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
              onClick={() => {
                setForm({
                  ...emptyPlan,
                  elderId: elderId ? Number(elderId) : 0,
                  nurseId: currentNurseId || undefined,
                });
                setFormOpen(true);
              }}
              className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              新增护理计划
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">护理计划列表</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : records.length === 0 ? (
              <EmptyState title="暂无护理计划" description="可新增护理计划" />
            ) : (
              <div className="space-y-3">
                {records.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-xl border border-border/40 bg-white/60 p-4"
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{plan.planName}</h3>
                          <Badge variant="outline">
                            {typeLabels[plan.planType || 0]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={statusClass(plan.status)}
                          >
                            {statusLabels[plan.status || 0]}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {elderNames.get(plan.elderId) ||
                            "姓名未同步"}{" "}
                          · {plan.startDate || "-"} 至 {plan.endDate || "-"} ·{" "}
                          {plan.completedCount || 0}/{plan.totalCount || 0}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {plan.nursingGoal || plan.nursingContent || "-"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDetailId(plan.id)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          详情
                        </Button>
                        {(plan.status === 0 || plan.status === 1) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setForm({ ...emptyPlan, ...plan });
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="mr-1 h-4 w-4" />
                            编辑
                          </Button>
                        )}
                        {plan.status === 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPlanStatus(plan.id!, 1)}
                          >
                            开始执行
                          </Button>
                        )}
                        {plan.status === 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => increment(plan.id!)}
                          >
                            完成一次
                          </Button>
                        )}
                        {plan.status === 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPlanStatus(plan.id!, 2)}
                          >
                            完成计划
                          </Button>
                        )}
                        {(plan.status === 0 || plan.status === 1) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPlanStatus(plan.id!, 3)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            终止
                          </Button>
                        )}
                        {(plan.status === 0 || plan.status === 1) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => setDeleteTarget(plan)}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            删除
                          </Button>
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
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-2xl bg-white/95">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "编辑护理计划" : "新增护理计划"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ElderMasterSelect
              elders={eldersData?.records || []}
              value={form.elderId}
              onChange={(value) => updateForm("elderId", value || 0)}
              allowAll={false}
            />
            <select
              value={form.planType || 1}
              onChange={(event) =>
                updateForm("planType", Number(event.target.value))
              }
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {typeLabels.slice(1).map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
            <Input
              className="md:col-span-2"
              value={form.planName}
              onChange={(event) => updateForm("planName", event.target.value)}
              placeholder="计划名称"
            />
            <Input
              type="date"
              value={form.startDate || ""}
              onChange={(event) => updateForm("startDate", event.target.value)}
            />
            <Input
              type="date"
              value={form.endDate || ""}
              onChange={(event) => updateForm("endDate", event.target.value)}
            />
            <Input
              value={form.frequency || ""}
              onChange={(event) => updateForm("frequency", event.target.value)}
              placeholder="执行频次"
            />
            <Input
              value={`计划状态：${statusLabels[form.status ?? 0]}`}
              disabled
            />
            <Input
              type="number"
              value={form.totalCount || 0}
              onChange={(event) =>
                updateForm("totalCount", Number(event.target.value))
              }
              placeholder="计划次数"
            />
            <Input value={`完成次数：${form.completedCount ?? 0}`} disabled />
            <textarea
              className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm md:col-span-2"
              value={form.nursingGoal || ""}
              onChange={(event) =>
                updateForm("nursingGoal", event.target.value)
              }
              placeholder="护理目标"
            />
            <textarea
              className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm md:col-span-2"
              value={form.nursingContent || ""}
              onChange={(event) =>
                updateForm("nursingContent", event.target.value)
              }
              placeholder="护理内容"
            />
            <Input
              type="number"
              min="1"
              max="5"
              value={form.effectScore || ""}
              onChange={(event) =>
                updateForm("effectScore", Number(event.target.value))
              }
              placeholder="效果评分 1-5"
            />
            <textarea
              className="min-h-16 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={form.remark || ""}
              onChange={(event) => updateForm("remark", event.target.value)}
              placeholder="备注"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button
              onClick={save}
              disabled={createPlan.isPending || updatePlan.isPending}
              className="bg-gradient-to-r from-medical-400 to-medical-600 text-white"
            >
              保存护理计划
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DetailDialog
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(undefined)}
        title="护理计划详情"
        loading={detailLoading}
        fields={
          detail
            ? [
                {
                  label: "老人",
                  value:
                    elderNames.get(detail.elderId) || "姓名未同步",
                },
                { label: "计划类型", value: typeLabels[detail.planType || 0] },
                { label: "计划名称", value: detail.planName, wide: true },
                { label: "状态", value: statusLabels[detail.status || 0] },
                { label: "执行频次", value: detail.frequency || "-" },
                { label: "开始日期", value: detail.startDate || "-" },
                { label: "结束日期", value: detail.endDate || "-" },
                {
                  label: "执行进度",
                  value: `${detail.completedCount || 0}/${detail.totalCount || 0}`,
                },
                {
                  label: "护理目标",
                  value: detail.nursingGoal || "-",
                  wide: true,
                },
                {
                  label: "护理内容",
                  value: detail.nursingContent || "-",
                  wide: true,
                },
                { label: "效果评分", value: detail.effectScore || "-" },
                {
                  label: "医生审核",
                  value:
                    detail.doctorApproval === 1
                      ? "通过"
                      : detail.doctorApproval === 2
                        ? "驳回"
                        : "待审核",
                },
                { label: "备注", value: detail.remark || "-", wide: true },
              ]
            : []
        }
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="删除护理计划"
        description={`确定删除“${deleteTarget?.planName || "该护理计划"}”吗？`}
        confirmText="确认删除"
        destructive
        pending={deletePlan.isPending}
        onConfirm={remove}
      />
      <WorkflowNavigationDialog
        open={!!navigationState}
        onOpenChange={(open) => !open && setNavigationState(null)}
        title={navigationState?.title || "护理计划已保存"}
        description={navigationState?.description}
        options={navigationState?.options || []}
      />
    </PageShell>
  );
}
