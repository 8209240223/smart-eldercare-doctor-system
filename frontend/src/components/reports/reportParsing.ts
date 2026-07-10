import type { AiHealthReport, AiHealthReportDocument } from "@/hooks/useApi";

export interface ParsedReport<T> {
  document?: T;
  rawText?: string;
  prettyJson?: string;
  error?: string;
  warning?: string;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function serializeForTechnicalView(value: unknown) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value ?? "");
  }
}

export function parseNestedReport<T extends Record<string, unknown>>(
  source: unknown,
): ParsedReport<T> {
  if (source === null || source === undefined || source === "") {
    return { error: "报告内容为空，暂时没有可展示的数据。" };
  }

  const originalText = serializeForTechnicalView(source);
  let current: unknown = source;

  for (let depth = 0; depth < 4; depth += 1) {
    if (isRecord(current)) {
      return {
        document: current as T,
        rawText: originalText,
        prettyJson: JSON.stringify(current, null, 2),
      };
    }

    if (typeof current !== "string") {
      return {
        rawText: originalText,
        error: "报告数据不是可识别的结构化对象。",
      };
    }

    const trimmed = current.trim();
    if (!trimmed) {
      return { rawText: originalText, error: "报告内容为空。" };
    }

    try {
      current = JSON.parse(trimmed) as unknown;
    } catch {
      return {
        rawText: originalText,
        error: "报告内容不是合法 JSON，已保留原始文本供技术排查。",
      };
    }
  }

  return {
    rawText: originalText,
    error: "报告被重复编码过多次，无法可靠解析。",
  };
}

export function parseAiHealthReport(
  report: AiHealthReport | AiHealthReportDocument | unknown,
): ParsedReport<AiHealthReportDocument> {
  if (!isRecord(report))
    return parseNestedReport<AiHealthReportDocument>(report);

  const hasEnvelope = "reportJson" in report || "editedReportJson" in report;
  if (!hasEnvelope) return parseNestedReport<AiHealthReportDocument>(report);

  const edited = report.editedReportJson;
  if (edited !== null && edited !== undefined && edited !== "") {
    const parsedEdited = parseNestedReport<AiHealthReportDocument>(edited);
    if (parsedEdited.document) return parsedEdited;

    const parsedOriginal = parseNestedReport<AiHealthReportDocument>(
      report.reportJson,
    );
    if (parsedOriginal.document) {
      return {
        ...parsedOriginal,
        warning: "医生编辑版本无法解析，当前展示原始生成版本。",
      };
    }
    return parsedEdited;
  }

  return parseNestedReport<AiHealthReportDocument>(report.reportJson);
}

export function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function asTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === "string") return [item.trim()];
        if (isRecord(item)) {
          const text =
            asText(item.content) ||
            asText(item.advice) ||
            asText(item.finding) ||
            asText(item.name) ||
            asText(item.type);
          return text ? [text] : [];
        }
        return [];
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n|；/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function formatDateTime(value: unknown) {
  const text = asText(value);
  if (!text) return "-";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text.replace("T", " ");
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function riskLevelText(level: unknown) {
  const normalized = asText(level).toUpperCase();
  const labels: Record<string, string> = {
    LOW: "低风险",
    MEDIUM: "中风险",
    HIGH: "高风险",
    CRITICAL: "危急风险",
    "1": "低风险",
    "2": "中风险",
    "3": "高风险",
    "4": "危急风险",
  };
  return labels[normalized] || asText(level) || "未分级";
}

export function riskTone(level: unknown) {
  const normalized = asText(level).toUpperCase();
  if (normalized === "CRITICAL" || normalized === "4") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (normalized === "HIGH" || normalized === "3") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  if (normalized === "MEDIUM" || normalized === "2") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function getAiReportSummary(report: AiHealthReport) {
  const parsed = parseAiHealthReport(report);
  return {
    ...parsed,
    summary: asText(parsed.document?.reportText),
    riskScore:
      asNumber(parsed.document?.riskScore) ?? asNumber(report.riskScore),
    riskLevel: parsed.document?.riskLevel ?? report.riskLevel,
  };
}
