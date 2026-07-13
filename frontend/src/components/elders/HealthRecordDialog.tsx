import { useEffect, useState } from "react";
import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  disabilityStatusOptions,
  livingAbilityOptions,
} from "@/lib/healthRecordOptions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  useAddHealthDetailRecord,
  useDeleteHealthDetailRecord,
  useElderHealthRecord,
  useHealthDetail,
  useSaveElderHealthRecord,
  useUpdateMedicationRecord,
  type ElderInfo,
  type HealthRecordInfo,
} from "@/hooks/useApi";

interface HealthRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elder?: ElderInfo | null;
}

interface MedicationForm {
  id: number;
  elderId: number;
  drugName: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate: string;
  prescribeDoctor: string;
  status: number;
  remark: string;
}

function toMedicationForm(
  item: Record<string, unknown>,
  elderId: number,
): MedicationForm {
  return {
    id: Number(item.id),
    elderId: Number(item.elderId || elderId),
    drugName: String(item.drugName || ""),
    dosage: String(item.dosage || ""),
    frequency: String(item.frequency || ""),
    route: String(item.route || ""),
    startDate: String(item.startDate || ""),
    endDate: String(item.endDate || ""),
    prescribeDoctor: String(item.prescribeDoctor || ""),
    status: Number(item.status ?? 1),
    remark: String(item.remark || ""),
  };
}

const detailTabs = [
  {
    value: "medical-history",
    label: "病史",
    key: "medicalHistory",
    titleField: "diseaseName",
    placeholder: "疾病名称",
  },
  {
    value: "medication",
    label: "用药",
    key: "medications",
    titleField: "drugName",
    placeholder: "药品名称",
  },
  {
    value: "allergy",
    label: "过敏",
    key: "allergies",
    titleField: "allergen",
    placeholder: "过敏原",
  },
  {
    value: "family-history",
    label: "家族史",
    key: "familyHistory",
    titleField: "diseaseName",
    placeholder: "疾病名称",
  },
] as const;

