import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRightLeft,
  Bot,
  ClipboardCheck,
  FileHeart,
  RefreshCw,
  Settings,
  ShieldAlert,
  Stethoscope,
  Users,
} from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import TodoList from "@/components/dashboard/TodoList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ElderMasterSelect from "@/components/workflow/ElderMasterSelect";
import { createElderNameMap, resolveElderName } from "@/lib/elderName";
import { useCareWorkflowSummary } from "@/hooks/useCareWorkflow";
import {
  useAssessmentStats,
  useDashboardChronicOverview,
  useDashboardStats,
  useDashboardTodo,
  useExamStats,
  useInterventionStats,
  useElders,
  useReferralStats,
  useReferrals,
  useWarnings,
} from "@/hooks/useApi";

function todoItemsFrom(data: unknown) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  const source = data as Record<string, unknown>;
  return [
    {
      id: "warnings",
      name: "待处理预警",
      elderId: `数量 ${String(source.pendingWarnings ?? 0)}`,
      status: "attention" as const,
      date: "今日",
      path: "/warnings",
    },
    {
      id: "followups",
      name: "今日随访",
      elderId: `数量 ${String(source.todayFollowups ?? 0)}`,
      status: "pending" as const,
      date: "今日",
      path: "/followup",
    },
    {
      id: "reviews",
      name: "护士审核",
      elderId: `数量 ${String(source.pendingNurseRecords ?? 0)}`,
      status: "stable" as const,
      date: "待办",
      path: "/nurse-review",
    },
  ];
}

