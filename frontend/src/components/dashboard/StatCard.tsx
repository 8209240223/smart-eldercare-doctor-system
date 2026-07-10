import { motion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  icon: LucideIcon;
  iconClassName?: string;
  delay?: number;
}

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) =>
    Math.floor(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

export default function StatCard({
  title,
  value,
  suffix = "",
  trend,
  trendLabel,
  icon: Icon,
  iconClassName,
  delay = 0,
}: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + delay * 0.1, duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="relative overflow-hidden border-border/40 bg-white/80 shadow-card backdrop-blur-sm transition-shadow hover:shadow-soft">
        <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-medical-100/50 to-transparent blur-2xl" />
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  <AnimatedNumber value={value} />
                </span>
                {suffix && (
                  <span className="text-lg font-semibold text-muted-foreground">
                    {suffix}
                  </span>
                )}
              </div>
              {trend !== undefined && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 font-medium",
                      isPositive
                        ? "bg-medical-100 text-medical-700"
                        : "bg-red-100 text-red-600"
                    )}
                  >
                    {isPositive ? "+" : ""}
                    {trend}%
                  </span>
                  {trendLabel && (
                    <span className="text-muted-foreground">{trendLabel}</span>
                  )}
                </div>
              )}
            </div>
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-soft",
                iconClassName || "from-medical-400 to-medical-500"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
