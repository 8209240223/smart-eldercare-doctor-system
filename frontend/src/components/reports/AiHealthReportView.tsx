import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  Database,
  HeartPulse,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  AiHealthAdviceItem,
  AiHealthFinding,
  AiHealthReport,
  AiHealthReportDocument,
} from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import {
  asNumber,
  asText,
  asTextList,
  formatDateTime,
  isRecord,
  parseAiHealthReport,
  riskLevelText,
  riskTone,
} from "./reportParsing";

interface AiHealthReportViewProps {
  report: AiHealthReport | AiHealthReportDocument | unknown;
  className?: string;
}

function Section({
  icon,
  title,
  children,
  className,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-lg border border-border/50 bg-white/75 p-4 shadow-sm",
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-medical-50 text-medical-600">
          {icon}
        </span>
        {title}
      </div>
      {children}
    </section>
  );
}

function TextList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="flex min-w-0 items-start gap-2 text-sm leading-6 text-slate-700"
        >
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-medical-400" />
          <span className="min-w-0 break-words">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function normalizeFinding(value: unknown): AiHealthFinding | undefined {
  if (!isRecord(value)) return undefined;
  return {
    ...value,
    category: asText(value.category),
    severity: asNumber(value.severity),
    finding: asText(value.finding),
    advice: asText(value.advice),
  };
}

function normalizeAdvice(value: unknown): AiHealthAdviceItem | undefined {
  if (!isRecord(value)) return undefined;
  return {
    ...value,
    disease: asText(value.disease),
    name: asText(value.name),
    type: asText(value.type),
    content: asText(value.content),
    advice: asText(value.advice),
    target: asText(value.target),
    effect: asText(value.effect),
  };
}