export default function AdminDashboard() {
  const [selectedElderId, setSelectedElderId] = useState<number | undefined>();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: todo } = useDashboardTodo();
  const { data: chronicOverview } = useDashboardChronicOverview();
  const { data: assessmentStats } = useAssessmentStats();
  const { data: referralStats } = useReferralStats();
  const { data: examStats } = useExamStats();
  const { data: interventionStats } = useInterventionStats();
  const { data: latestWarnings } = useWarnings(1, 5, 0);
  const { data: latestReferrals } = useReferrals(1, 5);
  const { data: eldersData } = useElders(1, 500);
  const {
    data: workflow,
    refetch: refetchWorkflow,
    isFetching: workflowLoading,
  } = useCareWorkflowSummary(selectedElderId);
  const todoItems = Array.isArray(todo) ? todo : todoItemsFrom(todo);
  const elderNames = createElderNameMap(eldersData?.records || []);
  const selectedElder = (eldersData?.records || []).find(
    (elder) => elder.id === selectedElderId,
  );
  return (
    <PageShell
      title="管理员工作台"
      subtitle="总览平台数据、系统配置、AI 配置、预警规则和审核待办"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="老人档案"
            value={isLoading ? 0 : stats?.elderCount || 0}
            icon={Users}
            delay={0}
          />
          <StatCard
            title="今日预警"
            value={isLoading ? 0 : stats?.warningCount || 0}
            icon={ShieldAlert}
            iconClassName="from-amber-400 to-amber-500"
            delay={1}
          />
          <StatCard
            title="随访计划"
            value={isLoading ? 0 : stats?.followupCount || 0}
            icon={ClipboardCheck}
            iconClassName="from-sky-400 to-sky-500"
            delay={2}
          />
          <StatCard
            title="完成率"
            value={isLoading ? 0 : Number(chronicOverview?.followupRate || 0)}
            suffix="%"
            icon={Settings}
            iconClassName="from-lavender-400 to-lavender-500"
            delay={3}
          />
        </div>

        <Card className="border-medical-100 bg-white/90 shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              全流程演示对象
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <ElderMasterSelect
              className="w-full lg:max-w-xl"
              label="老人主档"
              elders={eldersData?.records || []}
              value={selectedElderId}
              onChange={setSelectedElderId}
              allowAll={false}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={!selectedElderId || workflowLoading}
                onClick={() => refetchWorkflow()}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${workflowLoading ? "animate-spin" : ""}`}
                />
                读取流程状态
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl"
                disabled={!selectedElderId}
              >
                <Link
                  to={
                    selectedElderId
                      ? `/elders/${selectedElderId}/care-journey`
                      : "/elders"
                  }
                >
                  进入全流程
                </Link>
              </Button>
            </div>
          </CardContent>
          {selectedElderId && (
            <CardContent className="border-t border-border/40 pt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-xl bg-medical-50 p-3">
                  <p className="text-xs text-muted-foreground">演示老人</p>
                  <p className="mt-1 font-semibold">
                    {resolveElderName(
                      workflow?.elder?.name || selectedElder?.name,
                      selectedElderId,
                      elderNames,
                    )}
                  </p>
                </div>
                <div className="rounded-xl bg-sky-50 p-3">
                  <p className="text-xs text-muted-foreground">风险</p>
                  <p className="mt-1 font-semibold">
                    {workflow?.risk?.statusText ||
                      workflow?.risk?.status ||
                      (workflow?.risk?.id
                        ? `ID ${workflow.risk.id}`
                        : "待读取")}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-xs text-muted-foreground">随访计划</p>
                  <p className="mt-1 font-semibold">
                    {workflow?.plan?.count ?? (workflow?.plan?.id ? 1 : 0)} 条
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-xs text-muted-foreground">随访任务</p>
                  <p className="mt-1 font-semibold">
                    {workflow?.task?.count ?? (workflow?.task?.id ? 1 : 0)} 条
                  </p>
                </div>
                <div className="rounded-xl bg-rose-50 p-3">
                  <p className="text-xs text-muted-foreground">AI 报告</p>
                  <p className="mt-1 font-semibold">
                    {workflow?.report?.count ?? (workflow?.report?.id ? 1 : 0)}{" "}
                    份
                  </p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">管理入口</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Button
                asChild
                variant="outline"
                className="h-20 justify-start rounded-xl px-5"
              >
                <Link to="/warning-rules">
                  <ShieldAlert className="mr-3 h-5 w-5 text-medical-500" />
                  预警规则配置
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-20 justify-start rounded-xl px-5"
              >
                <Link to="/admin-ai-config">
                  <Bot className="mr-3 h-5 w-5 text-medical-500" />
                  AI 配置管理
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-20 justify-start rounded-xl px-5"
              >
                <Link to="/key-population">
                  <Users className="mr-3 h-5 w-5 text-medical-500" />
                  重点人群分层
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-20 justify-start rounded-xl px-5"
              >
                <Link to="/nurse-review">
                  <ClipboardCheck className="mr-3 h-5 w-5 text-medical-500" />
                  护士审核
                </Link>
              </Button>
            </CardContent>
          </Card>

          <TodoList items={todoItems} loading={isLoading} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="健康评估"
            value={Number(assessmentStats?.total || 0)}
            icon={Activity}
            delay={0}
          />
          <StatCard
            title="待接收转诊"
            value={Number(referralStats?.pending || 0)}
            icon={ArrowRightLeft}
            iconClassName="from-cyan-400 to-cyan-500"
            delay={1}
          />
          <StatCard
            title="年度体检"
            value={Number(examStats?.thisYear || 0)}
            icon={Stethoscope}
            iconClassName="from-emerald-400 to-emerald-500"
            delay={2}
          />
          <StatCard
            title="干预记录"
            value={Number(interventionStats?.total || 0)}
            icon={FileHeart}
            iconClassName="from-rose-400 to-rose-500"
            delay={3}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-bold">
                最新待处理预警
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/warnings">查看全部</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {(latestWarnings?.records || []).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  当前没有待处理预警
                </p>
              ) : (
                (latestWarnings?.records || []).map((warning) => (
                  <Link
                    key={warning.id}
                    to={`/warnings?warningId=${warning.id}`}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border/50 px-3 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {resolveElderName(
                          warning.elderName,
                          warning.elderId,
                          elderNames,
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {warning.warningTitle ||
                          warning.warningContent ||
                          "健康预警"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${warning.warningLevel === 3 ? "bg-red-100 text-red-700" : warning.warningLevel === 2 ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {warning.warningLevel === 3
                        ? "高危"
                        : warning.warningLevel === 2
                          ? "中危"
                          : "低危"}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-bold">
                最新转诊协同
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/referrals">查看全部</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {(latestReferrals?.records || []).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  当前没有转诊记录
                </p>
              ) : (
                (latestReferrals?.records || []).map((referral) => (
                  <Link
                    key={referral.id}
                    to="/referrals"
                    className="flex items-center justify-between gap-4 rounded-lg border border-border/50 px-3 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {resolveElderName(
                          referral.elderName,
                          referral.elderId,
                          elderNames,
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {referral.fromOrg || "未填写转出机构"} →{" "}
                        {referral.toOrg || "未填写接收机构"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">
                      {referral.status === 0
                        ? "待接收"
                        : referral.status === 1 || referral.status === 2
                          ? "处理中"
                          : referral.status === 3
                            ? "已完成"
                            : "已结束"}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
