import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export interface TodoItem {
  id: string;
  name: string;
  elderId: string;
  status: "stable" | "pending" | "attention" | "done";
  date: string;
  path?: string;
}

interface TodoListProps {
  items: TodoItem[];
  loading?: boolean;
}

const statusMap = {
  stable: { label: "稳定", className: "bg-medical-100 text-medical-700 hover:bg-medical-100" },
  pending: { label: "待复查", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  attention: { label: "重点关注", className: "bg-red-100 text-red-600 hover:bg-red-100" },
  done: { label: "已处理", className: "bg-sky-100 text-sky-700 hover:bg-sky-100" },
};

export default function TodoList({ items, loading }: TodoListProps) {
  const navigate = useNavigate();
  return (
    <Card className="h-full border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base font-bold">待处理事项</CardTitle>
        <span className="text-xs text-muted-foreground">今日</span>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-340px)] px-5 pb-5">
          <div className="space-y-3">
            {loading && (
              <>
                <Skeleton className="h-[72px] rounded-xl" />
                <Skeleton className="h-[72px] rounded-xl" />
                <Skeleton className="h-[72px] rounded-xl" />
                <Skeleton className="h-[72px] rounded-xl" />
              </>
            )}
            <AnimatePresence mode="popLayout">
              {!loading && items.map((item, index) => (
                <motion.button
                  type="button"
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01, x: 2 }}
                  onClick={() => item.path && navigate(item.path)}
                  disabled={!item.path}
                  className="group w-full rounded-xl border border-border/40 bg-white/60 p-3.5 text-left transition-all hover:border-medical-300 hover:bg-white hover:shadow-soft disabled:cursor-default"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.elderId}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "shrink-0 text-xs",
                        statusMap[item.status].className
                      )}
                    >
                      {statusMap[item.status].label}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{item.date}</p>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
