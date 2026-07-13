import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api, apiClient, post, put, del, type ApiResponse } from "@/lib/api";

export function unwrap<T>(res: ApiResponse<T>): T {
  if (res.code !== 200 && res.code !== 0) {
    throw new Error(res.msg || res.message || "请求失败");
  }
  return res.data;
}

export function useApiQuery<T>(key: string[], url: string, enabled = true) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const res = await api<ApiResponse<T>>(url);
      return unwrap(res);
    },
    enabled,
  });
}

export function useApiMutation<T, V = unknown>(
  url: string | ((variables: V) => string),
  method: "POST" | "PUT" | "DELETE" = "POST",
  invalidateKeys?: string[][],
) {
  const queryClient = useQueryClient();
  return useMutation<T, Error, V>({
    mutationFn: async (variables) => {
      const finalUrl = typeof url === "string" ? url : url(variables);
      let res: ApiResponse<T>;
      if (method === "POST") res = await post(finalUrl, variables);
      else if (method === "PUT") res = await put(finalUrl, variables);
      else res = await del(finalUrl);
      return unwrap(res);
    },
    onSuccess: () => {
      if (invalidateKeys) {
        invalidateKeys.forEach((key) =>
          queryClient.invalidateQueries({ queryKey: key }),
        );
      }
    },
  });
}

// ============ 通用分页类型 ============
export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// ============ Dashboard ============
export interface DashboardStats {
  elderCount?: number;
  maleCount?: number;
  femaleCount?: number;
  warningCount?: number;
  warningPending?: number;
  warningYellow?: number;
  warningOrange?: number;
  warningRed?: number;
  followupCount?: number;
  activePlans?: number;
  totalRecords?: number;
  dueTodayCount?: number;
  overdueCount?: number;
  completionRate?: number;
}

export function useDashboardStats() {
  const results = useQueries({
    queries: [
      {
        queryKey: ["elders", "stats"],
        queryFn: async () =>
          unwrap(
            await api<
              ApiResponse<{ total: number; male: number; female: number }>
            >("/api/elders/stats"),
          ),
      },
      {
        queryKey: ["warnings", "stats"],
        queryFn: async () =>
          unwrap(
            await api<
              ApiResponse<{
                total: number;
                todayCount: number;
                pending: number;
                yellow: number;
                orange: number;
                red: number;
              }>
            >("/api/warnings/stats"),
          ),
      },
      {
        queryKey: ["followup", "stats"],
        queryFn: async () =>
          unwrap(
            await api<
              ApiResponse<{
                totalPlans: number;
                activePlans: number;
                totalRecords: number;
                dueTodayCount: number;
                overdueCount: number;
                completionRate: number;
              }>
            >("/api/followup/stats"),
          ),
      },
    ],
  });
  const [elderRes, warningRes, followupRes] = results;
  const isLoading =
    elderRes.isLoading || warningRes.isLoading || followupRes.isLoading;
  const data: DashboardStats | undefined = isLoading
    ? undefined
    : {
        elderCount: elderRes.data?.total ?? 0,
        maleCount: elderRes.data?.male ?? 0,
        femaleCount: elderRes.data?.female ?? 0,
        warningCount:
          warningRes.data?.todayCount ?? warningRes.data?.total ?? 0,
        warningPending: warningRes.data?.pending ?? 0,
        warningYellow: warningRes.data?.yellow ?? 0,
        warningOrange: warningRes.data?.orange ?? 0,
        warningRed: warningRes.data?.red ?? 0,
        followupCount: followupRes.data?.totalPlans ?? 0,
        activePlans: followupRes.data?.activePlans ?? 0,
        totalRecords: followupRes.data?.totalRecords ?? 0,
        dueTodayCount: followupRes.data?.dueTodayCount ?? 0,
        overdueCount: followupRes.data?.overdueCount ?? 0,
        completionRate: followupRes.data?.completionRate ?? 0,
      };
  return { data, isLoading };
}

export interface TodoItemData {
  id: string;
  name: string;
  elderId: string;
  status: string;
  date: string;
}

export interface DashboardTodoSummary {
  pendingWarnings?: number;
  todayFollowups?: number;
  todayRecords?: number;
  pendingNurseRecords?: number;
  pendingNursePlans?: number;
  overdueFollowups?: number;
  totalTodo?: number;
  [key: string]: unknown;
}

export function useDashboardTodo() {
  return useApiQuery<DashboardTodoSummary | TodoItemData[]>(
    ["dashboard", "todo"],
    "/api/dashboard/todo",
  );
}

export function useDashboardReviewCounts() {
  return useApiQuery<Record<string, number>>(
    ["dashboard", "review-counts"],
    "/api/dashboard/review-counts",
  );
}

export function useDashboardChronicOverview() {
  return useApiQuery<Record<string, number>>(
    ["dashboard", "chronic-overview"],
    "/api/dashboard/chronic-overview",
  );
}

// ============ Elders ============
export interface ElderInfo {
  id?: number;
  name: string;
  gender: number;
  birthDate?: string;
  idCard: string;
  phone: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  nation?: string;
  maritalStatus?: number;
  education?: number;
  address?: string;
  community?: string;
  medicalInsuranceType?: number;
  doctorId?: number;
  accountStatus?: number;
  createTime?: string;
  updateTime?: string;
}

export function useElders(
  page = 1,
  pageSize = 10,
  name = "",
  community = "",
  doctorId?: number,
  diseaseType?: number,
  elderId?: number,
) {
  const query = new URLSearchParams({
    pageNum: String(page),
    pageSize: String(pageSize),
  });
  if (name) query.set("name", name);
  if (elderId !== undefined) query.set("elderId", String(elderId));
  if (community) query.set("community", community);
  if (doctorId !== undefined) query.set("doctorId", String(doctorId));
  if (diseaseType !== undefined) query.set("diseaseType", String(diseaseType));
  return useApiQuery<PageResult<ElderInfo>>(
    [
      "elders",
      String(page),
      String(pageSize),
      name,
      community,
      doctorId === undefined ? "all" : String(doctorId),
      diseaseType === undefined ? "all" : String(diseaseType),
      elderId === undefined ? "all" : String(elderId),
    ],
    `/api/elders?${query.toString()}`,
  );
}

export function useElderDetail(id?: number) {
  return useApiQuery<ElderInfo>(
    ["elder", String(id)],
    `/api/elders/${id}`,
    !!id,
  );
}

export function useCreateElder() {
  return useApiMutation<number, ElderInfo>("/api/elders", "POST", [["elders"]]);
}

export function useUpdateElder() {
  return useApiMutation<void, ElderInfo>(
    (elder) => `/api/elders/${elder.id}`,
    "PUT",
    [["elders"]],
  );
}

export function useDeleteElder() {
  return useApiMutation<void, number>((id) => `/api/elders/${id}`, "DELETE", [
    ["elders"],
  ]);
}

