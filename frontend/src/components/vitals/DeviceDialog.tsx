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
import { ChevronDown, Loader2 } from "lucide-react";
import type { WearableDevice } from "@/hooks/useApi";

const deviceTypeOptions = [
  { value: 1, label: "智能手环" },
  { value: 2, label: "血压计" },
  { value: 3, label: "血糖仪" },
  { value: 4, label: "心电监护" },
];

interface DeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elderId: number;
  onSubmit: (data: WearableDevice) => void;
  isSubmitting?: boolean;
}

export default function DeviceDialog({
  open,
  onOpenChange,
  elderId,
  onSubmit,
  isSubmitting,
}: DeviceDialogProps) {
  const [form, setForm] = useState<WearableDevice>({
    elderId,
    deviceName: "",
    deviceSn: "",
    deviceType: 1,
    bindStatus: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({ elderId, deviceName: "", deviceSn: "", deviceType: 1, bindStatus: 1 });
      setErrors({});
    }
  }, [open, elderId]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.deviceName.trim() || form.deviceName.trim().length > 50) errs.deviceName = "设备名称不能为空且不能超过50个字符";
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{2,63}$/.test(form.deviceSn.trim())) {
      errs.deviceSn = "请输入3到64位字母、数字或 . _ : -";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      deviceName: form.deviceName.trim(),
      deviceSn: form.deviceSn.trim().toUpperCase(),
    });
  };

  const updateField = (field: keyof WearableDevice, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border-border/40 bg-white/95 p-0 backdrop-blur-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-white/80 px-6 py-4 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">绑定设备</DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="space-y-2">
            <Label>设备名称 <span className="text-red-500">*</span></Label>
            <Input
              value={form.deviceName}
              onChange={(e) => updateField("deviceName", e.target.value)}
              placeholder="如：华为手环 9"
              maxLength={50}
              className={cn("rounded-xl", errors.deviceName && "border-red-400")}
            />
            {errors.deviceName && <p className="text-xs text-red-500">{errors.deviceName}</p>}
          </div>

          <div className="space-y-2">
            <Label>设备序列号 <span className="text-red-500">*</span></Label>
            <Input
              value={form.deviceSn}
              onChange={(e) => updateField("deviceSn", e.target.value)}
              placeholder="请输入设备序列号"
              maxLength={64}
              autoCapitalize="characters"
              className={cn("rounded-xl", errors.deviceSn && "border-red-400")}
            />
            {errors.deviceSn && <p className="text-xs text-red-500">{errors.deviceSn}</p>}
          </div>

          <div className="space-y-2">
            <Label>设备类型</Label>
            <div className="relative">
              <select
                value={form.deviceType}
                onChange={(e) => updateField("deviceType", Number(e.target.value))}
                className="h-10 w-full appearance-none rounded-xl border border-input bg-background px-3 pr-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {deviceTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} - {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              {isSubmitting ? "绑定中..." : "确认绑定"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
