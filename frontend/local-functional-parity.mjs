import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const FRONTEND_DIR = path.dirname(fileURLToPath(import.meta.url));
const cliBaseUrl = process.argv
  .find((value) => value.startsWith("--base-url="))
  ?.slice(11);
const BASE_URL = (
  cliBaseUrl ||
  process.env.PARITY_BASE_URL ||
  "http://127.0.0.1:5173"
).replace(/\/$/, "");
const HEADLESS =
  !process.argv.includes("--headed") && process.env.PARITY_HEADED !== "1";
const ACTION_TIMEOUT = Number(process.env.PARITY_TIMEOUT_MS || 12_000);
const OUT_DIR = path.join(
  FRONTEND_DIR,
  "test-results",
  "local-functional-parity",
);
const REPORT_PATH = path.join(OUT_DIR, "report.json");

const ELDER = {
  id: 101,
  name: "回归测试老人",
  gender: 1,
  birthDate: "1950-01-02",
  idCard: "110101195001020011",
  phone: "13800138001",
  emergencyContact: "测试家属",
  emergencyPhone: "13800138002",
  nation: "汉族",
  maritalStatus: 2,
  education: 2,
  medicalInsuranceType: 1,
  community: "幸福社区",
  address: "测试路 1 号",
  doctorId: 2,
  accountStatus: 1,
};

const WARNINGS = [
  {
    id: 201,
    elderId: 101,
    elderName: ELDER.name,
    warningLevel: 3,
    status: 0,
    warningTitle: "待处理高压预警",
    warningContent: "收缩压超过阈值",
    warningValue: "188",
    thresholdValue: "180",
    createTime: "2026-07-10 08:00:00",
  },
  {
    id: 202,
    elderId: 101,
    elderName: ELDER.name,
    warningLevel: 2,
    status: 1,
    warningTitle: "处理中血糖预警",
    warningContent: "空腹血糖偏高",
    warningValue: "9.2",
    thresholdValue: "7.0",
    createTime: "2026-07-10 08:10:00",
  },
  {
    id: 203,
    elderId: 101,
    elderName: ELDER.name,
    warningLevel: 1,
    status: 0,
    warningTitle: "可忽略心率预警",
    warningContent: "短时心率偏快",
    warningValue: "105",
    thresholdValue: "100",
    createTime: "2026-07-10 08:20:00",
  },
  {
    id: 204,
    elderId: 101,
    elderName: ELDER.name,
    warningLevel: 1,
    status: 2,
    warningTitle: "已处理血氧预警",
    warningContent: "血氧已恢复",
    warningValue: "97",
    thresholdValue: "95",
    handleResult: "已复测",
    createTime: "2026-07-10 08:30:00",
  },
];

const FOLLOWUP_PLANS = [
  {
    id: 501,
    elderId: 101,
    elderName: ELDER.name,
    doctorId: 2,
    planName: "待执行高血压随访",
    diseaseType: 1,
    frequencyType: 2,
    startDate: "2026-07-01",
    endDate: "2026-12-31",
    totalCount: 6,
    completedCount: 0,
    status: 0,
  },
  {
    id: 502,
    elderId: 101,
    elderName: ELDER.name,
    doctorId: 2,
    planName: "进行中糖尿病随访",
    diseaseType: 2,
    frequencyType: 2,
    startDate: "2026-06-01",
    endDate: "2026-12-31",
    totalCount: 8,
    completedCount: 2,
    status: 1,
  },
];

const FOLLOWUP_RECORD = {
  id: 511,
  planId: 501,
  elderId: 101,
  doctorId: 2,
  elderName: ELDER.name,
  followDate: "2026-07-09T09:30",
  followType: 2,
  systolicPressure: 136,
  diastolicPressure: 82,
  heartRate: 72,
  bloodSugarFasting: 6.1,
  weight: 65,
  followResult: "血压稳定，继续观察",
  nextFollowDate: "2026-08-09",
  status: 1,
};

const INTERVENTION = {
  id: 521,
  followRecordId: 511,
  elderId: 101,
  doctorId: 2,
  elderName: ELDER.name,
  interventionType: 1,
  interventionTitle: "原始干预方案",
  interventionContent: "按时服药并记录血压",
  interventionDate: "2026-07-01",
  effectEvaluation: 2,
  effectDesc: "有效",
  status: 1,
};

const ASSESSMENT = {
  id: 531,
  elderId: 101,
  doctorId: 2,
  elderName: ELDER.name,
  assessType: 9,
  assessDate: "2026-07-02",
  score: 86,
  level: "良好",
  result: "综合状态良好",
  suggestion: "继续保持规律作息",
  createTime: "2026-07-02 09:30:00",
};

const REFERRALS = [
  {
    id: 601,
    referralNo: "RF-601",
    elderId: 101,
    elderName: "接收权限老人",
    referralType: 1,
    fromOrg: "社区医院",
    fromDoctorId: 9,
    toOrg: "中心医院",
    toDoctorId: 2,
    referralReason: "需要进一步检查",
    status: 0,
  },
  {
    id: 602,
    referralNo: "RF-602",
    elderId: 102,
    elderName: "完成权限老人",
    referralType: 1,
    fromOrg: "社区医院",
    fromDoctorId: 9,
    toOrg: "中心医院",
    toDoctorId: 2,
    referralReason: "住院治疗",
    status: 1,
  },
  {
    id: 603,
    referralNo: "RF-603",
    elderId: 103,
    elderName: "取消权限老人",
    referralType: 2,
    fromOrg: "中心医院",
    fromDoctorId: 2,
    toOrg: "社区医院",
    toDoctorId: 9,
    referralReason: "康复下转",
    status: 0,
  },
  {
    id: 604,
    referralNo: "RF-604",
    elderId: 104,
    elderName: "终态转诊老人",
    referralType: 1,
    fromOrg: "社区医院",
    fromDoctorId: 2,
    toOrg: "中心医院",
    toDoctorId: 9,
    referralReason: "已完成转诊",
    status: 3,
    dischargeSummary: "状态稳定",
  },
];

const DEVICE = {
  id: 701,
  elderId: 101,
  deviceName: "既有测试手环",
  deviceSn: "E2E-DEVICE-OLD",
  deviceType: 1,
  bindStatus: 1,
  bindTime: "2026-07-01 08:00:00",
};

const NURSE_RECORDS = [
  {
    id: 801,
    elderId: 101,
    nurseId: 3,
    recordType: 1,
    recordTitle: "待审核护理记录",
    recordContent: "完成晨间护理",
    recordDate: "2026-07-10T08:30",
    isAbnormal: 0,
    reportStatus: 1,
    doctorReview: 0,
    createTime: "2026-07-10 08:40:00",
  },
];

const NURSE_PLANS = [
  {
    id: 811,
    elderId: 101,
    nurseId: 3,
    planName: "待执行护理计划",
    planType: 1,
    startDate: "2026-07-10",
    endDate: "2026-07-20",
    frequency: "每日",
    status: 0,
    totalCount: 10,
    completedCount: 0,
    nursingGoal: "保持皮肤清洁",
  },
  {
    id: 812,
    elderId: 101,
    nurseId: 3,
    planName: "进行中护理计划",
    planType: 2,
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    frequency: "每日",
    status: 1,
    totalCount: 20,
    completedCount: 5,
    nursingGoal: "恢复活动能力",
  },
  {
    id: 813,
    elderId: 101,
    nurseId: 3,
    planName: "已完成护理计划",
    planType: 1,
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    frequency: "每日",
    status: 2,
    totalCount: 20,
    completedCount: 20,
    nursingGoal: "完成护理目标",
  },
  {
    id: 814,
    elderId: 101,
    nurseId: 3,
    planName: "已终止护理计划",
    planType: 4,
    startDate: "2026-05-01",
    endDate: "2026-05-31",
    frequency: "每周",
    status: 3,
    totalCount: 4,
    completedCount: 1,
    nursingGoal: "计划已终止",
  },
];

const REVIEW_PLAN = {
  id: 821,
  elderId: 101,
  nurseId: 3,
  planName: "待审核压疮护理计划",
  planType: 3,
  nursingGoal: "预防压疮",
  nursingContent: "定时翻身",
  doctorApproval: 0,
  createTime: "2026-07-10 09:00:00",
};

