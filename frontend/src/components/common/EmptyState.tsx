import { motion } from "motion/react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export default function EmptyState({
  title = "暂无数据",
  description = "当前列表为空",
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-white/60 py-12 backdrop-blur-sm"
    >
      <div className="h-32 w-32 bg-contain bg-center bg-no-repeat opacity-80"
        style={{ backgroundImage: "url('/images/暂无数据UI_医疗档案空状态插图.png')" }}
      />
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}
