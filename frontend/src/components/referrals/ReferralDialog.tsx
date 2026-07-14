import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { DoctorOption, Referral } from "@/hooks/useApi";

interface ReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elders: { id?: number; name: string }[];
  targetDoctors: DoctorOption[];
  currentUserName?: string;
  currentDepartment?: string;
  onSubmit: (data: Referral) => void;
  isSubmitting?: boolean;
}

const emptyReferral: Referral = {
  elderId: 0,
  referralType: 1,
  toDoctorId: undefined,
  diagnosis: "",
  referralReason: "",
  urgencyLevel: 1,
  bedReserved: 0,
  remark: "",
};

export default function ReferralDialog({
  open,
  onOpenChange,
  elders,
  targetDoctors,
  currentUserName,
  currentDepartment,
  onSubmit,
  isSubmitting,
}: ReferralDialogProps) {
  const [form, setForm] = useState<Referral>(emptyReferral);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({ ...emptyReferral });
      setErrors({});
    }
  }, [open]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.elderId) nextErrors.elderId = "请选择需要移交的老人";
    if (!form.toDoctorId) nextErrors.toDoctorId = "请选择接收医生";
    if (!form.referralReason.trim()) nextErrors.referralReason = "请填写患者移交原因";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = (field: keyof Referral, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: "" }));
  };

  const selectDoctor = (doctorId: number) => {
    const doctor = targetDoctors.find((item) => item.id === doctorId);
    setForm((current) => ({
      ...current,
      toDoctorId: doctorId || undefined,
      toDoctorName: doctor?.realName || doctor?.username || "",
      toDept: doctor?.department || "",
    }));
    setErrors((current) => ({ ...current, toDoctorId: "" }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validate()) onSubmit(form);
  };

  const selectedDoctor = targetDoctors.find((item) => item.id === form.toDoctorId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-lg border-border/40 bg-white p-0">
        <div className="sticky top-0 z-10 border-b border-border/40 bg-white/90 px-6 py-4 backdrop-blur-md">
          <DialogHeader><DialogTitle className="text-lg font-bold">发起医生间患者移交</DialogTitle></DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="flex items-center gap-3 rounded-lg border border-medical-100 bg-medical-50/70 px-4 py-3 text-sm">
            <Stethoscope className="h-5 w-5 shrink-0 text-medical-600" />
            <span className="font-medium">{currentUserName || "当前医生"}</span>
            <span className="text-muted-foreground">{currentDepartment || "全科医学科"}</span>
            <ArrowRight className="h-4 w-4 text-medical-500" />
            <span className="text-muted-foreground">选择接收医生后自动带出科室</span>
          </div>

          <div className="space-y-2">
            <Label>老人 <span className="text-red-500">*</span></Label>
            <select value={form.elderId || ""} onChange={(event) => updateField("elderId", Number(event.target.value))} className={cn("h-10 w-full rounded-md border border-border/60 bg-white px-3 text-sm outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-200", errors.elderId && "border-red-400")}>
              <option value="">请选择本人当前负责的老人</option>
              {elders.map((elder) => <option key={elder.id} value={elder.id}>{elder.name}</option>)}
            </select>
            {errors.elderId && <p className="text-xs text-red-500">{errors.elderId}</p>}
          </div>

          <div className="space-y-2">
            <Label>接收医生 <span className="text-red-500">*</span></Label>
            <select value={form.toDoctorId || ""} onChange={(event) => selectDoctor(Number(event.target.value))} className={cn("h-10 w-full rounded-md border border-border/60 bg-white px-3 text-sm outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-200", errors.toDoctorId && "border-red-400")}>
              <option value="">请选择其他正常启用的医生</option>
              {targetDoctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.realName || doctor.username} · ID {doctor.id} · {doctor.department || "全科医学科"}</option>)}
            </select>
            {selectedDoctor && <p className="text-xs text-muted-foreground">接收科室：{selectedDoctor.department || "全科医学科"}</p>}
            {errors.toDoctorId && <p className="text-xs text-red-500">{errors.toDoctorId}</p>}
          </div>

          <div className="space-y-2">
            <Label>当前诊断</Label>
            <Input value={form.diagnosis || ""} onChange={(event) => updateField("diagnosis", event.target.value)} placeholder="填写当前主要诊断，便于接收医生判断" />
          </div>

          <div className="space-y-2">
            <Label>移交原因 <span className="text-red-500">*</span></Label>
            <textarea value={form.referralReason} onChange={(event) => updateField("referralReason", event.target.value)} placeholder="说明需要更换责任医生的原因和当前重点事项" rows={4} className={cn("w-full resize-none rounded-md border border-border/60 bg-white px-3 py-2 text-sm outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-200", errors.referralReason && "border-red-400")} />
            {errors.referralReason && <p className="text-xs text-red-500">{errors.referralReason}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>紧急程度</Label><select value={form.urgencyLevel} onChange={(event) => updateField("urgencyLevel", Number(event.target.value))} className="h-10 w-full rounded-md border border-border/60 bg-white px-3 text-sm"><option value={1}>普通</option><option value={2}>紧急</option><option value={3}>危急</option></select></div>
            <div className="space-y-2"><Label>备注</Label><Input value={form.remark || ""} onChange={(event) => updateField("remark", event.target.value)} placeholder="可选" /></div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            接收医生完成移交后，老人档案、历史健康资料和未完成任务将整体归属接收医生；原责任医生将不再看到该患者。
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>取消</Button>
            <Button type="submit" disabled={isSubmitting || !targetDoctors.length} className="bg-medical-500 text-white hover:bg-medical-600">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "提交中..." : "提交移交申请"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