export default function HealthRecordDialog({
  open,
  onOpenChange,
  elder,
}: HealthRecordDialogProps) {
  const elderId = elder?.id;
  const {
    data: record,
    isLoading: recordLoading,
    refetch: refetchRecord,
  } = useElderHealthRecord(elderId);
  const {
    data: detail,
    isLoading: detailLoading,
    refetch: refetchDetail,
  } = useHealthDetail(elderId);
  const saveRecord = useSaveElderHealthRecord();
  const [form, setForm] = useState<HealthRecordInfo>({});
  const [detailDraft, setDetailDraft] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: (typeof detailTabs)[number]["value"];
    id: number;
    title: string;
  } | null>(null);
  const [editingMedication, setEditingMedication] =
    useState<MedicationForm | null>(null);

  const addMedicalHistory = useAddHealthDetailRecord("medical-history");
  const addMedication = useAddHealthDetailRecord("medication");
  const addAllergy = useAddHealthDetailRecord("allergy");
  const addFamilyHistory = useAddHealthDetailRecord("family-history");
  const deleteMedicalHistory = useDeleteHealthDetailRecord("medical-history");
  const deleteMedication = useDeleteHealthDetailRecord("medication");
  const deleteAllergy = useDeleteHealthDetailRecord("allergy");
  const deleteFamilyHistory = useDeleteHealthDetailRecord("family-history");
  const updateMedication = useUpdateMedicationRecord();

  useEffect(() => {
    setForm(record || {});
  }, [record]);

  useEffect(() => {
    if (!open) {
      setEditingMedication(null);
      setDeleteTarget(null);
    }
  }, [open]);

  const save = async () => {
    if (!elderId) return;
    if (form.height !== undefined && (form.height < 30 || form.height > 250)) {
      toast.error("身高必须在 30 到 250 厘米之间");
      return;
    }
    if (form.weight !== undefined && (form.weight < 10 || form.weight > 300)) {
      toast.error("体重必须在 10 到 300 千克之间");
      return;
    }
    try {
      await saveRecord.mutateAsync({ elderId, record: form });
      toast.success("健康档案已保存");
      refetchRecord();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存健康档案失败");
    }
  };

  const addDetail = async (kind: (typeof detailTabs)[number]["value"]) => {
    if (!elderId) return;
    const text = detailDraft[kind]?.trim();
    if (!text) {
      toast.error("请先填写内容");
      return;
    }
    const payload: Record<string, unknown> = { elderId };
    if (kind === "medical-history")
      Object.assign(payload, {
        diseaseName: text,
        isCured: 0,
        remark: detailDraft[`${kind}-remark`] || "",
      });
    if (kind === "medication")
      Object.assign(payload, {
        drugName: text,
        status: 1,
        remark: detailDraft[`${kind}-remark`] || "",
      });
    if (kind === "allergy")
      Object.assign(payload, {
        allergen: text,
        allergyType: 4,
        severity: 1,
        remark: detailDraft[`${kind}-remark`] || "",
      });
    if (kind === "family-history")
      Object.assign(payload, {
        diseaseName: text,
        relationship: detailDraft[`${kind}-remark`] || "",
      });
    try {
      const mutation = {
        "medical-history": addMedicalHistory,
        medication: addMedication,
        allergy: addAllergy,
        "family-history": addFamilyHistory,
      }[kind];
      await mutation.mutateAsync(payload);
      setDetailDraft((value) => ({
        ...value,
        [kind]: "",
        [`${kind}-remark`]: "",
      }));
      toast.success("健康明细已新增");
      refetchDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "新增健康明细失败");
    }
  };

  const saveMedication = async () => {
    if (!editingMedication || !elderId) return;
    const drugName = editingMedication.drugName.trim();
    const dosage = editingMedication.dosage.trim();
    const frequency = editingMedication.frequency.trim();
    const route = editingMedication.route.trim();
    const prescribeDoctor = editingMedication.prescribeDoctor.trim();
    const remark = editingMedication.remark.trim();

    if (
      !drugName ||
      !dosage ||
      !frequency ||
      !route ||
      !editingMedication.startDate ||
      !prescribeDoctor
    ) {
      toast.error("请完整填写药品、剂量、频次、给药途径、开始日期和处方医生");
      return;
    }
    if (
      drugName.length > 200 ||
      dosage.length > 100 ||
      frequency.length > 100 ||
      route.length > 50 ||
      prescribeDoctor.length > 50 ||
      remark.length > 500
    ) {
      toast.error("用药记录字段超过允许长度，请精简后再保存");
      return;
    }
    if (![0, 1].includes(editingMedication.status)) {
      toast.error("请选择有效的用药状态");
      return;
    }
    if (editingMedication.status === 0 && !editingMedication.endDate) {
      toast.error("已停用的药品必须填写结束日期");
      return;
    }
    if (
      editingMedication.endDate &&
      editingMedication.endDate < editingMedication.startDate
    ) {
      toast.error("结束日期不能早于开始日期");
      return;
    }

    try {
      await updateMedication.mutateAsync({
        id: editingMedication.id,
        record: {
          elderId,
          drugName,
          dosage,
          frequency,
          route,
          startDate: editingMedication.startDate,
          endDate: editingMedication.endDate || null,
          prescribeDoctor,
          status: editingMedication.status,
          remark,
        },
      });
      setEditingMedication(null);
      toast.success("用药记录已更新");
      refetchDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新用药记录失败");
    }
  };

  const deleteDetail = async () => {
    if (!deleteTarget) return;
    try {
      const mutation = {
        "medical-history": deleteMedicalHistory,
        medication: deleteMedication,
        allergy: deleteAllergy,
        "family-history": deleteFamilyHistory,
      }[deleteTarget.kind];
      await mutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("健康明细已删除");
      refetchDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除健康明细失败");
    }
  };

  const deleting =
    deleteMedicalHistory.isPending ||
    deleteMedication.isPending ||
    deleteAllergy.isPending ||
    deleteFamilyHistory.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-2xl border-border/40 bg-white/95 p-0 backdrop-blur-xl">
          <div className="sticky top-0 z-10 border-b border-border/40 bg-white/85 px-6 py-4 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {elder?.name || "老人"} · 健康档案
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6">
            <Tabs defaultValue="record">
              <TabsList className="mb-5 bg-medical-50/70">
                <TabsTrigger value="record">基础档案</TabsTrigger>
                {detailTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="record">
                {recordLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>档案编号</Label>
                      <Input
                        value={form.recordNo || ""}
                        onChange={(event) =>
                          setForm((value) => ({
                            ...value,
                            recordNo: event.target.value,
                          }))
                        }
                        placeholder="可由系统自动生成"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>身高 cm</Label>
                      <Input
                        type="number"
                        min={30}
                        max={250}
                        step="0.1"
                        value={form.height ?? ""}
                        onChange={(event) =>
                          setForm((value) => ({
                            ...value,
                            height: event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>体重 kg</Label>
                      <Input
                        type="number"
                        min={10}
                        max={300}
                        step="0.1"
                        value={form.weight ?? ""}
                        onChange={(event) =>
                          setForm((value) => ({
                            ...value,
                            weight: event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>BMI</Label>
                      <Input
                        value={
                          form.height && form.weight
                            ? (form.weight / (form.height / 100) ** 2).toFixed(
                                1,
                              )
                            : ""
                        }
                        readOnly
                        placeholder="根据身高和体重自动计算"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>血型</Label>
                      <select
                        value={form.bloodType || ""}
                        onChange={(event) =>
                          setForm((value) => ({
                            ...value,
                            bloodType: event.target.value || undefined,
                          }))
                        }
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">未知</option>
                        <option value="A">A 型</option>
                        <option value="B">B 型</option>
                        <option value="AB">AB 型</option>
                        <option value="O">O 型</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>吸烟情况</Label>
                      <select
                        value={form.smokingStatus ?? ""}
                        onChange={(event) =>
                          setForm((value) => ({
                            ...value,
                            smokingStatus: event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          }))
                        }
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">未填写</option>
                        <option value={1}>从不</option>
                        <option value={2}>已戒</option>
                        <option value={3}>吸烟</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>饮酒情况</Label>
                      <select
                        value={form.drinkingStatus ?? ""}
                        onChange={(event) =>
                          setForm((value) => ({
                            ...value,
                            drinkingStatus: event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          }))
                        }
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">未填写</option>
                        <option value={1}>从不</option>
                        <option value={2}>偶尔</option>
                        <option value={3}>经常</option>
                        <option value={4}>每天</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>运动频率</Label>
                      <select
                        value={form.exerciseFrequency ?? ""}
                        onChange={(event) =>
                          setForm((value) => ({
                            ...value,
                            exerciseFrequency: event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          }))
                        }
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">未填写</option>
                        <option value={1}>不运动</option>
                        <option value={2}>偶尔</option>
                        <option value={3}>经常</option>
                        <option value={4}>每天</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>失能情况</Label>
                      <select
                        value={String(form.disabilityStatus || "")}
                        onChange={(event) =>
                          setForm((value) => ({
                            ...value,
                            disabilityStatus: event.target.value,
                          }))
                        }
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">未填写</option>
                        {disabilityStatusOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>生活能力</Label>
                      <select
                        value={form.livingAbility ?? ""}
                        onChange={(event) =>
                          setForm((value) => ({
                            ...value,
                            livingAbility: event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          }))
                        }
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">未填写</option>
                        {livingAbilityOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>既往病史</Label>
                      <textarea
                        className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        value={form.medicalHistory || ""}
                        onChange={(event) =>
                          setForm((value) => ({
                            ...value,
                            medicalHistory: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>家族病史</Label>
                      <textarea
                        className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        value={form.familyHistory || ""}
                        onChange={(event) =>
                          setForm((value) => ({
                            ...value,
                            familyHistory: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>过敏史</Label>
                      <textarea
                        className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        value={form.allergyHistory || ""}
                        onChange={(event) =>
                          setForm((value) => ({
                            ...value,
                            allergyHistory: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>当前用药</Label>
                      <textarea
                        className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        value={form.currentMedication || ""}
                        onChange={(event) =>
                          setForm((value) => ({
                            ...value,
                            currentMedication: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>手术史</Label>
                      <Input
                        value={String(form.surgeryHistory || "")}
                        onChange={(event) =>
                          setForm((value) => ({
                            ...value,
                            surgeryHistory: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </TabsContent>

              {detailTabs.map((tab) => {
                const records = (detail?.[tab.key] || []) as Record<
                  string,
                  unknown
                >[];
                return (
                  <TabsContent
                    key={tab.value}
                    value={tab.value}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
                      <Input
                        value={detailDraft[tab.value] || ""}
                        onChange={(event) =>
                          setDetailDraft((value) => ({
                            ...value,
                            [tab.value]: event.target.value,
                          }))
                        }
                        placeholder={tab.placeholder}
                      />
                      <Input
                        value={detailDraft[`${tab.value}-remark`] || ""}
                        onChange={(event) =>
                          setDetailDraft((value) => ({
                            ...value,
                            [`${tab.value}-remark`]: event.target.value,
                          }))
                        }
                        placeholder="备注/关系/说明"
                      />
                      <Button
                        onClick={() => addDetail(tab.value)}
                        className="bg-gradient-to-r from-medical-400 to-medical-600 text-white"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        新增
                      </Button>
                    </div>
                    {detailLoading ? (
                      <Skeleton className="h-32 w-full" />
                    ) : records.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/60 bg-white/60 p-8 text-center text-sm text-muted-foreground">
                        暂无{tab.label}记录
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {records.map((item) => (
                          <div
                            key={String(item.id)}
                            className="flex flex-col gap-3 rounded-xl border border-border/40 bg-white/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground">
                                {String(item[tab.titleField] || "-")}
                              </div>
                              {tab.value === "medication" && (
                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                  <span>
                                    {String(item.dosage || "剂量未填写")}
                                  </span>
                                  <span>
                                    {String(item.frequency || "频次未填写")}
                                  </span>
                                  <span>
                                    {String(item.route || "途径未填写")}
                                  </span>
                                  <span>
                                    {String(item.startDate || "-")} 至{" "}
                                    {String(item.endDate || "长期")}
                                  </span>
                                  <span
                                    className={
                                      Number(item.status ?? 1) === 1
                                        ? "font-medium text-medical-700"
                                        : "font-medium text-slate-500"
                                    }
                                  >
                                    {Number(item.status ?? 1) === 1
                                      ? "使用中"
                                      : "已停用"}
                                  </span>
                                </div>
                              )}
                              <div className="mt-1 text-sm text-muted-foreground">
                                {String(
                                  item.remark ||
                                    item.relationship ||
                                    item.treatment ||
                                    item.reaction ||
                                    "-",
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                              {tab.value === "medication" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg"
                                  onClick={() =>
                                    setEditingMedication(
                                      toMedicationForm(item, elderId || 0),
                                    )
                                  }
                                >
                                  <Pencil className="mr-1 h-4 w-4" />
                                  编辑
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg text-red-600"
                                onClick={() =>
                                  setDeleteTarget({
                                    kind: tab.value,
                                    id: Number(item.id),
                                    title: String(
                                      item[tab.titleField] || tab.label,
                                    ),
                                  })
                                }
                              >
                                <Trash2 className="mr-1 h-4 w-4" />
                                删除
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>

          <DialogFooter className="border-t border-border/40 bg-white/70 px-6 py-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
            <Button
              onClick={save}
              disabled={saveRecord.isPending}
              className="bg-gradient-to-r from-medical-400 to-medical-600 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              保存基础档案
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!editingMedication}
        onOpenChange={(nextOpen) => !nextOpen && setEditingMedication(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border-border/40 bg-white/95 p-0 backdrop-blur-xl">
          <div className="border-b border-border/40 bg-white/85 px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                编辑用药记录
              </DialogTitle>
            </DialogHeader>
          </div>
          {editingMedication && (
            <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>
                  药品名称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  maxLength={200}
                  value={editingMedication.drugName}
                  onChange={(event) =>
                    setEditingMedication((value) =>
                      value
                        ? { ...value, drugName: event.target.value }
                        : value,
                    )
                  }
                  placeholder="请输入药品通用名或商品名"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  剂量 <span className="text-red-500">*</span>
                </Label>
                <Input
                  maxLength={100}
                  value={editingMedication.dosage}
                  onChange={(event) =>
                    setEditingMedication((value) =>
                      value ? { ...value, dosage: event.target.value } : value,
                    )
                  }
                  placeholder="例如：10mg"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  用药频次 <span className="text-red-500">*</span>
                </Label>
                <Input
                  maxLength={100}
                  value={editingMedication.frequency}
                  onChange={(event) =>
                    setEditingMedication((value) =>
                      value
                        ? { ...value, frequency: event.target.value }
                        : value,
                    )
                  }
                  placeholder="例如：每日 1 次"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  给药途径 <span className="text-red-500">*</span>
                </Label>
                <Input
                  maxLength={50}
                  value={editingMedication.route}
                  onChange={(event) =>
                    setEditingMedication((value) =>
                      value ? { ...value, route: event.target.value } : value,
                    )
                  }
                  placeholder="例如：口服、吸入、皮下"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  处方医生 <span className="text-red-500">*</span>
                </Label>
                <Input
                  maxLength={50}
                  value={editingMedication.prescribeDoctor}
                  onChange={(event) =>
                    setEditingMedication((value) =>
                      value
                        ? { ...value, prescribeDoctor: event.target.value }
                        : value,
                    )
                  }
                  placeholder="请输入处方医生姓名"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  开始日期 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={editingMedication.startDate}
                  max={editingMedication.endDate || undefined}
                  onChange={(event) =>
                    setEditingMedication((value) =>
                      value
                        ? { ...value, startDate: event.target.value }
                        : value,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>
                  结束日期{" "}
                  {editingMedication.status === 0 && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <Input
                  type="date"
                  value={editingMedication.endDate}
                  min={editingMedication.startDate || undefined}
                  onChange={(event) =>
                    setEditingMedication((value) =>
                      value ? { ...value, endDate: event.target.value } : value,
                    )
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>
                  用药状态 <span className="text-red-500">*</span>
                </Label>
                <select
                  value={editingMedication.status}
                  onChange={(event) =>
                    setEditingMedication((value) =>
                      value
                        ? { ...value, status: Number(event.target.value) }
                        : value,
                    )
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value={1}>使用中</option>
                  <option value={0}>已停用</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>备注</Label>
                <textarea
                  maxLength={500}
                  className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={editingMedication.remark}
                  onChange={(event) =>
                    setEditingMedication((value) =>
                      value ? { ...value, remark: event.target.value } : value,
                    )
                  }
                  placeholder="补充用药注意事项、不良反应或调整说明"
                />
                <div className="text-right text-xs text-muted-foreground">
                  {editingMedication.remark.length} / 500
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-border/40 bg-white/70 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setEditingMedication(null)}
            >
              取消
            </Button>
            <Button
              onClick={saveMedication}
              disabled={updateMedication.isPending}
              className="bg-gradient-to-r from-medical-400 to-medical-600 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateMedication.isPending ? "保存中..." : "保存用药记录"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(nextOpen) => !nextOpen && setDeleteTarget(null)}
        title="删除健康明细"
        description={`确认删除“${deleteTarget?.title || "该记录"}”吗？删除后无法恢复。`}
        confirmText="确认删除"
        destructive
        pending={deleting}
        onConfirm={deleteDetail}
      />
    </>
  );
}
