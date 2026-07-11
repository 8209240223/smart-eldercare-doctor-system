import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  Download,
  FileText,
  HeartPulse,
  Pencil,
  Plus,
  Route,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ElderDialog from "@/components/elders/ElderDialog";
import ElderOnboardingDialog, {
  type ElderOnboardingPayload,
} from "@/components/elders/ElderOnboardingDialog";
import HealthRecordDialog from "@/components/elders/HealthRecordDialog";
import ComprehensiveHealthReportView from "@/components/reports/ComprehensiveHealthReportView";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiClient, post, unwrap, type ApiResponse } from "@/lib/api";
import {
  useAssessmentReport,
  useDeleteElder,
  useElders,
  useElderStats,
  useUpdateElder,
  type ElderInfo,
} from "@/hooks/useApi";
import {
  normalizeCareWorkflow,
  workflowLink,
  type CareWorkflowSummary,
} from "@/hooks/useCareWorkflow";
import { getUserRole, useAuthStore } from "@/store/auth";

interface DoctorOption {
  id: number;
  realName?: string;
  username?: string;
}

interface ElderOnboardResult {
  elder: ElderInfo;
  workflow?: CareWorkflowSummary;
}

const diseaseLabels = [
  "",
  "高血压",
  "糖尿病",
  "冠心病",
  "脑卒中",
  "慢阻肺",
  "其他",
];

