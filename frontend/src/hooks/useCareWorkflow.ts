import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, post, type ApiResponse } from "@/lib/api";

export type WorkflowStageStatus =
  "completed" | "pending" | "in_progress" | "missing" | string;

export interface WorkflowStage {
  id?: number;
  ids?: number[];
  count?: number;
  status?: WorkflowStageStatus | number;
  statusText?: string;
  completed?: boolean;
  exists?: boolean;
  name?: string;
  title?: string;
  message?: string;
  created?: boolean;
  reused?: boolean;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface WorkflowElder {
  id: number;
  name?: string;
  idCard?: string;
  phone?: string;
  community?: string;
  doctorId?: number;
  accountStatus?: number;
  health?: WorkflowStage;
  healthRecord?: WorkflowStage;
  [key: string]: unknown;
}

export interface CareWorkflowSummary {
  elder: WorkflowElder;
  health?: WorkflowStage;
  risk?: WorkflowStage;
  plan?: WorkflowStage;
  task?: WorkflowStage;
  report?: WorkflowStage;
  nursing?: WorkflowStage;
  care?: WorkflowStage;
  links?: Record<string, string>;
  created?: string[] | Record<string, unknown>;
  reused?: string[] | Record<string, unknown>;
  message?: string;
  healthRecordPresent?: boolean;
  examCount?: number;
  nursingPlanCount?: number;
  nursingRecordCount?: number;
  [key: string]: unknown;
}

const WORKFLOW_STEP_KEYS = ["risk", "plan", "task", "report"] as const;

function normalizeStage(stage: WorkflowStage | undefined) {
  if (!stage) return undefined;
  const data = stage.data && typeof stage.data === "object" ? stage.data : {};
  const id = Number(data.id ?? stage.id ?? 0) || undefined;
  return {
    ...data,
    ...stage,
    id,
    count: stage.count ?? (id ? 1 : 0),
    exists: stage.exists ?? Boolean(id),
    completed: stage.completed ?? Boolean(id),
    data,
  } satisfies WorkflowStage;
}

export function normalizeCareWorkflow(
  source: CareWorkflowSummary,
): CareWorkflowSummary {
  const created: string[] = [];
  const reused: string[] = [];
  const normalized = { ...source };

  for (const key of WORKFLOW_STEP_KEYS) {
    const stage = normalizeStage(source[key]);
    normalized[key] = stage;
    if (stage?.created) created.push(key);
    if (stage?.reused) reused.push(key);
  }

  const healthCount =
    (source.healthRecordPresent ? 1 : 0) + Number(source.examCount || 0);
  normalized.health = {
    status: healthCount > 0 ? "completed" : "missing",
    count: healthCount,
    exists: Boolean(source.healthRecordPresent),
    completed: healthCount > 0,
    statusText: source.healthRecordPresent
      ? `健康档案已建立，体检 ${Number(source.examCount || 0)} 条`
      : Number(source.examCount || 0) > 0
        ? `已有体检 ${Number(source.examCount || 0)} 条，健康档案待补充`
        : "健康档案和体检资料待补充",
  };

  const nursingCount =
    Number(source.nursingPlanCount || 0) +
    Number(source.nursingRecordCount || 0);
  normalized.nursing = {
    status: nursingCount > 0 ? "completed" : "missing",
    count: nursingCount,
    exists: nursingCount > 0,
    completed: nursingCount > 0,
    statusText:
      nursingCount > 0
        ? `护理计划 ${Number(source.nursingPlanCount || 0)} 条，护理记录 ${Number(source.nursingRecordCount || 0)} 条`
        : "护理计划和护理记录待建立",
  };
  normalized.created = created;
  normalized.reused = reused;
  return normalized;
}

export interface ElderWorkflowTask {
  id?: number;
  elderId?: number;
  elderName?: string;
  name?: string;
  status?: number;
  priority?: number;
  taskReason?: string;
  dueDate?: string;
  [key: string]: unknown;
}

interface WorkflowTaskPage {
  records: ElderWorkflowTask[];
  total: number;
  pages: number;
  current?: number;
  size?: number;
}

function unwrap<T>(response: ApiResponse<T>) {
  if (response.code !== 200 && response.code !== 0) {
    throw new Error(response.message || response.msg || "请求失败");
  }
  return response.data;
}

export function useCareWorkflowSummary(elderId?: number) {
  return useQuery<CareWorkflowSummary>({
    queryKey: ["care-workflow", String(elderId || "")],
    queryFn: async () =>
      normalizeCareWorkflow(
        unwrap(
          await api<ApiResponse<CareWorkflowSummary>>(
            `/api/care-workflows/elders/${elderId}/summary`,
          ),
        ),
      ),
    enabled: Boolean(elderId),
  });
}

export function useGenerateCareWorkflow() {
  const queryClient = useQueryClient();
  return useMutation<CareWorkflowSummary, Error, number>({
    mutationFn: async (elderId) =>
      normalizeCareWorkflow(
        unwrap(
          await post<ApiResponse<CareWorkflowSummary>>(
            `/api/care-workflows/elders/${elderId}/generate`,
          ),
        ),
      ),
    onSuccess: (data, elderId) => {
      queryClient.setQueryData(["care-workflow", String(elderId)], data);
      queryClient.invalidateQueries({ queryKey: ["risk"] });
      queryClient.invalidateQueries({ queryKey: ["followup"] });
      queryClient.invalidateQueries({ queryKey: ["ai", "reports"] });
      queryClient.invalidateQueries({ queryKey: ["nurse"] });
    },
  });
}

export function useElderWorkflowTasks(elderId?: number, status?: number) {
  const query = new URLSearchParams({ pageNum: "1", pageSize: "500" });
  if (elderId) query.set("elderId", String(elderId));
  if (status !== undefined) query.set("status", String(status));
  return useQuery<WorkflowTaskPage>({
    queryKey: [
      "care-workflow",
      "tasks",
      String(elderId || ""),
      String(status ?? "all"),
    ],
    queryFn: async () =>
      unwrap(
        await api<ApiResponse<WorkflowTaskPage>>(
          `/api/followup/tasks?${query.toString()}`,
        ),
      ),
    enabled: Boolean(elderId),
  });
}

export function workflowLink(
  summary: CareWorkflowSummary | undefined,
  key: string,
  fallback: string,
  elderId: number,
) {
  const configured = summary?.links?.[key];
  if (configured) return configured;
  const separator = fallback.includes("?") ? "&" : "?";
  return `${fallback}${separator}elderId=${elderId}`;
}
