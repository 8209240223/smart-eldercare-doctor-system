import { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, ClipboardCheck, Eye, XCircle } from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DetailDialog from "@/components/common/DetailDialog";
import TextActionDialog from "@/components/common/TextActionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createElderNameMap, resolveElderName } from "@/lib/elderName";
import {
  useApproveReviewPlan,
  useApproveReviewRecord,
  useElders,
  usePendingReviewPlans,
  usePendingReviewRecords,
  useRejectReviewPlan,
  useRejectReviewRecord,
  useReviewStats,
  type ReviewPlan,
  type ReviewRecord,
} from "@/hooks/useApi";

const recordTypeLabels = ["", "基础护理", "专科护理", "生活照料", "心理护理", "康复护理"];
const planTypeLabels = ["", "基础护理", "康复护理", "专科护理", "心理护理"];

export default function NurseReview() {
  const [recordPage, setRecordPage] = useState(1);
  const [planPage, setPlanPage] = useState(1);
  const [recordDetail, setRecordDetail] = useState<ReviewRecord | null>(null);
  const [planDetail, setPlanDetail] = useState<ReviewPlan | null>(null);
  const [approveRecordTarget, setApproveRecordTarget] =
    useState<ReviewRecord | null>(null);
  const [approvePlanTarget, setApprovePlanTarget] = useState<ReviewPlan | null>(
    null,
  );
  const [rejectRecordTarget, setRejectRecordTarget] =
    useState<ReviewRecord | null>(null);
  const [rejectPlanTarget, setRejectPlanTarget] = useState<ReviewPlan | null>(
    null,
  );
  const {
    data: recordsData,
    isLoading: recordsLoading,
    refetch: refetchRecords,
  } = usePendingReviewRecords(recordPage, 10);
  const {
    data: plansData,
    isLoading: plansLoading,
    refetch: refetchPlans,
  } = usePendingReviewPlans(planPage, 10);
  const { data: stats } = useReviewStats();
  const { data: eldersData } = useElders(1, 500);
  const approveRecord = useApproveReviewRecord();
  const rejectRecord = useRejectReviewRecord();
  const approvePlan = useApproveReviewPlan();
  const rejectPlan = useRejectReviewPlan();
  const records = recordsData?.records || [];
  const plans = plansData?.records || [];
  const elderNames = createElderNameMap(eldersData?.records || []);

  const approveRecordAction = async () => {
    if (!approveRecordTarget) return;
    try {
      await approveRecord.mutateAsync({ id: approveRecordTarget.id });
      setApproveRecordTarget(null);
      toast.success("护理记录审核通过");
      refetchRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "审核失败");
    }
  };
  const rejectRecordAction = async (comment: string) => {
    if (!rejectRecordTarget) return;
    try {
      await rejectRecord.mutateAsync({ id: rejectRecordTarget.id, comment });
      setRejectRecordTarget(null);
      toast.success("护理记录已驳回");
      refetchRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "驳回失败");
    }
  };
  const approvePlanAction = async () => {
    if (!approvePlanTarget) return;
    try {
      await approvePlan.mutateAsync(approvePlanTarget.id);
      setApprovePlanTarget(null);
      toast.success("护理计划审核通过");
      refetchPlans();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "审核失败");
    }
  };
  const rejectPlanAction = async () => {
    if (!rejectPlanTarget) return;
    try {
      await rejectPlan.mutateAsync(rejectPlanTarget.id);
      setRejectPlanTarget(null);
      toast.success("护理计划已驳回");
      refetchPlans();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "驳回失败");
    }
  };

  return (
    <PageShell
      title="护士审核"
      subtitle="查看并审核护士提交的护理记录和护理计划"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="待审护理记录"
            value={Number(stats?.pendingRecords || recordsData?.total || 0)}
            icon={ClipboardCheck}
            iconClassName="from-amber-400 to-amber-500"
            delay={0}
          />
          <StatCard
            title="待审护理计划"
            value={Number(stats?.pendingPlans || plansData?.total || 0)}
            icon={ClipboardCheck}
            iconClassName="from-sky-400 to-sky-500"
            delay={1}
          />
          <StatCard
            title="已处理记录"
            value={Number(stats?.reviewedRecords || 0)}
            icon={CheckCircle2}
            delay={2}
          />
          <StatCard
            title="已通过计划"
            value={Number(stats?.approvedPlans || 0)}
            icon={CheckCircle2}
            iconClassName="from-medical-400 to-medical-500"
            delay={3}
          />
        </div>
        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">审核工作台</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="records">
              <TabsList>
                <TabsTrigger value="records">待审核护理记录</TabsTrigger>
                <TabsTrigger value="plans">待审核护理计划</TabsTrigger>
              </TabsList>
              <TabsContent value="records" className="mt-5">
                {recordsLoading ? (
                  <Skeleton className="h-44 w-full" />
                ) : records.length === 0 ? (
                  <EmptyState
                    title="暂无待审核护理记录"
                    description="所有护理记录已处理"
                  />
                ) : (
                  <div className="space-y-3">
                    {records.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="rounded-xl border border-border/40 bg-white/60 p-4"
                      >
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {item.recordTitle || "护理记录"}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                              老人：{resolveElderName(undefined, item.elderId, elderNames)} · {recordTypeLabels[item.recordType || 0] || "护理记录"} · {item.recordDate || "-"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              异常说明：{item.abnormalDesc || "-"} · 护士ID：{item.nurseId || "-"} · {item.createTime}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRecordDetail(item)}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              查看
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setApproveRecordTarget(item)}
                              className="bg-gradient-to-r from-medical-400 to-medical-600 text-white"
                            >
                              通过
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => setRejectRecordTarget(item)}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              驳回
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {(recordsData?.pages || 1) > 1 && (
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={recordPage <= 1}
                          onClick={() => setRecordPage((value) => value - 1)}
                        >
                          上一页
                        </Button>
                        <span className="px-2 py-1 text-sm">
                          {recordPage}/{recordsData?.pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={recordPage >= (recordsData?.pages || 1)}
                          onClick={() => setRecordPage((value) => value + 1)}
                        >
                          下一页
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="plans" className="mt-5">
                {plansLoading ? (
                  <Skeleton className="h-44 w-full" />
                ) : plans.length === 0 ? (
                  <EmptyState
                    title="暂无待审核护理计划"
                    description="所有护理计划已处理"
                  />
                ) : (
                  <div className="space-y-3">
                    {plans.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="rounded-xl border border-border/40 bg-white/60 p-4"
                      >
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {item.planName || "护理计划"}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                              老人：{resolveElderName(undefined, item.elderId, elderNames)} · {planTypeLabels[item.planType || 0] || "护理计划"} · {item.startDate || "-"} 至 {item.endDate || "-"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.nursingGoal || item.nursingContent || "-"} · 护士ID：{item.nurseId || "-"} · {item.createTime}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPlanDetail(item)}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              查看
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setApprovePlanTarget(item)}
                              className="bg-gradient-to-r from-medical-400 to-medical-600 text-white"
                            >
                              通过
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => setRejectPlanTarget(item)}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              驳回
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {(plansData?.pages || 1) > 1 && (
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={planPage <= 1}
                          onClick={() => setPlanPage((value) => value - 1)}
                        >
                          上一页
                        </Button>
                        <span className="px-2 py-1 text-sm">
                          {planPage}/{plansData?.pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={planPage >= (plansData?.pages || 1)}
                          onClick={() => setPlanPage((value) => value + 1)}
                        >
                          下一页
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog
        open={!!approveRecordTarget}
        onOpenChange={(open) => !open && setApproveRecordTarget(null)}
        title="通过护理记录"
        description="确定通过这条护理记录吗？确认后将提交审核结果。"
        confirmText="确认通过"
        pending={approveRecord.isPending}
        onConfirm={approveRecordAction}
      />
      <ConfirmDialog
        open={!!approvePlanTarget}
        onOpenChange={(open) => !open && setApprovePlanTarget(null)}
        title="通过护理计划"
        description={`确定通过“${approvePlanTarget?.planName || "该护理计划"}”吗？通过后计划将生效并开始执行。`}
        confirmText="确认通过"
        pending={approvePlan.isPending}
        onConfirm={approvePlanAction}
      />
      <TextActionDialog
        open={!!rejectRecordTarget}
        onOpenChange={(open) => !open && setRejectRecordTarget(null)}
        title="驳回护理记录"
        description="请填写驳回意见，护士将根据意见重新提交"
        placeholder="驳回意见"
        confirmText="确认驳回"
        required
        destructive
        pending={rejectRecord.isPending}
        onConfirm={rejectRecordAction}
      />
      <ConfirmDialog
        open={!!rejectPlanTarget}
        onOpenChange={(open) => !open && setRejectPlanTarget(null)}
        title="驳回护理计划"
        description={`确定驳回“${rejectPlanTarget?.planName || "该护理计划"}”吗？`}
        confirmText="确认驳回"
        destructive
        pending={rejectPlan.isPending}
        onConfirm={rejectPlanAction}
      />
      <DetailDialog
        open={!!recordDetail}
        onOpenChange={(open) => !open && setRecordDetail(null)}
        title="待审核护理记录详情"
        fields={
          recordDetail
            ? [
                {
                  label: "记录标题",
                  value: recordDetail.recordTitle || "护理记录",
                },
                { label: "老人", value: resolveElderName(undefined, recordDetail.elderId, elderNames) },
                { label: "护士ID", value: recordDetail.nurseId || "-" },
                { label: "记录类型", value: recordTypeLabels[recordDetail.recordType || 0] || "-" },
                { label: "记录时间", value: recordDetail.recordDate || "-" },
                { label: "提交时间", value: recordDetail.createTime },
                {
                  label: "护理内容",
                  value: recordDetail.recordContent || "-",
                  wide: true,
                },
                {
                  label: "护理措施",
                  value: recordDetail.nursingMeasures || "-",
                  wide: true,
                },
                {
                  label: "观察记录",
                  value: recordDetail.observation || "-",
                  wide: true,
                },
                {
                  label: "效果评价",
                  value: recordDetail.evaluation || "-",
                  wide: true,
                },
                {
                  label: "异常说明",
                  value: recordDetail.abnormalDesc || "-",
                  wide: true,
                },
              ]
            : []
        }
      />
      <DetailDialog
        open={!!planDetail}
        onOpenChange={(open) => !open && setPlanDetail(null)}
        title="待审核护理计划详情"
        fields={
          planDetail
            ? [
                {
                  label: "计划名称",
                  value: planDetail.planName || "护理计划",
                },
                { label: "老人", value: resolveElderName(undefined, planDetail.elderId, elderNames) },
                { label: "护士ID", value: planDetail.nurseId || "-" },
                { label: "计划类型", value: planTypeLabels[planDetail.planType || 0] || "-" },
                { label: "计划周期", value: `${planDetail.startDate || "-"} 至 ${planDetail.endDate || "-"}` },
                { label: "执行频次", value: planDetail.frequency || "-" },
                { label: "执行次数", value: `${planDetail.completedCount || 0}/${planDetail.totalCount || 0}` },
                { label: "提交时间", value: planDetail.createTime },
                {
                  label: "护理目标",
                  value: planDetail.nursingGoal || "-",
                  wide: true,
                },
                {
                  label: "护理内容",
                  value: planDetail.nursingContent || "-",
                  wide: true,
                },
              ]
            : []
        }
      />
    </PageShell>
  );
}
