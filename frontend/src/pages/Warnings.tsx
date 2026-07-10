import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  Bell,
  CheckCircle2,
  Eye,
  History,
  MailOpen,
  Plus,
  ShieldAlert,
  Timer,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import DetailDialog from "@/components/common/DetailDialog";
import TextActionDialog from "@/components/common/TextActionDialog";
import WarningDialog from "@/components/warnings/WarningDialog";
import WarningRealtimeSnapshot from "@/components/warnings/WarningRealtimeSnapshot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { createElderNameMap, resolveElderName } from "@/lib/elderName";
import {
  useCreateWarning,
  useElders,
  useHandleWarning,
  useIgnoreWarning,
  useMarkWarningProcessing,
  useMarkWarningRead,
  useWarningDetail,
  useWarningLogs,
  useWarningRealtimeStats,
  useWarnings,
  useWarningStats,
  type HealthWarning,
} from "@/hooks/useApi";
import { getUserRole, useAuthStore } from "@/store/auth";

function levelMeta(level: number) {
  if (level === 3)
    return { label: "高危", className: "bg-red-100 text-red-700" };
  if (level === 2)
    return { label: "中危", className: "bg-amber-100 text-amber-700" };
  return { label: "低危", className: "bg-medical-100 text-medical-700" };
}

function statusMeta(status: number) {
  if (status === 0)
    return { label: "未处理", className: "bg-red-100 text-red-700" };
  if (status === 1)
    return { label: "处理中", className: "bg-amber-100 text-amber-700" };
  if (status === 2)
    return { label: "已处理", className: "bg-medical-100 text-medical-700" };
  return { label: "已忽略", className: "bg-slate-100 text-slate-600" };
}

