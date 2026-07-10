import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  ListChecks,
  UserRound,
} from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ElderMasterSelect from "@/components/workflow/ElderMasterSelect";
import {
  useElders,
  useNurseDashboardStats,
  useNurseDashboardTasks,
} from "@/hooks/useApi";

export default function NurseDashboard() {
  const [selectedElderId, setSelectedElderId] = useState<number | undefined>();
  const { data: stats, isLoading: statsLoading } = useNurseDashboardStats();
  const { data: tasks, isLoading: tasksLoading } = useNurseDashboardTasks();
  const { data: eldersData } = useElders(1, 500);
  const todayRecords = Array.isArray(tasks?.todayRecords)
    ? tasks.todayRecords
    : [];
  const activePlans = Array.isArray(tasks?.activePlans)
    ? tasks.activePlans
    : [];
  const elderNames = new Map(
    (eldersData?.records || []).map((elder) => [elder.id, elder.name]),
  );
  const selectedElder = (eldersData?.records || []).find(
    (elder) => elder.id === selectedElderId,
  );

  return (
    <PageShell
      title="护士工作台"
      subtitle="录入护理记录，执行护理计划，上报异常护理情况"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="今日护理记录"
            value={Number(stats?.todayRecords || stats?.todayCount || 0)}
            icon={ClipboardList}
            delay={0}
          />
          <StatCard
            title="执行中计划"
            value={Number(stats?.activePlans || stats?.active || 0)}
            icon={CalendarCheck}
            iconClassName="from-sky-400 to-sky-500"
            delay={1}
          />
          <StatCard
            title="待上报异常"
            value={Number(stats?.pendingReports || stats?.abnormal || 0)}
            icon={AlertTriangle}
            iconClassName="from-amber-400 to-amber-500"
            delay={2}
          />
          <StatCard
            title="我的随访任务"
            value={Number(stats?.myFollowTasks || stats?.tasks || 0)}
            icon={HeartPulse}
            iconClassName="from-lavender-400 to-lavender-500"
            delay={3}
          />
        </div>

        <Card className="border-medical-100 bg-white/90 shadow-card">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 flex-1 items-end gap-3">
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-medical-100 text-medical-700 sm:flex">
                <UserRound className="h-5 w-5" />
              </div>
              <ElderMasterSelect
                className="w-full max-w-xl"
                label="老人主档"
                elders={eldersData?.records || []}
                value={selectedElderId}
                onChange={setSelectedElderId}
                allowAll={false}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="rounded-xl">
                <Link
                  to={
                    selectedElderId
                      ? `/nurse-records?elderId=${selectedElderId}`
                      : "/nurse-records"
                  }
                >
                  查看护理记录
                </Link>
              </Button>
              <Button
                asChild
                className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white"
              >
                <Link
                  to={
                    selectedElderId
                      ? `/elders/${selectedElderId}/care-journey`
                      : "/elders"
                  }
                >
                  进入照护全流程
                </Link>
              </Button>
            </div>
          </CardContent>
          {selectedElder && (
            <CardContent className="border-t border-border/40 pt-4 text-sm text-muted-foreground">
              当前对象：
              <span className="font-semibold text-foreground">
                {selectedElder.name}
              </span>
              {selectedElder.idCard ? ` · ${selectedElder.idCard}` : ""}
              {selectedElder.community ? ` · ${selectedElder.community}` : ""}
            </CardContent>
          )}
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">
                今日护理记录
              </CardTitle>
              <Button
                asChild
                size="sm"
                className="rounded-lg bg-gradient-to-r from-medical-400 to-medical-600 text-white"
              >
                <Link to="/nurse-records">进入记录</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : todayRecords.length === 0 ? (
                <EmptyState
                  title="今日暂无护理记录"
                  description="可进入护理记录页面新增"
                />
              ) : (
                <div className="space-y-3">
                  {todayRecords
                    .slice(0, 6)
                    .map((item: Record<string, unknown>, index: number) => (
                      <div
                        key={String(item.id || index)}
                        className="rounded-xl border border-border/40 bg-white/60 p-3"
                      >
                        <div className="font-medium">
                          {String(item.recordTitle || item.title || "护理记录")}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {elderNames.get(Number(item.elderId)) ||
                            "姓名未同步"}{" "}
                          · {String(item.recordDate || item.createTime || "")}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">
                执行中护理计划
              </CardTitle>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-lg"
              >
                <Link to="/nurse-plans">进入计划</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {tasksLoading || statsLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : activePlans.length === 0 ? (
                <EmptyState
                  title="暂无执行中计划"
                  description="可进入护理计划页面新增或启动计划"
                />
              ) : (
                <div className="space-y-3">
                  {activePlans
                    .slice(0, 6)
                    .map((item: Record<string, unknown>, index: number) => (
                      <div
                        key={String(item.id || index)}
                        className="flex items-center justify-between rounded-xl border border-border/40 bg-white/60 p-3"
                      >
                        <div>
                          <div className="font-medium">
                            {String(item.planName || "护理计划")}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {elderNames.get(Number(item.elderId)) ||
                              "姓名未同步"}{" "}
                            · {String(item.completedCount || 0)}/
                            {String(item.totalCount || 0)}
                          </div>
                        </div>
                        <ListChecks className="h-5 w-5 text-medical-500" />
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white"
          >
            <Link
              to={
                selectedElderId
                  ? `/nurse-records?elderId=${selectedElderId}`
                  : "/nurse-records"
              }
            >
              新增护理记录
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link
              to={
                selectedElderId
                  ? `/nurse-plans?elderId=${selectedElderId}`
                  : "/nurse-plans"
              }
            >
              制定护理计划
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/warnings">
              <Activity className="mr-2 h-4 w-4" />
              查看预警
            </Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
