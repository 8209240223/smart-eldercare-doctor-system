import { motion } from "motion/react";
import { LogOut, Plus, UserCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { post } from "@/lib/api";
import { getUserRole, useAuthStore } from "@/store/auth";
import MobileSidebar from "./MobileSidebar";

interface HeaderProps { title: string; subtitle?: string; }

export default function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const { userInfo, tokenId, logout } = useAuthStore();
  const canCreateElder = getUserRole(userInfo) === "doctor";
  const signOut = async () => {
    try {
      const storedTokenId = tokenId || localStorage.getItem("tokenId");
      const query = storedTokenId ? `?tokenId=${encodeURIComponent(storedTokenId)}` : "";
      await post(`/api/auth/logout${query}`);
    } catch {
      // 本地会话仍需清理，避免后端暂时不可用时用户无法退出。
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };
  return (
    <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex h-20 items-center justify-between rounded-2xl border border-border/40 bg-white/80 px-4 shadow-card backdrop-blur-md lg:px-6">
      <div className="flex min-w-0 items-center gap-3"><MobileSidebar /><div className="min-w-0"><h1 className="truncate text-xl font-bold text-foreground lg:text-2xl">{title}</h1>{subtitle && <p className="mt-0.5 hidden truncate text-sm text-muted-foreground lg:block">{subtitle}</p>}</div></div>
      <div className="flex items-center gap-2 lg:gap-3">
        <Button asChild variant="outline" className="hidden rounded-full border-border/60 bg-white/60 px-4 hover:bg-medical-50 hover:text-medical-700 sm:flex"><Link to="/profile"><UserCircle className="mr-2 h-4 w-4" />个人中心</Link></Button>
        {canCreateElder && <Button asChild className="hidden rounded-full bg-gradient-to-r from-medical-400 to-medical-600 px-4 text-white shadow-soft hover:shadow-glow md:flex"><Link to="/elders?create=1"><Plus className="mr-2 h-4 w-4" />新增档案</Link></Button>}
        <Button variant="outline" size="icon" className="rounded-full" onClick={signOut} title="退出登录"><LogOut className="h-4 w-4" /></Button>
        <motion.div whileHover={{ scale: 1.05 }}><Link to="/profile" aria-label="打开个人中心"><Avatar className="h-10 w-10 border border-white shadow-soft"><AvatarImage src={userInfo?.avatar || undefined} alt={userInfo?.realName || userInfo?.username || "用户头像"} /><AvatarFallback className="bg-gradient-to-br from-medical-400 to-sky-400 text-sm font-bold text-white">{userInfo?.realName?.[0] || userInfo?.username?.[0] || "用"}</AvatarFallback></Avatar></Link></motion.div>
      </div>
    </motion.header>
  );
}