export interface HealthRecordInfo {
  id?: number;
  elderId?: number;
  recordNo?: string;
  height?: number;
  weight?: number;
  bloodType?: string;
  medicalHistory?: string;
  familyHistory?: string;
  allergyHistory?: string;
  currentMedication?: string;
  smokingStatus?: number;
  drinkingStatus?: number;
  exerciseFrequency?: number;
  disabilityStatus?: string;
  livingAbility?: number;
  surgeryHistory?: string;
  createDoctorId?: number;
  [key: string]: unknown;
}

export function useElderHealthRecord(elderId?: number) {
  return useApiQuery<HealthRecordInfo>(
    ["elders", "record", String(elderId)],
    `/api/elders/${elderId}/record`,
    !!elderId,
  );
}

export function useSaveElderHealthRecord() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { elderId: number; record: HealthRecordInfo }
  >({
    mutationFn: async ({ elderId, record }) => {
      const res = await post<ApiResponse<void>>(
        `/api/elders/${elderId}/record`,
        record,
      );
      return unwrap(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["elders"] });
      queryClient.invalidateQueries({ queryKey: ["health-detail"] });
    },
  });
}

export function useHealthDetail(elderId?: number) {
  return useApiQuery<Record<string, unknown[]>>(
    ["health-detail", String(elderId)],
    `/api/health-detail/${elderId}`,
    !!elderId,
  );
}

export function useAddHealthDetailRecord(
  kind: "medical-history" | "medication" | "allergy" | "family-history",
) {
  return useApiMutation<number, Record<string, unknown>>(
    `/api/health-detail/${kind}`,
    "POST",
    [["health-detail"]],
  );
}

export function useUpdateMedicationRecord() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { id: number; record: Record<string, unknown> }
  >({
    mutationFn: async ({ id, record }) =>
      unwrap(
        await put<ApiResponse<void>>(
          `/api/health-detail/medication/${id}`,
          record,
        ),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-detail"] });
    },
  });
}

export function useDeleteHealthDetailRecord(
  kind: "medical-history" | "medication" | "allergy" | "family-history",
) {
  return useApiMutation<void, number>(
    (id) => `/api/health-detail/${kind}/${id}`,
    "DELETE",
    [["health-detail"]],
  );
}

export interface ElderStats {
  total: number;
  trend?: number;
}

export function useElderStats() {
  return useApiQuery<ElderStats>(["elders", "stats"], "/api/elders/stats");
}

// ============ Warnings ============
export interface HealthWarning {
  id: number;
  elderId: number;
  elderName?: string;
  warningLevel: number;
  warningType?: number;
  warningTitle?: string;
  warningContent?: string;
  warningValue?: string;
  thresholdValue?: string;
  content?: string;
  status: number;
  handleResult?: string;
  doctorId?: number;
  read?: boolean;
  createTime: string;
}

export function useWarnings(
  page = 1,
  pageSize = 10,
  status?: number,
  warningLevel?: number,
  elderId?: number,
) {
  const query = new URLSearchParams({
    pageNum: String(page),
    pageSize: String(pageSize),
  });
  if (status !== undefined) query.set("status", String(status));
  if (warningLevel !== undefined)
    query.set("warningLevel", String(warningLevel));
  if (elderId !== undefined) query.set("elderId", String(elderId));
  return useApiQuery<PageResult<HealthWarning>>(
    [
      "warnings",
      String(page),
      String(pageSize),
      status === undefined ? "all" : String(status),
      warningLevel === undefined ? "all" : String(warningLevel),
      elderId === undefined ? "all" : String(elderId),
    ],
    `/api/warnings?${query.toString()}`,
  );
}

export interface WarningStats {
  total: number;
  todayCount: number;
  pending: number;
  processing: number;
  handled: number;
  ignored: number;
  red: number;
  orange: number;
  yellow: number;
}

export interface WarningRealtimeStats {
  redPending?: number;
  orangePending?: number;
  yellowPending?: number;
  totalPending?: number;
  hourlyTrend?: Array<{ hour?: string; count?: number }>;
  recentWarnings?: HealthWarning[];
  onlineDoctors?: number;
}

export function useWarningStats() {
  return useApiQuery<WarningStats>(
    ["warnings", "stats"],
    "/api/warnings/stats",
  );
}

export function useWarningRealtimeStats() {
  return useApiQuery<WarningRealtimeStats>(
    ["warnings", "stats", "realtime"],
    "/api/warnings/stats/realtime",
  );
}

export function useWarningDetail(id?: number) {
  return useApiQuery<HealthWarning>(
    ["warning", String(id)],
    `/api/warnings/${id}`,
    !!id,
  );
}

export function useWarningLogs(id?: number) {
  return useApiQuery<Record<string, unknown>[]>(
    ["warning", String(id), "logs"],
    `/api/warnings/${id}/logs`,
    !!id,
  );
}

export function useHandleWarning() {
  return useApiMutation<
    void,
    { id: number; handleResult: string; doctorId?: number }
  >((vars) => `/api/warnings/${vars.id}/handle`, "PUT", [["warnings"]]);
}

export function useIgnoreWarning() {
  return useApiMutation<void, { id: number; handleResult?: string }>(
    (vars) => `/api/warnings/${vars.id}/ignore`,
    "PUT",
    [["warnings"]],
  );
}

export function useCreateWarning() {
  return useApiMutation<HealthWarning, Partial<HealthWarning>>(
    "/api/warnings",
    "POST",
    [["warnings"]],
  );
}

export function useMarkWarningProcessing() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: number; doctorId?: number }>({
    mutationFn: async ({ id, doctorId }) =>
      unwrap(
        await put<ApiResponse<void>>(`/api/warnings/${id}/processing`, {
          doctorId,
        }),
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["warnings"] });
      queryClient.invalidateQueries({
        queryKey: ["warning", String(variables.id)],
      });
    },
  });
}

export function useMarkWarningRead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: number; doctorId?: number }>({
    mutationFn: async ({ id, doctorId }) =>
      unwrap(
        await put<ApiResponse<void>>(`/api/warnings/${id}/read`, { doctorId }),
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["warnings"] });
      queryClient.invalidateQueries({
        queryKey: ["warning", String(variables.id)],
      });
    },
  });
}

