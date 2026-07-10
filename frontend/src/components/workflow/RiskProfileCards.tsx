import {
  Activity,
  CalendarClock,
  HeartPulse,
  ShieldAlert,
  Stethoscope,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RiskProfileCardsProps {
  profile: Record<string, unknown> | null | undefined;
}

type RiskLevelMeta = {
  label: string;
  badgeClassName: string;
  scoreClassName: string;
  panelClassName: string;
};

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function numberValue(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    return objectValue(JSON.parse(value));
  } catch {
    return {};
  }
}

function riskLevelMeta(level?: number): RiskLevelMeta {
  if (level === 4) {
    return {
      label: "高危",
      badgeClassName: "border-red-200 bg-red-50 text-red-700",
      scoreClassName: "text-red-700",
      panelClassName: "border-red-100 bg-red-50/55",
    };
  }
  if (level === 3) {
    return {
      label: "重点",
      badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
      scoreClassName: "text-orange-700",
      panelClassName: "border-orange-100 bg-orange-50/55",
    };
  }
  if (level === 2) {
    return {
      label: "关注",
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
      scoreClassName: "text-amber-700",
      panelClassName: "border-amber-100 bg-amber-50/55",
    };
  }
  return {
    label: "正常",
    badgeClassName: "border-medical-200 bg-medical-50 text-medical-700",
    scoreClassName: "text-medical-700",
    panelClassName: "border-medical-100 bg-medical-50/55",
  };
}

export default function RiskProfileCards({ profile }: RiskProfileCardsProps) {
  if (!profile) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-white px-6 py-12 text-center text-sm text-muted-foreground">
        暂无风险画像数据
      </div>
    );
  }

  const risk = Object.keys(objectValue(profile.profile)).length
    ? objectValue(profile.profile)
    : profile;
  const elder = Object.keys(objectValue(profile.elder)).length
    ? objectValue(profile.elder)
    : profile;
  const reasonDetails = Object.keys(objectValue(profile.reasonDetails)).length
    ? objectValue(profile.reasonDetails)
    : parseJsonObject(risk.reasonJson);
  const context = objectValue(reasonDetails.contextData);
  const scoreDetails = Array.isArray(reasonDetails.scoreDetails)
    ? reasonDetails.scoreDetails.map(objectValue)
    : [];

  const elderName = String(
    elder.name ||
      elder.elderName ||
      profile.elderName ||
      profile.name ||
      "姓名未同步",
  );
  const riskScore = numberValue(risk.riskScore ?? profile.riskScore) ?? 0;
  const riskLevel =
    numberValue(risk.riskLevel ?? profile.riskLevel) ??
    (riskScore >= 80 ? 4 : riskScore >= 60 ? 3 : riskScore >= 30 ? 2 : 1);
  const levelMeta = riskLevelMeta(riskLevel);
  const tags = String(risk.riskTags || profile.riskTags || "")
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const calculateTime = String(
    risk.lastCalculateTime || risk.updateTime || profile.updateTime || "-",
  );

  const metrics = [
    {
      label: "年龄",
      value: numberValue(context.age),
      suffix: "岁",
      icon: UserRound,
      className: "bg-medical-100 text-medical-700",
    },
    {
      label: "慢病数量",
      value: numberValue(context.chronicDiseaseCount),
      suffix: "项",
      icon: Stethoscope,
      className: "bg-sky-100 text-sky-700",
    },
    {
      label: "近期预警",
      value: numberValue(context.warningCountIn30Days),
      suffix: "条",
      icon: ShieldAlert,
      className: "bg-amber-100 text-amber-700",
    },
    {
      label: "体征异常",
      value: numberValue(context.vitalSignAbnormalCount),
      suffix: "次",
      icon: HeartPulse,
      className: "bg-rose-100 text-rose-700",
    },
    {
      label: "护理异常",
      value: numberValue(context.nursingAbnormalCount),
      suffix: "条",
      icon: Activity,
      className: "bg-violet-100 text-violet-700",
    },
    {
      label: "随访逾期",
      value: numberValue(context.followupOverdueDays),
      suffix: "天",
      icon: CalendarClock,
      className: "bg-cyan-100 text-cyan-700",
    },
  ];

  const suggestions: string[] = [];
  const vitalAbnormalCount = numberValue(context.vitalSignAbnormalCount) || 0;
  const warningCount = numberValue(context.warningCountIn30Days) || 0;
  const chronicCount = numberValue(context.chronicDiseaseCount) || 0;
  const overdueDays = numberValue(context.followupOverdueDays) || 0;
  if (vitalAbnormalCount > 0) {
    suggestions.push(
      `近 30 天发现 ${vitalAbnormalCount} 次生命体征异常，建议结合趋势图安排复测。`,
    );
  }
  if (warningCount > 0) {
    suggestions.push(
      `近期产生 ${warningCount} 条健康预警，应核对处理状态和后续干预结果。`,
    );
  }
  if (chronicCount > 0) {
    suggestions.push(
      `当前纳入 ${chronicCount} 项慢病管理，随访计划应覆盖用药、饮食和复查。`,
    );
  }
  if (overdueDays > 0) {
    suggestions.push(`随访已逾期 ${overdueDays} 天，建议优先安排联系。`);
  }
  if (suggestions.length === 0) {
    suggestions.push("当前风险指标平稳，继续按既定周期完成健康监测和随访。 ");
  }

  return (
    <div className="space-y-5">
      <section
        className={cn(
          "rounded-lg border p-4 sm:p-5",
          levelMeta.panelClassName,
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-medical-700 shadow-sm">
              <UserRound className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-bold text-foreground">
                  {elderName}
                </h3>
                <Badge variant="outline" className={levelMeta.badgeClassName}>
                  {levelMeta.label}风险
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                最近计算 {calculateTime}
              </p>
            </div>
          </div>
          <div className="flex items-end gap-2 rounded-lg border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
            <span className={cn("text-3xl font-bold", levelMeta.scoreClassName)}>
              {riskScore}
            </span>
            <span className="pb-1 text-xs text-muted-foreground">风险评分</span>
          </div>
        </div>
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-black/5 pt-4">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-white bg-white/80 font-normal text-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-medical-600" />
          <h3 className="text-sm font-semibold">健康管理概况</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="rounded-lg border border-border/50 bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      metric.className,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p className="mt-0.5 font-semibold text-foreground">
                      {metric.value == null ? "暂无" : `${metric.value}${metric.suffix}`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-semibold">风险构成</h3>
        </div>
        {scoreDetails.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {scoreDetails.map((item, index) => (
              <div
                key={`${String(item.ruleCode || item.ruleName || index)}-${index}`}
                className="rounded-lg border border-amber-100 bg-amber-50/45 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm">
                      <TriangleAlert className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-foreground">
                        {String(item.ruleName || "风险因素")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {String(item.ruleCode || "系统评估规则")}
                      </p>
                    </div>
                  </div>
                  <Badge className="shrink-0 bg-amber-100 text-amber-700 hover:bg-amber-100">
                    +{String(item.score ?? 0)} 分
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-medical-100 bg-medical-50/45 px-4 py-5 text-sm text-medical-800">
            当前没有触发额外风险评分规则。
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-sky-600" />
          <h3 className="text-sm font-semibold">管理建议</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion}-${index}`}
              className="flex gap-3 rounded-lg border border-sky-100 bg-sky-50/45 p-4"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm">
                <span className="text-xs font-bold">{index + 1}</span>
              </div>
              <p className="text-sm leading-6 text-foreground">{suggestion}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
