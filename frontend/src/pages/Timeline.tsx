import { useState } from "react";
import { motion } from "motion/react";
import { Activity, BrainCircuit, CalendarCheck, ChevronDown, Clock, FileHeart, Hospital, Pill, ShieldAlert, Siren, Stethoscope } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import { useElders, useTimeline, useTimelineSummary } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

const eventTypes = [
  { value: 1, label: "就诊", color: "bg-sky-100 text-sky-700", dot: "bg-sky-500", icon: Stethoscope },
  { value: 2, label: "检查", color: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-500", icon: Activity },
  { value: 3, label: "用药变更", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500", icon: Pill },
  { value: 4, label: "预警", color: "bg-red-100 text-red-700", dot: "bg-red-500", icon: Siren },
  { value: 5, label: "随访", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", icon: CalendarCheck },
  { value: 6, label: "评估", color: "bg-violet-100 text-violet-700", dot: "bg-violet-500", icon: Activity },
  { value: 7, label: "转诊", color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500", icon: Hospital },
  { value: 8, label: "住院", color: "bg-fuchsia-100 text-fuchsia-700", dot: "bg-fuchsia-500", icon: Hospital },
  { value: 9, label: "出院", color: "bg-lime-100 text-lime-700", dot: "bg-lime-500", icon: Hospital },
  { value: 10, label: "风险分层", color: "bg-orange-100 text-orange-700", dot: "bg-orange-500", icon: ShieldAlert },
  { value: 11, label: "健康干预", color: "bg-teal-100 text-teal-700", dot: "bg-teal-500", icon: FileHeart },
  { value: 12, label: "AI健康报告", color: "bg-purple-100 text-purple-700", dot: "bg-purple-500", icon: BrainCircuit },
];

function typeMeta(value: number, sourceType?: string) {
  const normalizedValue = sourceType === "intervention_record" ? 11 : sourceType === "ai_health_report" ? 12 : value;
  return eventTypes.find((item) => item.value === normalizedValue) || { label: "其他", color: "bg-slate-100 text-slate-700", dot: "bg-slate-500", icon: Clock };
}

export default function Timeline() {
  const [selectedElderId, setSelectedElderId] = useState<number | null>(null);
  const [eventType, setEventType] = useState<number | undefined>();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: eldersData, isLoading: eldersLoading } = useElders(1, 100);
  const { data, isLoading, isError } = useTimeline(selectedElderId || 0, page, pageSize, startDate, endDate, eventType);
  const { data: summary } = useTimelineSummary(selectedElderId || 0, startDate, endDate, eventType);
  const elders = eldersData?.records || [];
  const events = data?.records || [];
  const selectedElder = elders.find((elder) => elder.id === selectedElderId);
  const dateRangeValid = !startDate || !endDate || startDate <= endDate;

  const updateFilter = (setter: () => void) => {
    setter();
    setPage(1);
  };

  return (
    <PageShell
      title="健康时间轴"
      subtitle="按老人、事件类型和日期范围追溯完整健康历程"
      backgroundImage="/images/医生工作台背景_浅色高级医疗科技.png"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="事件总数" value={summary?.total || 0} icon={Clock} delay={0} />
          <StatCard title="预警事件" value={Number(summary?.type4 || 0)} icon={Siren} delay={1} />
          <StatCard title="随访事件" value={Number(summary?.type5 || 0)} icon={CalendarCheck} delay={2} />
          <StatCard title="转诊事件" value={Number(summary?.type7 || 0)} icon={Hospital} delay={3} />
        </div>

        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterField label="老人档案">
              {eldersLoading ? <Skeleton className="h-10 w-full rounded-xl" /> : (
                <SelectControl
                  value={selectedElderId || ""}
                  onChange={(value) => updateFilter(() => setSelectedElderId(Number(value) || null))}
                >
                  <option value="">请选择老人</option>
                  {elders.map((elder) => <option key={elder.id} value={elder.id}>{elder.name}（{elder.idCard}）</option>)}
                </SelectControl>
              )}
            </FilterField>
            <FilterField label="事件类型">
              <SelectControl
                value={eventType ?? ""}
                onChange={(value) => updateFilter(() => setEventType(value ? Number(value) : undefined))}
              >
                <option value="">全部事件</option>
                {eventTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </SelectControl>
            </FilterField>
            <FilterField label="开始日期">
              <Input type="date" value={startDate} onChange={(event) => updateFilter(() => setStartDate(event.target.value))} className="h-10 rounded-xl bg-white/70" />
            </FilterField>
            <FilterField label="结束日期">
              <Input type="date" value={endDate} onChange={(event) => updateFilter(() => setEndDate(event.target.value))} className="h-10 rounded-xl bg-white/70" />
            </FilterField>
            {!dateRangeValid && <p className="text-sm text-red-500 md:col-span-2 xl:col-span-4">开始日期不能晚于结束日期。</p>}
          </CardContent>
        </Card>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold">事件时间轴</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{selectedElder ? `${selectedElder.name}的健康事件` : "请选择老人后查询"}</p>
              </div>
              {selectedElderId && <span className="text-xs text-muted-foreground">共 {data?.total || 0} 条</span>}
            </CardHeader>
            <CardContent>
              {!selectedElderId ? (
                <EmptyState title="请选择老人" description="选择老人后可按类型和日期筛选健康事件" />
              ) : !dateRangeValid ? (
                <EmptyState title="日期范围无效" description="请调整开始日期和结束日期" />
              ) : isLoading ? (
                <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
              ) : isError ? (
                <EmptyState title="时间轴加载失败" description="后端未能返回事件数据，请稍后重试" />
              ) : events.length === 0 ? (
                <EmptyState title="暂无匹配事件" description="当前筛选条件下没有健康事件" />
              ) : (
                <div className="relative space-y-5 pl-3 before:absolute before:bottom-4 before:left-[18px] before:top-3 before:w-px before:bg-border">
                  {events.map((event, index) => {
                    const meta = typeMeta(event.eventType, event.sourceType);
                    const Icon = meta.icon;
                    return (
                      <motion.article key={event.id} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.025 }} className="relative pl-10">
                        <div className={cn("absolute left-0 top-4 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white text-white shadow-sm", meta.dot)}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="rounded-xl border border-border/50 bg-white/70 p-4 transition-colors hover:border-medical-300 hover:bg-white">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", meta.color)}>{meta.label}</span>
                            <time className="text-xs text-muted-foreground">{event.eventTime?.replace("T", " ")}</time>
                            {event.sourceType && <span className="text-xs text-muted-foreground">来源：{event.sourceType}</span>}
                          </div>
                          <h3 className="mt-3 text-sm font-semibold text-foreground">{event.eventTitle || `${meta.label}事件`}</h3>
                          {event.eventContent && <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{event.eventContent}</p>}
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )}

              {selectedElderId && dateRangeValid && (data?.pages || 0) > 1 && (
                <div className="mt-6 flex items-center justify-end gap-3 border-t border-border/40 pt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</Button>
                  <span className="text-sm text-muted-foreground">第 {data?.current || page} / {data?.pages || 1} 页</span>
                  <Button variant="outline" size="sm" disabled={page >= (data?.pages || 1) || isLoading} onClick={() => setPage((value) => value + 1)}>下一页</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageShell>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-1.5"><span className="text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}

function SelectControl({ value, onChange, children }: { value: string | number; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full appearance-none rounded-xl border border-border/60 bg-white/70 pl-3 pr-9 text-sm outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-200">{children}</select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