const AI_CONFIG = [
  {
    id: 1,
    configKey: "ai.base_url",
    configValue: "https://api.example.test/v1",
    configDesc: "API 基础地址",
    updateTime: "2026-07-10",
  },
  {
    id: 2,
    configKey: "ai.model",
    configValue: "medical-model-v1",
    configDesc: "模型名称",
    updateTime: "2026-07-10",
  },
  {
    id: 3,
    configKey: "ai.api_key",
    configValue: "fixture-secret-key",
    configDesc: "API Key",
    updateTime: "2026-07-10",
  },
  {
    id: 4,
    configKey: "ai.mock_enabled",
    configValue: "true",
    configDesc: "Mock 开关",
    updateTime: "2026-07-10",
  },
  {
    id: 5,
    configKey: "ai.max_per_day",
    configValue: "100",
    configDesc: "每日最大调用次数",
    updateTime: "2026-07-10",
  },
  {
    id: 6,
    configKey: "ai.timeout_seconds",
    configValue: "30",
    configDesc: "调用超时时间",
    updateTime: "2026-07-10",
  },
  {
    id: 7,
    configKey: "ai.max_retries",
    configValue: "2",
    configDesc: "失败重试次数",
    updateTime: "2026-07-10",
  },
];

const PROFILE = {
  id: 2,
  userId: 2,
  username: "doctor01",
  realName: "张医生",
  phone: "13800138000",
  email: "doctor@example.test",
  avatar: "",
  role: "doctor",
  userType: 2,
};
const MESSAGE = {
  id: 901,
  userId: 2,
  title: "回归测试消息",
  content: "请查看新的健康预警",
  msgType: 1,
  isRead: 0,
  sourceType: "warning",
  createTime: "2026-07-10 10:00:00",
};

const ROLE_USERS = {
  admin: {
    token: "fixture-admin-token",
    userId: 1,
    id: 1,
    username: "admin",
    realName: "系统管理员",
    phone: "13800138010",
    email: "admin@example.test",
    userType: 1,
    role: "admin",
  },
  doctor: {
    token: "fixture-doctor-token",
    userId: 2,
    id: 2,
    username: "doctor01",
    realName: "张医生",
    phone: "13800138000",
    email: "doctor@example.test",
    userType: 2,
    role: "doctor",
  },
  nurse: {
    token: "fixture-nurse-token",
    userId: 3,
    id: 3,
    username: "nurse01",
    realName: "刘护士",
    phone: "13800138003",
    email: "nurse@example.test",
    userType: 3,
    role: "nurse",
  },
};

function pageResult(records, pageSize = 10) {
  return {
    records,
    total: records.length,
    size: pageSize,
    current: 1,
    pages: 1,
  };
}

function apiEnvelope(data, status = 200) {
  return {
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({
      code: status === 200 ? 200 : status,
      message: status === 200 ? "ok" : "mock error",
      data,
    }),
  };
}

function parseRequestBody(request) {
  const contentType = request.headers()["content-type"] || "";
  const raw = request.postData();
  if (raw === null || raw === "") return null;
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return {
    contentType,
    size: request.postDataBuffer()?.length || Buffer.byteLength(raw),
    preview: raw.replace(/[^\x20-\x7E\r\n\t]/g, ".").slice(0, 800),
  };
}

function requestSnapshot(request) {
  const url = new URL(request.url());
  return {
    at: new Date().toISOString(),
    method: request.method(),
    url: request.url(),
    path: `${url.pathname}${url.search}`,
    pathname: url.pathname,
    body: parseRequestBody(request),
  };
}

