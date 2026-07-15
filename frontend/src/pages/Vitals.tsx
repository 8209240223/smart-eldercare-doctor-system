import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  ArrowRight,
  ChevronDown,
  Droplets,
  FlaskConical,
  Footprints,
  Gauge,
  HeartPulse,
  Moon,
  Plus,
  Thermometer,
  Trash2,
  TriangleAlert,
  Watch,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageShell from "@/components/layout/PageShell";
import StatCard from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DeviceDialog from "@/components/vitals/DeviceDialog";
import DeviceVitalDialog from "@/components/vitals/DeviceVitalDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useBindDevice,
  useDevices,
  useElders,
  useLatestVitals,
  useMockVitals,
  useUnbindDevice,
  useUploadVitals,
  useVitalTrends,
  type VitalSignData,
  type WearableDevice,
} from "@/hooks/useApi";
import { toast } from "sonner";
import { getUserRole, useAuthStore } from "@/store/auth";

const vitalTypes = [
  { dataType: 1, title: "收缩压", unit: "mmHg", icon: Gauge },
  { dataType: 2, title: "舒张压", unit: "mmHg", icon: Gauge },
  { dataType: 3, title: "心率", unit: "bpm", icon: HeartPulse },
  { dataType: 4, title: "空腹血糖", unit: "mmol/L", icon: Droplets },
  { dataType: 5, title: "餐后血糖", unit: "mmol/L", icon: Droplets },
  { dataType: 6, title: "血氧饱和度", unit: "%", icon: Activity },
  { dataType: 7, title: "体温", unit: "℃", icon: Thermometer },
  { dataType: 8, title: "步数", unit: "步", icon: Footprints },
  { dataType: 9, title: "睡眠时长", unit: "小时", icon: Moon },
];

const deviceTypeLabels: Record<number, string> = {
  1: "智能手环",
  2: "血压计",
  3: "血糖仪",
  4: "心电监护",
};