// ============ Followup ============
export interface FollowupPlan {
  id?: number;
  elderId: number;
  doctorId?: number;
  elderName?: string;
  planName: string;
  diseaseType: number;
  frequencyType: number;
  startDate: string;
  endDate?: string;
  nextFollowDate?: string;
  totalCount: number;
  completedCount?: number;
  status?: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export interface FollowupRecord {
  id?: number;
  planId?: number;
  elderId: number;
  doctorId?: number;
  elderName?: string;
  followDate?: string;
  followType?: number;
  diseaseType?: number;
  symptomDesc?: string;
  systolicPressure?: number;
  diastolicPressure?: number;
  heartRate?: number;
  bloodSugarFasting?: number;
  weight?: number;
  medicationCompliance?: number;
  currentMedication?: string;
  followResult?: string;
  nextFollowDate?: string;
  isOverdue?: number;
  remark?: string;
  status?: number;
  createTime?: string;
}

export function useFollowupPlans(
  page = 1,
  pageSize = 10,
  status?: number,
  diseaseType?: number,
  elderId?: number,
) {
  const query = new URLSearchParams({
    pageNum: String(page),
    pageSize: String(pageSize),
  });
  if (status !== undefined) query.set("status", String(status));
  if (diseaseType !== undefined) query.set("diseaseType", String(diseaseType));
  if (elderId !== undefined) query.set("elderId", String(elderId));
  return useApiQuery<PageResult<FollowupPlan>>(
    [
      "followup",
      "plans",
      String(page),
      String(pageSize),
      status === undefined ? "all" : String(status),
      diseaseType === undefined ? "all" : String(diseaseType),
      elderId === undefined ? "all" : String(elderId),
    ],
    `/api/followup/plans?${query.toString()}`,
  );
}

export function useFollowupRecords(
  page = 1,
  pageSize = 10,
  planId?: number,
  elderId?: number,
) {
  const query = new URLSearchParams({
    pageNum: String(page),
    pageSize: String(pageSize),
  });
  if (planId !== undefined) query.set("planId", String(planId));
  if (elderId !== undefined) query.set("elderId", String(elderId));
  return useApiQuery<PageResult<FollowupRecord>>(
    [
      "followup",
      "records",
      String(page),
      String(pageSize),
      planId === undefined ? "all" : String(planId),
      elderId === undefined ? "all" : String(elderId),
    ],
    `/api/followup/records?${query.toString()}`,
  );
}

export function useFollowupRecordDetail(id?: number) {
  return useApiQuery<FollowupRecord>(
    ["followup", "record", String(id)],
    `/api/followup/records/${id}`,
    !!id,
  );
}

export function useCreateFollowupPlan() {
  return useApiMutation<FollowupPlan, FollowupPlan>(
    "/api/followup/plans",
    "POST",
    [["followup", "plans"]],
  );
}

export function useUpdateFollowupPlan() {
  return useApiMutation<void, FollowupPlan>(
    (plan) => `/api/followup/plans/${plan.id}`,
    "PUT",
    [["followup", "plans"]],
  );
}

export function useDeleteFollowupPlan() {
  return useApiMutation<void, number>(
    (id) => `/api/followup/plans/${id}`,
    "DELETE",
    [["followup", "plans"]],
  );
}

export function useDeleteGeneratedFollowupPlans() {
  return useApiMutation<number, void>(
    "/api/followup/plans/generated",
    "DELETE",
    [["followup", "plans"]],
  );
}

export function useChangeFollowupPlanStatus() {
  return useApiMutation<void, { id: number; status: number }>(
    (vars) => `/api/followup/plans/${vars.id}/status?status=${vars.status}`,
    "PUT",
    [["followup", "plans"]],
  );
}

export interface RiskPlanGenerationResult {
  createdCount?: number;
  createdPlans?: Array<{
    id?: number;
    elderId?: number;
    elderName?: string;
    planName?: string;
    nextFollowDate?: string;
  }>;
  reusedCount?: number;
  reusedPlans?: Array<{
    id?: number;
    elderId?: number;
    elderName?: string;
    planName?: string;
    nextFollowDate?: string;
  }>;
  skippedReasons?: string[];
  message?: string;
}

export function useGenerateRiskPlans() {
  return useApiMutation<
    RiskPlanGenerationResult,
    { doctorId?: number; elderId?: number }
  >(
    (vars) => {
      const query = new URLSearchParams();
      if (vars.doctorId !== undefined)
        query.set("doctorId", String(vars.doctorId));
      if (vars.elderId !== undefined)
        query.set("elderId", String(vars.elderId));
      return `/api/followup/plans/generate-risk${query.toString() ? `?${query.toString()}` : ""}`;
    },
    "POST",
    [["followup", "plans"]],
  );
}

export function useCreateFollowupRecord() {
  return useApiMutation<FollowupRecord, FollowupRecord>(
    "/api/followup/records",
    "POST",
    [["followup", "records"]],
  );
}

export interface FollowupStats {
  totalPlans: number;
  totalRecords: number;
  activePlans: number;
  completionRate: number;
  dueTodayCount: number;
  overdueCount: number;
}

export function useFollowupStats() {
  return useApiQuery<FollowupStats>(
    ["followup", "stats"],
    "/api/followup/stats",
  );
}

// ============ Interventions ============
export interface Intervention {
  id?: number;
  followRecordId?: number;
  elderId: number;
  doctorId?: number;
  elderName?: string;
  interventionType: number;
  interventionTitle: string;
  interventionContent: string;
  medicationAdjust?: string;
  lifestyleGuidance?: string;
  healthEducation?: string;
  effectEvaluation?: number;
  effectDesc?: string;
  nextPlan?: string;
  interventionDate?: string;
  status?: number;
  createTime?: string;
}

export function useInterventions(
  page = 1,
  pageSize = 10,
  elderId?: number,
  type?: number,
  followRecordId?: number,
) {
  const query = new URLSearchParams({
    pageNum: String(page),
    pageSize: String(pageSize),
  });
  if (elderId !== undefined) query.set("elderId", String(elderId));
  if (type !== undefined) query.set("type", String(type));
  if (followRecordId !== undefined)
    query.set("followRecordId", String(followRecordId));
  return useApiQuery<PageResult<Intervention>>(
    [
      "interventions",
      String(page),
      String(pageSize),
      elderId === undefined ? "all" : String(elderId),
      type === undefined ? "all" : String(type),
      followRecordId === undefined ? "all" : String(followRecordId),
    ],
    `/api/intervention/list?${query.toString()}`,
  );
}

export function useInterventionDetail(id?: number) {
  return useApiQuery<Intervention>(
    ["intervention", String(id)],
    `/api/intervention/${id}`,
    !!id,
  );
}

export function useCreateIntervention() {
  return useApiMutation<Intervention, Intervention>(
    "/api/intervention",
    "POST",
    [["interventions"]],
  );
}

export function useUpdateIntervention() {
  return useApiMutation<void, Intervention>(
    (item) => `/api/intervention/${item.id}`,
    "PUT",
    [["interventions"]],
  );
}

export function useDeleteIntervention() {
  return useApiMutation<void, number>(
    (id) => `/api/intervention/${id}`,
    "DELETE",
    [["interventions"]],
  );
}

export interface InterventionStats {
  total?: number;
  medication?: number;
  nonMedication?: number;
  referral?: number;
  education?: number;
  evaluated?: number;
}

export function useInterventionStats() {
  return useApiQuery<InterventionStats>(
    ["interventions", "stats"],
    "/api/intervention/stats",
  );
}

// ============ Assessments ============
export interface Assessment {
  id?: number;
  elderId: number;
  doctorId?: number;
  elderName?: string;
  assessType?: number;
  assessDate?: string;
  score: number;
  level?: string;
  result?: string;
  suggestion?: string;
  createTime?: string;
}

export function useAssessments(
  page = 1,
  pageSize = 10,
  elderId?: number,
  assessType?: number,
) {
  const query = new URLSearchParams({
    pageNum: String(page),
    pageSize: String(pageSize),
  });
  if (elderId !== undefined) query.set("elderId", String(elderId));
  if (assessType !== undefined) query.set("assessType", String(assessType));
  return useApiQuery<PageResult<Assessment>>(
    [
      "assessments",
      String(page),
      String(pageSize),
      elderId === undefined ? "all" : String(elderId),
      assessType === undefined ? "all" : String(assessType),
    ],
    `/api/assessments?${query.toString()}`,
  );
}

export function useAssessmentDetail(id?: number) {
  return useApiQuery<Assessment>(
    ["assessment", String(id)],
    `/api/assessments/${id}`,
    !!id,
  );
}

export function useCreateAssessment() {
  return useApiMutation<Assessment, Assessment>("/api/assessments", "POST", [
    ["assessments"],
  ]);
}

export function useUpdateAssessment() {
  return useApiMutation<void, Assessment>(
    (item) => `/api/assessments/${item.id}`,
    "PUT",
    [["assessments"]],
  );
}

export function useDeleteAssessment() {
  return useApiMutation<void, number>(
    (id) => `/api/assessments/${id}`,
    "DELETE",
    [["assessments"]],
  );
}

export function useAssessmentStats(elderId?: number) {
  return useApiQuery<Record<string, number>>(
    ["assessments", "stats", String(elderId || "all")],
    `/api/assessments/stats${elderId ? `?elderId=${elderId}` : ""}`,
  );
}

export function useAssessmentReport(elderId: number) {
  return useApiQuery<ComprehensiveHealthReport>(
    ["assessments", "report", String(elderId)],
    `/api/assessments/report/${elderId}`,
    !!elderId,
  );
}

export interface ComprehensiveHealthReport {
  basicInfo?: Record<string, unknown>;
  healthRecord?: Record<string, unknown>;
  assessments?: Array<Record<string, unknown>>;
  assessmentCount?: number;
  overallScore?: number;
  overallLevel?: string;
  medicalHistories?: Array<Record<string, unknown>>;
  medications?: Array<Record<string, unknown>>;
  allergies?: Array<Record<string, unknown>>;
  familyHistories?: Array<Record<string, unknown>>;
  recentVitals?: Array<Record<string, unknown>>;
  recentWarnings?: Array<Record<string, unknown>>;
  aiReports?: AiHealthReport[];
  aiReportCount?: number;
  latestAiReport?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

// ============ Referrals ============
export interface Referral {
  id?: number;
  referralNo?: string;
  elderId: number;
  elderName?: string;
  referralType: number;
  fromOrg?: string;
  fromDoctorId?: number;
  fromDoctorName?: string;
  toOrg?: string;
  toDoctorId?: number;
  toDoctorName?: string;
  toDept?: string;
  diagnosis?: string;
  referralReason: string;
  urgencyLevel?: number;
  bedReserved?: number;
  status?: number;
  acceptTime?: string;
  completeTime?: string;
  dischargeSummary?: string;
  rejectReason?: string;
  cancelReason?: string;
  remark?: string;
  createTime?: string;
}

export function useReferrals(
  page = 1,
  pageSize = 10,
  status?: number,
  referralType?: number,
  doctorId?: number,
) {
  const query = new URLSearchParams({
    pageNum: String(page),
    pageSize: String(pageSize),
  });
  if (status !== undefined) query.set("status", String(status));
  if (referralType !== undefined)
    query.set("referralType", String(referralType));
  if (doctorId !== undefined) query.set("doctorId", String(doctorId));
  return useApiQuery<PageResult<Referral>>(
    [
      "referrals",
      String(page),
      String(pageSize),
      status === undefined ? "all" : String(status),
      referralType === undefined ? "all" : String(referralType),
      doctorId === undefined ? "all" : String(doctorId),
    ],
    `/api/referrals?${query.toString()}`,
  );
}

export function useReferralDetail(id?: number) {
  return useApiQuery<Referral>(
    ["referral", String(id)],
    `/api/referrals/${id}`,
    !!id,
  );
}

export function useCreateReferral() {
  return useApiMutation<Referral, Referral>("/api/referrals", "POST", [
    ["referrals"],
  ]);
}

export function useAcceptReferral() {
  return useApiMutation<void, number>(
    (id) => `/api/referrals/${id}/accept`,
    "PUT",
    [["referrals"]],
  );
}

export function useCompleteReferral() {
  return useApiMutation<void, { id: number; dischargeSummary: string }>(
    (vars) => `/api/referrals/${vars.id}/complete`,
    "PUT",
    [["referrals"]],
  );
}

export function useRejectReferral() {
  return useApiMutation<void, { id: number; reason: string }>(
    (vars) => `/api/referrals/${vars.id}/reject`,
    "PUT",
    [["referrals"]],
  );
}

export function useCancelReferral() {
  return useApiMutation<void, { id: number; reason?: string }>(
    (vars) => `/api/referrals/${vars.id}/cancel`,
    "PUT",
    [["referrals"]],
  );
}

export function useReferralStats() {
  return useApiQuery<Record<string, number>>(
    ["referrals", "stats"],
    "/api/referrals/stats",
  );
}

// ============ Vitals ============
export interface VitalSignData {
  id: number;
  elderId: number;
  dataType: number;
  dataValue: number;
  unit: string;
  measureTime: string;
  isAbnormal?: number;
}

export interface LatestVitals {
  systolic?: VitalSignData;
  diastolic?: VitalSignData;
  heartRate?: VitalSignData;
  bloodSugarFasting?: VitalSignData;
  spo2?: VitalSignData;
  temperature?: VitalSignData;
}

export interface WearableDevice {
  id?: number;
  elderId: number;
  deviceName: string;
  deviceSn: string;
  deviceType: number;
  bindStatus: number;
  bindTime?: string;
  createTime?: string;
}

export function useVitalTrends(
  elderId: number,
  dataType: number,
  startDate?: string,
  endDate?: string,
) {
  const query = new URLSearchParams();
  query.set("dataType", String(dataType));
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);
  return useApiQuery<VitalSignData[]>(
    [
      "vitals",
      "trend",
      String(elderId),
      String(dataType),
      startDate || "",
      endDate || "",
    ],
    `/api/vitals/trend/${elderId}?${query.toString()}`,
    !!elderId,
  );
}

export function useLatestVitals(elderId: number) {
  return useApiQuery<LatestVitals>(
    ["vitals", "latest", String(elderId)],
    `/api/vitals/latest/${elderId}`,
    !!elderId,
  );
}

export function useDevices(elderId: number) {
  return useApiQuery<WearableDevice[]>(
    ["vitals", "devices", String(elderId)],
    `/api/vitals/devices/${elderId}`,
    !!elderId,
  );
}

export function useBindDevice() {
  return useApiMutation<WearableDevice, WearableDevice>(
    "/api/vitals/devices",
    "POST",
    [["vitals", "devices"]],
  );
}

export function useUnbindDevice() {
  return useApiMutation<void, number>(
    (id) => `/api/vitals/devices/${id}/unbind`,
    "PUT",
    [["vitals", "devices"]],
  );
}

export function useUploadVitals() {
  return useApiMutation<void, VitalSignData[]>("/api/vitals/upload", "POST");
}

export function useMockVitals(elderId: number) {
  return useApiMutation<void, { days?: number }>(
    (vars) =>
      `/api/vitals/mock/${elderId}${vars.days !== undefined ? `?days=${vars.days}` : ""}`,
    "POST",
    [["vitals"]],
  );
}

// ============ Exams （体检管理） ============
export interface PhysicalExam {
  id?: number;
  elderId: number;
  elderName?: string;
  doctorId?: number;
  examDate: string;
  height?: number;
  weight?: number;
  systolicPressure?: number;
  diastolicPressure?: number;
  heartRate?: number;
  bloodSugarFasting?: number;
  bloodSugarRandom?: number;
  temperature?: number;
  bloodOxygen?: number;
  waistline?: number;
  bmi?: number;
  examSummary?: string;
  doctorAdvice?: string;
  abnormalFlag?: number;
  createTime?: string;
}

export function useExams(
  page = 1,
  pageSize = 10,
  elderId?: number,
  startDate?: string,
  endDate?: string,
) {
  const query = new URLSearchParams({
    pageNum: String(page),
    pageSize: String(pageSize),
  });
  if (elderId !== undefined) query.set("elderId", String(elderId));
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);
  return useApiQuery<PageResult<PhysicalExam>>(
    [
      "exams",
      String(page),
      String(pageSize),
      elderId === undefined ? "all" : String(elderId),
      startDate || "",
      endDate || "",
    ],
    `/api/exams?${query.toString()}`,
  );
}