async function mockApiRoute(route, entry) {
  const request = route.request();
  const url = new URL(request.url());
  const pathname = url.pathname;
  const method = request.method();
  const body = parseRequestBody(request);
  const respond = async (data, mockKey) => {
    entry.mock = mockKey;
    await route.fulfill(apiEnvelope(data));
  };
  if (pathname === "/api/warnings/stream") {
    entry.mock = "warnings.stream";
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: ": mock stream\n\n",
    });
    return;
  }
  if (pathname === "/api/auth/captcha" && method === "GET")
    return respond(
      {
        key: "captcha-fixture",
        image:
          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMzAiIGhlaWdodD0iNDQiPjxyZWN0IHdpZHRoPSIxMzAiIGhlaWdodD0iNDQiIGZpbGw9IiNlMGYyZmUiLz48dGV4dCB4PSIzNSIgeT0iMzAiIGZvbnQtc2l6ZT0iMjQiPjEyMzQ8L3RleHQ+PC9zdmc+",
      },
      "auth.captcha",
    );
  if (pathname === "/api/auth/login" && method === "POST")
    return respond(ROLE_USERS.admin, "auth.login");
  if (pathname === "/api/auth/register" && method === "POST")
    return respond(null, "auth.register");
  if (pathname === "/api/auth/resetPassword" && method === "POST")
    return respond(null, "auth.resetPassword");
  if (pathname === "/api/elders/options/doctors" && method === "GET")
    return respond(
      [{ id: 2, realName: "张医生", username: "doctor01" }],
      "elders.doctor-options",
    );
  if (pathname === "/api/elders/onboard" && method === "POST") {
    const elder = { ...ELDER, ...body?.elder, id: 102 };
    return respond(
      {
        elder,
        healthRecord: body?.healthRecord || null,
        initialExam: body?.initialExam || null,
        medicalHistories: body?.medicalHistories || [],
        workflow: {
          elder,
          healthRecordPresent: Boolean(body?.healthRecord),
          examCount: body?.initialExam ? 1 : 0,
          nursingPlanCount: 0,
          nursingRecordCount: 0,
          risk: {
            status: "created",
            created: true,
            reused: false,
            data: { id: 301, elderId: 102, riskLevel: 2 },
          },
          plan: {
            status: "created",
            created: true,
            reused: false,
            data: { id: 503, elderId: 102, planName: "自动健康随访计划" },
          },
          task: {
            status: "created",
            created: true,
            reused: false,
            data: { id: 603, elderId: 102, planId: 503 },
          },
          report: {
            status: "created",
            created: true,
            reused: false,
            data: { id: 703, elderId: 102 },
          },
          links: {
            risk: "/key-population?elderId=102",
            plan: "/followup?elderId=102",
            task: "/followup-tasks?elderId=102",
            report: "/ai-reports?elderId=102",
          },
        },
      },
      "elders.onboard",
    );
  }
  if (pathname === "/api/elders/stats" && method === "GET")
    return respond({ total: 1, male: 1, female: 0, trend: 3 }, "elders.stats");
  if (/^\/api\/elders\/\d+\/record$/.test(pathname) && method === "GET")
    return respond(
      {
        elderId: 101,
        height: 170,
        weight: 65,
        bloodType: "A",
        smokingStatus: 0,
        drinkingStatus: 0,
        exerciseFrequency: 2,
        selfCareAbility: 1,
        medicalHistory: "高血压",
      },
      "elders.health-record.get",
    );
  if (/^\/api\/elders\/\d+\/record$/.test(pathname) && method === "POST")
    return respond(null, "elders.health-record.save");
  if (/^\/api\/elders\/\d+$/.test(pathname) && method === "GET")
    return respond(ELDER, "elders.detail");
  if (pathname === "/api/elders" && method === "GET")
    return respond(
      pageResult([ELDER], Number(url.searchParams.get("pageSize") || 10)),
      "elders.list",
    );
  if (pathname === "/api/elders" && method === "POST")
    return respond(102, "elders.create");
  if (/^\/api\/elders\/\d+$/.test(pathname) && method === "PUT")
    return respond(null, "elders.update");
  if (/^\/api\/health-detail\/\d+$/.test(pathname) && method === "GET")
    return respond(
      {
        medicalHistory: [
          { id: 1001, elderId: 101, diseaseName: "高血压", remark: "规律复查" },
        ],
        medications: [],
        allergies: [],
        familyHistory: [],
      },
      "health-detail.list",
    );
  if (
    /^\/api\/health-detail\/(medical-history|medication|allergy|family-history)$/.test(
      pathname,
    ) &&
    method === "POST"
  )
    return respond(1002, "health-detail.create");
  if (
    /^\/api\/health-detail\/(medical-history|medication|allergy|family-history)\/\d+$/.test(
      pathname,
    ) &&
    method === "DELETE"
  )
    return respond(null, "health-detail.delete");
  if (pathname === "/api/warnings/stats" && method === "GET")
    return respond(
      {
        total: 4,
        pending: 2,
        processing: 1,
        handled: 1,
        ignored: 0,
        todayCount: 4,
      },
      "warnings.stats",
    );
  if (pathname === "/api/warnings/stats/realtime" && method === "GET")
    return respond(
      { total: 4, pending: 2, processing: 1, handled: 1 },
      "warnings.stats.realtime",
    );
  if (/^\/api\/warnings\/\d+\/logs$/.test(pathname) && method === "GET")
    return respond(
      [{ id: 1, action: "创建预警", createTime: "2026-07-10 08:00:00" }],
      "warnings.logs",
    );
  if (/^\/api\/warnings\/\d+$/.test(pathname) && method === "GET")
    return respond(
      WARNINGS.find((item) => item.id === Number(pathname.split("/").pop())) ||
        WARNINGS[0],
      "warnings.detail",
    );
  if (pathname === "/api/warnings" && method === "GET")
    return respond(pageResult(WARNINGS), "warnings.list");
  if (
    /^\/api\/warnings\/\d+\/(processing|handle|ignore|read)$/.test(pathname) &&
    method === "PUT"
  )
    return respond(null, `warnings.${pathname.split("/").pop()}`);
  if (pathname === "/api/warnings" && method === "POST")
    return respond({ id: 205, ...body }, "warnings.create");
  if (pathname === "/api/risk/stats" && method === "GET")
    return respond(
      { highRisk: 1, key: 0, attention: 0, normal: 0 },
      "risk.stats",
    );
  if (/^\/api\/risk\/elders\/\d+$/.test(pathname) && method === "GET")
    return respond(
      {
        elderId: 101,
        elderName: ELDER.name,
        riskLevel: 4,
        riskScore: 92,
        riskTags: "高血压,高龄",
      },
      "risk.detail",
    );
  if (pathname === "/api/risk/elders" && method === "GET")
    return respond(
      pageResult([
        {
          elderId: 101,
          elderName: ELDER.name,
          riskLevel: 4,
          riskLevelText: "高危",
          riskScore: 92,
          riskTags: "高血压,高龄",
          lastCalculateTime: "2026-07-10 09:00:00",
        },
      ]),
      "risk.list",
    );
  if (pathname === "/api/followup/plans/generate-risk" && method === "POST")
    return respond(
      {
        createdCount: 1,
        createdPlans: [
          {
            id: 503,
            elderId: 101,
            elderName: ELDER.name,
            planName: "高危老人自动随访计划",
            nextFollowDate: "2026-07-15",
          },
        ],
        skippedReasons: ["低风险老人无需生成"],
        message: "生成完成",
      },
      "followup.generate-risk",
    );
  if (pathname === "/api/followup/stats" && method === "GET")
    return respond(
      {
        totalPlans: 2,
        totalRecords: 1,
        activePlans: 1,
        completionRate: 50,
        dueTodayCount: 1,
        overdueCount: 0,
      },
      "followup.stats",
    );
  if (pathname === "/api/followup/plans" && method === "GET")
    return respond(pageResult(FOLLOWUP_PLANS), "followup.plans.list");
  if (pathname === "/api/followup/plans" && method === "POST")
    return respond({ id: 503, ...body }, "followup.plans.create");
  if (
    /^\/api\/followup\/plans\/\d+\/status$/.test(pathname) &&
    method === "PUT"
  )
    return respond(null, "followup.plans.status");
  if (pathname === "/api/followup/records" && method === "GET")
    return respond(
      pageResult(
        [FOLLOWUP_RECORD],
        Number(url.searchParams.get("pageSize") || 10),
      ),
      "followup.records.list",
    );
  if (pathname === "/api/followup/records" && method === "POST")
    return respond({ id: 512, ...body }, "followup.records.create");
  if (/^\/api\/followup\/records\/\d+$/.test(pathname) && method === "GET")
    return respond(FOLLOWUP_RECORD, "followup.records.detail");
  if (pathname === "/api/intervention/stats" && method === "GET")
    return respond(
      { total: 1, medication: 1, evaluated: 1 },
      "intervention.stats",
    );
  if (pathname === "/api/intervention/list" && method === "GET")
    return respond(pageResult([INTERVENTION]), "intervention.list");
  if (pathname === "/api/intervention" && method === "POST")
    return respond({ id: 522, ...body }, "intervention.create");
  if (/^\/api\/intervention\/\d+$/.test(pathname) && method === "GET")
    return respond(INTERVENTION, "intervention.detail");
  if (pathname === "/api/assessments/stats" && method === "GET")
    return respond({ total: 1, averageScore: 86 }, "assessments.stats");
  if (pathname === "/api/assessments" && method === "GET")
    return respond(pageResult([ASSESSMENT]), "assessments.list");
  if (pathname === "/api/assessments" && method === "POST")
    return respond({ id: 532, ...body }, "assessments.create");
  if (/^\/api\/assessments\/\d+$/.test(pathname) && method === "GET")
    return respond(ASSESSMENT, "assessments.detail");
  if (pathname === "/api/referrals/stats" && method === "GET")
    return respond(
      { pending: 2, processing: 1, completed: 1, upCount: 3, downCount: 1 },
      "referrals.stats",
    );
  if (pathname === "/api/referrals" && method === "GET")
    return respond(pageResult(REFERRALS), "referrals.list");
  if (/^\/api\/referrals\/\d+$/.test(pathname) && method === "GET")
    return respond(
      REFERRALS.find((item) => item.id === Number(pathname.split("/").pop())) ||
        REFERRALS[0],
      "referrals.detail",
    );
  if (
    /^\/api\/referrals\/\d+\/(accept|complete|reject|cancel)$/.test(pathname) &&
    method === "PUT"
  )
    return respond(null, `referrals.${pathname.split("/").pop()}`);
  if (/^\/api\/vitals\/latest\/\d+$/.test(pathname) && method === "GET")
    return respond(
      {
        systolic: {
          id: 1,
          elderId: 101,
          dataType: 1,
          dataValue: 132,
          unit: "mmHg",
          measureTime: "2026-07-10 08:00:00",
        },
      },
      "vitals.latest",
    );
  if (/^\/api\/vitals\/devices\/\d+$/.test(pathname) && method === "GET")
    return respond([DEVICE], "vitals.devices.list");
  if (/^\/api\/vitals\/trend\/\d+$/.test(pathname) && method === "GET")
    return respond(
      [
        {
          id: 1,
          elderId: 101,
          dataType: Number(url.searchParams.get("dataType") || 1),
          dataValue: 120,
          unit: "mock",
          measureTime: "2026-07-10 08:00:00",
        },
      ],
      "vitals.trend",
    );
  if (pathname === "/api/vitals/devices" && method === "POST")
    return respond({ id: 702, ...body }, "vitals.devices.bind");
  if (pathname === "/api/exams/stats" && method === "GET")
    return respond({ total: 1, abnormal: 0 }, "exams.stats");
  if (pathname === "/api/exams" && method === "GET")
    return respond(
      pageResult([
        {
          id: 711,
          elderId: 101,
          elderName: ELDER.name,
          examDate: "2026-07-01",
          height: 170,
          weight: 65,
          bmi: 22.5,
          examSummary: "状态良好",
        },
      ]),
      "exams.list",
    );
  if (pathname === "/api/exams" && method === "POST")
    return respond({ id: 712, ...body }, "exams.create");
  if (pathname === "/api/nurse/records/stats" && method === "GET")
    return respond(
      { total: 1, abnormal: 0, reported: 1 },
      "nurse.records.stats",
    );
  if (pathname === "/api/nurse/dashboard/stats" && method === "GET")
    return respond(
      { pendingRecords: 1, activePlans: 1, abnormalRecords: 0 },
      "nurse.dashboard.stats",
    );
  if (pathname === "/api/nurse/dashboard/tasks" && method === "GET")
    return respond(
      { records: NURSE_RECORDS, plans: NURSE_PLANS.slice(0, 2) },
      "nurse.dashboard.tasks",
    );
  if (pathname === "/api/nurse/records" && method === "GET")
    return respond(pageResult(NURSE_RECORDS), "nurse.records.list");
  if (pathname === "/api/nurse/records" && method === "POST")
    return respond({ id: 802, ...body }, "nurse.records.create");
  if (pathname === "/api/nurse/plans/stats" && method === "GET")
    return respond(
      { total: 4, pending: 1, active: 1, completed: 1 },
      "nurse.plans.stats",
    );
  if (pathname === "/api/nurse/plans" && method === "GET")
    return respond(pageResult(NURSE_PLANS), "nurse.plans.list");
  if (pathname === "/api/nurse/plans" && method === "POST")
    return respond({ id: 815, ...body }, "nurse.plans.create");
  if (/^\/api\/nurse\/plans\/\d+\/status$/.test(pathname) && method === "PUT")
    return respond(null, "nurse.plans.status");
  if (pathname === "/api/review/stats" && method === "GET")
    return respond(
      { pendingRecords: 1, pendingPlans: 1, approvedToday: 0 },
      "review.stats",
    );
  if (pathname === "/api/review/records" && method === "GET")
    return respond(pageResult(NURSE_RECORDS), "review.records.list");
  if (pathname === "/api/review/plans" && method === "GET")
    return respond(pageResult([REVIEW_PLAN]), "review.plans.list");
  if (
    /^\/api\/review\/records\/\d+\/(approve|reject)$/.test(pathname) &&
    method === "POST"
  )
    return respond(null, `review.records.${pathname.split("/").pop()}`);
  if (
    /^\/api\/review\/plans\/\d+\/(approve|reject)$/.test(pathname) &&
    method === "POST"
  )
    return respond(null, `review.plans.${pathname.split("/").pop()}`);
  if (pathname === "/api/ai/config" && method === "GET")
    return respond(AI_CONFIG, "ai.config.get");
  if (pathname === "/api/ai/config" && method === "PUT")
    return respond(null, "ai.config.update");
  if (pathname === "/api/ai/config/reload" && method === "POST")
    return respond(null, "ai.config.reload");
  if (pathname === "/api/auth/info" && method === "GET")
    return respond(PROFILE, "profile.info.get");
  if (pathname === "/api/profile/info" && method === "PUT")
    return respond(null, "profile.info.update");
  if (pathname === "/api/profile/avatar" && method === "POST")
    return respond(
      { avatar: "/uploads/mock-avatar.png" },
      "profile.avatar.upload",
    );
  if (pathname === "/api/auth/password" && method === "PUT")
    return respond(null, "profile.password.update");
  if (pathname === "/api/profile/messages" && method === "GET")
    return respond(pageResult([MESSAGE]), "profile.messages.list");
  if (pathname === "/api/profile/messages/unread-count" && method === "GET")
    return respond(1, "profile.messages.unread");
  if (
    /^\/api\/profile\/messages\/\d+\/read$/.test(pathname) &&
    method === "PUT"
  )
    return respond(null, "profile.messages.read");
  if (pathname === "/api/profile/messages/read-all" && method === "PUT")
    return respond(null, "profile.messages.read-all");
  if (pathname === "/api/profile/logs" && method === "GET")
    return respond(
      pageResult([
        {
          id: 1,
          userId: 2,
          module: "登录",
          operationType: "LOGIN",
          description: "登录系统",
          requestIp: "127.0.0.1",
          duration: 12,
          createTime: "2026-07-10 07:50:00",
        },
      ]),
      "profile.logs",
    );
  if (pathname === "/api/dashboard/todo" && method === "GET")
    return respond(
      { pendingWarnings: 2, dueFollowups: 1, pendingReviews: 2 },
      "dashboard.todo",
    );
  if (pathname === "/api/dashboard/review-counts" && method === "GET")
    return respond({ records: 1, plans: 1 }, "dashboard.review-counts");
  if (pathname === "/api/dashboard/chronic-overview" && method === "GET")
    return respond(
      { hypertension: 1, diabetes: 1 },
      "dashboard.chronic-overview",
    );
  entry.mock = "fallback";
  await route.fulfill(apiEnvelope(method === "GET" ? {} : null));
}

