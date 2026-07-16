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
  Repeat,
  Settings,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  UserCircle,
  Users,
} from "lucide-react";
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
  { path: "/followup", label: "随访计划", icon: CalendarCheck, roles: ["admin", "doctor"] },
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

export default function Sidebar() {
  const location = useLocation();
  const { userInfo } = useAuthStore();
  const role = getUserRole(userInfo);
  const visibleItems = menuItems.filter((item) => item.roles.includes(role));

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-border/40 bg-white/90 shadow-[4px_0_24px_rgba(0,0,0,0.04)] backdrop-blur-xl"
    >
      <div className="flex h-20 items-center gap-3 px-6">
        <motion.div
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-medical-400 to-medical-600 text-white shadow-soft"
          whileHover={{ scale: 1.05, rotate: 3 }}
        >
          <span className="text-lg font-bold">医</span>
        </motion.div>
        <div>
          <h2 className="text-sm font-bold leading-tight text-foreground">智慧医养医生服务系统</h2>
          <p className="text-[10px] text-muted-foreground">React + Spring Boot 医疗服务平台</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.03 }}
            >
              <NavLink
                to={item.path}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                  isActive ? "bg-medical-50 text-medical-700" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-medical-500"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-medical-500" : "text-muted-foreground group-hover:text-foreground")} />
                <span>{item.label}</span>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      <div className="border-t border-border/40 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
          <Avatar className="h-9 w-9"><AvatarImage src={userInfo?.avatar || undefined} alt={userInfo?.realName || userInfo?.username || "用户头像"} /><AvatarFallback className="bg-gradient-to-br from-medical-400 to-sky-400 text-xs font-bold text-white">{userInfo?.realName?.[0] || userInfo?.username?.[0] || "用"}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">{userInfo?.realName || userInfo?.username || "医养用户"}</p>
            <p className="truncate text-[10px] text-muted-foreground">{roleLabel(role)}</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
