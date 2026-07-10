import type { ComponentType, ReactNode } from "react";
import {
  Activity,
  CalendarDays,
  ClipboardCheck,
  FileText,
  HeartPulse,
  Pill,
  Stethoscope,
  UserRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface DetailField {
  label: string;
  value: ReactNode;
  wide?: boolean;
}

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  fields?: DetailField[];
  loading?: boolean;
  children?: ReactNode;
}

type FieldVisual = {
  icon: ComponentType<{ className?: string }>;
  iconClassName: string;
  cardClassName: string;
};

const fieldVisuals: FieldVisual[] = [
  {
    icon: UserRound,
    iconClassName: "bg-medical-100 text-medical-700",
    cardClassName: "border-medical-100/80 bg-medical-50/45",
  },
  {
    icon: CalendarDays,
    iconClassName: "bg-sky-100 text-sky-700",
    cardClassName: "border-sky-100/80 bg-sky-50/45",
  },
  {
    icon: Activity,
    iconClassName: "bg-amber-100 text-amber-700",
    cardClassName: "border-amber-100/80 bg-amber-50/45",
  },
  {
    icon: ClipboardCheck,
    iconClassName: "bg-rose-100 text-rose-700",
    cardClassName: "border-rose-100/80 bg-rose-50/45",
  },
];

function fieldVisual(label: string, index: number): FieldVisual {
  if (/老人|患者|医生|护士|联系人/.test(label)) return fieldVisuals[0];
  if (/时间|日期|随访|创建/.test(label)) return fieldVisuals[1];
  if (/血压|心率|血糖|体温|血氧|体重|BMI|评分|风险/.test(label)) {
    return {
      icon: HeartPulse,
      iconClassName: "bg-rose-100 text-rose-700",
      cardClassName: "border-rose-100/80 bg-rose-50/45",
    };
  }
  if (/用药|药物/.test(label)) {
    return {
      icon: Pill,
      iconClassName: "bg-violet-100 text-violet-700",
      cardClassName: "border-violet-100/80 bg-violet-50/45",
    };
  }
  if (/方式|类型|状态|结论|结果|评价/.test(label)) return fieldVisuals[3];
  return fieldVisuals[index % fieldVisuals.length];
}

export default function DetailDialog({
  open,
  onOpenChange,
  title,
  subtitle = "信息已按业务维度整理",
  fields = [],
  loading,
  children,
}: DetailDialogProps) {
  const summaryFields = fields.filter((field) => !field.wide);
  const narrativeFields = fields.filter((field) => field.wide);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-4xl overflow-hidden rounded-lg border-border/50 bg-slate-50/95 p-0 shadow-2xl backdrop-blur-xl">
        <div className="border-b border-border/50 bg-white/95 px-5 py-4 sm:px-6">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-medical-100 text-medical-700">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-bold text-foreground">
                  {title}
                </DialogTitle>
                <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </div>
          </DialogHeader>
        </div>
        <div className="max-h-[calc(90vh-138px)] overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {summaryFields.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-medical-600" />
                    <h3 className="text-sm font-semibold text-foreground">
                      关键数据
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {summaryFields.map((field, index) => {
                      const visual = fieldVisual(field.label, index);
                      const Icon = visual.icon;
                      return (
                        <div
                          key={`${field.label}-${index}`}
                          className={cn(
                            "min-h-24 rounded-lg border p-4",
                            visual.cardClassName,
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                visual.iconClassName,
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                {field.label}
                              </p>
                              <div className="mt-1.5 break-words text-sm font-semibold leading-6 text-foreground">
                                {field.value ?? "-"}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {narrativeFields.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-sky-600" />
                    <h3 className="text-sm font-semibold text-foreground">
                      记录内容
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {narrativeFields.map((field, index) => (
                      <div
                        key={`${field.label}-${index}`}
                        className="rounded-lg border border-sky-100/80 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-2 text-sky-700">
                          <FileText className="h-4 w-4" />
                          <p className="text-xs font-semibold">{field.label}</p>
                        </div>
                        <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                          {field.value ?? "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {children && (
                <section className="border-t border-border/50 pt-5">
                  {children}
                </section>
              )}
              {fields.length === 0 && !children && (
                <div className="rounded-lg border border-dashed border-border bg-white px-6 py-12 text-center text-sm text-muted-foreground">
                  暂无可展示的详情
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="border-t border-border/50 bg-white px-5 py-3 sm:px-6">
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