async function ensureBaseUrl() {
  const response = await fetch(`${BASE_URL}/login`, {
    signal: AbortSignal.timeout(5_000),
  }).catch(() => null);
  assert(response?.ok, `无法访问 ${BASE_URL}/login，请先启动 Vite 开发服务`);
}

async function prepareOutputDir() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const entries = await fs.readdir(OUT_DIR, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".png"))
      .map((entry) => fs.unlink(path.join(OUT_DIR, entry.name))),
  );
}

async function createScenarioContext(browser, role) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const payload = role
    ? { token: ROLE_USERS[role].token, userInfo: ROLE_USERS[role] }
    : null;
  await context.addInitScript((auth) => {
    window.localStorage.clear();
    if (!auth) return;
    window.localStorage.setItem("token", auth.token);
    window.localStorage.setItem("userInfo", JSON.stringify(auth.userInfo));
    window.localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          token: auth.token,
          userInfo: auth.userInfo,
          isAuthenticated: true,
        },
        version: 0,
      }),
    );
  }, payload);
  return context;
}

async function openPage(page, route, heading) {
  await page.goto(`${BASE_URL}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: ACTION_TIMEOUT,
  });
  if (heading)
    await page
      .getByRole("heading", { name: heading, exact: true })
      .waitFor({ state: "visible", timeout: ACTION_TIMEOUT });
}

function fieldByLabel(root, labelText) {
  return root
    .locator("label")
    .filter({ hasText: labelText })
    .first()
    .locator("xpath=..")
    .locator("input, select, textarea")
    .first();
}

function borderedCard(page, uniqueText) {
  return page
    .getByText(uniqueText, { exact: true })
    .first()
    .locator(
      "xpath=ancestor::div[contains(@class,'rounded-xl') and contains(@class,'border')][1]",
    );
}

function mutationPredicate(method, pathname) {
  return (request) =>
    request.method() === method && new URL(request.url()).pathname === pathname;
}

async function captureMutation(page, method, pathname, action) {
  const pending = page.waitForRequest(mutationPredicate(method, pathname), {
    timeout: ACTION_TIMEOUT,
  });
  await action();
  return requestSnapshot(await pending);
}

function assertJsonBody(request, expected) {
  assert.deepEqual(
    request.body,
    expected,
    `${request.method} ${request.path} body 不符合预期`,
  );
}
function assertBodyIncludes(request, expected) {
  assert.equal(
    typeof request.body,
    "object",
    `${request.method} ${request.path} 未捕获到对象 body`,
  );
  for (const [key, value] of Object.entries(expected))
    assert.deepEqual(
      request.body?.[key],
      value,
      `${request.method} ${request.path} body.${key} 不符合预期`,
    );
}
function safeFileName(value) {
  return (
    value
      .replace(/[^\p{L}\p{N}._-]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "failed"
  );
}
const scenarios = [];
function scenario(name, role, route, heading, run) {
  scenarios.push({ name, role, route, heading, run });
}

scenario(
  "登录、注册和找回密码弹窗及校验",
  null,
  "/login",
  "智慧医养医生服务系统",
  async ({ page }) => {
    await page.getByRole("button", { name: "登录", exact: true }).click();
    await page.getByText("请输入用户名和密码", { exact: true }).waitFor();
    await page.getByRole("button", { name: "注册账号", exact: true }).click();
    const registerDialog = page
      .getByRole("dialog")
      .filter({ hasText: "注册账号" });
    await registerDialog
      .getByRole("button", { name: "提交注册", exact: true })
      .click();
    await registerDialog
      .getByText("用户名必须为4-20位中文、字母、数字或下划线", { exact: true })
      .waitFor();
    await registerDialog.locator("#register-username").fill("nurse_test");
    await registerDialog.locator("#register-real-name").fill("回归护士");
    await registerDialog.locator("#register-phone").fill("13900139001");
    await registerDialog.locator("#register-role").selectOption("3");
    await registerDialog.locator("#register-password").fill("Testpass123");
    await registerDialog.locator("#register-confirm").fill("Testpass123");
    await registerDialog.locator("#register-captcha").fill("1234");
    const registerRequest = await captureMutation(
      page,
      "POST",
      "/api/auth/register",
      () =>
        registerDialog
          .getByRole("button", { name: "提交注册", exact: true })
          .click(),
    );
    assertBodyIncludes(registerRequest, {
      username: "nurse_test",
      realName: "回归护士",
      phone: "13900139001",
      userType: 3,
      password: "Testpass123",
      confirmPassword: "Testpass123",
      captchaKey: "captcha-fixture",
      captchaCode: "1234",
    });
    await registerDialog.waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "忘记密码", exact: true }).click();
    const resetDialog = page
      .getByRole("dialog")
      .filter({ hasText: "找回密码" });
    await resetDialog.locator("#reset-username").fill("doctor01");
    await resetDialog.locator("#reset-phone").fill("123");
    await resetDialog.locator("#reset-password").fill("Newpass123");
    await resetDialog.locator("#reset-confirm").fill("Newpass123");
    await resetDialog.locator("#reset-captcha").fill("1234");
    await resetDialog
      .getByRole("button", { name: "确认重置", exact: true })
      .click();
    await resetDialog
      .getByText("请输入正确的11位中国大陆手机号", { exact: true })
      .waitFor();
    await resetDialog.locator("#reset-phone").fill("13800138000");
    const resetRequest = await captureMutation(
      page,
      "POST",
      "/api/auth/resetPassword",
      () =>
        resetDialog
          .getByRole("button", { name: "确认重置", exact: true })
          .click(),
    );
    assertBodyIncludes(resetRequest, {
      username: "doctor01",
      phone: "13800138000",
      newPassword: "Newpass123",
      confirmPassword: "Newpass123",
      captchaKey: "captcha-fixture",
      captchaCode: "1234",
    });
    await resetDialog.waitFor({ state: "hidden" });
    await page.locator("#login-username").fill("admin");
    await page.locator("#login-password").fill("admin123");
    await page.locator("#login-captcha").fill("1234");
    const loginRequest = await captureMutation(
      page,
      "POST",
      "/api/auth/login",
      () => page.getByRole("button", { name: "登录", exact: true }).click(),
    );
    assertJsonBody(loginRequest, {
      username: "admin",
      password: "admin123",
      captchaKey: "captcha-fixture",
      captchaCode: "1234",
    });
    await page
      .getByRole("heading", { name: "管理员工作台", exact: true })
      .waitFor({ timeout: ACTION_TIMEOUT });
  },
);

scenario(
  "老人新增和健康详情",
  "doctor",
  "/elders",
  "老人档案",
  async ({ page }) => {
    await page
      .getByRole("button", { name: "新增老人档案", exact: true })
      .click();
    const createDialog = page
      .getByRole("dialog")
      .filter({ hasText: "新增老人并建立健康管理档案" });
    await createDialog
      .getByRole("button", { name: "保存并建档", exact: true })
      .click();
    await createDialog.getByText("姓名不能为空", { exact: true }).waitFor();
    await fieldByLabel(createDialog, "姓名 *").fill("新增回归老人");
    await fieldByLabel(createDialog, "身份证号 *").fill("110101195001020223");
    await fieldByLabel(createDialog, "联系电话").fill("13800138022");
    await fieldByLabel(createDialog, "紧急联系人").fill("新增家属");
    await fieldByLabel(createDialog, "紧急联系电话").fill("13800138023");
    await fieldByLabel(createDialog, "所属社区").fill("回归社区");
    const createRequest = await captureMutation(
      page,
      "POST",
      "/api/elders/onboard",
      () =>
        createDialog
          .getByRole("button", { name: "保存并建档", exact: true })
          .click(),
    );
    assertBodyIncludes(createRequest, { generateWorkflow: true });
    assert.deepEqual(createRequest.body?.elder, {
      ...createRequest.body?.elder,
      name: "新增回归老人",
      idCard: "110101195001020223",
      phone: "13800138022",
      emergencyContact: "新增家属",
      emergencyPhone: "13800138023",
      community: "回归社区",
      gender: 1,
      accountStatus: 1,
      doctorId: 2,
    });
    await createDialog.waitFor({ state: "hidden" });
    await page
      .getByRole("dialog")
      .filter({ hasText: "老人建档与健康管理流程已完成" })
      .getByRole("button", { name: "暂不跳转", exact: true })
      .click();
    const recordGet = page.waitForRequest(
      (request) =>
        request.method() === "GET" &&
        new URL(request.url()).pathname === "/api/elders/101/record",
    );
    const detailGet = page.waitForRequest(
      (request) =>
        request.method() === "GET" &&
        new URL(request.url()).pathname === "/api/health-detail/101",
    );
    await borderedCard(page, ELDER.name)
      .getByRole("button", { name: "健康详情", exact: true })
      .click();
    await Promise.all([recordGet, detailGet]);
    const healthDialog = page
      .getByRole("dialog")
      .filter({ hasText: `${ELDER.name} · 健康档案` });
    await healthDialog
      .getByRole("heading", { name: `${ELDER.name} · 健康档案`, exact: true })
      .waitFor();
    assert.equal(
      await fieldByLabel(healthDialog, "BMI").getAttribute("readonly"),
      "",
      "健康档案 BMI 应为只读",
    );
    await healthDialog.getByRole("tab", { name: "病史", exact: true }).click();
    await healthDialog.getByPlaceholder("疾病名称").fill("冠心病");
    await healthDialog.getByPlaceholder("备注/关系/说明").fill("2026 年确诊");
    const detailRequest = await captureMutation(
      page,
      "POST",
      "/api/health-detail/medical-history",
      () =>
        healthDialog.getByRole("button", { name: "新增", exact: true }).click(),
    );
    assertJsonBody(detailRequest, {
      elderId: 101,
      diseaseName: "冠心病",
      isCured: 0,
      remark: "2026 年确诊",
    });
  },
);

scenario(
  "预警处理中、处理、忽略和已读",
  "doctor",
  "/warnings",
  "预警中心",
  async ({ page }) => {
    const processingRequest = await captureMutation(
      page,
      "PUT",
      "/api/warnings/201/processing",
      () =>
        borderedCard(page, "待处理高压预警")
          .getByRole("button", { name: "处理中", exact: true })
          .click(),
    );
    assertJsonBody(processingRequest, { doctorId: 2 });
    await borderedCard(page, "处理中血糖预警")
      .getByRole("button", { name: "处理", exact: true })
      .click();
    const handleDialog = page
      .getByRole("dialog")
      .filter({ hasText: "处理健康预警" });
    await handleDialog.locator("textarea").fill("电话联系家属并调整用药");
    const handleRequest = await captureMutation(
      page,
      "PUT",
      "/api/warnings/202/handle",
      () =>
        handleDialog
          .getByRole("button", { name: "确认处理", exact: true })
          .click(),
    );
    assertJsonBody(handleRequest, {
      id: 202,
      handleResult: "电话联系家属并调整用药",
      doctorId: 2,
    });
    await handleDialog.waitFor({ state: "hidden" });
    await borderedCard(page, "可忽略心率预警")
      .getByRole("button", { name: "忽略", exact: true })
      .click();
    const ignoreDialog = page
      .getByRole("dialog")
      .filter({ hasText: "忽略健康预警" });
    await ignoreDialog.locator("textarea").fill("运动后短时波动");
    const ignoreRequest = await captureMutation(
      page,
      "PUT",
      "/api/warnings/203/ignore",
      () =>
        ignoreDialog
          .getByRole("button", { name: "确认忽略", exact: true })
          .click(),
    );
    assertJsonBody(ignoreRequest, { id: 203, handleResult: "运动后短时波动" });
    await ignoreDialog.waitFor({ state: "hidden" });
    const readRequest = await captureMutation(
      page,
      "PUT",
      "/api/warnings/204/read",
      () =>
        borderedCard(page, "已处理血氧预警")
          .getByRole("button", { name: "已读", exact: true })
          .click(),
    );
    assertJsonBody(readRequest, { doctorId: 2 });
  },
);

scenario(
  "风险计划结果弹窗",
  "doctor",
  "/key-population",
  "重点人群",
  async ({ page }) => {
    const request = await captureMutation(
      page,
      "POST",
      "/api/followup/plans/generate-risk",
      () =>
        borderedCard(page, ELDER.name)
          .getByRole("button", { name: "生成计划", exact: true })
          .click(),
    );
    const url = new URL(request.url);
    assert.equal(url.searchParams.get("doctorId"), "2");
    assert.equal(url.searchParams.get("elderId"), "101");
    const resultDialog = page
      .getByRole("dialog")
      .filter({ hasText: "风险随访计划处理完成" });
    await resultDialog
      .getByText("已生成：高危老人自动随访计划", { exact: true })
      .waitFor();
    await resultDialog
      .getByText("已跳过：低风险老人无需生成", { exact: true })
      .waitFor();
    await resultDialog
      .getByRole("button", { name: "暂不跳转", exact: true })
      .click();
  },
);

scenario(
  "随访新增、记录查看和状态流转",
  "doctor",
  "/followup",
  "随访计划",
  async ({ page }) => {
    await page
      .getByRole("button", { name: "新增随访计划", exact: true })
      .click();
    const planDialog = page
      .getByRole("dialog")
      .filter({ hasText: "新增随访计划" });
    await fieldByLabel(planDialog, "老人").selectOption("101");
    await fieldByLabel(planDialog, "计划名称").fill("按钮级回归随访计划");
    await fieldByLabel(planDialog, "开始日期").fill("2026-07-10");
    await fieldByLabel(planDialog, "结束日期").fill("2026-12-31");
    await fieldByLabel(planDialog, "计划总次数").fill("6");
    const planRequest = await captureMutation(
      page,
      "POST",
      "/api/followup/plans",
      () =>
        planDialog
          .getByRole("button", { name: "确认新增", exact: true })
          .click(),
    );
    assertBodyIncludes(planRequest, {
      elderId: 101,
      planName: "按钮级回归随访计划",
      startDate: "2026-07-10",
      endDate: "2026-12-31",
      totalCount: 6,
      doctorId: 2,
    });
    await planDialog.waitFor({ state: "hidden" });
    await page
      .getByRole("dialog")
      .filter({ hasText: "随访计划已新增" })
      .getByRole("button", { name: "暂不跳转", exact: true })
      .click();
    await borderedCard(page, "待执行高血压随访")
      .getByRole("button", { name: "查看记录", exact: true })
      .click();
    const historyDialog = page
      .getByRole("dialog")
      .filter({ hasText: "随访历史" });
    await historyDialog
      .getByText(FOLLOWUP_RECORD.followResult, { exact: true })
      .waitFor();
    await historyDialog
      .getByRole("button", { name: "详情", exact: true })
      .click();
    const detailDialog = page
      .getByRole("dialog")
      .filter({ hasText: "随访记录详情" });
    await detailDialog
      .getByText("血压稳定，继续观察", { exact: true })
      .waitFor();
    await detailDialog
      .getByRole("button", { name: "关闭", exact: true })
      .click();
    await historyDialog
      .getByRole("button", { name: "关闭", exact: true })
      .click();
    await borderedCard(page, "待执行高血压随访")
      .getByRole("button", { name: "记录结果", exact: true })
      .click();
    const recordDialog = page
      .getByRole("dialog")
      .filter({ hasText: "记录随访结果" });
    await fieldByLabel(recordDialog, "随访结论").fill("本次随访情况稳定");
    const recordRequest = await captureMutation(
      page,
      "POST",
      "/api/followup/records",
      () =>
        recordDialog
          .getByRole("button", { name: "保存并记录随访", exact: true })
          .click(),
    );
    assertBodyIncludes(recordRequest, {
      planId: 501,
      elderId: 101,
      doctorId: 2,
      followResult: "本次随访情况稳定",
    });
    await recordDialog.waitFor({ state: "hidden" });
    await page
      .getByRole("dialog")
      .filter({ hasText: "随访结果已记录" })
      .getByRole("button", { name: "暂不跳转", exact: true })
      .click();
    const startRequest = await captureMutation(
      page,
      "PUT",
      "/api/followup/plans/501/status",
      () =>
        borderedCard(page, "待执行高血压随访")
          .getByRole("button", { name: "开始", exact: true })
          .click(),
    );
    assert.equal(new URL(startRequest.url).searchParams.get("status"), "1");
    assertJsonBody(startRequest, { id: 501, status: 1 });
    const completeRequest = await captureMutation(
      page,
      "PUT",
      "/api/followup/plans/502/status",
      () =>
        borderedCard(page, "进行中糖尿病随访")
          .getByRole("button", { name: "完成", exact: true })
          .click(),
    );
    assert.equal(new URL(completeRequest.url).searchParams.get("status"), "2");
    assertJsonBody(completeRequest, { id: 502, status: 2 });
  },
);

scenario(
  "新增干预记录",
  "doctor",
  "/interventions",
  "干预管理",
  async ({ page }) => {
    await page
      .getByRole("button", { name: "新增干预记录", exact: true })
      .click();
    const dialog = page.getByRole("dialog").filter({ hasText: "新增干预记录" });
    await fieldByLabel(dialog, "老人").selectOption("101");
    await fieldByLabel(dialog, "关联随访记录ID").fill("511");
    await fieldByLabel(dialog, "干预类型").selectOption("2");
    await fieldByLabel(dialog, "干预标题").fill("饮食运动联合干预");
    await fieldByLabel(dialog, "干预内容").fill("低盐饮食，每日步行 30 分钟");
    const request = await captureMutation(
      page,
      "POST",
      "/api/intervention",
      () => dialog.getByRole("button", { name: "保存", exact: true }).click(),
    );
    assertBodyIncludes(request, {
      elderId: 101,
      followRecordId: 511,
      interventionType: 2,
      interventionTitle: "饮食运动联合干预",
      interventionContent: "低盐饮食，每日步行 30 分钟",
      doctorId: 2,
    });
  },
);

scenario(
  "评估类型 1-9 新增请求",
  "doctor",
  "/assessments",
  "评估记录",
  async ({ page }) => {
    const labels = [
      "日常生活能力",
      "认知功能",
      "情绪/心理",
      "营养",
      "跌倒风险",
      "压疮风险",
      "疼痛",
      "社会功能",
      "综合",
    ];
    for (let type = 1; type <= 9; type += 1) {
      await page
        .getByRole("button", { name: "新增评估记录", exact: true })
        .click();
      const dialog = page.getByRole("dialog").filter({ hasText: "新增评估" });
      await fieldByLabel(dialog, "老人").selectOption("101");
      await fieldByLabel(dialog, "评估类型").selectOption(String(type));
      await fieldByLabel(dialog, "评估日期").fill("2026-07-10");
      await fieldByLabel(dialog, "评分").fill(String(70 + type));
      await fieldByLabel(dialog, "评估结果").fill(
        `${labels[type - 1]}回归结果`,
      );
      const request = await captureMutation(
        page,
        "POST",
        "/api/assessments",
        () =>
          dialog.getByRole("button", { name: "确认新增", exact: true }).click(),
      );
      assertBodyIncludes(request, {
        elderId: 101,
        assessType: type,
        assessDate: "2026-07-10",
        score: 70 + type,
        doctorId: 2,
        result: `${labels[type - 1]}回归结果`,
      });
      await dialog.waitFor({ state: "hidden" });
    }
  },
);

scenario(
  "转诊角色动作和请求",
  "doctor",
  "/referrals",
  "转诊协同",
  async ({ page }) => {
    const receiveCard = borderedCard(page, "接收权限老人");
    await receiveCard
      .getByRole("button", { name: "接收", exact: true })
      .waitFor();
    assert.equal(
      await receiveCard
        .getByRole("button", { name: "取消", exact: true })
        .count(),
      0,
      "接收医生不应看到转出方取消按钮",
    );
    const acceptRequest = await captureMutation(
      page,
      "PUT",
      "/api/referrals/601/accept",
      () =>
        receiveCard.getByRole("button", { name: "接收", exact: true }).click(),
    );
    assertJsonBody(acceptRequest, 601);
    await receiveCard
      .getByRole("button", { name: "拒绝", exact: true })
      .click();
    const rejectDialog = page
      .getByRole("dialog")
      .filter({ hasText: "拒绝转诊" });
    await rejectDialog.locator("textarea").fill("床位暂时不足");
    const rejectRequest = await captureMutation(
      page,
      "PUT",
      "/api/referrals/601/reject",
      () =>
        rejectDialog
          .getByRole("button", { name: "提交处理结果", exact: true })
          .click(),
    );
    assertJsonBody(rejectRequest, { id: 601, reason: "床位暂时不足" });
    const completeCard = borderedCard(page, "完成权限老人");
    await completeCard
      .getByRole("button", { name: "完成", exact: true })
      .click();
    const completeDialog = page
      .getByRole("dialog")
      .filter({ hasText: "完成转诊" });
    await completeDialog.locator("textarea").fill("病情稳定，转回社区随访");
    const completeRequest = await captureMutation(
      page,
      "PUT",
      "/api/referrals/602/complete",
      () =>
        completeDialog
          .getByRole("button", { name: "提交处理结果", exact: true })
          .click(),
    );
    assertJsonBody(completeRequest, {
      id: 602,
      dischargeSummary: "病情稳定，转回社区随访",
    });
    const cancelCard = borderedCard(page, "取消权限老人");
    assert.equal(
      await cancelCard
        .getByRole("button", { name: "接收", exact: true })
        .count(),
      0,
      "转出医生不应看到接收按钮",
    );
    await cancelCard.getByRole("button", { name: "取消", exact: true }).click();
    const cancelDialog = page
      .getByRole("dialog")
      .filter({ hasText: "取消转诊" });
    await cancelDialog.locator("textarea").fill("老人暂缓转诊");
    const cancelRequest = await captureMutation(
      page,
      "PUT",
      "/api/referrals/603/cancel",
      () =>
        cancelDialog
          .getByRole("button", { name: "提交处理结果", exact: true })
          .click(),
    );
    assertJsonBody(cancelRequest, { id: 603, reason: "老人暂缓转诊" });
    const terminalCard = borderedCard(page, "终态转诊老人");
    for (const action of ["接收", "拒绝", "完成", "取消"])
      assert.equal(
        await terminalCard
          .getByRole("button", { name: action, exact: true })
          .count(),
        0,
        `终态转诊不应显示“${action}”`,
      );
  },
);

scenario(
  "护士角色无转诊动作权限",
  "nurse",
  "/referrals",
  "护士工作台",
  async ({ page }) => {
    assert.equal(new URL(page.url()).pathname, "/nurse-dashboard");
  },
);

scenario("穿戴设备绑定", "doctor", "/vitals", "生命体征", async ({ page }) => {
  await fieldByLabel(page, "老人档案").selectOption("101");
  await page.getByRole("button", { name: "绑定设备", exact: true }).waitFor();
  await page.getByRole("button", { name: "绑定设备", exact: true }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "绑定设备" });
  await dialog.getByRole("button", { name: "确认绑定", exact: true }).click();
  await dialog.getByText("设备名称不能为空", { exact: true }).waitFor();
  await fieldByLabel(dialog, "设备名称").fill("回归血压计");
  await fieldByLabel(dialog, "设备序列号").fill("E2E-BP-001");
  await fieldByLabel(dialog, "设备类型").selectOption("2");
  const request = await captureMutation(
    page,
    "POST",
    "/api/vitals/devices",
    () => dialog.getByRole("button", { name: "确认绑定", exact: true }).click(),
  );
  assertJsonBody(request, {
    elderId: 101,
    deviceName: "回归血压计",
    deviceSn: "E2E-BP-001",
    deviceType: 2,
    bindStatus: 1,
  });
});

scenario(
  "体检空数字不提交 0 且 BMI 只读",
  "doctor",
  "/exams",
  "体检管理",
  async ({ page }) => {
    await page
      .getByRole("button", { name: "新增体检记录", exact: true })
      .click();
    const dialog = page.getByRole("dialog").filter({ hasText: "新增体检记录" });
    await fieldByLabel(dialog, "老人").selectOption("101");
    await fieldByLabel(dialog, "体检日期").fill("2026-07-10");
    await dialog.getByPlaceholder("身高", { exact: true }).fill("170");
    await dialog.getByPlaceholder("体重", { exact: true }).fill("65");
    const bmi = fieldByLabel(dialog, "BMI");
    assert.equal(
      await bmi.getAttribute("readonly"),
      "",
      "BMI 输入框必须为只读",
    );
    assert.equal(await bmi.inputValue(), "22.5", "BMI 应由身高体重自动计算");
    const request = await captureMutation(page, "POST", "/api/exams", () =>
      dialog.getByRole("button", { name: "确认新增", exact: true }).click(),
    );
    assertBodyIncludes(request, {
      elderId: 101,
      examDate: "2026-07-10",
      height: 170,
      weight: 65,
    });
    for (const key of [
      "systolicPressure",
      "diastolicPressure",
      "heartRate",
      "bloodSugarFasting",
      "bloodSugarRandom",
      "temperature",
      "bloodOxygen",
      "waistline",
      "bmi",
    ])
      assert.equal(
        Object.hasOwn(request.body, key),
        false,
        `空数字字段 ${key} 不应被提交为 0 或空值`,
      );
    assert.equal(
      Object.values(request.body).some((value) => value === 0),
      false,
      "体检请求不应包含由空输入转换出的 0",
    );
  },
);

scenario(
  "护理新增请求含 nurseId 且终态按钮隐藏",
  "nurse",
  "/nurse-records",
  "护理记录",
  async ({ page }) => {
    await page
      .getByRole("button", { name: "新增护理记录", exact: true })
      .click();
    const recordDialog = page
      .getByRole("dialog")
      .filter({ hasText: "新增护理记录" });
    await recordDialog.locator("select").first().selectOption("101");
    await recordDialog.getByPlaceholder("记录标题").fill("新增回归护理记录");
    await recordDialog.getByPlaceholder("记录内容").fill("完成生命体征观察");
    const recordRequest = await captureMutation(
      page,
      "POST",
      "/api/nurse/records",
      () =>
        recordDialog
          .getByRole("button", { name: "保存护理记录", exact: true })
          .click(),
    );
    assertBodyIncludes(recordRequest, {
      elderId: 101,
      recordTitle: "新增回归护理记录",
      recordContent: "完成生命体征观察",
      nurseId: 3,
    });
    await openPage(page, "/nurse-plans", "护理计划");
    await page
      .getByRole("button", { name: "新增护理计划", exact: true })
      .click();
    const planDialog = page
      .getByRole("dialog")
      .filter({ hasText: "新增护理计划" });
    await planDialog.locator("select").first().selectOption("101");
    await planDialog.getByPlaceholder("计划名称").fill("新增回归护理计划");
    await planDialog.getByPlaceholder("执行频次").fill("每日两次");
    const planRequest = await captureMutation(
      page,
      "POST",
      "/api/nurse/plans",
      () =>
        planDialog
          .getByRole("button", { name: "保存护理计划", exact: true })
          .click(),
    );
    assertBodyIncludes(planRequest, {
      elderId: 101,
      planName: "新增回归护理计划",
      frequency: "每日两次",
      nurseId: 3,
    });
    await page
      .getByRole("dialog")
      .filter({ hasText: "护理计划已新增" })
      .getByRole("button", { name: "暂不跳转", exact: true })
      .click();
    for (const planName of ["已完成护理计划", "已终止护理计划"]) {
      const card = borderedCard(page, planName);
      await card.getByRole("button", { name: "详情", exact: true }).waitFor();
      for (const action of [
        "编辑",
        "开始执行",
        "完成一次",
        "完成计划",
        "终止",
        "删除",
      ])
        assert.equal(
          await card.getByRole("button", { name: action, exact: true }).count(),
          0,
          `${planName} 不应显示“${action}”按钮`,
        );
    }
  },
);

scenario(
  "审核通过必须二次确认",
  "doctor",
  "/nurse-review",
  "护士审核",
  async ({ page, requests }) => {
    const beforeRecord = requests.filter(
      (item) => item.pathname === "/api/review/records/801/approve",
    ).length;
    await borderedCard(page, "待审核护理记录")
      .getByRole("button", { name: "通过", exact: true })
      .click();
    const recordConfirm = page
      .getByRole("dialog")
      .filter({ hasText: "通过护理记录" });
    await recordConfirm
      .getByText("确定通过这条护理记录吗？确认后将提交审核结果。", {
        exact: true,
      })
      .waitFor();
    assert.equal(
      requests.filter(
        (item) => item.pathname === "/api/review/records/801/approve",
      ).length,
      beforeRecord,
      "点击通过后、确认前不应提交审核请求",
    );
    const recordRequest = await captureMutation(
      page,
      "POST",
      "/api/review/records/801/approve",
      () =>
        recordConfirm
          .getByRole("button", { name: "确认通过", exact: true })
          .click(),
    );
    assertJsonBody(recordRequest, { id: 801 });
    await page
      .getByRole("tab", { name: "待审核护理计划", exact: true })
      .click();
    const beforePlan = requests.filter(
      (item) => item.pathname === "/api/review/plans/821/approve",
    ).length;
    await borderedCard(page, REVIEW_PLAN.planName)
      .getByRole("button", { name: "通过", exact: true })
      .click();
    const planConfirm = page
      .getByRole("dialog")
      .filter({ hasText: "通过护理计划" });
    await planConfirm
      .getByText(
        `确定通过“${REVIEW_PLAN.planName}”吗？通过后计划将生效并开始执行。`,
        { exact: true },
      )
      .waitFor();
    assert.equal(
      requests.filter(
        (item) => item.pathname === "/api/review/plans/821/approve",
      ).length,
      beforePlan,
      "护理计划确认前不应提交审核请求",
    );
    const planRequest = await captureMutation(
      page,
      "POST",
      "/api/review/plans/821/approve",
      () =>
        planConfirm
          .getByRole("button", { name: "确认通过", exact: true })
          .click(),
    );
    assertJsonBody(planRequest, 821);
  },
);

scenario(
  "AI 配置控件、保存和重载",
  "admin",
  "/admin-ai-config",
  "AI 配置管理",
  async ({ page }) => {
    const apiKeyRow = borderedCard(page, "ai.api_key");
    const apiKeyInput = apiKeyRow.locator("input").first();
    assert.equal(await apiKeyInput.getAttribute("type"), "password");
    await apiKeyRow
      .getByRole("button", { name: "显示 API Key", exact: true })
      .click();
    assert.equal(await apiKeyInput.getAttribute("type"), "text");
    const mockCheckbox = borderedCard(page, "ai.mock_enabled").locator(
      'input[type="checkbox"]',
    );
    assert.equal(await mockCheckbox.isChecked(), true);
    await mockCheckbox.uncheck();
    await borderedCard(page, "ai.base_url")
      .locator("input")
      .first()
      .fill("https://api.regression.test/v1");
    await borderedCard(page, "ai.model")
      .locator("input")
      .first()
      .fill("medical-regression-model");
    await borderedCard(page, "ai.max_per_day")
      .locator("input")
      .first()
      .fill("321");
    await borderedCard(page, "ai.timeout_seconds")
      .locator("input")
      .first()
      .fill("45");
    await borderedCard(page, "ai.max_retries")
      .locator("input")
      .first()
      .fill("4");
    const saveRequest = await captureMutation(
      page,
      "PUT",
      "/api/ai/config",
      () => page.getByRole("button", { name: "保存全部", exact: true }).click(),
    );
    assert.equal(
      saveRequest.body?.["ai.base_url"]?.value,
      "https://api.regression.test/v1",
    );
    assert.equal(
      saveRequest.body?.["ai.model"]?.value,
      "medical-regression-model",
    );
    assert.equal(saveRequest.body?.["ai.mock_enabled"]?.value, "false");
    assert.equal(saveRequest.body?.["ai.max_per_day"]?.value, "321");
    assert.equal(saveRequest.body?.["ai.timeout_seconds"]?.value, "45");
    assert.equal(saveRequest.body?.["ai.max_retries"]?.value, "4");
    const reloadRequest = await captureMutation(
      page,
      "POST",
      "/api/ai/config/reload",
      () => page.getByRole("button", { name: "重载配置", exact: true }).click(),
    );
    assert.equal(reloadRequest.body, null);
  },
);

scenario(
  "个人资料、头像、密码和消息",
  "doctor",
  "/profile",
  "个人中心",
  async ({ page }) => {
    await fieldByLabel(page, "真实姓名").fill("张回归医生");
    await fieldByLabel(page, "手机号").fill("13800138088");
    await fieldByLabel(page, "邮箱").fill("regression.doctor@example.test");
    const profileRequest = await captureMutation(
      page,
      "PUT",
      "/api/profile/info",
      () => page.getByRole("button", { name: "保存修改", exact: true }).click(),
    );
    assertJsonBody(profileRequest, {
      realName: "张回归医生",
      phone: "13800138088",
      email: "regression.doctor@example.test",
      avatar: "",
    });
    const avatarPending = page.waitForRequest(
      mutationPredicate("POST", "/api/profile/avatar"),
      { timeout: ACTION_TIMEOUT },
    );
    await page
      .locator('input[type="file"]')
      .setInputFiles({
        name: "avatar.png",
        mimeType: "image/png",
        buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      });
    const avatarRequest = requestSnapshot(await avatarPending);
    assert.equal(
      avatarRequest.body?.contentType?.includes("multipart/form-data"),
      true,
    );
    assert.equal(
      avatarRequest.body?.preview?.includes("avatar.png"),
      true,
      "头像 multipart body 应包含文件名",
    );
    await page.getByRole("tab", { name: "系统消息", exact: true }).click();
    const readRequest = await captureMutation(
      page,
      "PUT",
      "/api/profile/messages/901/read",
      () => page.getByRole("button", { name: "标记已读", exact: true }).click(),
    );
    assertJsonBody(readRequest, 901);
    const allReadRequest = await captureMutation(
      page,
      "PUT",
      "/api/profile/messages/read-all",
      () =>
        page.getByRole("button", { name: "全部标记已读", exact: true }).click(),
    );
    assert.equal(new URL(allReadRequest.url).searchParams.get("userId"), "2");
    assertJsonBody(allReadRequest, { userId: 2 });
    await page.getByRole("tab", { name: "修改密码", exact: true }).click();
    await page.getByPlaceholder("旧密码").fill("Oldpass123");
    await page
      .getByPlaceholder("新密码，8-20位且至少包含字母和数字")
      .fill("Newpass456");
    await page.getByPlaceholder("确认新密码").fill("Newpass456");
    const passwordRequest = await captureMutation(
      page,
      "PUT",
      "/api/auth/password",
      () =>
        page.getByRole("button", { name: "确认修改密码", exact: true }).click(),
    );
    assertJsonBody(passwordRequest, {
      oldPassword: "Oldpass123",
      newPassword: "Newpass456",
      confirmPassword: "Newpass456",
    });
    await page
      .getByRole("heading", { name: "智慧医养医生服务系统", exact: true })
      .waitFor({ timeout: ACTION_TIMEOUT });
  },
);

async function runScenario(browser, definition) {
  const context = await createScenarioContext(browser, definition.role);
  const requests = [];
  const pageErrors = [];
  const consoleErrors = [];
  const page = await context.newPage();
  const startedAt = Date.now();
  let screenshot = null;
  page.setDefaultTimeout(ACTION_TIMEOUT);
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await context.route("**/api/**", async (route) => {
    const entry = requestSnapshot(route.request());
    requests.push(entry);
    await mockApiRoute(route, entry);
  });
  try {
    await openPage(page, definition.route, definition.heading);
    await definition.run({ page, context, requests });
    assert.deepEqual(pageErrors, [], `页面运行错误：${pageErrors.join(" | ")}`);
    return {
      name: definition.name,
      role: definition.role || "anonymous",
      route: definition.route,
      status: "passed",
      durationMs: Date.now() - startedAt,
      requests,
      pageErrors,
      consoleErrors,
      screenshot,
    };
  } catch (error) {
    const absoluteScreenshot = path.join(
      OUT_DIR,
      `${safeFileName(definition.name)}.png`,
    );
    await page
      .screenshot({ path: absoluteScreenshot, fullPage: true })
      .catch(() => undefined);
    screenshot = path
      .relative(FRONTEND_DIR, absoluteScreenshot)
      .replaceAll("\\", "/");
    return {
      name: definition.name,
      role: definition.role || "anonymous",
      route: definition.route,
      status: "failed",
      durationMs: Date.now() - startedAt,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : { message: String(error) },
      requests,
      pageErrors,
      consoleErrors,
      screenshot,
      finalUrl: page.url(),
    };
  } finally {
    await context.close().catch(() => undefined);
  }
}

async function main() {
  const runStartedAt = Date.now();
  await prepareOutputDir();
  await ensureBaseUrl();
  const browser = await chromium.launch({ headless: HEADLESS });
  const tests = [];
  try {
    for (const definition of scenarios) {
      const result = await runScenario(browser, definition);
      tests.push(result);
      console.log(
        `[${result.status === "passed" ? "PASS" : "FAIL"}] ${result.name} (${result.durationMs} ms)`,
      );
    }
  } finally {
    await browser.close();
  }
  const failed = tests.filter((test) => test.status === "failed");
  const requestCount = tests.reduce(
    (sum, test) => sum + test.requests.length,
    0,
  );
  const fallbackRequests = tests
    .flatMap((test) =>
      test.requests.map((request) => ({ test: test.name, ...request })),
    )
    .filter((request) => request.mock === "fallback");
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    headless: HEADLESS,
    coverage: [
      "登录注册/找回密码弹窗与校验",
      "老人新增和健康详情",
      "预警处理中/处理/忽略/已读",
      "风险计划结果弹窗",
      "随访新增/记录/状态",
      "干预新增",
      "评估1-9",
      "转诊角色动作",
      "设备绑定",
      "体检空数字与BMI只读",
      "护理新增nurseId与终态按钮",
      "审核通过确认",
      "AI配置控件",
      "个人资料/头像/密码/消息",
    ],
    summary: {
      total: tests.length,
      passed: tests.length - failed.length,
      failed: failed.length,
      requestCount,
      fallbackMockCount: fallbackRequests.length,
      durationMs: Date.now() - runStartedAt,
    },
    fallbackRequests,
    tests,
  };
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
  console.log(
    JSON.stringify(
      {
        reportPath: REPORT_PATH,
        ...report.summary,
        failedTests: failed.map((test) => ({
          name: test.name,
          error: test.error?.message,
          screenshot: test.screenshot,
        })),
      },
      null,
      2,
    ),
  );
  if (failed.length > 0) process.exitCode = 1;
}

main().catch(async (error) => {
  await fs.mkdir(OUT_DIR, { recursive: true }).catch(() => undefined);
  await fs
    .writeFile(
      REPORT_PATH,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          baseUrl: BASE_URL,
          headless: HEADLESS,
          fatal:
            error instanceof Error
              ? { name: error.name, message: error.message, stack: error.stack }
              : { message: String(error) },
        },
        null,
        2,
      ),
      "utf8",
    )
    .catch(() => undefined);
  console.error(error);
  process.exit(1);
});
