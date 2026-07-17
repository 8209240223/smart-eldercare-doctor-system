import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useSearchParams } from "react-router-dom";
import {
  ClipboardPlus,
  Eye,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DetailDialog from "@/components/common/DetailDialog";
import TextActionDialog from "@/components/common/TextActionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api, unwrap, type ApiResponse } from "@/lib/api";
import ElderMasterSelect from "@/components/workflow/ElderMasterSelect";
import WorkflowNavigationDialog, {
  type WorkflowNavigationOption,
} from "@/components/workflow/WorkflowNavigationDialog";
import {
  useCreateNurseRecord,
  useDeleteNurseRecord,
  useElders,
  useNurseRecordDetail,
  useNurseRecords,
  useNurseRecordStats,
  useReportNurseRecord,
  useUpdateNurseRecord,
  type NursingRecord,
} from "@/hooks/useApi";
import { getUserRole, useAuthStore } from "@/store/auth";

interface DoctorOption {
  id: number;
  realName?: string;
  username?: string;
}

const emptyRecord: NursingRecord = {
  elderId: 0,
  recordType: 1,
  recordTitle: "",
  recordContent: "",
  nursingMeasures: "",
  observation: "",
  evaluation: "",
  recordDate: "",
  isAbnormal: 0,
  abnormalDesc: "",
  remark: "",
};
const typeLabels = [
  "",
  "基础护理",
  "专科护理",
  "生活照料",
  "心理护理",
  "康复护理",
];
const reportLabels = ["未上报", "已上报", "已处理"];

export default function NurseRecords() {
  const userInfo = useAuthStore((state) => state.userInfo);
  const canManageNursingRecords = getUserRole(userInfo) === "nurse";
  const currentNurseId = Number(userInfo?.userId || userInfo?.id || 0);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedElderId = searchParams.get("elderId") || "";
  const requestedPlanId = searchParams.get("planId") || "";
  const [page, setPage] = useState(1);
  const [elderId, setElderId] = useState(requestedElderId);
  const [recordType, setRecordType] = useState<number | undefined>();
  const [reportStatus, setReportStatus] = useState<number | undefined>();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<NursingRecord>(emptyRecord);
  const [detailId, setDetailId] = useState<number | undefined>();
  const [reportTarget, setReportTarget] = useState<NursingRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NursingRecord | null>(null);
  const [navigationState, setNavigationState] = useState<{
    title: string;
    description: string;
    options: WorkflowNavigationOption[];
  } | null>(null);

  const { data, isLoading, refetch } = useNurseRecords(
    page,
    10,
    elderId ? Number(elderId) : undefined,
    recordType,
    reportStatus,
    startDate,
    endDate,
  );
  const { data: stats } = useNurseRecordStats();
  const { data: eldersData } = useElders(1, 500);
  const { data: doctorOptions = [] } = useQuery<DoctorOption[]>({
    queryKey: ["elders", "doctor-options"],
    queryFn: async () =>
      unwrap(
        await api<ApiResponse<DoctorOption[]>>("/api/elders/options/doctors"),
      ),
  });
  const { data: detail, isLoading: detailLoading } =
    useNurseRecordDetail(detailId);
  const createRecord = useCreateNurseRecord();
  const updateRecord = useUpdateNurseRecord();
  const deleteRecord = useDeleteNurseRecord();
  const reportRecord = useReportNurseRecord();
  const records = data?.records || [];
  const totalPages = data?.pages || 1;
  const elderNames = new Map(
    (eldersData?.records || []).map((elder) => [elder.id, elder.name]),
  );
  const doctorNames = new Map(
    doctorOptions.map((doctor) => [
      doctor.id,
      doctor.realName || doctor.username || `医生 #${doctor.id}`,
    ]),
  );
  const selectedFormElder = (eldersData?.records || []).find(
    (elder) => elder.id === form.elderId,
  );
  const assignedDoctorId = selectedFormElder
    ? selectedFormElder.doctorId
    : form.doctorId;
  const targetDoctorId = assignedDoctorId && assignedDoctorId > 0
    ? assignedDoctorId
    : undefined;

  useEffect(() => {
    setElderId(requestedElderId);
    setPage(1);
  }, [requestedElderId]);

  const selectElder = (value?: number) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("elderId", String(value));
    else next.delete("elderId");
    setSearchParams(next, { replace: true });
    setElderId(value ? String(value) : "");
    setPage(1);
  };

  const updateForm = (field: keyof NursingRecord, value: string | number) =>
    setForm((current) => ({ ...current, [field]: value }));
  const updateFormElder = (value?: number) => {
    const elder = (eldersData?.records || []).find((item) => item.id === value);
    setForm((current) => ({
      ...current,
      elderId: value || 0,
      doctorId: elder?.doctorId,
    }));
  };
  const openCreateForm = () => {
    const initialElderId = elderId ? Number(elderId) : 0;
    const initialElder = (eldersData?.records || []).find(
      (item) => item.id === initialElderId,
    );
    setForm({
      ...emptyRecord,
      elderId: initialElderId,
      nurseId: currentNurseId || undefined,
      doctorId: initialElder?.doctorId,
    });
    setFormOpen(true);
  };
  const save = async () => {
    const payload = {
      ...form,
      nurseId: form.nurseId || currentNurseId,
      doctorId: targetDoctorId,
    };
    if (!payload.elderId || !payload.recordTitle.trim())
      return toast.error("老人和记录标题不能为空");
    if (!payload.nurseId)
      return toast.error("无法识别当前护士账号，请重新登录");
    if (!payload.doctorId)
      return toast.error("该老人尚未分配启用中的责任医生，不能保存护理记录");
    try {
      if (payload.id) await updateRecord.mutateAsync(payload);
      else await createRecord.mutateAsync(payload);
      setFormOpen(false);
      toast.success(form.id ? "护理记录已更新" : "护理记录已新增");
      refetch();
      setNavigationState({
        title: form.id ? "护理记录已更新" : "护理记录已新增",
        description:
          "护理数据已关联到统一老人主档，是否继续制定护理计划或查看健康报告？",
        options: [
          {
            key: "plans",
            label: "制定护理计划",
            description: "继续为该老人安排护理计划",
            to: `/nurse-plans?elderId=${payload.elderId}${
              requestedPlanId ? `&planId=${requestedPlanId}` : ""
            }`,
          },
          {
            key: "reports",
            label: "查看 AI 健康报告",
            description: "查看该老人的健康分析和护理建议",
            to: `/ai-reports?elderId=${payload.elderId}`,
          },
        ],
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存护理记录失败");
    }
  };
  const report = async (value: string) => {
    if (!reportTarget?.id) return;
    try {
      await reportRecord.mutateAsync({
        id: reportTarget.id,
        abnormalDesc: value,
      });
      setReportTarget(null);
      toast.success("异常护理记录已上报");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上报异常失败");
    }
  };
  const remove = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteRecord.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("护理记录已删除");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除护理记录失败");
    }
  };

  return (
    <PageShell
      title="护理记录"
      subtitle="维护护理记录、时间筛选、详情和异常上报"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="记录总数"
            value={Number(stats?.total || 0)}
            icon={ClipboardPlus}
            delay={0}
          />
          <StatCard
            title="今日记录"
            value={Number(stats?.today || stats?.todayRecords || 0)}
            icon={Plus}
            iconClassName="from-sky-400 to-sky-500"
            delay={1}
          />
          <StatCard
            title="异常记录"
            value={Number(stats?.abnormal || 0)}
            icon={Megaphone}
            iconClassName="from-amber-400 to-amber-500"
            delay={2}
          />
          <StatCard
            title="待审核"
            value={Number(stats?.pendingReview || 0)}
            icon={Eye}
            iconClassName="from-lavender-400 to-lavender-500"
            delay={3}
          />
        </div>
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <ElderMasterSelect
              className="min-w-[260px]"
              label="老人主档"
              elders={eldersData?.records || []}
              value={elderId}
              onChange={selectElder}
            />
            <div className="min-w-[150px]">
              <label className="text-sm font-medium text-muted-foreground">
                记录类型
              </label>
              <select
                className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm"
                value={recordType ?? ""}
                onChange={(event) =>
                  setRecordType(
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
              >
                <option value="">全部类型</option>
                {typeLabels.slice(1).map((label, index) => (
                  <option key={label} value={index + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="text-sm font-medium text-muted-foreground">
                上报状态
              </label>
              <select
                className="mt-2 h-9 w-full rounded-xl border border-border/60 bg-white/70 px-3 text-sm"
                value={reportStatus ?? ""}
                onChange={(event) =>
                  setReportStatus(
                    event.target.value ? Number(event.target.value) : undefined,
                  )
                }
              >
                <option value="">全部状态</option>
                {reportLabels.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                开始日期
              </label>
              <Input
                type="date"
                className="mt-2 rounded-xl bg-white/70"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                结束日期
              </label>
              <Input
                type="date"
                className="mt-2 rounded-xl bg-white/70"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => refetch()}
            >
              查询
            </Button>
            {canManageNursingRecords && (
              <Button
                onClick={openCreateForm}
                className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                新增护理记录
              </Button>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">护理记录列表</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : records.length === 0 ? (
              <EmptyState title="暂无护理记录" description="可新增护理记录" />
            ) : (
              <div className="space-y-3">
                {records.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="rounded-xl border border-border/40 bg-white/60 p-4"
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">
                            {record.recordTitle}
                          </h3>
                          <Badge variant="outline">
                            {typeLabels[record.recordType || 0] || "护理记录"}
                          </Badge>
                          <Badge variant="outline">
                            {reportLabels[record.reportStatus || 0] || "未上报"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {elderNames.get(record.elderId) ||
                            "姓名未同步"}{" "}
                          · 目标医生 {record.doctorId ? doctorNames.get(record.doctorId) || `医生 #${record.doctorId}` : "待分配"} · {record.recordDate || record.createTime || "-"}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {record.recordContent || record.observation || "-"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDetailId(record.id)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          详情
                        </Button>
                        {canManageNursingRecords && Number(record.reportStatus) === 0 && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setForm({
                                  ...emptyRecord,
                                  ...record,
                                  recordDate: record.recordDate
                                    ? String(record.recordDate).slice(0, 16)
                                    : "",
                                });
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="mr-1 h-4 w-4" />
                              编辑
                            </Button>
                            {record.isAbnormal === 1 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReportTarget(record)}
                              >
                                <Megaphone className="mr-1 h-4 w-4" />
                                上报异常
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => setDeleteTarget(record)}
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              删除
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {totalPages > 1 && (
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((value) => value - 1)}
                    >
                      上一页
                    </Button>
                    <span className="px-2 py-1 text-sm text-muted-foreground">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((value) => value + 1)}
                    >
                      下一页
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-2xl bg-white/95">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "编辑护理记录" : "新增护理记录"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ElderMasterSelect
              elders={eldersData?.records || []}
              value={form.elderId}
              onChange={updateFormElder}
              allowAll={false}
            />
            <div className="flex h-9 items-center justify-between rounded-md border border-input bg-muted/30 px-3 text-sm">
              <span className="text-muted-foreground">目标责任医生</span>
              <span className="font-medium">
                {targetDoctorId
                  ? doctorNames.get(targetDoctorId) || `医生 #${targetDoctorId}（ID: ${targetDoctorId}）`
                  : "未分配有效医生"}
              </span>
            </div>
            <select
              value={form.recordType || 1}
              onChange={(event) =>
                updateForm("recordType", Number(event.target.value))
              }
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {typeLabels.slice(1).map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
            <Input
              className="md:col-span-2"
              value={form.recordTitle}
              onChange={(event) =>
                updateForm("recordTitle", event.target.value)
              }
              placeholder="记录标题"
            />
            <Input
              type="datetime-local"
              value={form.recordDate || ""}
              onChange={(event) => updateForm("recordDate", event.target.value)}
            />
            <select
              value={form.isAbnormal || 0}
              onChange={(event) =>
                updateForm("isAbnormal", Number(event.target.value))
              }
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="0">正常</option>
              <option value="1">异常</option>
            </select>
            <textarea
              className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm md:col-span-2"
              value={form.recordContent || ""}
              onChange={(event) =>
                updateForm("recordContent", event.target.value)
              }
              placeholder="记录内容"
            />
            <textarea
              className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm md:col-span-2"
              value={form.nursingMeasures || ""}
              onChange={(event) =>
                updateForm("nursingMeasures", event.target.value)
              }
              placeholder="护理措施"
            />
            <textarea
              className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={form.observation || ""}
              onChange={(event) =>
                updateForm("observation", event.target.value)
              }
              placeholder="观察记录"
            />
            <textarea
              className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={form.evaluation || ""}
              onChange={(event) => updateForm("evaluation", event.target.value)}
              placeholder="护理评价"
            />
            <textarea
              className="min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm md:col-span-2"
              value={form.abnormalDesc || ""}
              onChange={(event) =>
                updateForm("abnormalDesc", event.target.value)
              }
              placeholder="异常说明"
            />
            <textarea
              className="min-h-16 rounded-md border border-input bg-transparent px-3 py-2 text-sm md:col-span-2"
              value={form.remark || ""}
              onChange={(event) => updateForm("remark", event.target.value)}
              placeholder="备注"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button
              onClick={save}
              disabled={createRecord.isPending || updateRecord.isPending}
              className="bg-gradient-to-r from-medical-400 to-medical-600 text-white"
            >
              保存护理记录
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <TextActionDialog
        open={!!reportTarget}
        onOpenChange={(open) => !open && setReportTarget(null)}
        title="上报异常护理记录"
        description={reportTarget?.recordTitle}
        placeholder="请填写异常说明"
        initialValue={reportTarget?.abnormalDesc || ""}
        confirmText="确认上报"
        required
        pending={reportRecord.isPending}
        onConfirm={report}
      />
      <DetailDialog
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(undefined)}
        title="护理记录详情"
        loading={detailLoading}
        fields={
          detail
            ? [
                {
                  label: "老人",
                  value:
                    elderNames.get(detail.elderId) || "姓名未同步",
                },
                {
                  label: "记录类型",
                  value: typeLabels[detail.recordType || 0],
                },
                {
                  label: "目标责任医生",
                  value: detail.doctorId
                    ? doctorNames.get(detail.doctorId) ||
                      `医生 #${detail.doctorId}`
                    : "未分配",
                },
                { label: "记录标题", value: detail.recordTitle, wide: true },
                {
                  label: "记录时间",
                  value: detail.recordDate || detail.createTime || "-",
                },
                {
                  label: "是否异常",
                  value: detail.isAbnormal === 1 ? "异常" : "正常",
                },
                {
                  label: "记录内容",
                  value: detail.recordContent || "-",
                  wide: true,
                },
                {
                  label: "护理措施",
                  value: detail.nursingMeasures || "-",
                  wide: true,
                },
                {
                  label: "观察记录",
                  value: detail.observation || "-",
                  wide: true,
                },
                {
                  label: "护理评价",
                  value: detail.evaluation || "-",
                  wide: true,
                },
                {
                  label: "异常说明",
                  value: detail.abnormalDesc || "-",
                  wide: true,
                },
                {
                  label: "上报状态",
                  value: reportLabels[detail.reportStatus || 0],
                },
                {
                  label: "医生审核",
                  value:
                    detail.doctorReview === 2
                      ? "已处理"
                      : detail.doctorReview === 1
                        ? "已查看"
                        : "未审核",
                },
                {
                  label: "审核意见",
                  value: detail.reviewComment || "-",
                  wide: true,
                },
                { label: "备注", value: detail.remark || "-", wide: true },
              ]
            : []
        }
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="删除护理记录"
        description={`确定删除“${deleteTarget?.recordTitle || "该护理记录"}”吗？`}
        confirmText="确认删除"
        destructive
        pending={deleteRecord.isPending}
        onConfirm={remove}
      />
      <WorkflowNavigationDialog
        open={!!navigationState}
        onOpenChange={(open) => !open && setNavigationState(null)}
        title={navigationState?.title || "护理记录已保存"}
        description={navigationState?.description}
        options={navigationState?.options || []}
      />
    </PageShell>
  );
}