export function useExamDetail(id?: number) {
  return useApiQuery<PhysicalExam>(
    ["exam", String(id)],
    `/api/exams/${id}`,
    !!id,
  );
}

export function useCreateExam() {
  return useApiMutation<PhysicalExam, PhysicalExam>("/api/exams", "POST", [
    ["exams"],
  ]);
}

export function useUpdateExam() {
  return useApiMutation<void, PhysicalExam>(
    (item) => `/api/exams/${item.id}`,
    "PUT",
    [["exams"]],
  );
}

export function useDeleteExam() {
  return useApiMutation<void, number>((id) => `/api/exams/${id}`, "DELETE", [
    ["exams"],
  ]);
}

export function useExamStats(elderId?: number) {
  return useApiQuery<Record<string, number>>(
    ["exams", "stats", String(elderId || "all")],
    `/api/exams/stats${elderId ? `?elderId=${elderId}` : ""}`,
  );
}

export function useExamCompare(
  elderId: number,
  startDate?: string,
  endDate?: string,
) {
  const query = new URLSearchParams();
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);
  return useApiQuery<PhysicalExam[]>(
    ["exams", "compare", String(elderId), startDate || "", endDate || ""],
    `/api/exams/compare?elderId=${elderId}&${query.toString()}`,
    !!elderId,
  );
}

