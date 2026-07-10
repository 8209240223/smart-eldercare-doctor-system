import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FollowupPlan, FollowupRecord } from "@/hooks/useApi";

interface FollowupRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: FollowupPlan | null;
  onSubmit: (record: FollowupRecord) => void;
  pending?: boolean;
}

function getNextDay(date: string) {
  if (!date) return undefined;
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

export default function FollowupRecordDialog({ open, onOpenChange, plan, onSubmit, pending }: FollowupRecordDialogProps) {
  const [form, setForm] = useState<FollowupRecord>({ elderId: 0, followType: 2, medicationCompliance: 1, followResult: "" });

  const planIsTerminal = plan?.status === 2 || plan?.status === 3;
  const planHasNoRemainingVisits = plan?.totalCount != null && (plan.completedCount || 0) >= plan.totalCount;
  const recordingDisabled = !plan || planIsTerminal || planHasNoRemainingVisits;
  const followDateOnly = form.followDate?.slice(0, 10) || "";
  const nextFollowDateInvalid = !!form.nextFollowDate && !!followDateOnly && form.nextFollowDate <= followDateOnly;

  useEffect(() => {
    if (!open || !plan) return;
    setForm({
      planId: plan.id,
      elderId: plan.elderId,
      diseaseType: plan.diseaseType,
      followDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
      followType: 2,
      medicationCompliance: 1,
      followResult: "",
      nextFollowDate: "",
    });
  }, [open, plan]);

  const update = (field: keyof FollowupRecord, value: string | number) => setForm((current) => ({ ...current, [field]: value }));
  const updateNumber = (field: keyof FollowupRecord, value: string) => {
    setForm((current) => ({ ...current, [field]: value === "" ? undefined : Number(value) }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (recordingDisabled || nextFollowDateInvalid || !form.planId || !form.elderId || !form.followResult?.trim()) return;
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-2xl border-border/40 bg-white/95 p-0 backdrop-blur-xl">
        <div className="sticky top-0 z-10 border-b border-border/40 bg-white/85 px-6 py-4 backdrop-blur-md">
          <DialogHeader><DialogTitle>记录随访结果 · {plan?.elderName || "姓名未同步"}</DialogTitle></DialogHeader>
          {recordingDisabled && <p className="mt-2 text-sm text-red-600">该计划已完成、已终止或随访次数已用完，不能继续新增记录。</p>}
        </div>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          <div className="space-y-2"><Label>随访时间</Label><Input type="datetime-local" value={form.followDate || ""} onChange={(event) => update("followDate", event.target.value)} /></div>
          <div className="space-y-2"><Label>随访方式</Label><select value={form.followType ?? 2} onChange={(event) => update("followType", Number(event.target.value))} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"><option value="1">门诊</option><option value="2">电话</option><option value="3">上门</option><option value="4">远程视频</option></select></div>
          <div className="space-y-2"><Label>收缩压</Label><Input type="number" min={60} max={240} value={form.systolicPressure ?? ""} onChange={(event) => updateNumber("systolicPressure", event.target.value)} /></div>
          <div className="space-y-2"><Label>舒张压</Label><Input type="number" min={40} max={140} value={form.diastolicPressure ?? ""} onChange={(event) => updateNumber("diastolicPressure", event.target.value)} /></div>
          <div className="space-y-2"><Label>心率</Label><Input type="number" min={30} max={180} value={form.heartRate ?? ""} onChange={(event) => updateNumber("heartRate", event.target.value)} /></div>
          <div className="space-y-2"><Label>空腹血糖</Label><Input type="number" min={2} max={30} step="0.1" value={form.bloodSugarFasting ?? ""} onChange={(event) => updateNumber("bloodSugarFasting", event.target.value)} /></div>
          <div className="space-y-2"><Label>体重</Label><Input type="number" min={20} max={200} step="0.1" value={form.weight ?? ""} onChange={(event) => updateNumber("weight", event.target.value)} /></div>
          <div className="space-y-2"><Label>用药依从性</Label><select value={form.medicationCompliance || 1} onChange={(event) => update("medicationCompliance", Number(event.target.value))} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"><option value="1">规律</option><option value="2">间断</option><option value="3">未服药</option></select></div>
          <div className="space-y-2 md:col-span-2"><Label>症状描述</Label><textarea value={form.symptomDesc || ""} onChange={(event) => update("symptomDesc", event.target.value)} className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" /></div>
          <div className="space-y-2 md:col-span-2"><Label>当前用药</Label><textarea value={form.currentMedication || ""} onChange={(event) => update("currentMedication", event.target.value)} className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" /></div>
          <div className="space-y-2 md:col-span-2"><Label>随访结论 *</Label><textarea required value={form.followResult || ""} onChange={(event) => update("followResult", event.target.value)} className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" /></div>
          <div className="space-y-2"><Label>下次随访日期</Label><Input type="date" min={getNextDay(followDateOnly)} value={form.nextFollowDate || ""} onChange={(event) => update("nextFollowDate", event.target.value)} className={nextFollowDateInvalid ? "border-red-400" : undefined} />{nextFollowDateInvalid && <p className="text-xs text-red-500">下次随访日期必须晚于本次随访日期</p>}</div>
          <div className="space-y-2"><Label>备注</Label><Input value={form.remark || ""} onChange={(event) => update("remark", event.target.value)} /></div>
          <div className="flex justify-end gap-3 md:col-span-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button><Button type="submit" disabled={pending || recordingDisabled || nextFollowDateInvalid || !form.followResult?.trim()} className="bg-gradient-to-r from-medical-400 to-medical-600 text-white">{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}保存并记录随访</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
