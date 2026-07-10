import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { gsap } from "gsap";
import { Activity, Eye, EyeOff, Loader2, Lock, Phone, RefreshCw, User, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, post, type ApiResponse } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const ParticleField = lazy(() => import("@/components/three/ParticleField"));
const usernamePattern = /^[\u4e00-\u9fa5A-Za-z0-9_]{4,20}$/;
const phonePattern = /^1[3-9]\d{9}$/;
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&._-]{8,20}$/;

interface LoginResponse {
  token: string;
  tokenId?: string;
  userId?: number;
  username?: string;
  realName?: string;
  userType?: number;
  avatar?: string;
  phone?: string;
  [key: string]: unknown;
}

interface CaptchaState {
  key: string;
  image: string;
  code: string;
}

function useCaptcha() {
  const [state, setState] = useState<CaptchaState>({ key: "", image: "", code: "" });
  const refresh = useCallback(async () => {
    try {
      const response = await api<ApiResponse<{ key: string; image: string }>>("/api/auth/captcha");
      if (response.code === 200) setState({ key: response.data.key, image: response.data.image, code: "" });
    } catch {
      setState({ key: "", image: "", code: "" });
    }
  }, []);
  return { ...state, setCode: (code: string) => setState((value) => ({ ...value, code })), refresh };
}

function responseError(response: ApiResponse<unknown>, fallback: string) {
  return response.message || response.msg || fallback;
}

