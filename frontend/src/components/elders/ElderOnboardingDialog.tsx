import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ClipboardPlus,
  HeartPulse,
  Loader2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ElderInfo, HealthRecordInfo, PhysicalExam } from "@/hooks/useApi";

export interface ElderOnboardingPayload {
  elder: ElderInfo;
  healthRecord?: HealthRecordInfo;
  initialExam?: PhysicalExam;
  medicalHistories?: Array<{
    diseaseName: string;
    diagnoseDate?: string;
    isCured?: number;
    treatment?: string;
    remark?: string;
  }>;
  generateWorkflow: boolean;
}

interface ElderOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: ElderOnboardingPayload) => void;
  isSubmitting?: boolean;
  currentUserId?: number;
  currentUserRole?: "admin" | "doctor" | "nurse";
  doctorOptions?: Array<{ id: number; realName?: string; username?: string }>;
}

interface HealthDraft {
  height: string;
  weight: string;
  smokingStatus: number | "";
  drinkingStatus: number | "";
  exerciseFrequency: number | "";
  livingAbility: number | "";
  disabilityStatus: string;
  surgeryHistory: string;
}

interface ExamDraft {
  examDate: string;
  systolicPressure: string;
  diastolicPressure: string;
  heartRate: string;
  bloodSugarFasting: string;
  bloodSugarRandom: string;
  temperature: string;
  bloodOxygen: string;
  waistline: string;
  examSummary: string;
  doctorAdvice: string;
}

interface HistoryDraft {
  diseaseName: string;
  diagnoseDate: string;
  isCured: number;
  treatment: string;
  remark: string;
}

const emptyElder: ElderInfo = {
  name: "",
  gender: 1,
  idCard: "",
  phone: "",
  emergencyContact: "",
  emergencyPhone: "",
  nation: "汉族",
  maritalStatus: 2,
  education: 2,
  address: "",
  community: "",
  medicalInsuranceType: 1,
  accountStatus: 1,
};

const emptyHealth: HealthDraft = {
  height: "",
  weight: "",
  smokingStatus: "",
  drinkingStatus: "",
  exerciseFrequency: "",
  livingAbility: "",
  disabilityStatus: "",
  surgeryHistory: "",
};

const emptyExam: ExamDraft = {
  examDate: new Date().toISOString().slice(0, 10),
  systolicPressure: "",
  diastolicPressure: "",
  heartRate: "",
  bloodSugarFasting: "",
  bloodSugarRandom: "",
  temperature: "",
  bloodOxygen: "",
  waistline: "",
  examSummary: "",
  doctorAdvice: "",
};

const emptyHistory: HistoryDraft = {
  diseaseName: "",
  diagnoseDate: "",
  isCured: 0,
  treatment: "",
  remark: "",
};

function validateIdCard(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!/^\d{17}[\dX]$/.test(normalized)) return false;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checksums = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
  const sum = normalized
    .slice(0, 17)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  return checksums[sum % 11] === normalized[17];
}

function optionalNumber(value: string) {
  return value === "" ? undefined : Number(value);
}

function hasAnyHealthValue(health: HealthDraft) {
  return Object.values(health).some((value) => value !== "");
}

function hasAnyExamValue(exam: ExamDraft) {
  return Object.entries(exam).some(
    ([key, value]) => key !== "examDate" && value !== "",
  );
}