// ============ Timeline （时间轴） ============
export interface TimelineEvent {
  id: number;
  elderId: number;
  eventType: number;
  eventTypeName?: string;
  eventTitle?: string;
  eventContent?: string;
  eventData?: string;
  sourceType?: string;
  sourceId?: number;
  eventTime: string;
  relatedId?: number;
  doctorId?: number;
  createTime?: string;
}

export interface TimelineSummary {
  total?: number;
  typeCounts?: Record<string, number>;
  [key: string]: number | Record<string, number> | undefined;
}

export function useTimeline(
  elderId: number,
  page = 1,
  pageSize = 20,
  startDate?: string,
  endDate?: string,
  eventType?: number,
) {
  const query = new URLSearchParams({
    pageNum: String(page),
    pageSize: String(pageSize),
  });
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);
  if (eventType !== undefined) query.set("eventType", String(eventType));
  return useApiQuery<PageResult<TimelineEvent>>(
    [
      "timeline",
      String(elderId),
      String(page),
      String(pageSize),
      startDate || "",
      endDate || "",
      eventType === undefined ? "all" : String(eventType),
    ],
    `/api/timeline/${elderId}?${query.toString()}`,
    !!elderId,
  );
}

export function useTimelineSummary(
  elderId: number,
  startDate?: string,
  endDate?: string,
  eventType?: number,
) {
  const query = new URLSearchParams();
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);
  if (eventType !== undefined) query.set("eventType", String(eventType));
  return useApiQuery<TimelineSummary>(
    [
      "timeline",
      String(elderId),
      "summary",
      startDate || "",
      endDate || "",
      eventType === undefined ? "all" : String(eventType),
    ],
    `/api/timeline/${elderId}/summary?${query.toString()}`,
    !!elderId,
  );
}

// ============ Nurse Review （护士审核） ============
export interface ReviewRecord {
  id: number;
  elderId: number;
  nurseId?: number;
  recordType?: number;
  recordTitle?: string;
  recordContent?: string;
  nursingMeasures?: string;
  observation?: string;
  evaluation?: string;
  recordDate?: string;
  isAbnormal?: number;
  abnormalDesc?: string;
  reportStatus?: number;
  doctorReview?: number;
  reviewDoctorId?: number;
  reviewComment?: string;
  reviewTime?: string;
  remark?: string;
  createTime: string;
}

export interface ReviewPlan {
  id: number;
  elderId: number;
  nurseId?: number;
  doctorId?: number;
  planName?: string;
  planType?: number;
  startDate?: string;
  endDate?: string;
  frequency?: string;
  nursingGoal?: string;
  nursingContent?: string;
  status?: number;
  totalCount?: number;
  completedCount?: number;
  effectScore?: number;
  doctorApproval?: number;
  remark?: string;
  createTime: string;
}

export function usePendingReviewRecords(page = 1, pageSize = 10) {
  return useApiQuery<PageResult<ReviewRecord>>(
    ["review", "records", String(page), String(pageSize)],
    `/api/review/records?pageNum=${page}&pageSize=${pageSize}`,
  );
}

