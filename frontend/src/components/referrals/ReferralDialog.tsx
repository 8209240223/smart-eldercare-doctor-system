import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { Referral } from "@/hooks/useApi";

interface ReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Referral;
  elders: { id?: number; name: string }[];
  currentUserId?: number;
  currentUserName?: string;
  onSubmit: (data: Referral) => void;
  isSubmitting?: boolean;
}

const emptyReferral: Referral = {
  elderId: 0,
  referralType: 1,
  fromOrg: "",
  toOrg: "",
  toDept: "",
  diagnosis: "",
  referralReason: "",
  urgencyLevel: 1,
  bedReserved: 0,
  remark: "",
};

export default function ReferralDialog({
  open,
  onOpenChange,
  initialData,
  elders,
  currentUserId,
  currentUserName,
  onSubmit,
  isSubmitting,
}: ReferralDialogProps) {
  const [form, setForm] = useState<Referral>(emptyReferral);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (open) {
      setForm(initialData || { ...emptyReferral, fromDoctorId: currentUserId, fromDoctorName: currentUserName || "" });
      setErrors({});
    }
  }, [currentUserId, currentUserName, open, initialData]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.elderId) errs.elderId = "请选择老人";
    if (!form.referralReason.trim()) errs.referralReason = "转诊原因不能为空";
    if (!(form.fromOrg || "").trim()) errs.fromOrg = "转出机构不能为空";
    if (!(form.toOrg || "").trim()) errs.toOrg = "目标机构不能为空";
    if (!form.fromDoctorId || form.fromDoctorId <= 0) errs.fromDoctorId = "转出医生ID必须为正整数";
    if (!form.toDoctorId || form.toDoctorId <= 0) errs.toDoctorId = "接收医生ID必须为正整数";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  const updateField = (field: keyof Referral, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border-border/40 bg-white/95 p-0 backdrop-blur-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-white/80 px-6 py-4 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {isEdit ? "编辑转诊" : "发起转诊"}
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="space-y-2">
            <Label>老人 <span className="text-red-500">*</span></Label>
            <select
              value={form.elderId || ""}
              onChange={(e) => updateField("elderId", Number(e.target.value))}
              className={cn(
                "h-10 w-full rounded-xl border border-border/60 bg-white/60 px-3 text-sm outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-200",
                errors.elderId && "border-red-400"
              )}
            >
              <option value="">请选择老人</option>
              {elders.map((elder) => (
                <option key={elder.id} value={elder.id}>
                  {elder.name}
                </option>
              ))}
            </select>
            {errors.elderId && <p className="text-xs text-red-500">{errors.elderId}</p>}
          </div>

          <div className="space-y-2">
            <Label>转诊类型 <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              {[1, 2].map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={form.referralType === type ? "default" : "outline"}
                  onClick={() => updateField("referralType", type)}
                  className={cn(
                    "flex-1 rounded-xl",
                    form.referralType === type && "bg-medical-500 hover:bg-medical-600"
                  )}
                >
                  {type === 1 ? "上转（社区→三甲）" : "下转（三甲→社区）"}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>转出机构 <span className="text-red-500">*</span></Label>
              <Input
                value={form.fromOrg || ""}
                onChange={(e) => updateField("fromOrg", e.target.value)}
                placeholder="转出机构"
                className={cn("rounded-xl", errors.fromOrg && "border-red-400")}
              />
              {errors.fromOrg && <p className="text-xs text-red-500">{errors.fromOrg}</p>}
            </div>
            <div className="space-y-2">
              <Label>目标机构 <span className="text-red-500">*</span></Label>
              <Input
                value={form.toOrg || ""}
                onChange={(e) => updateField("toOrg", e.target.value)}
                placeholder="目标机构"
                className={cn("rounded-xl", errors.toOrg && "border-red-400")}
              />
              {errors.toOrg && <p className="text-xs text-red-500">{errors.toOrg}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>转出医生 ID <span className="text-red-500">*</span></Label><Input type="number" min={1} value={form.fromDoctorId || ""} onChange={(event) => updateField("fromDoctorId", Number(event.target.value))} className={cn("rounded-xl", errors.fromDoctorId && "border-red-400")} />{errors.fromDoctorId && <p className="text-xs text-red-500">{errors.fromDoctorId}</p>}</div>
            <div className="space-y-2"><Label>转出医生姓名</Label><Input value={form.fromDoctorName || ""} onChange={(event) => updateField("fromDoctorName", event.target.value)} placeholder="请输入转出医生姓名" className="rounded-xl" /></div>
            <div className="space-y-2"><Label>接收医生 ID <span className="text-red-500">*</span></Label><Input type="number" min={1} value={form.toDoctorId || ""} onChange={(event) => updateField("toDoctorId", Number(event.target.value))} className={cn("rounded-xl", errors.toDoctorId && "border-red-400")} />{errors.toDoctorId && <p className="text-xs text-red-500">{errors.toDoctorId}</p>}</div>
            <div className="space-y-2"><Label>接收医生姓名</Label><Input value={form.toDoctorName || ""} onChange={(event) => updateField("toDoctorName", event.target.value)} placeholder="请输入接收医生姓名" className="rounded-xl" /></div>
          </div>

          <div className="space-y-2">
            <Label>目标科室</Label>
            <Input
              value={form.toDept || ""}
              onChange={(e) => updateField("toDept", e.target.value)}
              placeholder="如：心内科"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>诊断</Label>
            <Input
              value={form.diagnosis || ""}
              onChange={(e) => updateField("diagnosis", e.target.value)}
              placeholder="请输入诊断"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>转诊原因 <span className="text-red-500">*</span></Label>
            <Input
              value={form.referralReason}
              onChange={(e) => updateField("referralReason", e.target.value)}
              placeholder="请输入转诊原因"
              className={cn("rounded-xl", errors.referralReason && "border-red-400")}
            />
            {errors.referralReason && <p className="text-xs text-red-500">{errors.referralReason}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>紧急程度</Label>
              <select
                value={form.urgencyLevel}
                onChange={(e) => updateField("urgencyLevel", Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-border/60 bg-white/60 px-3 text-sm outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-200"
              >
                <option value={1}>普通</option>
                <option value={2}>紧急</option>
                <option value={3}>危急</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>是否预留床位</Label>
              <select
                value={form.bedReserved}
                onChange={(e) => updateField("bedReserved", Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-border/60 bg-white/60 px-3 text-sm outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-200"
              >
                <option value={0}>否</option>
                <option value={1}>是</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>备注</Label>
            <Input
              value={form.remark || ""}
              onChange={(e) => updateField("remark", e.target.value)}
              placeholder="请输入备注"
              className="rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl" disabled={isSubmitting}>
              取消
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white shadow-soft hover:shadow-glow"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "保存中..." : isEdit ? "保存修改" : "确认发起"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
