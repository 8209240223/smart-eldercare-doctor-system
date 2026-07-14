import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { ComponentType } from "react";
import { motion } from "motion/react";
import {
  Activity,
  Bell,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileText,
  History,
  HeartHandshake,
  LayoutDashboard,
  Menu,
  Repeat,
  Settings,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  UserCircle,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getUserRole, type UserRole, useAuthStore } from "@/store/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type MenuItem = {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  roles: UserRole[];
};

const menuItems: MenuItem[] = [
  { path: "/", label: "医生工作台", icon: LayoutDashboard, roles: ["doctor"] },
  { path: "/admin-dashboard", label: "管理员工作台", icon: LayoutDashboard, roles: ["admin"] },
  { path: "/admin/users", label: "用户治理", icon: Users, roles: ["admin"] },
  { path: "/admin/operation-logs", label: "操作审计", icon: History, roles: ["admin"] },
  { path: "/nurse-dashboard", label: "护士工作台", icon: LayoutDashboard, roles: ["nurse"] },
  { path: "/elders", label: "老人档案", icon: Users, roles: ["admin", "doctor", "nurse"] },
  { path: "/warnings", label: "预警中心", icon: Bell, roles: ["admin", "doctor", "nurse"] },
  { path: "/key-population", label: "重点人群", icon: ShieldAlert, roles: ["admin", "doctor", "nurse"] },
  { path: "/followup", label: "随访计划", icon: CalendarCheck, roles: ["admin", "doctor", "nurse"] },
  { path: "/followup-tasks", label: "随访任务", icon: Clock, roles: ["admin", "doctor", "nurse"] },
  { path: "/interventions", label: "干预管理", icon: Stethoscope, roles: ["admin", "doctor", "nurse"] },
  { path: "/assessments", label: "评估记录", icon: FileText, roles: ["admin", "doctor", "nurse"] },
  { path: "/referrals", label: "患者移交", icon: Repeat, roles: ["admin", "doctor"] },
  { path: "/vitals", label: "生命体征", icon: Activity, roles: ["admin", "doctor", "nurse"] },
  { path: "/exams", label: "体检管理", icon: ClipboardList, roles: ["admin", "doctor", "nurse"] },
  { path: "/timeline", label: "健康时间轴", icon: Clock, roles: ["admin", "doctor", "nurse"] },
  { path: "/nurse-records", label: "护理记录", icon: HeartHandshake, roles: ["nurse", "admin"] },
  { path: "/nurse-plans", label: "护理计划", icon: ClipboardList, roles: ["nurse", "admin"] },
  { path: "/nurse-review", label: "护士审核", icon: ClipboardCheck, roles: ["admin", "doctor"] },
  { path: "/ai-reports", label: "AI 报告", icon: Sparkles, roles: ["admin", "doctor", "nurse"] },
  { path: "/warning-rules", label: "预警规则", icon: Settings, roles: ["admin", "doctor"] },
  { path: "/messages", label: "消息协同", icon: Bell, roles: ["admin", "doctor", "nurse"] },
  { path: "/profile", label: "个人中心", icon: UserCircle, roles: ["admin", "doctor", "nurse"] },
];

function roleLabel(role: UserRole) {
  if (role === "admin") return "管理员";
  if (role === "nurse") return "护士";
  return "医生";
}

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { userInfo } = useAuthStore();
  const role = getUserRole(userInfo);
  const visibleItems = menuItems.filter((item) => item.roles.includes(role));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-white/60 text-foreground lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] border-r border-border/40 bg-white/95 p-0 backdrop-blur-xl">
        <div className="flex h-20 items-center gap-3 px-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-medical-400 to-medical-600 text-white shadow-soft">
            <span className="text-lg font-bold">医</span>
          </div>
          <div>
            <h2 className="text-sm font-bold leading-tight text-foreground">智慧医养医生服务系统</h2>
            <p className="text-[10px] text-muted-foreground">React + Spring Boot 医疗服务平台</p>
          </div>
        </div>

        <nav className="max-h-[calc(100vh-170px)] space-y-1 overflow-y-auto px-3 py-4">
          {visibleItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <NavLink
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    isActive ? "bg-medical-50 text-medical-700" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-medical-500" : "text-muted-foreground")} />
                  <span>{item.label}</span>
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border/40 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
            <Avatar className="h-9 w-9"><AvatarImage src={userInfo?.avatar || undefined} alt={userInfo?.realName || userInfo?.username || "用户头像"} /><AvatarFallback className="bg-gradient-to-br from-medical-400 to-sky-400 text-xs font-bold text-white">{userInfo?.realName?.[0] || userInfo?.username?.[0] || "用"}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">{userInfo?.realName || userInfo?.username || "医养用户"}</p>
              <p className="truncate text-[10px] text-muted-foreground">{roleLabel(role)}</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
