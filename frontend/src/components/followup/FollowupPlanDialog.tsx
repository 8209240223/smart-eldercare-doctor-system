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
import type { FollowupPlan } from "@/hooks/useApi";

interface FollowupPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: FollowupPlan;
  elders: { id?: number; name: string }[];
  onSubmit: (data: FollowupPlan) => void;
  isSubmitting?: boolean;
}

const emptyPlan: FollowupPlan = {
  elderId: 0,
  planName: "",
  diseaseType: 1,
  frequencyType: 1,
  startDate: "",
  totalCount: 1,
  status: 1,
  remark: "",
};

export default function FollowupPlanDialog({
  open,
  onOpenChange,
  initialData,
  elders,
  onSubmit,
  isSubmitting,
}: FollowupPlanDialogProps) {
  const [form, setForm] = useState<FollowupPlan>(emptyPlan);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (open) {
      setForm(initialData ? { ...emptyPlan, ...initialData } : { ...emptyPlan });
      setErrors({});
    }
  }, [open, initialData]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.elderId) errs.elderId = "请选择老人";
    if (!form.planName.trim()) errs.planName = "计划名称不能为空";
    if (!form.startDate) errs.startDate = "请选择开始日期";
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errs.endDate = "结束日期不能早于开始日期";
    }
    if (!form.totalCount || form.totalCount < 1) errs.totalCount = "计划次数至少为1";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  const updateField = (field: keyof FollowupPlan, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border-border/40 bg-white/95 p-0 backdrop-blur-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-white/80 px-6 py-4 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {isEdit ? "编辑随访计划" : "新增随访计划"}
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
            <Label>计划名称 <span className="text-red-500">*</span></Label>
            <Input
              value={form.planName}
              onChange={(e) => updateField("planName", e.target.value)}
              placeholder="如：高血压随访计划"
              className={cn("rounded-xl", errors.planName && "border-red-400")}
            />
            {errors.planName && <p className="text-xs text-red-500">{errors.planName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>病种类型 <span className="text-red-500">*</span></Label>
              <select
                value={form.diseaseType}
                onChange={(e) => updateField("diseaseType", Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-border/60 bg-white/60 px-3 text-sm outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-200"
              >
                <option value={1}>高血压</option>
                <option value={2}>糖尿病</option>
                <option value={3}>冠心病</option>
                <option value={4}>脑卒中</option>
                <option value={5}>慢阻肺</option>
                <option value={6}>阿尔茨海默病</option>
                <option value={7}>其他</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>随访频次 <span className="text-red-500">*</span></Label>
              <select
                value={form.frequencyType}
                onChange={(e) => updateField("frequencyType", Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-border/60 bg-white/60 px-3 text-sm outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-200"
              >
                <option value={1}>每周</option>
                <option value={2}>每月</option>
                <option value={3}>每季度</option>
                <option value={4}>每半年</option>
                <option value={5}>每年</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>开始日期 <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={form.startDate || ""}
                onChange={(e) => updateField("startDate", e.target.value)}
                className={cn("rounded-xl", errors.startDate && "border-red-400")}
              />
              {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
            </div>
            <div className="space-y-2">
              <Label>结束日期</Label>
              <Input
                type="date"
                value={form.endDate || ""}
                onChange={(e) => updateField("endDate", e.target.value)}
                min={form.startDate || undefined}
                className={cn("rounded-xl", errors.endDate && "border-red-400")}
              />
              {errors.endDate && <p className="text-xs text-red-500">{errors.endDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>计划总次数 <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min={1}
                value={form.totalCount}
                onChange={(e) => updateField("totalCount", Number(e.target.value))}
                className={cn("rounded-xl", errors.totalCount && "border-red-400")}
              />
              {errors.totalCount && <p className="text-xs text-red-500">{errors.totalCount}</p>}
            </div>
            <div className="space-y-2">
              <Label>计划状态 <span className="text-red-500">*</span></Label>
              <select
                value={form.status ?? 1}
                onChange={(e) => updateField("status", Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-border/60 bg-white/60 px-3 text-sm outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-200"
              >
                <option value={0}>暂停 / 待执行</option>
                <option value={1}>进行中</option>
                <option value={2}>已完成</option>
                <option value={3}>已终止</option>
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
              {isSubmitting ? "保存中..." : isEdit ? "保存修改" : "确认新增"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
