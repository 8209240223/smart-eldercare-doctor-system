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
import type { PhysicalExam } from "@/hooks/useApi";

interface ExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: PhysicalExam;
  elders: { id?: number; name: string }[];
  onSubmit: (data: PhysicalExam) => void;
  isSubmitting?: boolean;
}

const emptyExam: PhysicalExam = {
  elderId: 0,
  examDate: "",
};

export default function ExamDialog({
  open,
  onOpenChange,
  initialData,
  elders,
  onSubmit,
  isSubmitting,
}: ExamDialogProps) {
  const [form, setForm] = useState<PhysicalExam>(emptyExam);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (open) {
      setForm(initialData || emptyExam);
      setErrors({});
    }
  }, [open, initialData]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.elderId) errs.elderId = "请选择老人";
    if (!form.examDate) errs.examDate = "请选择体检日期";
    if (form.systolicPressure !== undefined && form.diastolicPressure !== undefined
      && form.systolicPressure <= form.diastolicPressure) {
      errs.diastolicPressure = "收缩压必须大于舒张压";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  const updateField = (field: keyof PhysicalExam, value: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border-border/40 bg-white/95 p-0 backdrop-blur-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-white/80 px-6 py-4 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {isEdit ? "编辑体检记录" : "新增体检记录"}
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
              <Label>体检日期 <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={form.examDate || ""}
                onChange={(e) => updateField("examDate", e.target.value)}
                className={cn("rounded-xl", errors.examDate && "border-red-400")}
              />
              {errors.examDate && <p className="text-xs text-red-500">{errors.examDate}</p>}
            </div>

            <div className="space-y-2">
              <Label>身高（cm）</Label>
              <Input
                type="number"
                step="0.1"
                min={50}
                max={230}
                value={form.height ?? ""}
                onChange={(e) => updateField("height", e.target.value === "" ? undefined : Number(e.target.value))}
                placeholder="身高"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>体重（kg）</Label>
              <Input
                type="number"
                step="0.1"
                min={20}
                max={200}
                value={form.weight ?? ""}
                onChange={(e) => updateField("weight", e.target.value === "" ? undefined : Number(e.target.value))}
                placeholder="体重"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>收缩压（mmHg）</Label>
              <Input
                type="number"
                min={60}
                max={240}
                value={form.systolicPressure ?? ""}
                onChange={(e) => updateField("systolicPressure", e.target.value === "" ? undefined : Number(e.target.value))}
                placeholder="收缩压"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>舒张压（mmHg）</Label>
              <Input
                type="number"
                min={40}
                max={140}
                value={form.diastolicPressure ?? ""}
                onChange={(e) => updateField("diastolicPressure", e.target.value === "" ? undefined : Number(e.target.value))}
                placeholder="舒张压"
                className="rounded-xl"
              />
              {errors.diastolicPressure && <p className="text-xs text-red-500">{errors.diastolicPressure}</p>}
            </div>

            <div className="space-y-2">
              <Label>心率（bpm）</Label>
              <Input
                type="number"
                min={30}
                max={180}
                value={form.heartRate ?? ""}
                onChange={(e) => updateField("heartRate", e.target.value === "" ? undefined : Number(e.target.value))}
                placeholder="心率"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>空腹血糖（mmol/L）</Label>
              <Input
                type="number"
                step="0.1"
                min={2}
                max={30}
                value={form.bloodSugarFasting ?? ""}
                onChange={(e) => updateField("bloodSugarFasting", e.target.value === "" ? undefined : Number(e.target.value))}
                placeholder="空腹血糖"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>随机血糖（mmol/L）</Label>
              <Input
                type="number"
                step="0.1"
                min={2}
                max={35}
                value={form.bloodSugarRandom ?? ""}
                onChange={(e) => updateField("bloodSugarRandom", e.target.value === "" ? undefined : Number(e.target.value))}
                placeholder="随机血糖"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>体温（℃）</Label>
              <Input
                type="number"
                step="0.1"
                min={34}
                max={42}
                value={form.temperature ?? ""}
                onChange={(e) => updateField("temperature", e.target.value === "" ? undefined : Number(e.target.value))}
                placeholder="体温"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>血氧（%）</Label>
              <Input
                type="number"
                step="0.1"
                min={50}
                max={100}
                value={form.bloodOxygen ?? ""}
                onChange={(e) => updateField("bloodOxygen", e.target.value === "" ? undefined : Number(e.target.value))}
                placeholder="血氧"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>腰围（cm）</Label>
              <Input
                type="number"
                step="0.1"
                min={40}
                max={180}
                value={form.waistline ?? ""}
                onChange={(e) => updateField("waistline", e.target.value === "" ? undefined : Number(e.target.value))}
                placeholder="腰围"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>BMI</Label>
              <Input
                type="number"
                step="0.1"
                value={form.height && form.weight ? (form.weight / ((form.height / 100) ** 2)).toFixed(1) : form.bmi ?? ""}
                placeholder="由身高和体重自动计算"
                className="rounded-xl bg-muted/40"
                readOnly
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>体检摘要</Label>
              <Input
                value={form.examSummary || ""}
                onChange={(e) => updateField("examSummary", e.target.value)}
                placeholder="请输入体检摘要"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>医生建议</Label>
              <Input
                value={form.doctorAdvice || ""}
                onChange={(e) => updateField("doctorAdvice", e.target.value)}
                placeholder="请输入医生建议"
                className="rounded-xl"
              />
            </div>
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