function AdviceList({ items }: { items: unknown }) {
  const normalized = Array.isArray(items)
    ? items
        .map(normalizeAdvice)
        .filter((item): item is AiHealthAdviceItem => !!item)
    : [];

  if (normalized.length === 0) return null;

  return (
    <div className="space-y-2">
      {normalized.map((item, index) => {
        const title =
          item.disease || item.name || item.type || `建议 ${index + 1}`;
        const body = item.advice || item.content || item.target || item.effect;
        return (
          <div
            key={`${title}-${index}`}
            className="min-w-0 rounded-lg bg-slate-50 px-3 py-2.5"
          >
            <p className="break-words text-sm font-medium text-slate-800">
              {title}
            </p>
            {body && (
              <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                {body}
              </p>
            )}
            {item.effect && item.effect !== body && (
              <p className="mt-1 break-words text-xs text-medical-700">
                当前效果：{item.effect}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DataCompleteness({ value }: { value: unknown }) {
  const textItems = asTextList(value);
  if (textItems.length > 0) return <TextList items={textItems} />;

  if (!isRecord(value)) {
    return (
      <p className="text-sm text-slate-600">当前报告未提供数据完整性说明。</p>
    );
  }

  const labels: Record<string, string> = {
    score: "完整度评分",
    completenessScore: "完整度评分",
    summary: "完整性说明",
    missingFields: "缺失数据",
    missingData: "缺失数据",
    availableFields: "已覆盖数据",
    completeFields: "已覆盖数据",
  };
  const rows = Object.entries(value)
    .map(([key, item]) => ({
      key,
      label: labels[key] || key,
      text: Array.isArray(item) ? asTextList(item).join("、") : asText(item),
    }))
    .filter((item) => item.text);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-600">当前报告未提供数据完整性说明。</p>
    );
  }

  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {rows.map((item) => (
        <div key={item.key} className="min-w-0 rounded-lg bg-slate-50 p-3">
          <dt className="text-xs text-slate-500">{item.label}</dt>
          <dd className="mt-1 break-words text-sm text-slate-700">
            {item.text}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function AiHealthReportView({
  report,
  className,
}: AiHealthReportViewProps) {
  const parsed = parseAiHealthReport(report);
  const document = parsed.document;
  const envelope = isRecord(report) ? report : undefined;

  if (!document) {
    return (
      <div
        data-testid="ai-health-report-view"
        className={cn("min-w-0 space-y-3", className)}
      >
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium">报告暂时无法结构化展示</p>
              <p className="mt-1 break-words text-amber-700">{parsed.error}</p>
            </div>
          </div>
        </div>
        {parsed.rawText && <TechnicalData value={parsed.rawText} invalid />}
      </div>
    );
  }

  const elderBrief = isRecord(document.elderBrief) ? document.elderBrief : {};
  const riskScore =
    asNumber(document.riskScore) ?? asNumber(envelope?.riskScore) ?? 0;
  const riskLevel = document.riskLevel ?? envelope?.riskLevel;
  const riskReasons = asTextList(document.riskReasons);
  const followUpAdvice = asTextList(document.followUpAdvice);
  const notices = asTextList(document.notices);
  const aiSuggestions = asTextList(document.aiSuggestions);
  const findings = Array.isArray(document.findings)
    ? document.findings
        .map(normalizeFinding)
        .filter((item): item is AiHealthFinding => !!item)
    : [];
  const generatedAt =
    document.aiGeneratedAt || document.generatedAt || envelope?.createTime;
  const reportText = asText(document.reportText);
  const aiAnalysis = asText(document.aiAnalysis);
  const aiComment = asText(document.aiComment);

  return (
    <div
      data-testid="ai-health-report-view"
      className={cn("min-w-0 space-y-4", className)}
    >
      {parsed.warning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {parsed.warning}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-medical-100 bg-gradient-to-r from-medical-50 via-white to-sky-50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn("border", riskTone(riskLevel))}
                variant="outline"
              >
                {riskLevelText(riskLevel)}
              </Badge>
              <span className="text-xs text-slate-500">
                {asText(envelope?.modelName) || "规则与健康数据综合评估"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <UserRound className="h-4 w-4 text-medical-500" />
                {asText(elderBrief.name) ||
                  asText(envelope?.elderName) ||
                  "老人"}
              </span>
              {asText(elderBrief.gender) && (
                <span>{asText(elderBrief.gender)}</span>
              )}
              {asText(elderBrief.age) && (
                <span>{asText(elderBrief.age)} 岁</span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4 text-sky-500" />
                {formatDateTime(generatedAt)}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-end gap-1 self-start sm:self-center">
            <span className="text-4xl font-bold text-medical-700">
              {riskScore}
            </span>
            <span className="pb-1 text-sm text-slate-500">/ 100</span>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/90">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
            style={{ width: `${Math.max(0, Math.min(100, riskScore))}%` }}
          />
        </div>
      </div>

      {reportText && (
        <Section icon={<ClipboardList className="h-4 w-4" />} title="综合摘要">
          <p className="break-words text-sm leading-7 text-slate-700">
            {reportText}
          </p>
        </Section>
      )}

      {riskReasons.length > 0 && (
        <Section icon={<ShieldAlert className="h-4 w-4" />} title="风险原因">
          <TextList items={riskReasons} />
        </Section>
      )}

      {findings.length > 0 && (
        <Section
          icon={<Activity className="h-4 w-4" />}
          title="分类发现与医生建议"
        >
          <div className="space-y-3">
            {findings.map((finding, index) => (
              <div
                key={`${finding.category}-${index}`}
                className="min-w-0 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-sky-50 text-sky-700">
                    {finding.category || "综合"}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    严重度 {finding.severity ?? "-"}
                  </span>
                </div>
                {finding.finding && (
                  <p className="mt-2 break-words text-sm leading-6 text-slate-800">
                    {finding.finding}
                  </p>
                )}
                {finding.advice && (
                  <p className="mt-2 break-words rounded-lg bg-medical-50 px-3 py-2 text-sm leading-6 text-medical-800">
                    建议：{finding.advice}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.isArray(document.chronicAdvice) &&
          document.chronicAdvice.length > 0 && (
            <Section
              icon={<HeartPulse className="h-4 w-4" />}
              title="慢病管理建议"
            >
              <AdviceList items={document.chronicAdvice} />
            </Section>
          )}
        {followUpAdvice.length > 0 && (
          <Section
            icon={<CalendarClock className="h-4 w-4" />}
            title="随访建议"
          >
            <TextList items={followUpAdvice} />
          </Section>
        )}
        {Array.isArray(document.interventionAdvice) &&
          document.interventionAdvice.length > 0 && (
            <Section
              icon={<Stethoscope className="h-4 w-4" />}
              title="干预建议"
            >
              <AdviceList items={document.interventionAdvice} />
            </Section>
          )}
        {notices.length > 0 && (
          <Section
            icon={<AlertTriangle className="h-4 w-4" />}
            title="注意事项"
          >
            <TextList items={notices} />
          </Section>
        )}
      </div>

      {(aiAnalysis || aiComment || aiSuggestions.length > 0) && (
        <Section
          icon={<Brain className="h-4 w-4" />}
          title="AI 深度分析"
          className="border-sky-200 bg-sky-50/45"
        >
          {aiAnalysis && (
            <p className="break-words text-sm leading-7 text-slate-700">
              {aiAnalysis}
            </p>
          )}
          {aiComment && aiComment !== aiAnalysis && (
            <p className="mt-3 break-words text-sm leading-7 text-slate-700">
              {aiComment}
            </p>
          )}
          {aiSuggestions.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-sky-800">
                <Lightbulb className="h-4 w-4" />
                AI 建议
              </p>
              <TextList items={aiSuggestions} />
            </div>
          )}
        </Section>
      )}

      {document.dataCompleteness !== undefined && (
        <Section icon={<Database className="h-4 w-4" />} title="数据完整性">
          <DataCompleteness value={document.dataCompleteness} />
        </Section>
      )}

      {asTextList(document.encouragements).length > 0 && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
            <Sparkles className="h-4 w-4" />
            健康提示
          </p>
          <p className="mt-1 break-words text-sm leading-6 text-emerald-700">
            {asTextList(document.encouragements).join(" ")}
          </p>
        </div>
      )}

      <TechnicalData value={parsed.prettyJson || parsed.rawText} />
    </div>
  );
}

export function TechnicalData({
  value,
  invalid = false,
}: {
  value?: string;
  invalid?: boolean;
}) {
  if (!value) return null;
  return (
    <details
      data-testid="report-technical-data"
      className="group min-w-0 rounded-lg border border-slate-200 bg-slate-50/70"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-slate-600">
        <span className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          {invalid ? "技术数据（解析失败）" : "技术数据"}
        </span>
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-slate-200 p-3">
        <pre className="max-h-80 max-w-full overflow-auto whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-xs leading-5 text-slate-600">
          {value}
        </pre>
      </div>
    </details>
  );
}