export default function Elders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userInfo = useAuthStore((state) => state.userInfo);
  const role = getUserRole(userInfo);
  const canManage = role === "doctor";
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [elderId, setElderId] = useState("");
  const [name, setName] = useState("");
  const [community, setCommunity] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [diseaseType, setDiseaseType] = useState<number | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [editing, setEditing] = useState<ElderInfo | undefined>();
  const [healthElder, setHealthElder] = useState<ElderInfo | null>(null);
  const [reportElder, setReportElder] = useState<ElderInfo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ElderInfo | null>(null);
  const [workflowResult, setWorkflowResult] =
    useState<CareWorkflowSummary | null>(null);
  const { data, isLoading, refetch } = useElders(
    page,
    10,
    name,
    community,
    doctorId ? Number(doctorId) : undefined,
    diseaseType,
    elderId ? Number(elderId) : undefined,
  );
  const { data: stats } = useElderStats();
  const { data: report, isLoading: reportLoading } = useAssessmentReport(
    reportElder?.id || 0,
  );
  const updateElder = useUpdateElder();
  const deleteElder = useDeleteElder();
  const { data: doctorOptions = [] } = useQuery<DoctorOption[]>({
    queryKey: ["elders", "doctor-options"],
    queryFn: async () =>
      unwrap(
        await api<ApiResponse<DoctorOption[]>>("/api/elders/options/doctors"),
      ),
    enabled: canManage,
  });
  const onboardElder = useMutation<
    ElderOnboardResult,
    Error,
    ElderOnboardingPayload
  >({
    mutationFn: async (payload) =>
      unwrap(
        await post<ApiResponse<ElderOnboardResult>>(
          "/api/elders/onboard",
          payload,
        ),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["elders"] });
      queryClient.invalidateQueries({ queryKey: ["risk"] });
      queryClient.invalidateQueries({ queryKey: ["followup"] });
      queryClient.invalidateQueries({ queryKey: ["care-workflow"] });
      queryClient.invalidateQueries({ queryKey: ["ai", "reports"] });
    },
  });
  const records = data?.records || [];
  const totalPages = data?.pages || 1;

  const workflowNavigationOptions = useMemo<WorkflowNavigationOption[]>(() => {
    const elderId = Number(workflowResult?.elder?.id || 0);
    if (!elderId) return [];
    return [
      {
        key: "journey",
        label: "查看照护全流程",
        description: "统一查看风险、随访、任务、报告与护理协同状态",
        to: `/elders/${elderId}/care-journey`,
      },
      {
        key: "risk",
        label: "查看风险画像",
        description: "核对系统根据建档资料计算出的风险分层",
        to: workflowLink(
          workflowResult || undefined,
          "risk",
          "/key-population",
          elderId,
        ),
      },
      {
        key: "plan",
        label: "查看随访计划",
        description: "查看自动生成或复用的随访计划",
        to: workflowLink(
          workflowResult || undefined,
          "plan",
          "/followup",
          elderId,
        ),
      },
      {
        key: "task",
        label: "查看随访任务",
        description: "进入该老人的待执行随访任务",
        to: workflowLink(
          workflowResult || undefined,
          "task",
          "/followup-tasks",
          elderId,
        ),
      },
      {
        key: "report",
        label: "查看 AI 健康报告",
        description: "查看基于本次真实健康数据生成的结构化报告",
        to: workflowLink(
          workflowResult || undefined,
          "report",
          "/ai-reports",
          elderId,
        ),
      },
    ];
  }, [workflowResult]);

  useEffect(() => {
    if (searchParams.get("create") !== "1") return;
    if (canManage) setOnboardingOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("create");
    setSearchParams(next, { replace: true });
  }, [canManage, searchParams, setSearchParams]);

  const save = async (form: ElderInfo) => {
    try {
      if (!editing?.id) return;
      await updateElder.mutateAsync({ ...form, id: editing.id });
      setFormOpen(false);
      setEditing(undefined);
      toast.success("老人档案已更新");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存老人档案失败");
    }
  };
  const onboard = async (payload: ElderOnboardingPayload) => {
    try {
      const result = await onboardElder.mutateAsync(payload);
      setOnboardingOpen(false);
      toast.success(`“${result.elder.name}”统一建档成功`);
      await refetch();
      if (result.workflow) {
        setWorkflowResult(normalizeCareWorkflow(result.workflow));
      } else if (result.elder.id) {
        navigate(`/elders/${result.elder.id}/care-journey`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "统一建档失败");
    }
  };
  const remove = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteElder.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("老人档案已删除");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除老人档案失败");
    }
  };
  const exportExcel = async () => {
    try {
      const response = await apiClient.get("/api/elders/export", {
        responseType: "blob",
        params: {
          elderId: elderId ? Number(elderId) : undefined,
          name: name || undefined,
          community: community || undefined,
          doctorId: doctorId ? Number(doctorId) : undefined,
          diseaseType,
        },
      });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "elders.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("老人档案已导出");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "导出老人档案失败");
    }
  };

  return (
    <PageShell
      title="老人档案"
      subtitle="查询、维护、导出老人基础信息和完整健康档案"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="老人总数"
            value={Number(stats?.total || data?.total || 0)}
            icon={Users}
            delay={0}
          />
          <StatCard
            title="当前列表"
            value={records.length}
            icon={Users}
            iconClassName="from-sky-400 to-sky-500"
            delay={1}
          />
          <StatCard
            title="变化趋势"
            value={Number(stats?.trend || 0)}
            suffix="%"
            icon={HeartPulse}
            iconClassName="from-lavender-400 to-lavender-500"
            delay={2}
          />
        </div>
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div className="min-w-[140px]">
              <label className="text-sm font-medium text-muted-foreground">老人ID</label>
              <Input className="mt-2 rounded-xl bg-white/70" type="number" min={1} value={elderId} onChange={(event) => setElderId(event.target.value.replace(/\D/g, ""))} placeholder="精确查询" />
            </div>
            <div className="min-w-[170px]">
              <label className="text-sm font-medium text-muted-foreground">
                姓名
              </label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="rounded-xl bg-white/70 pl-9"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <label className="text-sm font-medium text-muted-foreground">
                所属社区
              </label>
              <Input
                className="mt-2 rounded-xl bg-white/70"
                value={community}
                onChange={(event) => setCommunity(event.target.value)}
              />
            </div>
            <div className="min-w-[140px]">
              <label className="text-sm font-medium text-muted-foreground">
                责任医生ID
              </label>
              <Input
                className="mt-2 rounded-xl bg-white/70"
                value={doctorId}
                onChange={(event) => setDoctorId(event.target.value)}
              />
            </div>
            <div className="min-w-[150px]">
              <label className="text-sm font-medium text-muted-foreground">
                疾病类型
              </label>
              <select
                className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm"
                value={diseaseType ?? ""}
                onChange={(event) =>
                  setDiseaseType(
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
              >
                <option value="">全部疾病</option>
                {diseaseLabels.slice(1).map((label, index) => (
                  <option key={label} value={index + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setPage(1);
                refetch();
              }}
            >
              查询
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={exportExcel}
            >
              <Download className="mr-2 h-4 w-4" />
              导出 Excel
            </Button>
            {canManage && (
              <Button
                onClick={() => setOnboardingOpen(true)}
                className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                新增老人档案
              </Button>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">老人档案列表</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : records.length === 0 ? (
              <EmptyState title="暂无老人档案" description="可新增老人档案" />
            ) : (
              <div className="space-y-3">
                {records.map((elder, index) => (
                  <motion.div
                    key={elder.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-xl border border-border/40 bg-white/60 p-4"
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{elder.name}</h3>
                          <Badge variant="outline">
                            {elder.gender === 1
                              ? "男"
                              : elder.gender === 2
                                ? "女"
                                : "未知"}
                          </Badge>
                          <Badge variant="outline">
                            {elder.accountStatus === 0
                              ? "账号停用"
                              : "账号正常"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          老人ID：{elder.id || "-"} · 身份证：{elder.idCard} · 电话：{elder.phone}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          社区：{elder.community || "-"} · 紧急联系人：
                          {elder.emergencyContact || "-"}{" "}
                          {elder.emergencyPhone || ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setHealthElder(elder)}
                        >
                          <HeartPulse className="mr-1 h-4 w-4" />
                          健康详情
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReportElder(elder)}
                        >
                          <FileText className="mr-1 h-4 w-4" />
                          综合报告
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(`/elders/${elder.id}/care-journey`)
                          }
                        >
                          <Route className="mr-1 h-4 w-4" />
                          照护全流程
                        </Button>
                        {canManage && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditing(elder);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="mr-1 h-4 w-4" />
                              编辑
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => setDeleteTarget(elder)}
                            >
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
      <ElderDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={editing}
        onSubmit={save}
        isSubmitting={updateElder.isPending}
      />
      <ElderOnboardingDialog
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onSubmit={onboard}
        isSubmitting={onboardElder.isPending}
        currentUserId={
          Number(userInfo?.userId || userInfo?.id || 0) || undefined
        }
        currentUserRole={role}
        doctorOptions={doctorOptions}
      />
      <HealthRecordDialog
        open={!!healthElder}
        onOpenChange={(open) => !open && setHealthElder(null)}
        elder={healthElder}
      />
      <Dialog
        open={!!reportElder}
        onOpenChange={(open) => !open && setReportElder(null)}
      >
        <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-5xl overflow-y-auto rounded-lg bg-white/95 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{reportElder?.name} · 综合健康报告</DialogTitle>
          </DialogHeader>
          {reportLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-56 w-full" />
            </div>
          ) : report ? (
            <ComprehensiveHealthReportView report={report} />
          ) : (
            <EmptyState
              title="暂无综合报告"
              description="该老人暂无可用健康评估数据"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportElder(null)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="删除老人档案"
        description={`确定删除“${deleteTarget?.name || "该老人"}”的档案吗？`}
        confirmText="确认删除"
        destructive
        pending={deleteElder.isPending}
        onConfirm={remove}
      />
      <WorkflowNavigationDialog
        open={!!workflowResult}
        onOpenChange={(open) => !open && setWorkflowResult(null)}
        title="老人建档与健康管理流程已完成"
        description="老人主档、风险分层、随访计划、随访任务和 AI 健康报告已经按同一个老人 ID 建立。请选择下一步查看的位置。"
        options={workflowNavigationOptions}
        result={workflowResult}
      />
    </PageShell>
  );
}