export function usePendingReviewPlans(page = 1, pageSize = 10) {
  return useApiQuery<PageResult<ReviewPlan>>(
    ["review", "plans", String(page), String(pageSize)],
    `/api/review/plans?pageNum=${page}&pageSize=${pageSize}`,
  );
}

export function useApproveReviewRecord() {
  return useApiMutation<void, { id: number; comment?: string }>(
    (vars) => `/api/review/records/${vars.id}/approve`,
    "POST",
    [["review"], ["dashboard"]],
  );
}

export function useRejectReviewRecord() {
  return useApiMutation<void, { id: number; comment?: string }>(
    (vars) => `/api/review/records/${vars.id}/reject`,
    "POST",
    [["review"], ["dashboard"]],
  );
}

export function useApproveReviewPlan() {
  return useApiMutation<void, number>(
    (id) => `/api/review/plans/${id}/approve`,
    "POST",
    [["review"], ["dashboard"]],
  );
}

export function useRejectReviewPlan() {
  return useApiMutation<void, number>(
    (id) => `/api/review/plans/${id}/reject`,
    "POST",
    [["review"], ["dashboard"]],
  );
}

export function useReviewStats() {
  return useApiQuery<Record<string, number>>(
    ["review", "stats"],
    "/api/review/stats",
  );
}

// ============ AI Health Report （AI 报告） ============
export interface AiHealthFinding {
  category?: string;
  severity?: number;
  finding?: string;
  advice?: string;
  [key: string]: unknown;
}

export interface AiHealthAdviceItem {
  disease?: string;
  name?: string;
  type?: string;
  content?: string;
  advice?: string;
  target?: string;
  effect?: string;
  [key: string]: unknown;
}

export interface AiHealthReportDocument {
  schemaVersion?: string;
  elderBrief?: Record<string, unknown>;
  riskScore?: number;
  riskLevel?: string;
  reportText?: string;
  riskReasons?: string[];
  findings?: AiHealthFinding[];
  chronicAdvice?: AiHealthAdviceItem[];
  followUpAdvice?: string[];
  interventionAdvice?: AiHealthAdviceItem[];
  notices?: string[];
  aiComment?: string;
  aiAnalysis?: string;
  aiSuggestions?: string[];
  dataCompleteness?: unknown;
  generatedAt?: string;
  aiGeneratedAt?: string;
  triggeredRuleCount?: number;
  encouragements?: string[];
  [key: string]: unknown;
}

export interface AiHealthReport {
  id: number;
  elderId: number;
  elderName?: string;
  source?: number;
  riskScore?: number;
  riskLevel?: string;
  reportJson?: string;
  editedReportJson?: string;
  modelName?: string;
  promptVersion?: string;
  rejectReason?: string;
  confirmTime?: string;
  status: number;
  doctorId?: number;
  createTime: string;
}

export function useAiReports(elderId: number, page = 1, pageSize = 10) {
  return useApiQuery<PageResult<AiHealthReport>>(
    ["ai", "reports", String(elderId), String(page), String(pageSize)],
    `/api/ai/health-report/list?elderId=${elderId}&pageNum=${page}&pageSize=${pageSize}`,
    !!elderId,
  );
}

export function useAiReportDetail(id?: number) {
  return useApiQuery<AiHealthReport>(
    ["ai", "report", String(id)],
    `/api/ai/health-report/${id}`,
    !!id,
  );
}

export function useGenerateAiReport() {
  return useApiMutation<AiHealthReport, number>(
    (elderId) => `/api/ai/health-report/generate/${elderId}`,
    "POST",
    [["ai", "reports"]],
  );
}

export function useDeepAnalysisAiReport() {
  return useApiMutation<AiHealthReport, number>(
    (id) => `/api/ai/health-report/${id}/deep-analysis`,
    "POST",
    [["ai", "reports"]],
  );
}

export function useConfirmAiReport() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: number; editedReportJson?: string }>({
    mutationFn: async ({ id, editedReportJson }) => {
      const res = await put<ApiResponse<void>>(
        `/api/ai/health-report/${id}/confirm`,
        {
          editedReportJson,
          editedJson: editedReportJson,
        },
      );
      return unwrap(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai", "reports"] });
      queryClient.invalidateQueries({ queryKey: ["assessments", "report"] });
    },
  });
}

export function useRejectAiReport() {
  return useApiMutation<void, { id: number; reason: string }>(
    (vars) => `/api/ai/health-report/${vars.id}/reject`,
    "PUT",
    [["ai", "reports"]],
  );
}

// ============ Risk / Key Population ============
export interface RiskProfile {
  elderId: number;
  elderName?: string;
  name?: string;
  riskLevel?: number;
  riskLevelText?: string;
  riskScore?: number;
  riskTags?: string;
  lastCalculateTime?: string;
  community?: string;
}

export function useRiskElders(
  page = 1,
  pageSize = 10,
  riskLevel?: number,
  keyword?: string,
) {
  const query = new URLSearchParams({
    pageNum: String(page),
    pageSize: String(pageSize),
  });
  if (riskLevel !== undefined) query.set("riskLevel", String(riskLevel));
  if (keyword?.trim()) query.set("keyword", keyword.trim());
  return useApiQuery<PageResult<RiskProfile>>(
    [
      "risk",
      "elders",
      String(page),
      String(pageSize),
      riskLevel === undefined ? "all" : String(riskLevel),
      keyword?.trim() || "all",
    ],
    `/api/risk/elders?${query.toString()}`,
  );
}

export function useRiskStats() {
  return useApiQuery<Record<string, number>>(
    ["risk", "stats"],
    "/api/risk/stats",
  );
}

export function useRiskDetail(elderId?: number) {
  return useApiQuery<Record<string, unknown>>(
    ["risk", "detail", String(elderId)],
    `/api/risk/elders/${elderId}`,
    !!elderId,
  );
}

export function useCalculateAllRisk() {
  return useApiMutation<number, void>("/api/risk/elders/calculate", "POST", [
    ["risk"],
  ]);
}

export function useCalculateElderRisk() {
  return useApiMutation<Record<string, unknown>, number>(
    (elderId) => `/api/risk/elders/${elderId}/calculate`,
    "POST",
    [["risk"]],
  );
}

// ============ Followup Tasks ============
export interface FollowupTask {
  id?: number;
  elderId?: number;
  elderName?: string;
  taskType?: number;
  taskReason?: string;
  priority?: number;
  status?: number;
  dueDate?: string;
  createTime?: string;
}

export function useFollowupTasks(page = 1, pageSize = 10, status?: number) {
  const query = new URLSearchParams({
    pageNum: String(page),
    pageSize: String(pageSize),
  });
  if (status !== undefined) query.set("status", String(status));
  return useApiQuery<PageResult<FollowupTask>>(
    [
      "followup",
      "tasks",
      String(page),
      String(pageSize),
      status === undefined ? "all" : String(status),
    ],
    `/api/followup/tasks?${query.toString()}`,
  );
}