function formatDate(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export default function Vitals() {
  const navigate = useNavigate();
  const role = getUserRole(useAuthStore((state) => state.userInfo));
  const canManageDevices = role === "doctor" || role === "nurse";
  const canGenerateMockData = role === "admin";
  const [selectedElderId, setSelectedElderId] = useState<number | null>(null);
  const [selectedDataType, setSelectedDataType] = useState(0);
  const [startDate, setStartDate] = useState(() => formatDate(7));
  const [endDate, setEndDate] = useState(() => formatDate(0));
  const [mockDays, setMockDays] = useState(7);
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [unbindTarget, setUnbindTarget] = useState<WearableDevice | null>(null);
  const [simulationDevice, setSimulationDevice] = useState<WearableDevice | null>(null);
  const [warningResult, setWarningResult] = useState<{
    count: number;
    elderName: string;
    deviceName: string;
  } | null>(null);

  const { data: eldersData, isLoading: eldersLoading } = useElders(1, 100);
  const elders = eldersData?.records || [];
  const selectedElder = elders.find((elder) => elder.id === selectedElderId);
  const { data: latestVitals } = useLatestVitals(selectedElderId || 0);
  const { data: devices, isLoading: devicesLoading } = useDevices(selectedElderId || 0);
  const bindDevice = useBindDevice();
  const unbindDevice = useUnbindDevice();
  const uploadVitals = useUploadVitals();
  const mockVitals = useMockVitals(selectedElderId || 0);

  const visibleTypes = useMemo(
    () => selectedDataType === 0 ? vitalTypes : vitalTypes.filter((item) => item.dataType === selectedDataType),
    [selectedDataType]
  );

  const handleBind = async (form: WearableDevice) => {
    try {
      await bindDevice.mutateAsync(form);
      setDeviceDialogOpen(false);
      toast.success("设备绑定成功");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "设备绑定失败");
    }
  };

  const handleUnbind = async () => {
    if (!unbindTarget?.id) return;
    try {
      await unbindDevice.mutateAsync(unbindTarget.id);
      setUnbindTarget(null);
      toast.success("设备已解绑");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "设备解绑失败");
    }
  };

  const handleMock = async () => {
    if (!selectedElderId) {
      toast.error("请先选择老人");
      return;
    }
    if (!Number.isInteger(mockDays) || mockDays < 1 || mockDays > 365) {
      toast.error("模拟天数必须是 1 到 365 之间的整数");
      return;
    }
    try {
      await mockVitals.mutateAsync({ days: mockDays });
      toast.success(`已生成最近 ${mockDays} 天的模拟生命体征数据`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "模拟数据生成失败");
    }
  };

  const handleSimulationSubmit = async (data: VitalSignData[]) => {
    const result = await uploadVitals.mutateAsync(data);
    setSimulationDevice(null);
    if (result.triggeredWarningCount > 0) {
      setWarningResult({
        count: result.triggeredWarningCount,
        elderName: selectedElder?.name || "当前老人",
        deviceName: simulationDevice?.deviceName || "已绑定设备",
      });
      return;
    }
    toast.success("模拟数据已录入，本次未触发预警");
  };

  const dateRangeValid = !startDate || !endDate || startDate <= endDate;

  return (
    <PageShell
      title="生命体征"
      subtitle="查询九类健康指标趋势，并管理老人穿戴设备与测试数据"
      backgroundImage="/images/生命体征背景_青蓝柠檬绿医疗科技.png"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="档案总数" value={eldersData?.total || 0} icon={Activity} delay={0} />
          <StatCard title="已绑定设备" value={devices?.filter((device) => device.bindStatus === 1).length || 0} icon={Watch} delay={1} />
          <StatCard title="最新心率" value={latestVitals?.heartRate?.dataValue ?? 0} suffix={latestVitals?.heartRate ? "bpm" : ""} icon={HeartPulse} delay={2} />
          <StatCard title="最新血氧" value={latestVitals?.spo2?.dataValue ?? 0} suffix={latestVitals?.spo2 ? "%" : ""} icon={Droplets} delay={3} />
        </div>

        <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
          <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-6">
            <Field label="老人档案" className="xl:col-span-2">
              {eldersLoading ? (
                <Skeleton className="h-10 w-full rounded-xl" />
              ) : (
                <SelectControl
                  value={selectedElderId || ""}
                  onChange={(value) => setSelectedElderId(Number(value) || null)}
                >
                  <option value="">请选择老人</option>
                  {elders.map((elder) => <option key={elder.id} value={elder.id}>{elder.name}（{elder.idCard}）</option>)}
                </SelectControl>
              )}
            </Field>
            <Field label="指标类型">
              <SelectControl value={selectedDataType} onChange={(value) => setSelectedDataType(Number(value))}>
                <option value={0}>全部指标</option>
                {vitalTypes.map((item) => <option key={item.dataType} value={item.dataType}>{item.title}</option>)}
              </SelectControl>
            </Field>
            <Field label="开始日期">
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-10 rounded-xl bg-white/70" />
            </Field>
            <Field label="结束日期">
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-10 rounded-xl bg-white/70" />
            </Field>
            {canGenerateMockData && <Field label="模拟天数">
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={mockDays}
                  onChange={(event) => setMockDays(Number(event.target.value))}
                  className="h-10 rounded-xl bg-white/70"
                />
                <Button onClick={handleMock} disabled={!selectedElderId || mockVitals.isPending} className="h-10 rounded-xl bg-medical-500 text-white hover:bg-medical-600" title="生成模拟数据">
                  <Zap className="h-4 w-4" />
                </Button>
              </div>
            </Field>}
            {!dateRangeValid && <p className="text-sm text-red-500 md:col-span-2 xl:col-span-6">开始日期不能晚于结束日期。</p>}
          </CardContent>
        </Card>

        {!selectedElderId ? (
          <EmptyState title="请选择老人" description="选择老人后可查询趋势、绑定设备并生成测试数据" />
        ) : (
          <>
            <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold">穿戴设备</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedElder?.name || "当前老人"}的已绑定设备</p>
                </div>
                {canManageDevices && <Button onClick={() => setDeviceDialogOpen(true)} className="rounded-xl bg-gradient-to-r from-medical-400 to-medical-600 text-white">
                  <Plus className="mr-2 h-4 w-4" />绑定设备
                </Button>}
              </CardHeader>
              <CardContent>
                {devicesLoading ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
                ) : !devices?.length ? (
                  <EmptyState title="暂无绑定设备" description="点击右上角按钮为当前老人绑定手环、血压计或血糖仪" />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {devices.map((device) => (
                      <div key={device.id} className="flex flex-col gap-4 rounded-xl border border-border/50 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{device.deviceName}</p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">序列号：{device.deviceSn}</p>
                          <p className="mt-1 text-xs text-muted-foreground">类型：{deviceTypeLabels[device.deviceType] || `未知类型（${device.deviceType}）`}</p>
                          <p className="mt-1 text-xs text-muted-foreground">状态：{device.bindStatus === 1 ? "已绑定" : "已解绑"}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {canManageDevices && device.bindStatus === 1 && (
                            <Button variant="outline" size="sm" onClick={() => setSimulationDevice(device)} className="rounded-xl border-medical-200 bg-medical-50 text-medical-700 hover:bg-medical-100">
                              <FlaskConical className="h-4 w-4" />
                              输入模拟数据
                            </Button>
                          )}
                          {canManageDevices && device.bindStatus === 1 && (
                            <Button size="icon" variant="ghost" onClick={() => setUnbindTarget(device)} className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600" title="解绑设备">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {dateRangeValid && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {visibleTypes.map((item, index) => (
                  <VitalChart
                    key={item.dataType}
                    elderId={selectedElderId}
                    dataType={item.dataType}
                    title={item.title}
                    unit={item.unit}
                    delay={index * 0.04}
                    startDate={startDate}
                    endDate={endDate}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedElderId && (
        <DeviceDialog
          open={deviceDialogOpen}
          onOpenChange={setDeviceDialogOpen}
          elderId={selectedElderId}
          onSubmit={handleBind}
          isSubmitting={bindDevice.isPending}
        />
      )}
      <DeviceVitalDialog
        open={!!simulationDevice}
        device={simulationDevice}
        elderName={selectedElder?.name}
        onOpenChange={(open) => !open && setSimulationDevice(null)}
        onSubmit={handleSimulationSubmit}
        isSubmitting={uploadVitals.isPending}
      />
      <Dialog open={!!warningResult} onOpenChange={(open) => !open && setWarningResult(null)}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md rounded-lg border-red-200 bg-white p-0 shadow-2xl">
          <div className="border-b border-red-100 bg-red-50 px-6 py-5">
            <DialogHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <TriangleAlert className="h-6 w-6" />
              </div>
              <DialogTitle className="text-xl text-red-700">检测到健康预警</DialogTitle>
              <DialogDescription className="text-red-700/80">
                {warningResult?.elderName}通过“{warningResult?.deviceName}”录入的数据命中了 {warningResult?.count || 0} 条启用规则。
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="gap-2 px-6 pb-6">
            <Button variant="outline" onClick={() => setWarningResult(null)} className="rounded-xl">留在当前页</Button>
            <Button
              onClick={() => {
                setWarningResult(null);
                navigate("/warnings");
              }}
              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              查看预警
              <ArrowRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!unbindTarget}
        onOpenChange={(open) => !open && setUnbindTarget(null)}
        title="解绑设备"
        description={`确认解绑“${unbindTarget?.deviceName || "该设备"}”吗？解绑后将停止接收这台设备上传的数据。`}
        confirmText="确认解绑"
        destructive
        pending={unbindDevice.isPending}
        onConfirm={handleUnbind}
      />
    </PageShell>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={`space-y-1.5 ${className}`}><span className="text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}

function SelectControl({ value, onChange, children }: { value: string | number; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full appearance-none rounded-xl border border-border/60 bg-white/70 pl-3 pr-9 text-sm outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-200">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function VitalChart({ elderId, dataType, title, unit, delay, startDate, endDate }: { elderId: number; dataType: number; title: string; unit: string; delay: number; startDate: string; endDate: string }) {
  const { data, isLoading, isError } = useVitalTrends(elderId, dataType, startDate, endDate);
  const chartData = useMemo(() => (data || []).map((item) => ({
    time: item.measureTime ? item.measureTime.slice(5, 16).replace("T", " ") : "",
    value: Number(item.dataValue),
    abnormal: item.isAbnormal === 1,
  })), [data]);
  const Icon = vitalTypes.find((item) => item.dataType === dataType)?.icon || Activity;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="border-border/40 bg-white/80 shadow-card backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-bold"><Icon className="h-4 w-4 text-medical-500" />{title}</CardTitle>
          <span className="text-xs text-muted-foreground">{chartData.length} 条记录</span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[220px] w-full rounded-xl" />
          ) : isError ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-red-500">趋势数据加载失败</div>
          ) : chartData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">当前日期范围内暂无{title}数据</div>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eef2" vertical={false} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} minTickGap={24} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #dfe7ec" }} formatter={(value) => [`${value} ${unit}`, title]} />
                  <Line type="monotone" dataKey="value" stroke="#0aa88f" strokeWidth={2.5} dot={{ r: 2.5, fill: "#0aa88f" }} activeDot={{ r: 5 }} animationDuration={900} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