export default function Warnings() {
  const userInfo = useAuthStore((state) => state.userInfo);
  const canManageWarnings = getUserRole(userInfo) === "doctor";
  const currentDoctorId =
    Number(userInfo?.userId || userInfo?.id || 0) || undefined;
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<number | undefined>();
  const [warningLevel, setWarningLevel] = useState<number | undefined>();
  const [elderId, setElderId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | undefined>();
  const [handleTarget, setHandleTarget] = useState<HealthWarning | null>(null);
  const [ignoreTarget, setIgnoreTarget] = useState<HealthWarning | null>(null);
  const requestedHandleId = Number(searchParams.get("handle") || 0);

  const { data, isLoading, refetch } = useWarnings(
    page,
    10,
    status,
    warningLevel,
    elderId ? Number(elderId) : undefined,
  );
  const { data: stats } = useWarningStats();
  const { data: realtimeStatsRaw, isLoading: realtimeStatsLoading } =
    useWarningRealtimeStats();
  const { data: eldersData } = useElders(1, 100);
  const { data: detail, isLoading: detailLoading } = useWarningDetail(
    detailId || requestedHandleId || undefined,
  );
  const { data: logs } = useWarningLogs(detailId);
  const createWarning = useCreateWarning();
  const markProcessing = useMarkWarningProcessing();
  const handleWarning = useHandleWarning();
  const ignoreWarning = useIgnoreWarning();
  const markRead = useMarkWarningRead();

  const warnings = data?.records || [];
  const elderNames = createElderNameMap(eldersData?.records || []);
  const realtimeStats = realtimeStatsRaw;
  const totalPages = data?.pages || 1;
  const isMutating =
    markProcessing.isPending ||
    handleWarning.isPending ||
    ignoreWarning.isPending ||
    markRead.isPending;

  const create = async (form: Partial<HealthWarning>) => {
    try {
      await createWarning.mutateAsync({
        ...form,
        doctorId: form.doctorId || currentDoctorId,
      });
      setCreateOpen(false);
      toast.success("预警已新增");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "新增预警失败");
    }
  };

  const setProcessing = async (id: number) => {
    try {
      await markProcessing.mutateAsync({ id, doctorId: currentDoctorId });
      toast.success("预警已标记为处理中");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新预警失败");
    }
  };

  const submitHandle = async (value: string) => {
    if (!handleTarget) return;
    try {
      await handleWarning.mutateAsync({
        id: handleTarget.id,
        handleResult: value,
        doctorId: currentDoctorId,
      });
      setHandleTarget(null);
      toast.success("预警处理完成");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "处理预警失败");
    }
  };

  useEffect(() => {
    if (!requestedHandleId || !detail || detail.id !== requestedHandleId)
      return;
    setHandleTarget(detail);
    const next = new URLSearchParams(searchParams);
    next.delete("handle");
    setSearchParams(next, { replace: true });
  }, [detail, requestedHandleId, searchParams, setSearchParams]);

  const ignore = async (reason: string) => {
    if (!ignoreTarget) return;
    try {
      await ignoreWarning.mutateAsync({
        id: ignoreTarget.id,
        handleResult: reason,
      });
      setIgnoreTarget(null);
      toast.success("预警已忽略");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "忽略预警失败");
    }
  };

  const read = async (id: number) => {
    try {
      await markRead.mutateAsync({ id, doctorId: currentDoctorId });
      toast.success("预警已标记为已读");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "标记已读失败");
    }
  };

  return (
    <PageShell
      title="预警中心"
      subtitle="查询、查看、处理、忽略和跟踪老人健康预警"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="预警总数"
            value={Number(stats?.total || 0)}
            icon={Bell}
            delay={0}
          />
          <StatCard
            title="未处理"
            value={Number(stats?.pending || 0)}
            icon={ShieldAlert}
            iconClassName="from-red-400 to-red-500"
            delay={1}
          />
          <StatCard
            title="处理中"
            value={Number(stats?.processing || 0)}
            icon={Timer}
            iconClassName="from-amber-400 to-amber-500"
            delay={2}
          />
          <StatCard
            title="已处理"
            value={Number(stats?.handled || 0)}
            icon={CheckCircle2}
            delay={3}
          />
        </div>

        <WarningRealtimeSnapshot
          data={realtimeStats}
          isLoading={realtimeStatsLoading}
          elders={eldersData?.records || []}
          onView={(warning) => setDetailId(warning.id)}
          onHandle={setHandleTarget}
        />

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
                <option value="0">未处理</option>
                <option value="1">处理中</option>
                <option value="2">已处理</option>
                <option value="3">已忽略</option>
              </select>
            </div>
            <div className="min-w-[150px]">
              <label className="text-sm font-medium text-muted-foreground">
                预警等级
              </label>
              <select
                value={warningLevel ?? ""}
                onChange={(event) => {
                  setWarningLevel(
                    event.target.value ? Number(event.target.value) : undefined,
                  );
                  setPage(1);
                }}
                className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm"
              >
                <option value="">全部等级</option>
                <option value="1">低危</option>
                <option value="2">中危</option>
                <option value="3">高危</option>
              </select>
            </div>
            <div className="min-w-[160px]">
              <label className="text-sm font-medium text-muted-foreground">
                老人
              </label>
              <select
                value={elderId}
                onChange={(event) => {
                  setElderId(event.target.value);
                  setPage(1);
                }}
                className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm"
              >
                <option value="">全部老人</option>
                {eldersData?.records.map((elder) => (
                  <option key={elder.id} value={elder.id}>
                    {elder.name}
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
            {canManageWarnings && (
              <Button
                onClick={() => setCreateOpen(true)}
                className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                新建预警
              </Button>
            )}
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">预警列表</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : warnings.length === 0 ? (
                <EmptyState
                  title="暂无预警"
                  description="当前筛选条件下没有健康预警"
                />
              ) : (
                <div className="space-y-3">
                  {warnings.map((warning, index) => (
                    <motion.div
                      key={warning.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="rounded-xl border border-border/40 bg-white/60 p-4 transition-all hover:border-medical-300 hover:bg-white hover:shadow-soft"
                    >
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">
                              {resolveElderName(
                                warning.elderName,
                                warning.elderId,
                                elderNames,
                              )}
                            </h3>
                            <Badge
                              className={cn(
                                "text-xs",
                                levelMeta(warning.warningLevel).className,
                              )}
                            >
                              {levelMeta(warning.warningLevel).label}
                            </Badge>
                            <Badge
                              className={cn(
                                "text-xs",
                                statusMeta(warning.status).className,
                              )}
                            >
                              {statusMeta(warning.status).label}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {warning.warningTitle ||
                              warning.warningContent ||
                              warning.content ||
                              "-"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {warning.createTime || "-"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {canManageWarnings && (
                            <>
                              {warning.status === 0 && (
                                <Button size="sm" variant="outline" onClick={() => setProcessing(warning.id)} disabled={isMutating}>
                                  处理中
                                </Button>
                              )}
                              {(warning.status === 0 || warning.status === 1) && (
                                <Button size="sm" onClick={() => setHandleTarget(warning)} disabled={isMutating} className="bg-gradient-to-r from-medical-400 to-medical-600 text-white">
                                  处理
                                </Button>
                              )}
                              {warning.status === 0 && (
                                <Button size="sm" variant="outline" onClick={() => setIgnoreTarget(warning)} disabled={isMutating}>
                                  <XCircle className="mr-1 h-4 w-4" />
                                  忽略
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => read(warning.id)} disabled={isMutating}>
                                <MailOpen className="mr-1 h-4 w-4" />
                                已读
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailId(warning.id)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            详情
                          </Button>
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
        </motion.div>
      </div>

      <WarningDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        elders={eldersData?.records || []}
        onSubmit={create}
        isSubmitting={createWarning.isPending}
      />
      <TextActionDialog
        open={!!handleTarget}
        onOpenChange={(open) => !open && setHandleTarget(null)}
        title="处理健康预警"
        description={handleTarget?.warningTitle || handleTarget?.warningContent}
        placeholder="请输入处理措施和结果"
        initialValue={handleTarget?.handleResult || ""}
        confirmText="确认处理"
        required
        pending={handleWarning.isPending}
        onConfirm={submitHandle}
      />
      <TextActionDialog
        open={!!ignoreTarget}
        onOpenChange={(open) => !open && setIgnoreTarget(null)}
        title="忽略健康预警"
        description={ignoreTarget?.warningTitle || ignoreTarget?.warningContent}
        placeholder="请填写忽略原因"
        confirmText="确认忽略"
        required
        destructive
        pending={ignoreWarning.isPending}
        onConfirm={ignore}
      />
      <DetailDialog
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(undefined)}
        title="预警详情"
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
                  label: "预警等级",
                  value: levelMeta(detail.warningLevel).label,
                },
                { label: "状态", value: statusMeta(detail.status).label },
                { label: "发生时间", value: detail.createTime },
                {
                  label: "预警标题",
                  value: detail.warningTitle || "-",
                  wide: true,
                },
                {
                  label: "预警内容",
                  value: detail.warningContent || detail.content || "-",
                  wide: true,
                },
                { label: "预警值", value: detail.warningValue || "-" },
                { label: "阈值", value: detail.thresholdValue || "-" },
                {
                  label: "处理结果",
                  value: detail.handleResult || "未处理",
                  wide: true,
                },
              ]
            : []
        }
      >
        {logs && logs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-violet-600" />
              <h3 className="text-sm font-semibold">处理日志</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {logs.map((log, index) => (
                <div
                  key={String(log.id || index)}
                  className="rounded-lg border border-violet-100 bg-violet-50/40 p-4"
                >
                  <p className="text-sm font-medium leading-6 text-foreground">
                    {String(
                      log.action ||
                        log.operation ||
                        log.content ||
                        log.handleResult ||
                        "状态变更",
                    )}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {String(log.createTime || log.time || "时间未记录")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </DetailDialog>
    </PageShell>
  );
}