export function useTodayFollowupTasks() {
  return useApiQuery<FollowupTask[]>(
    ["followup", "tasks", "today"],
    "/api/followup/tasks/today",
  );
}

export function useOverdueFollowupTasks(enabled = true) {
  return useApiQuery<FollowupTask[]>(
    ["followup", "tasks", "overdue"],
    "/api/followup/tasks/overdue",
    enabled,
  );
}

export function useFinishFollowupTask() {
  return useApiMutation<void, { id: number; followRecordId: number }>(
    (vars) =>
      `/api/followup/tasks/${vars.id}/finish?followRecordId=${vars.followRecordId}`,
    "PUT",
    [["followup", "tasks"]],
  );
}

export function useCancelFollowupTask() {
  return useApiMutation<void, { id: number; reason?: string }>(
    (vars) =>
      `/api/followup/tasks/${vars.id}/cancel${vars.reason ? `?reason=${encodeURIComponent(vars.reason)}` : ""}`,
    "PUT",
    [["followup", "tasks"]],
  );
}

export function useGenerateFollowupTasks() {
  return useApiMutation<number, void>("/api/followup/tasks/generate", "POST", [
    ["followup", "tasks"],
  ]);
}

// ============ Nurse ============
export interface NursingRecord {
  id?: number;
  elderId: number;
  nurseId?: number;
  recordType?: number;
  recordTitle: string;
  recordContent?: string;
  nursingMeasures?: string;
  observation?: string;
  evaluation?: string;
  recordDate?: string;
  isAbnormal?: number;
  abnormalDesc?: string;
  reportStatus?: number;
  doctorReview?: number;
  reviewDoctorId?: number;
  reviewComment?: string;
  reviewTime?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

export interface NursingPlan {
  id?: number;
  elderId: number;
  nurseId?: number;
  doctorId?: number;
  planName: string;
  planType?: number;
  startDate?: string;
  endDate?: string;
  frequency?: string;
  nursingGoal?: string;
  nursingContent?: string;
  status?: number;
  totalCount?: number;
  completedCount?: number;
  effectScore?: number;
  doctorApproval?: number;
  remark?: string;
  createTime?: string;
}

export function useNurseDashboardStats() {
  return useApiQuery<Record<string, number>>(
    ["nurse", "dashboard", "stats"],
    "/api/nurse/dashboard/stats",
  );
}

export function useNurseDashboardTasks() {
  return useApiQuery<Record<string, unknown>>(
    ["nurse", "dashboard", "tasks"],
    "/api/nurse/dashboard/tasks",
  );
}

export function useNurseRecords(
  page = 1,
  pageSize = 10,
  elderId?: number,
  recordType?: number,
  reportStatus?: number,
  startDate?: string,
  endDate?: string,
) {
  const query = new URLSearchParams({
    pageNum: String(page),
    pageSize: String(pageSize),
  });
  if (elderId !== undefined) query.set("elderId", String(elderId));
  if (recordType !== undefined) query.set("recordType", String(recordType));
  if (reportStatus !== undefined)
    query.set("reportStatus", String(reportStatus));
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);
  return useApiQuery<PageResult<NursingRecord>>(
    [
      "nurse",
      "records",
      String(page),
      String(pageSize),
      elderId === undefined ? "all" : String(elderId),
      recordType === undefined ? "all" : String(recordType),
      reportStatus === undefined ? "all" : String(reportStatus),
      startDate || "",
      endDate || "",
    ],
    `/api/nurse/records?${query.toString()}`,
  );
}

export function useNurseRecordDetail(id?: number) {
  return useApiQuery<NursingRecord>(
    ["nurse", "record", String(id)],
    `/api/nurse/records/${id}`,
    !!id,
  );
}

export function useNurseRecordStats() {
  return useApiQuery<Record<string, number>>(
    ["nurse", "records", "stats"],
    "/api/nurse/records/stats",
  );
}

export function useCreateNurseRecord() {
  return useApiMutation<NursingRecord, NursingRecord>(
    "/api/nurse/records",
    "POST",
    [["nurse", "records"]],
  );
}

export function useUpdateNurseRecord() {
  return useApiMutation<void, NursingRecord>(
    (record) => `/api/nurse/records/${record.id}`,
    "PUT",
    [["nurse", "records"]],
  );
}

export function useDeleteNurseRecord() {
  return useApiMutation<void, number>(
    (id) => `/api/nurse/records/${id}`,
    "DELETE",
    [["nurse", "records"]],
  );
}

export function useReportNurseRecord() {
  return useApiMutation<void, { id: number; abnormalDesc: string }>(
    (vars) => `/api/nurse/records/${vars.id}/report`,
    "POST",
    [["nurse", "records"]],
  );
}

export function useNursePlans(
  page = 1,
  pageSize = 10,
  elderId?: number,
  planType?: number,
  status?: number,
) {
  const query = new URLSearchParams({
    pageNum: String(page),
    pageSize: String(pageSize),
  });
  if (elderId !== undefined) query.set("elderId", String(elderId));
  if (planType !== undefined) query.set("planType", String(planType));
  if (status !== undefined) query.set("status", String(status));
  return useApiQuery<PageResult<NursingPlan>>(
    [
      "nurse",
      "plans",
      String(page),
      String(pageSize),
      elderId === undefined ? "all" : String(elderId),
      planType === undefined ? "all" : String(planType),
      status === undefined ? "all" : String(status),
    ],
    `/api/nurse/plans?${query.toString()}`,
  );
}

export function useNursePlanDetail(id?: number) {
  return useApiQuery<NursingPlan>(
    ["nurse", "plan", String(id)],
    `/api/nurse/plans/${id}`,
    !!id,
  );
}

export function useNursePlanStats() {
  return useApiQuery<Record<string, number>>(
    ["nurse", "plans", "stats"],
    "/api/nurse/plans/stats",
  );
}

export function useCreateNursePlan() {
  return useApiMutation<NursingPlan, NursingPlan>("/api/nurse/plans", "POST", [
    ["nurse", "plans"],
    ["nurse", "dashboard"],
    ["review"],
  ]);
}

export function useReviewedReviewRecords(page = 1, pageSize = 10) {
  return useApiQuery<PageResult<ReviewRecord>>(
    ["review", "records", "history", String(page), String(pageSize)],
    `/api/review/records/history?pageNum=${page}&pageSize=${pageSize}`,
  );
}

export function useReviewedReviewPlans(page = 1, pageSize = 10) {
  return useApiQuery<PageResult<ReviewPlan>>(
    ["review", "plans", "history", String(page), String(pageSize)],
    `/api/review/plans/history?pageNum=${page}&pageSize=${pageSize}`,
  );
}

