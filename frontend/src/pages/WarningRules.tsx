import { useState } from "react";
import { Activity, Edit, Plus, Power, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateWarningRule,
  useDeleteWarningRule,
  useElders,
  useEvaluateWarningRules,
  useToggleWarningRule,
  useUpdateWarningRule,
  useWarningRules,
  type WarningRule,
} from "@/hooks/useApi";
import { getUserRole, useAuthStore } from "@/store/auth";

const emptyRule: WarningRule = {
  ruleName: "",
  ruleType: 1,
  metricCode: "systolic",
  conditionExpr: "systolic >= 180",
  warningLevel: 2,
  warningTemplate: "",
  enabled: 1,
};

const metricOptions = [
  ["systolic", "收缩压"],
  ["diastolic", "舒张压"],
  ["heartRate", "心率"],
  ["bloodSugarFasting", "空腹血糖"],
  ["bloodSugarPostprandial", "餐后血糖"],
  ["spo2", "血氧饱和度"],
  ["temperature", "体温"],
  ["bmi", "BMI"],
  ["steps", "步数"],
  ["sleep", "睡眠时长"],
] as const;

function ruleTypeText(type?: number) {
  return ["", "血压", "血糖", "心率", "体温", "BMI", "综合"][type || 0] || "预警规则";
}

function levelText(level?: number) {
  if (level === 3) return "红色";
  if (level === 2) return "橙色";
  return "黄色";
}

function levelClass(level?: number) {
  if (level === 3) return "border-red-200 bg-red-50 text-red-700";
  if (level === 2) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-yellow-200 bg-yellow-50 text-yellow-700";
}

