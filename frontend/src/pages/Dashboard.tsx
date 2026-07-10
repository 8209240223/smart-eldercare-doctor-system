import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Activity, Bell, ClipboardCheck, HeartPulse, ShieldCheck, UserRound, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import TodoList, { type TodoItem } from "@/components/dashboard/TodoList";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardChronicOverview, useDashboardReviewCounts, useDashboardStats, useDashboardTodo } from "@/hooks/useApi";
import { useAuthStore } from "@/store/auth";

function todoStatus(value: number, danger = false): TodoItem["status"] {
  if (value <= 0) return "done";
  return danger ? "attention" : "pending";
}

function buildTodoItems(data: ReturnType<typeof useDashboardTodo>["data"]): TodoItem[] {
  if (Array.isArray(data)) {
    return data.map((item) => ({ ...item, status: ["stable", "pending", "attention", "done"].includes(item.status) ? item.status as TodoItem["status"] : "pending" }));
  }
  if (!data) return [];
  return [
    { id: "warnings", name: `待处理预警 ${Number(data.pendingWarnings || 0)} 条`, elderId: "进入预警中心", status: todoStatus(Number(data.pendingWarnings || 0), true), date: "今日", path: "/warnings" },
    { id: "followups", name: `今日应随访 ${Number(data.todayFollowups || 0)} 项`, elderId: "进入随访计划", status: todoStatus(Number(data.todayFollowups || 0)), date: "今日", path: "/followup" },
    { id: "overdue", name: `逾期随访 ${Number(data.overdueFollowups || 0)} 项`, elderId: "进入随访任务", status: todoStatus(Number(data.overdueFollowups || 0), true), date: "需关注", path: "/followup-tasks?scope=overdue" },
    { id: "review-records", name: `待审核护理记录 ${Number(data.pendingNurseRecords || 0)} 条`, elderId: "进入护士审核", status: todoStatus(Number(data.pendingNurseRecords || 0)), date: "待办", path: "/nurse-review" },
    { id: "review-plans", name: `待审核护理计划 ${Number(data.pendingNursePlans || 0)} 条`, elderId: "进入护士审核", status: todoStatus(Number(data.pendingNursePlans || 0)), date: "待办", path: "/nurse-review" },
  ];
}

export default function Dashboard() {
  const { userInfo } = useAuthStore();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: todos, isLoading: todosLoading } = useDashboardTodo();
  const { data: reviewCounts } = useDashboardReviewCounts();
  const { data: chronicOverview } = useDashboardChronicOverview();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";
  const todoItems = buildTodoItems(todos);
  const chronicData = [
    { name: "高血压", value: Number(chronicOverview?.hypertension || 0) },
    { name: "糖尿病", value: Number(chronicOverview?.diabetes || 0) },
    { name: "冠心病", value: Number(chronicOverview?.coronaryHeartDisease || 0) },
    { name: "脑卒中", value: Number(chronicOverview?.stroke || 0) },
    { name: "慢阻肺", value: Number(chronicOverview?.copd || 0) },
  ];
  const warningData = [
    { name: "低危", value: Number(stats?.warningYellow || 0), color: "#eab308" },
    { name: "中危", value: Number(stats?.warningOrange || 0), color: "#f59e0b" },
    { name: "高危", value: Number(stats?.warningRed || 0), color: "#ef4444" },
  ];
  const hasWarningData = warningData.some((item) => item.value > 0);

  return (
    <PageShell
      title={`${greeting}，${userInfo?.realName || userInfo?.username || "医生"}`}
      subtitle="统一管理老人档案、预警、随访、干预与医养协同任务"
      backgroundImage="/images/医生工作台背景_浅色高级医疗科技.png"
      rightPanel={<TodoList items={todoItems} loading={todosLoading} />}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? <><Skeleton className="h-[120px] rounded-xl" /><Skeleton className="h-[120px] rounded-xl" /><Skeleton className="h-[120px] rounded-xl" /><Skeleton className="h-[120px] rounded-xl" /></> : <>
            <StatCard title="管理老人" value={stats?.elderCount || 0} icon={Users} delay={0} />
            <StatCard title="今日预警" value={stats?.warningCount || 0} icon={Bell} iconClassName="from-red-400 to-red-500" delay={1} />
            <StatCard title="随访计划" value={stats?.followupCount || 0} icon={ClipboardCheck} iconClassName="from-sky-400 to-sky-500" delay={2} />
            <StatCard title="随访完成率" value={Number(chronicOverview?.followupRate || 0)} suffix="%" icon={Activity} iconClassName="from-lavender-400 to-lavender-500" delay={3} />
          </>}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
            <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base font-bold">慢病管理概览</CardTitle><span className="text-xs text-muted-foreground">实时统计</span></CardHeader>
              <CardContent>
                <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chronicData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8eef2" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} allowDecimals={false} /><Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: 8, border: "1px solid #dfe7ec" }} /><Bar dataKey="value" name="人数" fill="#0aa88f" radius={[6, 6, 0, 0]} animationDuration={900} /></BarChart></ResponsiveContainer></div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
              <CardHeader><CardTitle className="text-base font-bold">待处理预警等级</CardTitle></CardHeader>
              <CardContent>
                {hasWarningData ? <><div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={warningData} cx="50%" cy="50%" innerRadius={55} outerRadius={86} paddingAngle={4} dataKey="value" animationDuration={900}>{warningData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="flex justify-center gap-4">{warningData.map((item) => <div key={item.name} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-xs text-muted-foreground">{item.name} {item.value}</span></div>)}</div></> : <EmptyState title="暂无待处理预警" description="当前没有低危、中危或高危预警" />}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard title="男性老人" value={stats?.maleCount || 0} icon={UserRound} delay={0} />
          <StatCard title="女性老人" value={stats?.femaleCount || 0} icon={UserRound} iconClassName="from-rose-400 to-rose-500" delay={1} />
          <StatCard title="待审护理记录" value={Number(reviewCounts?.pendingNurseRecords || 0)} icon={ShieldCheck} iconClassName="from-amber-400 to-amber-500" delay={2} />
          <StatCard title="待审护理计划" value={Number(reviewCounts?.pendingNursePlans || 0)} icon={ClipboardCheck} iconClassName="from-sky-400 to-sky-500" delay={3} />
          <StatCard title="高风险预警" value={Number(chronicOverview?.highRiskCount || 0)} icon={HeartPulse} iconClassName="from-red-400 to-red-500" delay={4} />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild className="rounded-xl bg-medical-500 text-white hover:bg-medical-600"><Link to="/warnings">处理预警</Link></Button>
          <Button asChild variant="outline" className="rounded-xl"><Link to="/followup">管理随访</Link></Button>
          <Button asChild variant="outline" className="rounded-xl"><Link to="/nurse-review">审核护理任务</Link></Button>
          <Button asChild variant="outline" className="rounded-xl"><Link to="/elders">老人档案</Link></Button>
        </div>
      </div>
    </PageShell>
  );
}