export default function Login() {
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const loginCaptcha = useCaptcha();
  const refreshLoginCaptcha = loginCaptcha.refresh;
  const ecgRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    refreshLoginCaptcha();
  }, [refreshLoginCaptcha]);

  useEffect(() => {
    if (!ecgRef.current) return;
    const path = ecgRef.current;
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    const animation = gsap.to(path, { strokeDashoffset: 0, duration: 2.5, ease: "power2.inOut", repeat: -1, repeatDelay: 0.8 });
    return () => {
      animation.kill();
    };
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("请输入用户名和密码");
      return;
    }
    if (!loginCaptcha.code.trim()) {
      setError("请输入验证码");
      return;
    }
    setLoading(true);
    try {
      const response = await post<ApiResponse<LoginResponse>>("/api/auth/login", {
        username: username.trim(),
        password,
        captchaKey: loginCaptcha.key,
        captchaCode: loginCaptcha.code.trim(),
      });
      if (response.code !== 200) throw new Error(responseError(response, "登录失败"));
      const { token, tokenId, ...userInfo } = response.data;
      setAuth(token, userInfo, tokenId);
      navigate("/", { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败，请重试");
      await loginCaptcha.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-sky-50">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70" style={{ backgroundImage: "url('/images/登录页背景_浅色高级医疗科技.png')" }} />
      <div className="absolute inset-0 bg-white/35" />
      <Suspense fallback={<Skeleton className="absolute inset-0 opacity-20" />}><ParticleField /></Suspense>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="w-full max-w-md">
          <div className="rounded-2xl border border-white/80 bg-white/88 p-7 shadow-2xl shadow-sky-200/40 backdrop-blur-xl sm:p-9">
            <div className="mb-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-medical-400 to-sky-500 text-white shadow-lg shadow-medical-200">
                <Activity className="h-8 w-8" />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-foreground">智慧医养医生服务系统</h1>
              <p className="mt-2 text-sm text-muted-foreground">医疗、护理与健康管理协同平台</p>
              <svg viewBox="0 0 260 34" className="mx-auto mt-4 h-8 w-64" aria-hidden="true">
                <path ref={ecgRef} d="M0 18 H64 L76 18 L84 5 L94 29 L104 12 L114 18 H170 L180 18 L188 8 L198 26 L207 14 L216 18 H260" fill="none" stroke="#0aa88f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <FormField label="用户名" htmlFor="login-username">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="login-username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="请输入用户名" className="h-11 rounded-xl bg-white/75 pl-10" />
                </div>
              </FormField>
              <FormField label="密码" htmlFor="login-password">
                <PasswordInput id="login-password" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((value) => !value)} autoComplete="current-password" />
              </FormField>
              <FormField label="验证码" htmlFor="login-captcha">
                <CaptchaInput id="login-captcha" captcha={loginCaptcha} />
              </FormField>
              {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</motion.div>}
              <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 font-medium text-white shadow-soft hover:shadow-glow">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{loading ? "登录中..." : "登录"}
              </Button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-5 text-sm">
              <button type="button" onClick={() => setRegisterOpen(true)} className="font-medium text-medical-700 hover:text-medical-800">注册账号</button>
              <span className="h-4 w-px bg-border" />
              <button type="button" onClick={() => setResetOpen(true)} className="font-medium text-medical-700 hover:text-medical-800">忘记密码</button>
            </div>
          </div>
        </motion.div>
      </div>

      <RegisterDialog open={registerOpen} onOpenChange={setRegisterOpen} />
      <ResetPasswordDialog open={resetOpen} onOpenChange={setResetOpen} />
    </div>
  );
}

function RegisterDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [form, setForm] = useState({ username: "", realName: "", phone: "", userType: 2, password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const captcha = useCaptcha();
  const refreshCaptcha = captcha.refresh;

  useEffect(() => {
    if (open) {
      setError("");
      refreshCaptcha();
    }
  }, [open, refreshCaptcha]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!usernamePattern.test(form.username.trim())) return setError("用户名必须为4-20位中文、字母、数字或下划线");
    if (!phonePattern.test(form.phone.trim())) return setError("请输入正确的11位中国大陆手机号");
    if (!passwordPattern.test(form.password)) return setError("密码必须为8-20位，至少包含字母和数字，可使用常见安全符号");
    if (form.password !== form.confirmPassword) return setError("两次输入的密码不一致");
    if (!captcha.code.trim()) return setError("请输入验证码");
    setPending(true);
    try {
      const response = await post<ApiResponse<unknown>>("/api/auth/register", { ...form, username: form.username.trim(), realName: form.realName.trim(), phone: form.phone.trim(), captchaKey: captcha.key, captchaCode: captcha.code.trim() });
      if (response.code !== 200) throw new Error(responseError(response, "注册失败"));
      toast.success("注册成功，请使用新账号登录");
      onOpenChange(false);
      setForm({ username: "", realName: "", phone: "", userType: 2, password: "", confirmPassword: "" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "注册失败");
      await captcha.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl border-border/40 bg-white/95 backdrop-blur-xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-medical-500" />注册账号</DialogTitle><DialogDescription>医生和护士可创建个人工作账号。</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="用户名" htmlFor="register-username"><Input id="register-username" maxLength={20} value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="4-20位中文、字母、数字或下划线" /></FormField>
            <FormField label="真实姓名" htmlFor="register-real-name"><Input id="register-real-name" value={form.realName} onChange={(event) => setForm({ ...form, realName: event.target.value })} placeholder="请输入真实姓名" /></FormField>
            <FormField label="手机号" htmlFor="register-phone"><Input id="register-phone" maxLength={11} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, "") })} placeholder="用于密码找回" /></FormField>
            <FormField label="角色" htmlFor="register-role"><select id="register-role" value={form.userType} onChange={(event) => setForm({ ...form, userType: Number(event.target.value) })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value={2}>医生</option><option value={3}>护士</option></select></FormField>
            <FormField label="密码" htmlFor="register-password"><Input id="register-password" type="password" maxLength={20} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="8-20位，至少包含字母和数字" /></FormField>
            <FormField label="确认密码" htmlFor="register-confirm"><Input id="register-confirm" type="password" maxLength={20} value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="请再次输入密码" /></FormField>
          </div>
          <FormField label="验证码" htmlFor="register-captcha"><CaptchaInput id="register-captcha" captcha={captcha} /></FormField>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>取消</Button><Button type="submit" disabled={pending} className="bg-medical-500 text-white hover:bg-medical-600">{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}提交注册</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [form, setForm] = useState({ username: "", phone: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const captcha = useCaptcha();
  const refreshCaptcha = captcha.refresh;

  useEffect(() => {
    if (open) {
      setError("");
      refreshCaptcha();
    }
  }, [open, refreshCaptcha]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!usernamePattern.test(form.username.trim())) return setError("用户名必须为4-20位中文、字母、数字或下划线");
    if (!phonePattern.test(form.phone.trim())) return setError("请输入正确的11位中国大陆手机号");
    if (!passwordPattern.test(form.newPassword)) return setError("新密码必须为8-20位，至少包含字母和数字，可使用常见安全符号");
    if (form.newPassword !== form.confirmPassword) return setError("两次输入的密码不一致");
    if (!captcha.code.trim()) return setError("请输入验证码");
    setPending(true);
    try {
      const response = await post<ApiResponse<unknown>>("/api/auth/resetPassword", { ...form, username: form.username.trim(), phone: form.phone.trim(), captchaKey: captcha.key, captchaCode: captcha.code.trim() });
      if (response.code !== 200) throw new Error(responseError(response, "密码重置失败"));
      toast.success("密码重置成功，请使用新密码登录");
      onOpenChange(false);
      setForm({ username: "", phone: "", newPassword: "", confirmPassword: "" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "密码重置失败");
      await captcha.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border-border/40 bg-white/95 backdrop-blur-xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-medical-500" />找回密码</DialogTitle><DialogDescription>通过账号绑定的手机号验证身份并设置新密码。</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <FormField label="用户名" htmlFor="reset-username"><Input id="reset-username" maxLength={20} value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="请输入用户名" /></FormField>
          <FormField label="手机号" htmlFor="reset-phone"><div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="reset-phone" maxLength={11} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, "") })} placeholder="请输入绑定手机号" className="pl-10" /></div></FormField>
          <FormField label="新密码" htmlFor="reset-password"><Input id="reset-password" type="password" maxLength={20} value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} placeholder="8-20位，至少包含字母和数字" /></FormField>
          <FormField label="确认新密码" htmlFor="reset-confirm"><Input id="reset-confirm" type="password" maxLength={20} value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="请再次输入新密码" /></FormField>
          <FormField label="验证码" htmlFor="reset-captcha"><CaptchaInput id="reset-captcha" captcha={captcha} /></FormField>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>取消</Button><Button type="submit" disabled={pending} className="bg-medical-500 text-white hover:bg-medical-600">{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}确认重置</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}

