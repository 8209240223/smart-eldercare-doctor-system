import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFollowupRecords, type Intervention } from "@/hooks/useApi";

interface InterventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Intervention;
  elders: { id?: number; name: string }[];
  onSubmit: (data: Intervention) => void;
  isSubmitting?: boolean;
}

const emptyIntervention: Intervention = { elderId: 0, interventionType: 1, interventionTitle: "", interventionContent: "", interventionDate: "", status: 1 };

export default function InterventionDialog({ open, onOpenChange, initialData, elders, onSubmit, isSubmitting }: InterventionDialogProps) {
  const [form, setForm] = useState<Intervention>(emptyIntervention);
  const { data: followRecordsData, isLoading: followRecordsLoading } = useFollowupRecords(
    1,
    500,
    undefined,
    form.elderId || undefined,
    open && !!form.elderId,
  );
  const followRecordOptions = followRecordsData?.records || [];
  useEffect(() => {
    if (!open) return;
    setForm(initialData ? {
      ...emptyIntervention,
      ...initialData,
      interventionDate: initialData.interventionDate?.slice(0, 10) || "",
      status: initialData.status === 0 ? 0 : 1,
    } : { ...emptyIntervention });
  }, [open, initialData]);
  const update = (field: keyof Intervention, value: string | number | undefined) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.elderId || !form.interventionTitle.trim() || !form.interventionContent.trim()) return;
    onSubmit({
      ...form,
      interventionDate: form.interventionDate ? `${form.interventionDate.slice(0, 10)}T00:00:00` : undefined,
      status: form.status === 0 ? 0 : 1,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-2xl border-border/40 bg-white/95 p-0 backdrop-blur-xl">
        <div className="sticky top-0 z-10 border-b border-border/40 bg-white/85 px-6 py-4 backdrop-blur-md"><DialogHeader><DialogTitle>{initialData?.id ? "编辑干预记录" : "新增干预记录"}</DialogTitle></DialogHeader></div>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          <div className="space-y-2"><Label>老人 *</Label><select required value={form.elderId || ""} onChange={(event) => setForm((current) => ({ ...current, elderId: Number(event.target.value), followRecordId: undefined }))} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"><option value="">请选择老人</option>{elders.map((elder) => <option key={elder.id} value={elder.id}>{elder.name}</option>)}</select></div>
          <div className="space-y-2">
            <Label>关联随访记录</Label>
            <select
              value={form.followRecordId || ""}
              onChange={(event) => update("followRecordId", event.target.value ? Number(event.target.value) : undefined)}
              disabled={!form.elderId || followRecordsLoading}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">{!form.elderId ? "请先选择老人" : followRecordsLoading ? "正在加载随访记录" : "不关联随访记录"}</option>
              {followRecordOptions.map((record) => (
                <option key={record.id} value={record.id}>
                  #{record.id} · {record.followDate || "未填写日期"} · {record.followResult || "未填写结果"}
                </option>
              ))}
            </select>
            {form.elderId && !followRecordsLoading && followRecordOptions.length === 0 && (
              <p className="text-xs text-amber-700">该老人暂无随访记录，可先到随访计划页面录入。</p>
            )}
          </div>
          <div className="space-y-2"><Label>干预类型 *</Label><select value={form.interventionType} onChange={(event) => update("interventionType", Number(event.target.value))} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"><option value="1">药物干预</option><option value="2">非药物干预</option><option value="3">转诊处理</option><option value="4">健康教育</option></select></div>
          <div className="space-y-2"><Label>干预日期</Label><Input type="date" value={form.interventionDate || ""} onChange={(event) => update("interventionDate", event.target.value)} /></div>
          <div className="space-y-2 md:col-span-2"><Label>干预标题 *</Label><Input required value={form.interventionTitle} onChange={(event) => update("interventionTitle", event.target.value)} /></div>
          <div className="space-y-2 md:col-span-2"><Label>干预内容 *</Label><textarea required value={form.interventionContent} onChange={(event) => update("interventionContent", event.target.value)} className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" /></div>
          <div className="space-y-2 md:col-span-2"><Label>用药调整</Label><textarea value={form.medicationAdjust || ""} onChange={(event) => update("medicationAdjust", event.target.value)} className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" /></div>
          <div className="space-y-2"><Label>生活方式指导</Label><textarea value={form.lifestyleGuidance || ""} onChange={(event) => update("lifestyleGuidance", event.target.value)} className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" /></div>
          <div className="space-y-2"><Label>健康教育</Label><textarea value={form.healthEducation || ""} onChange={(event) => update("healthEducation", event.target.value)} className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" /></div>
          <div className="space-y-2"><Label>效果评价</Label><select value={form.effectEvaluation ?? ""} onChange={(event) => setForm((current) => ({ ...current, effectEvaluation: event.target.value ? Number(event.target.value) : undefined }))} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"><option value="">未评价</option><option value="1">显著</option><option value="2">有效</option><option value="3">一般</option><option value="4">无效</option></select></div>
          <div className="space-y-2"><Label>状态</Label><select value={form.status ?? 1} onChange={(event) => update("status", Number(event.target.value))} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"><option value="1">正常</option><option value="0">已取消</option></select></div>
          <div className="space-y-2 md:col-span-2"><Label>效果说明</Label><textarea value={form.effectDesc || ""} onChange={(event) => update("effectDesc", event.target.value)} className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" /></div>
          <div className="space-y-2 md:col-span-2"><Label>下次计划</Label><textarea value={form.nextPlan || ""} onChange={(event) => update("nextPlan", event.target.value)} className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" /></div>
          <div className="flex justify-end gap-3 md:col-span-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-medical-400 to-medical-600 text-white">{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}保存</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
