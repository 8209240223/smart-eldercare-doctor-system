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
import type { HealthWarning } from "@/hooks/useApi";

interface WarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: HealthWarning;
  elders: { id?: number; name: string }[];
  onSubmit: (data: Partial<HealthWarning>) => void;
  isSubmitting?: boolean;
}

const emptyWarning: Partial<HealthWarning> = {
  elderId: undefined,
  warningLevel: 1,
  warningType: 1,
  warningTitle: "",
  warningContent: "",
};

export default function WarningDialog({
  open,
  onOpenChange,
  initialData,
  elders,
  onSubmit,
  isSubmitting,
}: WarningDialogProps) {
  const [form, setForm] = useState<Partial<HealthWarning>>(emptyWarning);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (open) {
      setForm(initialData || emptyWarning);
      setErrors({});
    }
  }, [open, initialData]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.elderId) errs.elderId = "请选择老人";
    if (!form.warningLevel) errs.warningLevel = "请选择预警等级";
    if (!form.warningType) errs.warningType = "请选择预警类型";
    if (!form.warningTitle?.trim()) errs.warningTitle = "预警标题不能为空";
    if (!form.warningContent?.trim()) errs.warningContent = "预警内容不能为空";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  const updateField = (field: keyof HealthWarning, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border-border/40 bg-white/95 p-0 backdrop-blur-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-white/80 px-6 py-4 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {isEdit ? "编辑预警" : "手动添加预警"}
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
            <Label>预警等级 <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              {[1, 2, 3].map((level) => (
                <Button
                  key={level}
                  type="button"
                  variant={form.warningLevel === level ? "default" : "outline"}
                  onClick={() => updateField("warningLevel", level)}
                  className={cn(
                    "flex-1 rounded-xl",
                    form.warningLevel === level && "bg-medical-500 hover:bg-medical-600"
                  )}
                >
                  {level === 1 ? "低危" : level === 2 ? "中危" : "高危"}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>预警类型</Label>
            <select
              value={form.warningType || ""}
              onChange={(e) => updateField("warningType", Number(e.target.value))}
              className="h-10 w-full rounded-xl border border-border/60 bg-white/60 px-3 text-sm outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-200"
            >
              <option value="">请选择</option>
              <option value={1}>血压异常</option>
              <option value={2}>血糖异常</option>
              <option value={3}>心率异常</option>
              <option value={4}>血氧异常</option>
              <option value={5}>设备离线</option>
              <option value={6}>睡眠异常</option>
              <option value={7}>其他</option>
            </select>
            {errors.warningType && <p className="text-xs text-red-500">{errors.warningType}</p>}
          </div>

          <div className="space-y-2">
            <Label>预警标题 <span className="text-red-500">*</span></Label>
            <Input value={form.warningTitle || ""} onChange={(e) => updateField("warningTitle", e.target.value)} placeholder="请输入预警标题" className={cn("rounded-xl", errors.warningTitle && "border-red-400")} />
            {errors.warningTitle && <p className="text-xs text-red-500">{errors.warningTitle}</p>}
          </div>

          <div className="space-y-2">
            <Label>预警内容 <span className="text-red-500">*</span></Label>
            <Input
              value={form.warningContent || ""}
              onChange={(e) => updateField("warningContent", e.target.value)}
              placeholder="请输入预警内容"
              className={cn("rounded-xl", errors.warningContent && "border-red-400")}
            />
            {errors.warningContent && <p className="text-xs text-red-500">{errors.warningContent}</p>}
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
              {isSubmitting ? "保存中..." : isEdit ? "保存修改" : "确认添加"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