export default function ElderOnboardingDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  currentUserId,
  currentUserRole,
  doctorOptions = [],
}: ElderOnboardingDialogProps) {
  const [elder, setElder] = useState<ElderInfo>(emptyElder);
  const [health, setHealth] = useState<HealthDraft>(emptyHealth);
  const [exam, setExam] = useState<ExamDraft>(emptyExam);
  const [history, setHistory] = useState<HistoryDraft>(emptyHistory);
  const [generateWorkflow, setGenerateWorkflow] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setElder({
      ...emptyElder,
      doctorId: currentUserRole === "doctor" ? currentUserId : undefined,
    });
    setHealth(emptyHealth);
    setExam({ ...emptyExam, examDate: new Date().toISOString().slice(0, 10) });
    setHistory(emptyHistory);
    setGenerateWorkflow(true);
    setErrors({});
  }, [open, currentUserId, currentUserRole]);

  const bmi = useMemo(() => {
    const height = Number(health.height);
    const weight = Number(health.weight);
    if (!height || !weight) return "-";
    return (weight / (height / 100) ** 2).toFixed(1);
  }, [health.height, health.weight]);

  const updateElder = (
    field: keyof ElderInfo,
    value: string | number | undefined,
  ) => {
    setElder((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!elder.name.trim()) next.name = "姓名不能为空";
    if (!validateIdCard(elder.idCard))
      next.idCard = "请输入包含正确校验位的18位身份证号";
    if (!/^1\d{10}$/.test(elder.phone)) next.phone = "手机号格式不正确";
    if (elder.emergencyPhone && !/^1\d{10}$/.test(elder.emergencyPhone))
      next.emergencyPhone = "紧急联系电话格式不正确";
    if (
      elder.birthDate &&
      elder.birthDate > new Date().toISOString().slice(0, 10)
    )
      next.birthDate = "出生日期不能晚于今天";
    if (!elder.doctorId || Number(elder.doctorId) <= 0)
      next.doctorId = "请选择或填写有效的责任医生";
    const ranges: Array<
      [keyof ExamDraft | keyof HealthDraft, string, number, number]
    > = [
      ["height", health.height, 50, 230],
      ["weight", health.weight, 20, 200],
      ["systolicPressure", exam.systolicPressure, 60, 240],
      ["diastolicPressure", exam.diastolicPressure, 40, 140],
      ["heartRate", exam.heartRate, 30, 180],
      ["bloodSugarFasting", exam.bloodSugarFasting, 2, 30],
      ["bloodSugarRandom", exam.bloodSugarRandom, 2, 35],
      ["temperature", exam.temperature, 34, 42],
      ["bloodOxygen", exam.bloodOxygen, 50, 100],
      ["waistline", exam.waistline, 40, 180],
    ];
    for (const [field, value, min, max] of ranges) {
      if (value !== "" && (Number(value) < min || Number(value) > max))
        next[field] = `请输入 ${min}-${max} 范围内的数值`;
    }
    if (history.diseaseName.trim() && !history.diagnoseDate)
      next.diagnoseDate = "填写疾病后必须填写确诊日期";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    const healthRecord = hasAnyHealthValue(health)
      ? {
          height: optionalNumber(health.height),
          weight: optionalNumber(health.weight),
          smokingStatus:
            health.smokingStatus === ""
              ? undefined
              : Number(health.smokingStatus),
          drinkingStatus:
            health.drinkingStatus === ""
              ? undefined
              : Number(health.drinkingStatus),
          exerciseFrequency:
            health.exerciseFrequency === ""
              ? undefined
              : Number(health.exerciseFrequency),
          livingAbility:
            health.livingAbility === ""
              ? undefined
              : Number(health.livingAbility),
          disabilityStatus: health.disabilityStatus || undefined,
          surgeryHistory: health.surgeryHistory || undefined,
          createDoctorId: Number(elder.doctorId),
        }
      : undefined;
    const initialExam = hasAnyExamValue(exam)
      ? {
          elderId: 0,
          doctorId: Number(elder.doctorId),
          examDate: exam.examDate,
          height: optionalNumber(health.height),
          weight: optionalNumber(health.weight),
          systolicPressure: optionalNumber(exam.systolicPressure),
          diastolicPressure: optionalNumber(exam.diastolicPressure),
          heartRate: optionalNumber(exam.heartRate),
          bloodSugarFasting: optionalNumber(exam.bloodSugarFasting),
          bloodSugarRandom: optionalNumber(exam.bloodSugarRandom),
          temperature: optionalNumber(exam.temperature),
          bloodOxygen: optionalNumber(exam.bloodOxygen),
          waistline: optionalNumber(exam.waistline),
          bmi: bmi === "-" ? undefined : Number(bmi),
          examSummary: exam.examSummary || undefined,
          doctorAdvice: exam.doctorAdvice || undefined,
        }
      : undefined;
    onSubmit({
      elder: { ...elder, idCard: elder.idCard.trim().toUpperCase() },
      healthRecord,
      initialExam,
      medicalHistories: history.diseaseName.trim()
        ? [
            {
              diseaseName: history.diseaseName.trim(),
              diagnoseDate: history.diagnoseDate || undefined,
              isCured: history.isCured,
              treatment: history.treatment || undefined,
              remark: history.remark || undefined,
            },
          ]
        : [],
      generateWorkflow,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto bg-white/95 p-0">
        <div className="sticky top-0 z-10 border-b border-border/40 bg-white/90 px-6 py-4 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>新增老人并建立健康管理档案</DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-sm text-muted-foreground">
            一次录入主档、健康概况和初始检查，后续模块统一使用同一个老人ID。
          </p>
        </div>
        <form onSubmit={submit} className="p-6">
          <Tabs defaultValue="basic">
            <TabsList className="grid h-auto w-full grid-cols-3">
              <TabsTrigger value="basic" className="gap-2">
                <UserRound className="h-4 w-4" />
                基本档案
              </TabsTrigger>
              <TabsTrigger value="health" className="gap-2">
                <HeartPulse className="h-4 w-4" />
                健康概况
              </TabsTrigger>
              <TabsTrigger value="exam" className="gap-2">
                <Activity className="h-4 w-4" />
                初始体检
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="basic"
              className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <Field label="姓名 *" error={errors.name}>
                <Input
                  value={elder.name}
                  onChange={(event) => updateElder("name", event.target.value)}
                />
              </Field>
              <Field label="性别 *">
                <Select
                  value={elder.gender}
                  onChange={(value) => updateElder("gender", value)}
                  options={[
                    [1, "男"],
                    [2, "女"],
                  ]}
                />
              </Field>
              <Field label="出生日期" error={errors.birthDate}>
                <Input
                  type="date"
                  value={elder.birthDate || ""}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(event) =>
                    updateElder("birthDate", event.target.value)
                  }
                />
              </Field>
              <Field label="身份证号 *" error={errors.idCard}>
                <Input
                  value={elder.idCard}
                  maxLength={18}
                  onChange={(event) =>
                    updateElder("idCard", event.target.value)
                  }
                />
              </Field>
              <Field label="联系电话 *" error={errors.phone}>
                <Input
                  value={elder.phone}
                  maxLength={11}
                  onChange={(event) => updateElder("phone", event.target.value)}
                />
              </Field>
              <Field label="责任医生 *" error={errors.doctorId}>
                <select
                  value={elder.doctorId || ""}
                  disabled={currentUserRole === "doctor"}
                  onChange={(event) =>
                    updateElder(
                      "doctorId",
                      event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    )
                  }
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:cursor-not-allowed disabled:bg-muted/50"
                >
                  <option value="">请选择责任医生</option>
                  {doctorOptions.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.realName || doctor.username || `医生#${doctor.id}`}
                    </option>
                  ))}
                  {currentUserRole === "doctor" &&
                    currentUserId &&
                    !doctorOptions.some((doctor) => doctor.id === currentUserId) && (
                      <option value={currentUserId}>当前登录医生</option>
                    )}
                </select>
              </Field>
              <Field label="所属社区">
                <Input
                  value={elder.community || ""}
                  onChange={(event) =>
                    updateElder("community", event.target.value)
                  }
                />
              </Field>
              <Field label="民族">
                <Input
                  value={elder.nation || ""}
                  onChange={(event) =>
                    updateElder("nation", event.target.value)
                  }
                />
              </Field>
              <Field label="紧急联系人">
                <Input
                  value={elder.emergencyContact || ""}
                  onChange={(event) =>
                    updateElder("emergencyContact", event.target.value)
                  }
                />
              </Field>
              <Field label="紧急联系电话" error={errors.emergencyPhone}>
                <Input
                  value={elder.emergencyPhone || ""}
                  maxLength={11}
                  onChange={(event) =>
                    updateElder("emergencyPhone", event.target.value)
                  }
                />
              </Field>
              <Field label="居住地址" className="md:col-span-2">
                <Input
                  value={elder.address || ""}
                  onChange={(event) =>
                    updateElder("address", event.target.value)
                  }
                />
              </Field>
            </TabsContent>

            <TabsContent
              value="health"
              className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <Field label="身高(cm)" error={errors.height}>
                <Input
                  type="number"
                  min={50}
                  max={230}
                  step="0.1"
                  value={health.height}
                  onChange={(event) =>
                    setHealth((current) => ({
                      ...current,
                      height: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="体重(kg)" error={errors.weight}>
                <Input
                  type="number"
                  min={20}
                  max={200}
                  step="0.1"
                  value={health.weight}
                  onChange={(event) =>
                    setHealth((current) => ({
                      ...current,
                      weight: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="BMI">
                <Input value={bmi} readOnly />
              </Field>
              <Field label="吸烟情况">
                <Select
                value={health.smokingStatus}
                onChange={(value) =>
                  setHealth((current) => ({
                    ...current,
                    smokingStatus: value === "" ? "" : Number(value),
                  }))
                  }
                  options={[
                    ["", "未知"],
                    [0, "不吸烟"],
                    [1, "吸烟"],
                    [2, "已戒烟"],
                  ]}
                />
              </Field>
              <Field label="饮酒情况">
                <Select
                value={health.drinkingStatus}
                onChange={(value) =>
                  setHealth((current) => ({
                    ...current,
                    drinkingStatus: value === "" ? "" : Number(value),
                  }))
                  }
                  options={[
                    ["", "未知"],
                    [0, "不饮酒"],
                    [1, "偶尔"],
                    [2, "经常"],
                  ]}
                />
              </Field>
              <Field label="运动频率">
                <Select
                value={health.exerciseFrequency}
                onChange={(value) =>
                  setHealth((current) => ({
                    ...current,
                    exerciseFrequency: value === "" ? "" : Number(value),
                  }))
                  }
                  options={[
                    ["", "未知"],
                    [0, "几乎不运动"],
                    [1, "偶尔"],
                    [2, "规律"],
                    [3, "频繁"],
                  ]}
                />
              </Field>
              <Field label="生活自理能力">
                <Select
                value={health.livingAbility}
                onChange={(value) =>
                  setHealth((current) => ({
                    ...current,
                    livingAbility: value === "" ? "" : Number(value),
                  }))
                  }
                  options={[
                    ["", "未知"],
                    [1, "完全自理"],
                    [2, "基本自理"],
                    [3, "部分依赖"],
                    [4, "完全依赖"],
                  ]}
                />
              </Field>
              <Field label="残疾/失能情况">
                <Input
                  value={health.disabilityStatus}
                  onChange={(event) =>
                    setHealth((current) => ({
                      ...current,
                      disabilityStatus: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="主要慢性病">
                <Input
                  value={history.diseaseName}
                  placeholder="例如：高血压、糖尿病"
                  onChange={(event) =>
                    setHistory((current) => ({
                      ...current,
                      diseaseName: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="确诊日期" error={errors.diagnoseDate}>
                <Input
                  type="date"
                  value={history.diagnoseDate}
                  onChange={(event) =>
                    setHistory((current) => ({
                      ...current,
                      diagnoseDate: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="治疗情况">
                <Input
                  value={history.treatment}
                  onChange={(event) =>
                    setHistory((current) => ({
                      ...current,
                      treatment: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="手术史">
                <Input
                  value={health.surgeryHistory}
                  onChange={(event) =>
                    setHealth((current) => ({
                      ...current,
                      surgeryHistory: event.target.value,
                    }))
                  }
                />
              </Field>
            </TabsContent>

            <TabsContent
              value="exam"
              className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3"
            >
              <Field label="体检日期">
                <Input
                  type="date"
                  value={exam.examDate}
                  onChange={(event) =>
                    setExam((current) => ({
                      ...current,
                      examDate: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="收缩压(mmHg)" error={errors.systolicPressure}>
                <Input
                  type="number"
                  min={60}
                  max={240}
                  value={exam.systolicPressure}
                  onChange={(event) =>
                    setExam((current) => ({
                      ...current,
                      systolicPressure: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="舒张压(mmHg)" error={errors.diastolicPressure}>
                <Input
                  type="number"
                  min={40}
                  max={140}
                  value={exam.diastolicPressure}
                  onChange={(event) =>
                    setExam((current) => ({
                      ...current,
                      diastolicPressure: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="心率(bpm)" error={errors.heartRate}>
                <Input
                  type="number"
                  min={30}
                  max={180}
                  value={exam.heartRate}
                  onChange={(event) =>
                    setExam((current) => ({
                      ...current,
                      heartRate: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="空腹血糖" error={errors.bloodSugarFasting}>
                <Input
                  type="number"
                  min={2}
                  max={30}
                  step="0.1"
                  value={exam.bloodSugarFasting}
                  onChange={(event) =>
                    setExam((current) => ({
                      ...current,
                      bloodSugarFasting: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="随机血糖" error={errors.bloodSugarRandom}>
                <Input
                  type="number"
                  min={2}
                  max={35}
                  step="0.1"
                  value={exam.bloodSugarRandom}
                  onChange={(event) =>
                    setExam((current) => ({
                      ...current,
                      bloodSugarRandom: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="体温(°C)" error={errors.temperature}>
                <Input
                  type="number"
                  min={34}
                  max={42}
                  step="0.1"
                  value={exam.temperature}
                  onChange={(event) =>
                    setExam((current) => ({
                      ...current,
                      temperature: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="血氧(%)" error={errors.bloodOxygen}>
                <Input
                  type="number"
                  min={50}
                  max={100}
                  step="0.1"
                  value={exam.bloodOxygen}
                  onChange={(event) =>
                    setExam((current) => ({
                      ...current,
                      bloodOxygen: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="腰围(cm)" error={errors.waistline}>
                <Input
                  type="number"
                  min={40}
                  max={180}
                  step="0.1"
                  value={exam.waistline}
                  onChange={(event) =>
                    setExam((current) => ({
                      ...current,
                      waistline: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="体检摘要" className="md:col-span-3">
                <Input
                  value={exam.examSummary}
                  placeholder="填写本次体检主要结论"
                  onChange={(event) =>
                    setExam((current) => ({
                      ...current,
                      examSummary: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="医生建议" className="md:col-span-3">
                <Input
                  value={exam.doctorAdvice}
                  placeholder="填写初始健康管理建议"
                  onChange={(event) =>
                    setExam((current) => ({
                      ...current,
                      doctorAdvice: event.target.value,
                    }))
                  }
                />
              </Field>
            </TabsContent>
          </Tabs>

          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-medical-100 bg-medical-50/60 p-4">
            <input
              type="checkbox"
              checked={generateWorkflow}
              onChange={(event) => setGenerateWorkflow(event.target.checked)}
              className="mt-1 h-4 w-4 accent-teal-600"
            />
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardPlus className="h-4 w-4 text-medical-600" />
                保存后自动生成健康管理流程
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                系统将基于本次真实录入的数据计算风险，并生成或复用随访计划、随访任务和结构化健康报告。
              </span>
            </span>
          </label>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-medical-400 to-medical-600 text-white"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              保存并建档
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  options: Array<[string | number, string]>;
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(event.target.value === "" ? "" : Number(event.target.value))
      }
      className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
    >
      {options.map(([optionValue, label]) => (
        <option key={String(optionValue)} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}