export default function WarningRules() {
  const canManageRules = getUserRole(useAuthStore((state) => state.userInfo)) === "doctor";
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<WarningRule>(emptyRule);
  const [deleteTarget, setDeleteTarget] = useState<WarningRule | null>(null);
  const [evaluateOpen, setEvaluateOpen] = useState(false);
  const [evaluateElderId, setEvaluateElderId] = useState("");
  const [vitalData, setVitalData] = useState<Record<string, string>>({});
  const { data, isLoading, refetch } = useWarningRules();
  const { data: eldersData } = useElders(1, 100);
  const createRule = useCreateWarningRule();
  const updateRule = useUpdateWarningRule();
  const deleteRule = useDeleteWarningRule();
  const toggleRule = useToggleWarningRule();
  const evaluateRules = useEvaluateWarningRules();

  const rules = data || [];
  const enabledCount = rules.filter((item) => item.enabled !== 0).length;

  const openCreate = () => {
    setForm(emptyRule);
    setFormOpen(true);
  };

  const openEdit = (rule: WarningRule) => {
    setForm({ ...emptyRule, ...rule });
    setFormOpen(true);
  };

  const saveRule = async () => {
    if (!form.ruleName?.trim() || !form.metricCode || !form.conditionExpr?.trim()) {
      toast.error("规则名称、指标和条件表达式不能为空");
      return;
    }
    const conditionMatch = form.conditionExpr.trim().match(/^([A-Za-z][A-Za-z0-9]*)\s*(>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)$/);
    const conditionMetric = conditionMatch?.[1];
    const metricMatches = conditionMetric === form.metricCode
      || ([conditionMetric, form.metricCode].includes("spo2") && [conditionMetric, form.metricCode].includes("bloodOxygen"));
    if (!conditionMatch || !metricMatches) {
      toast.error("条件表达式必须使用所选指标，例如 systolic >= 180");
      return;
    }
    const payload = {
      ...form,
      ruleType: Number(form.ruleType || 1),
      warningLevel: Number(form.warningLevel || 2),
      enabled: Number(form.enabled ?? 1),
    };
    try {
      if (form.id) {
        await updateRule.mutateAsync(payload);
        toast.success("预警规则已更新");
      } else {
        await createRule.mutateAsync(payload);
        toast.success("预警规则已新增");
      }
      setFormOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存预警规则失败");
    }
  };

  const handleToggle = async (rule: WarningRule) => {
    if (!rule.id) return;
    try {
      await toggleRule.mutateAsync({ id: rule.id, enabled: rule.enabled === 0 ? 1 : 0 });
      toast.success("规则启用状态已更新");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "切换规则状态失败");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteRule.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast.success("预警规则已删除");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除预警规则失败");
    }
  };

  const evaluate = async () => {
    const elderId = Number(evaluateElderId);
    if (!elderId) {
      toast.error("请选择需要评估的老人");
      return;
    }
    const numericData = Object.fromEntries(
      Object.entries(vitalData)
        .filter(([, value]) => value !== "")
        .map(([key, value]) => [key, Number(value)])
        .filter(([, value]) => Number.isFinite(value as number))
    ) as Record<string, number>;
    if (Object.keys(numericData).length === 0) {
      toast.error("请至少填写一项生命体征数据");
      return;
    }
    try {
      const count = await evaluateRules.mutateAsync({ elderId, vitalData: numericData });
      setEvaluateOpen(false);
      toast.success(`规则评估完成，触发 ${count} 条预警`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "规则评估失败");
    }
  };

  return (
    <PageShell title="预警规则配置" subtitle="维护体征指标预警规则，支持启用、停用、新增、编辑和删除">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="规则总数" value={rules.length} icon={ShieldAlert} delay={0} />
          <StatCard title="启用规则" value={enabledCount} icon={Power} iconClassName="from-medical-400 to-medical-600" delay={1} />
          <StatCard title="停用规则" value={rules.length - enabledCount} icon={Edit} iconClassName="from-slate-400 to-slate-500" delay={2} />
        </div>

        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">规则列表</CardTitle>
            {canManageRules && <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEvaluateOpen(true)} className="rounded-xl"><Activity className="mr-2 h-4 w-4" />手动评估</Button>
              <Button onClick={openCreate} className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white"><Plus className="mr-2 h-4 w-4" />新增规则</Button>
            </div>}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : !rules.length ? (
              <EmptyState title="暂无预警规则" description="可点击新增规则创建配置" />
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="rounded-xl border border-border/40 bg-white/60 p-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{rule.ruleName}</h3>
                          <Badge variant="outline" className="border-medical-200 bg-medical-50 text-medical-700">{ruleTypeText(rule.ruleType)}</Badge>
                          <Badge variant="outline" className={levelClass(rule.warningLevel)}>{levelText(rule.warningLevel)}</Badge>
                          <Badge variant="outline" className={rule.enabled === 0 ? "border-slate-200 bg-slate-50 text-slate-600" : "border-medical-200 bg-medical-50 text-medical-700"}>
                            {rule.enabled === 0 ? "停用" : "启用"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">指标：{rule.metricCode || "-"} · 条件：{rule.conditionExpr || "-"}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{rule.warningTemplate || "暂无预警消息模板"}</p>
                      </div>
                      {canManageRules && <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => openEdit(rule)}>编辑</Button>
                        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => handleToggle(rule)}>
                          {rule.enabled === 0 ? "启用" : "停用"}
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-lg text-red-600" onClick={() => setDeleteTarget(rule)}>
                          <Trash2 className="mr-1 h-4 w-4" />
                          删除
                        </Button>
                      </div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl bg-white/95">
          <DialogHeader>
            <DialogTitle>{form.id ? "编辑预警规则" : "新增预警规则"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input className="md:col-span-2" value={form.ruleName || ""} onChange={(event) => setForm((value) => ({ ...value, ruleName: event.target.value }))} placeholder="规则名称" />
            <select value={form.ruleType || 1} onChange={(event) => setForm((value) => ({ ...value, ruleType: Number(event.target.value) }))} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="1">血压</option>
              <option value="2">血糖</option>
              <option value="3">心率</option>
              <option value="4">体温</option>
              <option value="5">BMI</option>
              <option value="6">综合</option>
            </select>
            <select value={form.warningLevel || 2} onChange={(event) => setForm((value) => ({ ...value, warningLevel: Number(event.target.value) }))} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="1">黄色</option>
              <option value="2">橙色</option>
              <option value="3">红色</option>
            </select>
            <select value={form.metricCode || ""} onChange={(event) => setForm((value) => ({ ...value, metricCode: event.target.value }))} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              {form.metricCode === "bloodOxygen" && <option value="bloodOxygen">血氧饱和度（兼容旧规则）</option>}
              {metricOptions.map(([value, label]) => <option key={value} value={value}>{label}（{value}）</option>)}
            </select>
            <Input value={form.conditionExpr || ""} onChange={(event) => setForm((value) => ({ ...value, conditionExpr: event.target.value }))} placeholder="条件表达式，如 systolic > 180" />
            <select value={form.enabled ?? 1} onChange={(event) => setForm((value) => ({ ...value, enabled: Number(event.target.value) }))} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="1">启用</option>
              <option value="0">停用</option>
            </select>
            <Input value={form.doctorId || ""} onChange={(event) => setForm((value) => ({ ...value, doctorId: event.target.value ? Number(event.target.value) : undefined }))} placeholder="医生ID，留空表示全局" />
            <textarea className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm md:col-span-2" value={form.warningTemplate || ""} onChange={(event) => setForm((value) => ({ ...value, warningTemplate: event.target.value }))} placeholder="预警消息模板" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>取消</Button>
            <Button onClick={saveRule} disabled={createRule.isPending || updateRule.isPending} className="bg-gradient-to-r from-medical-400 to-medical-600 text-white">保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={evaluateOpen} onOpenChange={setEvaluateOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl bg-white/95">
          <DialogHeader><DialogTitle>手动评估生命体征</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <label className="space-y-2"><span className="text-sm font-medium">老人档案</span><select value={evaluateElderId} onChange={(event) => setEvaluateElderId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">请选择老人</option>{(eldersData?.records || []).map((elder) => <option key={elder.id} value={elder.id}>{elder.name}（{elder.idCard}）</option>)}</select></label>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["systolic", "收缩压", "mmHg"],
                ["diastolic", "舒张压", "mmHg"],
                ["heartRate", "心率", "bpm"],
                ["bloodSugarFasting", "空腹血糖", "mmol/L"],
                ["spo2", "血氧饱和度", "%"],
                ["temperature", "体温", "℃"],
                ["bmi", "BMI", ""],
                ["bloodSugarPostprandial", "餐后血糖", "mmol/L"],
                ["steps", "步数", "步"],
                ["sleep", "睡眠时长", "小时"],
              ].map(([key, label, unit]) => (
                <label key={key} className="space-y-2"><span className="text-sm font-medium">{label}{unit ? `（${unit}）` : ""}</span><Input type="number" step="0.1" value={vitalData[key] || ""} onChange={(event) => setVitalData((value) => ({ ...value, [key]: event.target.value }))} placeholder={`请输入${label}`} /></label>
              ))}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEvaluateOpen(false)} disabled={evaluateRules.isPending}>取消</Button><Button onClick={evaluate} disabled={evaluateRules.isPending} className="bg-gradient-to-r from-medical-400 to-medical-600 text-white">开始评估</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="删除预警规则"
        description={`确认删除“${deleteTarget?.ruleName || "该规则"}”吗？删除后无法恢复。`}
        confirmText="确认删除"
        destructive
        pending={deleteRule.isPending}
        onConfirm={handleDelete}
      />
    </PageShell>
  );
}