export function useUpdateNursePlan() {
  return useApiMutation<void, NursingPlan>(
    (plan) => `/api/nurse/plans/${plan.id}`,
    "PUT",
    [["nurse", "plans"], ["nurse", "dashboard"], ["review"]],
  );
}

export function useDeleteNursePlan() {
  return useApiMutation<void, number>(
    (id) => `/api/nurse/plans/${id}`,
    "DELETE",
    [["nurse", "plans"], ["nurse", "dashboard"], ["review"]],
  );
}

export function useChangeNursePlanStatus() {
  return useApiMutation<void, { id: number; status: number }>(
    (vars) => `/api/nurse/plans/${vars.id}/status`,
    "PUT",
    [["nurse", "plans"], ["nurse", "dashboard"], ["review"]],
  );
}

export function useIncrementNursePlan() {
  return useApiMutation<void, number>(
    (id) => `/api/nurse/plans/${id}/increment`,
    "POST",
    [["nurse", "plans"], ["nurse", "dashboard"], ["review"]],
  );
}

// ============ AI Config ============
export interface AiConfigItem {
  id?: number;
  configKey: string;
  configValue: string;
  configDesc?: string;
  createTime?: string;
  updateTime?: string;
}

export function useAiConfig() {
  return useApiQuery<AiConfigItem[]>(["ai", "config"], "/api/ai/config");
}

export function useUpdateAiConfig() {
  return useApiMutation<void, Record<string, { value: string; desc?: string }>>(
    "/api/ai/config",
    "PUT",
    [["ai", "config"]],
  );
}

export function useReloadAiConfig() {
  return useApiMutation<void, void>("/api/ai/config/reload", "POST", [
    ["ai", "config"],
  ]);
}

// ============ Warning Rules ============
export interface WarningRule {
  id?: number;
  ruleName?: string;
  ruleType?: number;
  metricCode?: string;
  conditionExpr?: string;
  warningLevel?: number;
  warningTemplate?: string;
  enabled?: number;
  doctorId?: number;
  createTime?: string;
}

export function useWarningRules(doctorId?: number) {
  const query = new URLSearchParams();
  if (doctorId !== undefined) query.set("doctorId", String(doctorId));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return useApiQuery<WarningRule[]>(
    ["warning-rules", String(doctorId || "all")],
    `/api/warning-rules${suffix}`,
  );
}

export function useCreateWarningRule() {
  return useApiMutation<WarningRule, WarningRule>(
    "/api/warning-rules",
    "POST",
    [["warning-rules"]],
  );
}

export function useUpdateWarningRule() {
  return useApiMutation<void, WarningRule>(
    (rule) => `/api/warning-rules/${rule.id}`,
    "PUT",
    [["warning-rules"]],
  );
}

export function useDeleteWarningRule() {
  return useApiMutation<void, number>(
    (id) => `/api/warning-rules/${id}`,
    "DELETE",
    [["warning-rules"]],
  );
}

export function useToggleWarningRule() {
  return useApiMutation<void, { id: number; enabled: number }>(
    (vars) => `/api/warning-rules/${vars.id}/toggle?enabled=${vars.enabled}`,
    "PUT",
    [["warning-rules"]],
  );
}

export function useEvaluateWarningRules() {
  const queryClient = useQueryClient();
  return useMutation<
    number,
    Error,
    { elderId: number; vitalData: Record<string, number> }
  >({
    mutationFn: async ({ elderId, vitalData }) => {
      const res = await post<ApiResponse<number>>(
        `/api/warning-rules/evaluate?elderId=${elderId}`,
        vitalData,
      );
      return unwrap(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warnings"] });
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
    },
  });
}

// ============ Profile ============
export interface ProfileInfo {
  id?: number;
  userId?: number;
  username?: string;
  realName?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  role?: string;
  userType?: number | string;
}

export interface SysMessage {
  id?: number;
  userId?: number;
  title?: string;
  content?: string;
  msgType?: number;
  isRead?: number;
  sourceType?: string;
  createTime?: string;
}

export interface OperationLog {
  id?: number;
  userId?: number;
  module?: string;
  operationType?: string;
  description?: string;
  requestIp?: string;
  requestUrl?: string;
  method?: string;
  duration?: number;
  status?: number;
  errorMsg?: string;
  type?: string;
  desc?: string;
  ip?: string;
  createTime?: string;
}

export function useProfileInfo() {
  return useApiQuery<ProfileInfo>(["profile", "info"], "/api/auth/info");
}

export function useUpdateProfileInfo() {
  return useApiMutation<void, ProfileInfo>("/api/profile/info", "PUT", [
    ["profile"],
  ]);
}

export function useChangeProfilePassword() {
  return useApiMutation<
    void,
    { oldPassword: string; newPassword: string; confirmPassword: string }
  >("/api/auth/password", "PUT", [["profile"]]);
}

export function useUploadProfileAvatar() {
  const queryClient = useQueryClient();
  return useMutation<{ avatar: string }, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.post<ApiResponse<{ avatar: string }>>(
        "/api/profile/avatar",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return unwrap(res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useProfileMessages(
  page = 1,
  pageSize = 10,
  userId?: number,
  isRead?: number,
) {
  const query = new URLSearchParams({
    pageNum: String(page),
    pageSize: String(pageSize),
  });
  if (userId !== undefined) query.set("userId", String(userId));
  if (isRead !== undefined) query.set("isRead", String(isRead));
  return useApiQuery<PageResult<SysMessage>>(
    [
      "profile",
      "messages",
      String(page),
      String(pageSize),
      String(userId || "me"),
      String(isRead ?? "all"),
    ],
    `/api/profile/messages?${query.toString()}`,
  );
}

export function useProfileUnreadCount(userId?: number) {
  const query = userId ? `?userId=${userId}` : "";
  return useApiQuery<number>(
    ["profile", "messages", "unread", String(userId || "me")],
    `/api/profile/messages/unread-count${query}`,
  );
}

export function useMarkProfileMessageRead() {
  return useApiMutation<void, number>(
    (id) => `/api/profile/messages/${id}/read`,
    "PUT",
    [["profile", "messages"]],
  );
}

export function useMarkAllProfileMessagesRead() {
  return useApiMutation<void, { userId?: number }>(
    (vars) =>
      `/api/profile/messages/read-all${vars.userId ? `?userId=${vars.userId}` : ""}`,
    "PUT",
    [["profile", "messages"]],
  );
}

export function useProfileLogs(page = 1, pageSize = 10, userId?: number) {
  const query = new URLSearchParams({
    pageNum: String(page),
    pageSize: String(pageSize),
  });
  if (userId !== undefined) query.set("userId", String(userId));
  return useApiQuery<PageResult<OperationLog>>(
    ["profile", "logs", String(page), String(pageSize), String(userId || "me")],
    `/api/profile/logs?${query.toString()}`,
  );
}
