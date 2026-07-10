import {
  Bot,
  ClipboardCheck,
  ClipboardList,
  FileHeart,
  HeartPulse,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { motion } from "motion/react";
import type {
  CareWorkflowSummary,
  WorkflowStage,
} from "@/hooks/useCareWorkflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CareWorkflowStepperProps {
  summary: CareWorkflowSummary;
  onNavigate: (key: string, fallback: string) => void;
}

function stageState(stage: WorkflowStage | undefined, fallbackDone = false) {
  const raw = String(stage?.status ?? "").toLowerCase();
  const count = Number(
    stage?.count ?? stage?.ids?.length ?? (stage?.id ? 1 : 0),
  );
  if (["in_progress", "progress", "active", "进行中"].includes(raw)) {
    return "in_progress" as const;
  }
  if (["pending", "missing", "draft", "待补充", "待执行"].includes(raw)) {
    return "pending" as const;
  }
  if (
    stage?.completed === true ||
    stage?.exists === true ||
    count > 0 ||
    ["completed", "complete", "done", "ready", "confirmed", "已完成"].includes(
      raw,
    )
  ) {
    return "completed" as const;
  }
  if (count > 0) return "in_progress" as const;
  return fallbackDone ? ("completed" as const) : ("pending" as const);
}

function stageDetail(stage: WorkflowStage | undefined, fallback: string) {
  if (!stage) return fallback;
  const count = Number(stage.count ?? stage.ids?.length ?? 0);
  const id = stage.id;
  const parts = [stage.statusText, stage.name, stage.title]
    .filter(Boolean)
    .map(String);
  if (count > 0) parts.push(`${count} 条`);
  if (id) parts.push(`ID ${id}`);
  return parts.join(" · ") || stage.message || fallback;
}

export default function CareWorkflowStepper({
  summary,
  onNavigate,
}: CareWorkflowStepperProps) {
  const health =
    summary.health || summary.elder.healthRecord || summary.elder.health;
  const nursing = summary.nursing || summary.care;
  const steps = [
    {
      key: "elder",
      title: "老人档案",
      detail: `${summary.elder.name || "姓名未同步"}${summary.elder.idCard ? ` · ${summary.elder.idCard}` : ""}`,
      state: "completed" as const,
      icon: UserRound,
      fallback: "/elders",
    },
    {
      key: "health",
      title: "健康资料",
      detail: stageDetail(health, "等待补充健康档案、病史、用药和体检数据"),
      state: stageState(health),
      icon: HeartPulse,
      fallback: `/elders?elderId=${summary.elder.id}`,
    },
    {
      key: "risk",
      title: "风险分层",
      detail: stageDetail(summary.risk, "尚未计算风险画像"),
      state: stageState(summary.risk),
      icon: ShieldCheck,
      fallback: `/key-population?elderId=${summary.elder.id}`,
    },
    {
      key: "plan",
      title: "随访计划",
      detail: stageDetail(summary.plan, "尚未建立随访计划"),
      state: stageState(summary.plan),
      icon: ClipboardList,
      fallback: `/followup?elderId=${summary.elder.id}`,
    },
    {
      key: "task",
      title: "随访任务",
      detail: stageDetail(summary.task, "尚未生成随访任务"),
      state: stageState(summary.task),
      icon: ClipboardCheck,
      fallback: `/followup-tasks?elderId=${summary.elder.id}`,
    },
    {
      key: "report",
      title: "AI 健康报告",
      detail: stageDetail(summary.report, "尚未生成健康报告"),
      state: stageState(summary.report),
      icon: Bot,
      fallback: `/ai-reports?elderId=${summary.elder.id}`,
    },
    {
      key: "nursing",
      title: "护理协同",
      detail: stageDetail(nursing, "等待护士建立护理计划或护理记录"),
      state: stageState(nursing),
      icon: FileHeart,
      fallback: `/nurse-plans?elderId=${summary.elder.id}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-7">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative min-w-0"
          >
            {index < steps.length - 1 && (
              <div className="absolute left-[calc(50%+28px)] right-[calc(-50%+28px)] top-8 hidden h-px bg-border lg:block" />
            )}
            <Card className="h-full border-border/50 bg-white/85 shadow-sm">
              <CardContent className="flex h-full flex-col gap-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${step.state === "completed" ? "bg-medical-100 text-medical-700" : step.state === "in_progress" ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      step.state === "completed"
                        ? "border-medical-200 bg-medical-50 text-medical-700"
                        : step.state === "in_progress"
                          ? "border-sky-200 bg-sky-50 text-sky-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                    }
                  >
                    {step.state === "completed"
                      ? "已完成"
                      : step.state === "in_progress"
                        ? "进行中"
                        : "待补充"}
                  </Badge>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                    {step.detail}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={() => onNavigate(step.key, step.fallback)}
                >
                  查看
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
