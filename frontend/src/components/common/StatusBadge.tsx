import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "stable" | "pending" | "attention" | "done" | "primary" | "secondary";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusMap: Record<StatusType, { label: string; className: string }> = {
  stable: { label: "稳定", className: "bg-medical-100 text-medical-700 hover:bg-medical-100" },
  pending: { label: "待复查", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  attention: { label: "重点关注", className: "bg-red-100 text-red-600 hover:bg-red-100" },
  done: { label: "已处理", className: "bg-sky-100 text-sky-700 hover:bg-sky-100" },
  primary: { label: "进行中", className: "bg-medical-100 text-medical-700 hover:bg-medical-100" },
  secondary: { label: "待处理", className: "bg-lavender-100 text-lavender-700 hover:bg-lavender-100" },
};

export default function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusMap[status];
  return (
    <Badge
      variant="secondary"
      className={cn("text-xs font-medium", config.className, className)}
    >
      {label || config.label}
    </Badge>
  );
}
