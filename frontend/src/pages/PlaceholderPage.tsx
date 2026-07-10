import { motion } from "motion/react";
import PageShell from "@/components/layout/PageShell";
import TodoList, { type TodoItem } from "@/components/dashboard/TodoList";
import { Construction } from "lucide-react";

const todoItems: TodoItem[] = [
  { id: "1", name: "王大爷", elderId: "10020", status: "stable", date: "2026-07-09" },
  { id: "2", name: "李奶奶", elderId: "10021", status: "pending", date: "2026-07-08" },
  { id: "3", name: "赵阿姨", elderId: "10022", status: "attention", date: "2026-07-07" },
];

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
}

export default function PlaceholderPage({
  title,
  subtitle,
  backgroundImage,
}: PlaceholderPageProps) {
  return (
    <PageShell
      title={title}
      subtitle={subtitle}
      backgroundImage={backgroundImage}
      rightPanel={<TodoList items={todoItems} />}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-white/60 backdrop-blur-sm"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-medical-100 text-medical-500">
          <Construction className="h-10 w-10" />
        </div>
        <h3 className="mt-6 text-lg font-semibold text-foreground">模块开发中</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          该页面将在 Phase 2 中实现完整功能
        </p>
      </motion.div>
    </PageShell>
  );
}
