import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { CareWorkflowSummary } from "@/hooks/useCareWorkflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface WorkflowNavigationOption {
  key: string;
  label: string;
  description: string;
  to: string;
}

interface WorkflowNavigationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  options: WorkflowNavigationOption[];
  result?: CareWorkflowSummary | null;
  details?: string[];
}

function resultNames(
  value: CareWorkflowSummary["created"] | CareWorkflowSummary["reused"],
) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  return Object.entries(value)
    .filter(([, item]) => Boolean(item))
    .map(([key]) => key);
}

const resultLabels: Record<string, string> = {
  elder: "老人主档",
  health: "健康资料",
  risk: "风险画像",
  plan: "随访计划",
  task: "随访任务",
  report: "AI 健康报告",
  nursing: "护理协同",
};

export default function WorkflowNavigationDialog({
  open,
  onOpenChange,
  title,
  description,
  options,
  result,
  details = [],
}: WorkflowNavigationDialogProps) {
  const navigate = useNavigate();
  const created = resultNames(result?.created);
  const reused = resultNames(result?.reused);

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto rounded-2xl bg-white/95">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-medical-100 text-medical-700">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description || "本次操作已经完成，是否继续进入下一个关联页面？"}
          </DialogDescription>
        </DialogHeader>

        {(created.length > 0 || reused.length > 0 || result?.message) && (
          <div className="space-y-3 rounded-xl border border-medical-100 bg-medical-50/60 p-4">
            {result?.message && (
              <p className="text-sm text-medical-900">{result.message}</p>
            )}
            {created.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  本次新建
                </span>
                {created.map((item) => (
                  <Badge key={item} className="bg-medical-600 text-white">
                    {resultLabels[item] || item}
                  </Badge>
                ))}
              </div>
            )}
            {reused.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  继续复用
                </span>
                {reused.map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className="border-sky-200 bg-sky-50 text-sky-700"
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    {resultLabels[item] || item}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {details.length > 0 && (
          <div className="space-y-2 rounded-xl border border-border/60 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              本次处理明细
            </p>
            {details.map((detail) => (
              <div
                key={detail}
                className="flex min-w-0 items-start gap-2 text-sm text-foreground"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-medical-600" />
                <span className="break-words">{detail}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => go(option.to)}
              className="group flex min-h-24 min-w-0 items-start justify-between gap-3 rounded-xl border border-border/60 bg-white p-4 text-left transition-all hover:border-medical-300 hover:bg-medical-50/50 hover:shadow-sm"
            >
              <span className="min-w-0">
                <span className="block font-semibold text-foreground">
                  {option.label}
                </span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                  {option.description}
                </span>
              </span>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-medical-600" />
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            暂不跳转
          </Button>
          {options[0] && (
            <Button
              onClick={() => go(options[0].to)}
              className="bg-gradient-to-r from-medical-400 to-medical-600 text-white"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {options[0].label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
