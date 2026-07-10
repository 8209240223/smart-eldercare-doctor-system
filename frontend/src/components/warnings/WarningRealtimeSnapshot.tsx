import {
  Activity,
  AlertTriangle,
  Clock3,
  Eye,
  ShieldAlert,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ElderInfo, HealthWarning, WarningRealtimeStats } from "@/hooks/useApi";

interface WarningRealtimeSnapshotProps {
  data?: WarningRealtimeStats;
  isLoading?: boolean;
  elders?: ElderInfo[];
  onView: (warning: HealthWarning) => void;
  onHandle: (warning: HealthWarning) => void;
}

const levelItems = [
  {
    key: "redPending",
    label: "高危待处理",
    icon: ShieldAlert,
    panelClass: "border-red-100 bg-red-50/70",
    iconClass: "bg-red-100 text-red-600",
    valueClass: "text-red-700",
  },
  {
    key: "orangePending",
    label: "中危待处理",
    icon: AlertTriangle,
    panelClass: "border-amber-100 bg-amber-50/70",
    iconClass: "bg-amber-100 text-amber-600",
    valueClass: "text-amber-700",
  },
  {
    key: "yellowPending",
    label: "低危待处理",
    icon: Activity,
    panelClass: "border-medical-100 bg-medical-50/70",
    iconClass: "bg-medical-100 text-medical-600",
    valueClass: "text-medical-700",
  },
] as const;

function levelMeta(level: number) {
  if (level === 3)
    return { label: "高危", className: "bg-red-100 text-red-700" };
  if (level === 2)
    return { label: "中危", className: "bg-amber-100 text-amber-700" };
  return { label: "低危", className: "bg-medical-100 text-medical-700" };
}

function formatTime(value?: string) {
  if (!value) return "-";
  return value.replace("T", " ").slice(0, 16);
}

export default function WarningRealtimeSnapshot({
  data,
  isLoading,
  elders = [],
  onView,
  onHandle,
}: WarningRealtimeSnapshotProps) {
  const elderNames = new Map(
    elders.map((elder) => [Number(elder.id), elder.name]),
  );
  const chartData = (data?.hourlyTrend || []).map((point) => ({
    hour: String(point.hour || ""),
    count: Number(point.count || 0),
  }));
  const recentWarnings = (data?.recentWarnings || []).slice(0, 5);

  return (
    <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base font-bold">实时预警快照</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            待处理风险分布、近 24 小时趋势与最新预警
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-medical-700">
          <span className="h-2 w-2 rounded-full bg-medical-500 shadow-[0_0_0_4px_rgba(20,184,166,0.12)]" />
          SSE 实时更新
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-56" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {levelItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className={cn(
                      "flex min-h-24 items-center justify-between rounded-xl border p-4",
                      item.panelClass,
                    )}
                  >
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {item.label}
                      </p>
                      <p
                        className={cn(
                          "mt-2 text-2xl font-bold",
                          item.valueClass,
                        )}
                      >
                        {Number(data?.[item.key] || 0)}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        item.iconClass,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
              <section className="min-w-0 border-t border-border/40 pt-4 xl:border-r xl:border-t-0 xl:pr-5 xl:pt-0">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Activity className="h-4 w-4 text-medical-600" />近 24
                    小时趋势
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    共 {chartData.reduce((sum, point) => sum + point.count, 0)}{" "}
                    条
                  </span>
                </div>
                {chartData.length > 0 ? (
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 8, right: 12, left: -24, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e5edf0"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="hour"
                          axisLine={false}
                          tickLine={false}
                          interval={5}
                          tick={{ fill: "#64748b", fontSize: 11 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                          tick={{ fill: "#64748b", fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid #dfe7ec",
                          }}
                          labelFormatter={(label) => `${label} 时段`}
                          formatter={(value) => [`${Number(value)} 条`, "预警"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="预警数"
                          stroke="#0aa88f"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 5, fill: "#0aa88f" }}
                          animationDuration={800}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground">
                    近 24 小时暂无预警趋势数据
                  </div>
                )}
              </section>

              <section className="min-w-0 border-t border-border/40 pt-4 xl:border-t-0 xl:pt-0">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Clock3 className="h-4 w-4 text-amber-600" />
                    最近预警
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    待处理 {Number(data?.totalPending || 0)} 条
                  </span>
                </div>
                {recentWarnings.length > 0 ? (
                  <div className="space-y-2">
                    {recentWarnings.map((warning) => {
                      const meta = levelMeta(Number(warning.warningLevel || 1));
                      return (
                        <div
                          key={warning.id}
                          className="rounded-xl border border-border/40 bg-white/70 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="truncate text-sm font-semibold">
                                  {warning.elderName ||
                                    elderNames.get(Number(warning.elderId)) ||
                                    "姓名未同步"}
                                </span>
                                <Badge
                                  className={cn("text-[11px]", meta.className)}
                                >
                                  {meta.label}
                                </Badge>
                              </div>
                              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                {warning.warningTitle ||
                                  warning.warningContent ||
                                  warning.content ||
                                  "健康指标异常"}
                              </p>
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                {formatTime(warning.createTime)}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title="查看预警详情"
                                onClick={() => onView(warning)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 bg-gradient-to-r from-medical-400 to-medical-600 px-2.5 text-xs text-white"
                                onClick={() => onHandle(warning)}
                              >
                                处理
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-border/60 px-4 text-center text-sm text-muted-foreground">
                    当前没有待处理的实时预警
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
