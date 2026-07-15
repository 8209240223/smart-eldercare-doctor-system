import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VitalSignData, WearableDevice } from "@/hooks/useApi";

interface VitalMetric {
  dataType: number;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  warningExample: number;
}

const metricsByDeviceType: Record<number, VitalMetric[]> = {
  1: [
    { dataType: 3, label: "心率", unit: "bpm", min: 30, max: 180, step: 1, warningExample: 130 },
    { dataType: 6, label: "血氧饱和度", unit: "%", min: 50, max: 100, step: 0.1, warningExample: 88 },
    { dataType: 7, label: "体温", unit: "°C", min: 34, max: 42, step: 0.1, warningExample: 39.5 },
    { dataType: 8, label: "步数", unit: "步", min: 0, max: 100000, step: 1, warningExample: 120 },
    { dataType: 9, label: "睡眠时长", unit: "小时", min: 0, max: 24, step: 0.1, warningExample: 2.5 },
  ],
  2: [
    { dataType: 1, label: "收缩压", unit: "mmHg", min: 60, max: 240, step: 1, warningExample: 190 },
    { dataType: 2, label: "舒张压", unit: "mmHg", min: 40, max: 140, step: 1, warningExample: 120 },
  ],
  3: [
    { dataType: 4, label: "空腹血糖", unit: "mmol/L", min: 2, max: 30, step: 0.1, warningExample: 12 },
    { dataType: 5, label: "餐后血糖", unit: "mmol/L", min: 2, max: 35, step: 0.1, warningExample: 16 },
  ],
  4: [
    { dataType: 3, label: "心率", unit: "bpm", min: 30, max: 180, step: 1, warningExample: 130 },
  ],
};

function localDateTimeValue() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

interface DeviceVitalDialogProps {
  open: boolean;
  device: WearableDevice | null;
  elderName?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: VitalSignData[]) => Promise<void>;
  isSubmitting?: boolean;
}

export default function DeviceVitalDialog({
  open,
  device,
  elderName,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: DeviceVitalDialogProps) {
  const [values, setValues] = useState<Record<number, string>>({});
  const [measureTime, setMeasureTime] = useState(localDateTimeValue);
  const [error, setError] = useState("");
  const metrics = useMemo(
    () => device ? metricsByDeviceType[device.deviceType] || [] : [],
    [device],
  );

  useEffect(() => {
    if (!open) return;
    setValues({});
    setMeasureTime(localDateTimeValue());
    setError("");
  }, [open, device?.id]);

  const fillWarningExample = () => {
    setValues(Object.fromEntries(metrics.map((metric) => [metric.dataType, String(metric.warningExample)])));
    setError("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!device?.id) {
      setError("设备信息无效，请重新绑定设备");
      return;
    }
    if (!measureTime) {
      setError("请选择测量时间");
      return;
    }
    if (new Date(measureTime).getTime() > Date.now() + 60_000) {
      setError("测量时间不能晚于当前时间");
      return;
    }

    const selectedMetrics = metrics.filter((metric) => values[metric.dataType]?.trim());
    if (selectedMetrics.length === 0) {
      setError("请至少输入一项生命体征数据");
      return;
    }
    if (device.deviceType === 2 && selectedMetrics.length !== 2) {
      setError("血压计需要同时输入收缩压和舒张压");
      return;
    }

    for (const metric of selectedMetrics) {
      const numericValue = Number(values[metric.dataType]);
      if (!Number.isFinite(numericValue) || numericValue < metric.min || numericValue > metric.max) {
        setError(`${metric.label}必须在 ${metric.min} 到 ${metric.max} ${metric.unit}之间`);
        return;
      }
    }

    if (device.deviceType === 2 && Number(values[1]) <= Number(values[2])) {
      setError("收缩压必须大于舒张压");
      return;
    }

    setError("");
    try {
      await onSubmit(selectedMetrics.map((metric) => ({
        elderId: device.elderId,
        deviceId: device.id,
        dataType: metric.dataType,
        dataValue: Number(values[metric.dataType]),
        unit: metric.unit,
        measureTime: `${measureTime}:00`,
      })));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "模拟数据录入失败");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto rounded-lg border-border/40 bg-white/95 p-0 backdrop-blur-xl">
        <div className="border-b border-border/40 bg-white/90 px-5 py-4 sm:px-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <FlaskConical className="h-5 w-5 text-medical-500" />
              输入模拟数据
            </DialogTitle>
            <DialogDescription>
              {elderName || "当前老人"} · {device?.deviceName || "已绑定设备"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={fillWarningExample} className="rounded-xl" disabled={isSubmitting}>
              <FlaskConical className="h-4 w-4" />
              填入预警示例
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {metrics.map((metric) => (
              <div key={metric.dataType} className="space-y-2">
                <Label htmlFor={`vital-${metric.dataType}`}>{metric.label}（{metric.unit}）</Label>
                <Input
                  id={`vital-${metric.dataType}`}
                  type="number"
                  min={metric.min}
                  max={metric.max}
                  step={metric.step}
                  value={values[metric.dataType] || ""}
                  onChange={(event) => {
                    setValues((current) => ({ ...current, [metric.dataType]: event.target.value }));
                    setError("");
                  }}
                  placeholder={`${metric.min} - ${metric.max}`}
                  className="h-11 rounded-xl bg-white"
                />
              </div>
            ))}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="vital-measure-time">测量时间</Label>
              <Input
                id="vital-measure-time"
                type="datetime-local"
                value={measureTime}
                onChange={(event) => {
                  setMeasureTime(event.target.value);
                  setError("");
                }}
                className="h-11 rounded-xl bg-white"
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 border-t border-border/40 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl" disabled={isSubmitting}>
              取消
            </Button>
            <Button type="submit" className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white" disabled={isSubmitting || metrics.length === 0}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "检测中..." : "上传并检测预警"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
