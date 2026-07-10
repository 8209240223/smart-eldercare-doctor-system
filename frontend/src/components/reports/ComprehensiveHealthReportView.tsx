import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  FileHeart,
  HeartPulse,
  History,
  Pill,
  ShieldAlert,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AiHealthReport, ComprehensiveHealthReport } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import { TechnicalData } from "./AiHealthReportView";
import {
  asNumber,
  asText,
  formatDateTime,
  getAiReportSummary,
  isRecord,
  parseNestedReport,
  riskLevelText,
  riskTone,
} from "./reportParsing";

interface ComprehensiveHealthReportViewProps {
  report: ComprehensiveHealthReport | unknown;
  className?: string;
}

const assessmentTypeLabels: Record<number, string> = {
  1: "日常生活能力",
  2: "认知功能",
  3: "情绪与心理",
  4: "营养状况",
  5: "跌倒风险",
  6: "压疮风险",
  7: "疼痛评估",
  8: "社会功能",
  9: "综合评估",
};

function ReportSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-border/50 bg-white/75 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
          {icon}
        </span>
        {title}
      </div>
      {children}
    </section>
  );
}

function InfoGrid({
  source,
  fields,
}: {
  source: Record<string, unknown>;
  fields: Array<{ key: string; label: string; suffix?: string }>;
}) {
  const rows = fields
    .map((field) => ({
      ...field,
      value: asText(source[field.key]),
    }))
    .filter((field) => field.value);

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">暂无已录入信息。</p>;
  }

  return (
    <dl className="grid min-w-0 grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
      {rows.map((field) => (
        <div key={field.key} className="min-w-0">
          <dt className="text-xs text-slate-500">{field.label}</dt>
          <dd className="mt-1 break-words text-sm text-slate-800">
            {field.value}
            {field.suffix || ""}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function recordList(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

export default function ComprehensiveHealthReportView({
  report,
  className,
}: ComprehensiveHealthReportViewProps) {
  const parsed = parseNestedReport<ComprehensiveHealthReport>(report);
  const document = parsed.document;

  if (!document) {
    return (
      <div
        data-testid="comprehensive-health-report-view"
        className={cn("min-w-0 space-y-3", className)}
      >
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium">综合报告暂时无法展示</p>
              <p className="mt-1 break-words">{parsed.error}</p>
            </div>
          </div>
        </div>
        <TechnicalData value={parsed.rawText} invalid />
      </div>
    );
  }

  const basicInfo = isRecord(document.basicInfo) ? document.basicInfo : {};
  const healthRecord = isRecord(document.healthRecord)
    ? document.healthRecord
    : {};
  const assessments = recordList(document.assessments);
  const medicalHistories = recordList(document.medicalHistories);
  const recentVitals = recordList(document.recentVitals);
  const recentWarnings = recordList(document.recentWarnings);
  const aiReports = Array.isArray(document.aiReports)
    ? document.aiReports.filter(isRecord)
    : [];
  const meta = isRecord(document.meta) ? document.meta : {};
  const overallScore = asNumber(document.overallScore);
  const overallLevel = asText(document.overallLevel);

  return (
    <div
      data-testid="comprehensive-health-report-view"
      className={cn("min-w-0 space-y-4", className)}
    >
      <div className="overflow-hidden rounded-lg border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-sky-700">综合健康档案</p>
            <h3 className="mt-1 break-words text-xl font-bold text-slate-900">
              {asText(basicInfo.name) || "老人健康报告"}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <UserRound className="h-4 w-4 text-medical-500" />
                {asText(basicInfo.gender) || "性别未录入"}
              </span>
              {asText(basicInfo.age) && <span>{asText(basicInfo.age)} 岁</span>}
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4 text-sky-500" />
                {formatDateTime(meta.generatedAt)}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 self-start sm:self-center">
            <div className="text-right">
              <p className="text-xs text-slate-500">综合评分</p>
              <p className="text-3xl font-bold text-medical-700">
                {overallScore ?? "-"}
              </p>
            </div>
            {overallLevel && (
              <Badge
                variant="outline"
                className="border-medical-200 bg-white text-medical-700"
              >
                {overallLevel}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportSection
          icon={<UserRound className="h-4 w-4" />}
          title="老人基本资料"
        >
          <InfoGrid
            source={basicInfo}
            fields={[
              { key: "birthDate", label: "出生日期" },
              { key: "idCard", label: "身份证号" },
              { key: "phone", label: "联系电话" },
              { key: "community", label: "所属社区" },
              { key: "address", label: "居住地址" },
              { key: "emergencyContact", label: "紧急联系人" },
              { key: "emergencyPhone", label: "紧急联系电话" },
            ]}
          />
        </ReportSection>

        <ReportSection
          icon={<FileHeart className="h-4 w-4" />}
          title="健康档案摘要"
        >
          <InfoGrid
            source={healthRecord}
            fields={[
              { key: "bloodType", label: "血型" },
              { key: "height", label: "身高", suffix: " cm" },
              { key: "weight", label: "体重", suffix: " kg" },
              { key: "bmi", label: "BMI" },
              { key: "bmiDesc", label: "BMI 评价" },
              { key: "medicalHistory", label: "既往病史" },
              { key: "allergyHistory", label: "过敏史" },
              { key: "currentMedication", label: "当前用药" },
              { key: "disabilityStatus", label: "失能情况" },
            ]}
          />
        </ReportSection>
      </div>

      {recentVitals.length > 0 && (
        <ReportSection
          icon={<HeartPulse className="h-4 w-4" />}
          title="最近生命体征"
        >
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {recentVitals.map((item, index) => (
              <div
                key={`${asText(item.name)}-${index}`}
                className="min-w-0 rounded-lg bg-slate-50 p-3"
              >
                <p className="truncate text-xs text-slate-500">
                  {asText(item.name) || "体征"}
                </p>
                <p
                  className={cn(
                    "mt-1 break-words text-lg font-semibold",
                    asNumber(item.isAbnormal) === 1
                      ? "text-rose-600"
                      : "text-slate-800",
                  )}
                >
                  {asText(item.value) || "-"}
                  <span className="ml-1 text-xs font-normal text-slate-500">
                    {asText(item.unit)}
                  </span>
                </p>
                <p className="mt-1 truncate text-[11px] text-slate-400">
                  {formatDateTime(item.time)}
                </p>
              </div>
            ))}
          </div>
        </ReportSection>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        {assessments.length > 0 && (
          <ReportSection
            icon={<ClipboardList className="h-4 w-4" />}
            title={`健康评估（${document.assessmentCount ?? assessments.length}）`}
          >
            <div className="space-y-2">
              {assessments.slice(0, 6).map((item, index) => {
                const type = asNumber(item.assessType);
                return (
                  <div
                    key={`${asText(item.id)}-${index}`}
                    className="flex min-w-0 items-start justify-between gap-3 rounded-lg bg-slate-50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-slate-800">
                        {type
                          ? assessmentTypeLabels[type] || `评估类型 ${type}`
                          : "健康评估"}
                      </p>
                      <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-slate-500">
                        {asText(item.result) ||
                          asText(item.suggestion) ||
                          "暂无结果说明"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-semibold text-medical-700">
                        {asText(item.score) || "-"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {asText(item.level)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ReportSection>
        )}

        {medicalHistories.length > 0 && (
          <ReportSection
            icon={<History className="h-4 w-4" />}
            title="病史记录"
          >
            <div className="space-y-2">
              {medicalHistories.slice(0, 6).map((item, index) => (
                <div
                  key={`${asText(item.id)}-${index}`}
                  className="min-w-0 rounded-lg bg-slate-50 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill className="h-4 w-4 text-sky-500" />
                    <p className="break-words text-sm font-medium text-slate-800">
                      {asText(item.diseaseName) ||
                        asText(item.diagnosis) ||
                        "病史记录"}
                    </p>
                  </div>
                  <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                    {asText(item.description) ||
                      asText(item.treatment) ||
                      asText(item.remark) ||
                      "暂无补充说明"}
                  </p>
                </div>
              ))}
            </div>
          </ReportSection>
        )}
      </div>

      {recentWarnings.length > 0 && (
        <ReportSection
          icon={<ShieldAlert className="h-4 w-4" />}
          title="最近健康预警"
        >
          <div className="space-y-2">
            {recentWarnings.map((item, index) => (
              <div
                key={`${asText(item.id)}-${index}`}
                className="flex min-w-0 items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/70 p-3"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium text-amber-900">
                    {asText(item.warningTitle) ||
                      asText(item.title) ||
                      "健康预警"}
                  </p>
                  <p className="mt-1 break-words text-xs leading-5 text-amber-700">
                    {asText(item.warningContent) ||
                      asText(item.content) ||
                      "请及时查看并处理。"}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-amber-600">
                  {formatDateTime(item.createTime)}
                </span>
              </div>
            ))}
          </div>
        </ReportSection>
      )}

      {aiReports.length > 0 && (
        <ReportSection
          icon={<Sparkles className="h-4 w-4" />}
          title={`AI 健康报告（${document.aiReportCount ?? aiReports.length}）`}
        >
          <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
            {aiReports.map((item, index) => {
              const summary = getAiReportSummary(
                item as unknown as AiHealthReport,
              );
              return (
                <article
                  data-testid="ai-report-summary-card"
                  key={`${asText(item.id)}-${index}`}
                  className="min-w-0 rounded-lg border border-sky-100 bg-sky-50/55 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={cn("border", riskTone(summary.riskLevel))}
                    >
                      {riskLevelText(summary.riskLevel)} ·{" "}
                      {summary.riskScore ?? "-"} 分
                    </Badge>
                    <span className="text-[11px] text-slate-400">
                      {formatDateTime(item.createTime)}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-slate-700">
                    {summary.summary || summary.error || "暂无结构化摘要"}
                  </p>
                </article>
              );
            })}
          </div>
        </ReportSection>
      )}

      {assessments.length === 0 &&
        medicalHistories.length === 0 &&
        recentVitals.length === 0 &&
        recentWarnings.length === 0 &&
        aiReports.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white/70 p-6 text-center">
            <Activity className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-700">
              基础档案已建立
            </p>
            <p className="mt-1 text-xs text-slate-500">
              评估、体征、预警和 AI 报告尚未形成，后续记录会自动汇总到这里。
            </p>
          </div>
        )}

      <TechnicalData value={parsed.prettyJson || parsed.rawText} />
    </div>
  );
}