function PasswordInput({ id, value, onChange, show, onToggle, autoComplete }: { id: string; value: string; onChange: (value: string) => void; show: boolean; onToggle: () => void; autoComplete?: string }) {
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input id={id} type={show ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} placeholder="请输入密码" className="h-11 rounded-xl bg-white/75 pl-10 pr-10" />
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" title={show ? "隐藏密码" : "显示密码"}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
    </div>
  );
}

function CaptchaInput({ id, captcha }: { id: string; captcha: ReturnType<typeof useCaptcha> }) {
  return (
    <div className="flex gap-2">
      <Input id={id} value={captcha.code} onChange={(event) => captcha.setCode(event.target.value)} maxLength={4} autoComplete="off" placeholder="输入验证码" className="h-11 min-w-0 flex-1 rounded-xl bg-white/75" />
      {captcha.image ? (
        <button type="button" onClick={captcha.refresh} className="h-11 w-[130px] shrink-0 overflow-hidden rounded-xl border border-border/60 bg-white" title="点击刷新验证码"><img src={captcha.image} alt="验证码" className="h-full w-full object-cover" /></button>
      ) : (
        <Button type="button" variant="outline" onClick={captcha.refresh} className="h-11 w-[130px] shrink-0 rounded-xl"><RefreshCw className="mr-2 h-4 w-4" />刷新</Button>
      )}
    </div>
  );
}
