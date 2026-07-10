import type { ElderInfo } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

interface ElderMasterSelectProps {
  elders: ElderInfo[];
  value?: number | string;
  onChange: (elderId?: number) => void;
  label?: string;
  allowAll?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function ElderMasterSelect({
  elders,
  value,
  onChange,
  label,
  allowAll = true,
  placeholder = "请选择老人档案",
  className,
  disabled,
}: ElderMasterSelectProps) {
  return (
    <label className={cn("block min-w-0", className)}>
      {label && (
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      )}
      <select
        aria-label={label || placeholder}
        value={value || ""}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value ? Number(event.target.value) : undefined)
        }
        className={cn(
          "h-10 w-full rounded-xl border border-border/60 bg-white/80 px-3 text-sm outline-none transition-colors focus:border-medical-400 focus:ring-2 focus:ring-medical-100",
          label && "mt-2",
        )}
      >
        <option value="">{allowAll ? "全部老人" : placeholder}</option>
        {elders.map((elder) => (
          <option key={elder.id} value={elder.id}>
            {elder.name || "姓名未同步"}
            {elder.idCard ? ` · ${elder.idCard}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
