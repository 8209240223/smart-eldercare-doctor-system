import { useEffect, useState } from "react";
import { Bot, Eye, EyeOff, RefreshCw, Save, Settings } from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import EmptyState from "@/components/common/EmptyState";
import StatCard from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiConfig, useReloadAiConfig, useUpdateAiConfig } from "@/hooks/useApi";

type ConfigDraft = Record<string, { value: string; desc?: string }>;

export default function AiConfig() {
  const { data, isLoading, refetch } = useAiConfig();
  const updateConfig = useUpdateAiConfig();
  const reloadConfig = useReloadAiConfig();
  const [draft, setDraft] = useState<ConfigDraft>({});
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (!data) return;
    const nextDraft: ConfigDraft = {};
    data.forEach((item) => {
      nextDraft[item.configKey] = {
        value: item.configValue || "",
        desc: item.configDesc || "",
      };
    });
    setDraft(nextDraft);
  }, [data]);

  const save = async () => {
    const baseUrl = draft["ai.base_url"]?.value?.trim();
    const model = draft["ai.model"]?.value?.trim();
    if (!baseUrl) return toast.error("API 基础地址不能为空");
    try {
      const parsed = new URL(baseUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return toast.error("API 基础地址只支持 http 或 https");
      }
    } catch {
      return toast.error("请输入有效的 API 基础地址");
    }
    if (!model) return toast.error("模型名称不能为空");

    const numericRules: Array<[string, string, number, number]> = [
      ["ai.max_per_day", "每日最大调用次数", 1, 10000],
      ["ai.timeout_seconds", "调用超时时间", 1, 600],
      ["ai.max_retries", "失败重试次数", 0, 10],
    ];
    for (const [key, label, min, max] of numericRules) {
      const value = Number(draft[key]?.value);
      if (!Number.isInteger(value) || value < min || value > max) {
        return toast.error(`${label}必须是 ${min}-${max} 之间的整数`);
      }
    }

    try {
      await updateConfig.mutateAsync(draft);
      toast.success("AI 配置已保存");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存 AI 配置失败");
    }
  };

  const setDraftValue = (key: string, value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: { ...current[key], value },
    }));
  };

  const renderValueControl = (key: string) => {
    const value = draft[key]?.value || "";
    if (key === "ai.mock_enabled") {
      const enabled = value === "true";
      return (
        <label className="flex h-10 cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-white/70 px-3 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setDraftValue(key, event.target.checked ? "true" : "false")}
            className="h-4 w-4 accent-medical-500"
          />
          <span>{enabled ? "已启用 Mock 模式" : "已关闭 Mock 模式"}</span>
        </label>
      );
    }

    if (key === "ai.api_key") {
      return (
        <div className="relative">
          <Input
            type={showApiKey ? "text" : "password"}
            value={value}
            onChange={(event) => setDraftValue(key, event.target.value)}
            placeholder="输入 AI API Key"
            className="pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            title={showApiKey ? "隐藏 API Key" : "显示 API Key"}
            aria-label={showApiKey ? "隐藏 API Key" : "显示 API Key"}
            onClick={() => setShowApiKey((current) => !current)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-medical-50 hover:text-medical-700"
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      );
    }

    const numericConfig: Record<string, { min: number; max: number; step: number }> = {
      "ai.max_per_day": { min: 1, max: 10000, step: 1 },
      "ai.timeout_seconds": { min: 1, max: 600, step: 1 },
      "ai.max_retries": { min: 0, max: 10, step: 1 },
    };
    const numeric = numericConfig[key];
    return (
      <Input
        type={numeric ? "number" : key === "ai.base_url" ? "url" : "text"}
        min={numeric?.min}
        max={numeric?.max}
        step={numeric?.step}
        value={value}
        onChange={(event) => setDraftValue(key, event.target.value)}
        placeholder={key === "ai.base_url" ? "https://..." : key === "ai.model" ? "模型名称" : "配置值"}
      />
    );
  };

  const reload = async () => {
    try {
      await reloadConfig.mutateAsync();
      toast.success("AI 配置缓存已重载");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "重载 AI 配置失败");
    }
  };

  return (
    <PageShell title="AI 配置管理" subtitle="维护 AI 服务地址、模型参数、开关项，并支持重载运行时配置">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="配置项" value={data?.length || 0} icon={Settings} delay={0} />
          <StatCard title="可编辑" value={data?.length || 0} icon={Bot} iconClassName="from-sky-400 to-sky-500" delay={1} />
          <StatCard title="缓存可重载" value={1} icon={RefreshCw} iconClassName="from-lavender-400 to-lavender-500" delay={2} />
        </div>

        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">AI 配置项</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl" onClick={reload} disabled={reloadConfig.isPending}>
                <RefreshCw className="mr-2 h-4 w-4" />
                重载配置
              </Button>
              <Button className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white" onClick={save} disabled={updateConfig.isPending}>
                <Save className="mr-2 h-4 w-4" />
                保存全部
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : !data?.length ? (
              <EmptyState title="暂无 AI 配置" description="后端暂未返回可配置项" />
            ) : (
              <div className="space-y-4">
                {data.map((item) => (
                  <div key={item.configKey} className="grid grid-cols-1 gap-3 rounded-xl border border-border/40 bg-white/60 p-4 xl:grid-cols-[220px_1fr_1fr]">
                    <div>
                      <p className="font-semibold text-foreground">{item.configKey}</p>
                      <p className="mt-1 text-xs text-muted-foreground">更新时间：{item.updateTime || "-"}</p>
                    </div>
                    {renderValueControl(item.configKey)}
                    <Input
                      value={draft[item.configKey]?.desc || ""}
                      onChange={(event) => setDraft((value) => ({ ...value, [item.configKey]: { ...value[item.configKey], desc: event.target.value } }))}
                      placeholder="配置说明"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
