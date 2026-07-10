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
import type { Assessment } from "@/hooks/useApi";

interface AssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Assessment;
  elders: { id?: number; name: string }[];
  defaultDoctorId?: number;
  onSubmit: (data: Assessment) => void;
  isSubmitting?: boolean;
}

const emptyAssessment: Assessment = {
  elderId: 0,
  assessType: 9,
  assessDate: "",
  score: 80,
  level: "良好",
  result: "",
  suggestion: "",
};

export default function AssessmentDialog({
  open,
  onOpenChange,
  initialData,
  elders,
  defaultDoctorId,
  onSubmit,
  isSubmitting,
}: AssessmentDialogProps) {
  const [form, setForm] = useState<Assessment>(emptyAssessment);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (open) {
      setForm(initialData || { ...emptyAssessment, doctorId: defaultDoctorId });
      setErrors({});
    }
  }, [defaultDoctorId, open, initialData]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.elderId) errs.elderId = "请选择老人";
    if (form.score === undefined || form.score < 0 || form.score > 100) errs.score = "评分需在 0-100 之间";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  const updateField = (field: keyof Assessment, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border-border/40 bg-white/95 p-0 backdrop-blur-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-white/80 px-6 py-4 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {isEdit ? "编辑评估" : "新增评估"}
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
            <Label>评估类型</Label>
            <select
              value={form.assessType}
              onChange={(e) => updateField("assessType", Number(e.target.value))}
              className="h-10 w-full rounded-xl border border-border/60 bg-white/60 px-3 text-sm outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-200"
            >
              <option value={1}>日常生活能力</option>
              <option value={2}>认知功能</option>
              <option value={3}>情绪/心理</option>
              <option value={4}>营养</option>
              <option value={5}>跌倒风险</option>
              <option value={6}>压疮风险</option>
              <option value={7}>疼痛</option>
              <option value={8}>社会功能</option>
              <option value={9}>综合</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>责任医生 ID</Label>
            <Input type="number" min={1} value={form.doctorId || ""} onChange={(event) => updateField("doctorId", event.target.value ? Number(event.target.value) : "")} placeholder="默认当前登录医生" className="rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>评估日期</Label>
              <Input
                type="date"
                value={form.assessDate || ""}
                onChange={(e) => updateField("assessDate", e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>评分 <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.score}
                onChange={(e) => updateField("score", Number(e.target.value))}
                className={cn("rounded-xl", errors.score && "border-red-400")}
              />
              {errors.score && <p className="text-xs text-red-500">{errors.score}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>评估等级</Label>
            <Input
              value={form.level || ""}
              onChange={(e) => updateField("level", e.target.value)}
              placeholder="如：良好、一般、较差"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>评估结果</Label>
            <Input
              value={form.result || ""}
              onChange={(e) => updateField("result", e.target.value)}
              placeholder="请输入评估结果"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>建议</Label>
            <Input
              value={form.suggestion || ""}
              onChange={(e) => updateField("suggestion", e.target.value)}
              placeholder="请输入建议"
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
