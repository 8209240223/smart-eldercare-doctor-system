import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";

const BASE_URL = (process.env.API_BASE_URL || "http://127.0.0.1:8080").replace(/\/$/, "");
const OUT_DIR = path.join(process.cwd(), "test-results", "local-api-parity");
const USERS = {
  admin: { username: "admin", password: "admin123" },
  doctor: { username: "doctor01", password: "doctor123" },
  nurse: { username: "nurse02", password: "nurse123" },
};

const checks = [];
const cleanups = [];

function redisGet(key) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port: 6379 });
    let data = Buffer.alloc(0);
    socket.setTimeout(2500);
    socket.on("connect", () => {
      socket.write(`*2\r\n$3\r\nGET\r\n$${Buffer.byteLength(key)}\r\n${key}\r\n`);
    });
    socket.on("data", (chunk) => {
      data = Buffer.concat([data, chunk]);
      socket.end();
    });
    socket.on("error", reject);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("Redis read timeout"));
    });
    socket.on("end", () => {
      const text = data.toString("utf8");
      const lineEnd = text.indexOf("\r\n");
      if (text.startsWith("$-1")) return resolve(null);
      if (!text.startsWith("$") || lineEnd < 0) return reject(new Error(`Unexpected Redis response: ${text}`));
      const length = Number(text.slice(1, lineEnd));
      const raw = text.slice(lineEnd + 2, lineEnd + 2 + length);
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && typeof parsed[1] === "string") return resolve(parsed[1]);
        if (typeof parsed === "string") return resolve(parsed);
      } catch {
        // Plain Redis strings are valid for captcha values.
      }
      resolve(raw);
    });
  });
}

async function rawRequest(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, options);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${options.method || "GET"} ${url} returned non-JSON ${response.status}: ${text.slice(0, 240)}`);
  }
  return { response, body };
}

async function login(account) {
  const captcha = await rawRequest("/api/auth/captcha");
  assert.equal(captcha.body.code, 200, `${account.username} captcha failed`);
  const captchaKey = captcha.body.data?.key;
  const captchaCode = await redisGet(`medical:captcha:${captchaKey}`);
  assert.ok(captchaCode, `${account.username} captcha missing from Redis`);
  const result = await rawRequest("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...account, captchaKey, captchaCode }),
  });
  assert.equal(result.body.code, 200, `${account.username} login failed: ${JSON.stringify(result.body)}`);
  checks.push({ name: `login:${account.username}`, ok: true });
  return result.body.data;
}

function client(auth) {
  return async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${auth.token}`);
    if (auth.tokenId) headers.set("X-Token-Id", auth.tokenId);
    if (options.body !== undefined && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
    const result = await rawRequest(url, {
      ...options,
      headers,
      body: options.body === undefined || options.body instanceof FormData ? options.body : JSON.stringify(options.body),
    });
    assert.ok(result.response.ok, `${options.method || "GET"} ${url} returned HTTP ${result.response.status}`);
    assert.equal(result.body?.code, 200, `${options.method || "GET"} ${url} failed: ${JSON.stringify(result.body)}`);
    return result.body.data;
  };
}

async function check(name, action) {
  const startedAt = Date.now();
  const data = await action();
  checks.push({ name, ok: true, durationMs: Date.now() - startedAt });
  return data;
}

function createdId(data, name) {
  const id = typeof data === "number" ? data : data?.id;
  assert.ok(Number(id) > 0, `${name} did not return an id: ${JSON.stringify(data)}`);
  return Number(id);
}

function registerCleanup(name, action) {
  cleanups.push({ name, action });
}

function makeIdCard(sequence) {
  const body = `11010119500102${String(sequence).padStart(3, "0").slice(-3)}`;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checksums = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
  const sum = [...body].reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  return `${body}${checksums[sum % 11]}`;
}

function purgeTestElderArtifacts(elderId) {
  const jshell = path.join(process.env.JAVA_HOME || "D:\\JDK21", "bin", "jshell.exe");
  const connector = path.join(
    process.env.USERPROFILE || "C:\\Users\\王仪杰",
    ".m2",
    "repository",
    "com",
    "mysql",
    "mysql-connector-j",
    "8.4.0",
    "mysql-connector-j-8.4.0.jar"
  );
  const marker = `PURGED_ELDER_${elderId}`;
  const tables = ["timeline_event", "elder_risk_profile", "follow_record", "follow_plan", "intervention_record", "assessment_record", "physical_exam", "nursing_record", "nursing_plan", "medical_history", "medication_record", "allergy_record", "family_history", "health_record"];
  const deleteStatements = tables.map((table) => `var delete_${table} = c.prepareStatement("DELETE FROM ${table} WHERE elder_id=?"); delete_${table}.setLong(1, ${elderId}L); delete_${table}.executeUpdate(); delete_${table}.close();`).join("\n");
  const script = `
import java.sql.*;
var c = DriverManager.getConnection("jdbc:mysql://localhost:3306/medical_doctor?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true", "root", "123456");
${deleteStatements}
var elder = c.prepareStatement("DELETE FROM elder_info WHERE id=?"); elder.setLong(1, ${elderId}L); elder.executeUpdate(); elder.close();
c.close();
System.out.println("${marker}");
/exit
`;
  const result = spawnSync(jshell, ["--class-path", connector], { input: script, encoding: "utf8" });
  if (result.status !== 0 || !result.stdout.includes(marker)) {
    throw new Error(`database artifact cleanup failed: ${result.stderr || result.stdout}`);
  }
}

async function cleanupAll() {
  const results = [];
  while (cleanups.length) {
    const cleanup = cleanups.pop();
    try {
      await cleanup.action();
      results.push({ name: cleanup.name, ok: true });
    } catch (error) {
      results.push({ name: cleanup.name, ok: false, error: error.message });
    }
  }
  return results;
}

async function logoutAndVerify(role, authData) {
  assert.ok(authData.tokenId, `${role} login must return tokenId`);
  const headers = { Authorization: `Bearer ${authData.token}`, "X-Token-Id": authData.tokenId };
  const logout = await rawRequest(`/api/auth/logout?tokenId=${encodeURIComponent(authData.tokenId)}`, { method: "POST", headers });
  assert.equal(logout.body?.code, 200, `${role} logout failed: ${JSON.stringify(logout.body)}`);
  checks.push({ name: `logout:${role}`, ok: true });
  const denied = await rawRequest("/api/auth/info", { headers });
  assert.equal(denied.body?.code, 401, `${role} tokenId remained valid after logout`);
  checks.push({ name: `logout-invalidates-session:${role}`, ok: true });
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const auth = {
    admin: await login(USERS.admin),
    doctor: await login(USERS.doctor),
    nurse: await login(USERS.nurse),
  };
  const admin = client(auth.admin);
  const doctor = client(auth.doctor);
  const nurse = client(auth.nurse);

  const readChecks = [
    ["auth.info", doctor, "/api/auth/info"],
    ["dashboard.todo", doctor, "/api/dashboard/todo"],
    ["dashboard.review-counts", doctor, "/api/dashboard/review-counts"],
    ["dashboard.chronic-overview", doctor, "/api/dashboard/chronic-overview"],
    ["elders.list", doctor, "/api/elders?pageNum=1&pageSize=10"],
    ["elders.stats", doctor, "/api/elders/stats"],
    ["warnings.list", doctor, "/api/warnings?pageNum=1&pageSize=10"],
    ["warnings.stats", doctor, "/api/warnings/stats"],
    ["warnings.realtime", doctor, "/api/warnings/stats/realtime"],
    ["risk.list", doctor, "/api/risk/elders?pageNum=1&pageSize=10"],
    ["risk.stats", doctor, "/api/risk/stats"],
    ["followup.plans", doctor, "/api/followup/plans?pageNum=1&pageSize=10"],
    ["followup.records", doctor, "/api/followup/records?pageNum=1&pageSize=10"],
    ["followup.stats", doctor, "/api/followup/stats"],
    ["followup.tasks", doctor, "/api/followup/tasks?pageNum=1&pageSize=10"],
    ["followup.tasks.today", doctor, "/api/followup/tasks/today"],
    ["followup.tasks.overdue", doctor, "/api/followup/tasks/overdue"],
    ["intervention.list", doctor, "/api/intervention/list?pageNum=1&pageSize=10"],
    ["intervention.stats", doctor, "/api/intervention/stats"],
    ["assessments.list", doctor, "/api/assessments?pageNum=1&pageSize=10"],
    ["assessments.stats", doctor, "/api/assessments/stats"],
    ["referrals.list", doctor, "/api/referrals?pageNum=1&pageSize=10"],
    ["referrals.stats", doctor, "/api/referrals/stats"],
    ["exams.list", doctor, "/api/exams?pageNum=1&pageSize=10"],
    ["exams.stats", doctor, "/api/exams/stats"],
    ["timeline.elder", doctor, "/api/timeline/1"],
    ["timeline.summary", doctor, "/api/timeline/1/summary"],
    ["review.records", doctor, "/api/review/records?pageNum=1&pageSize=10"],
    ["review.plans", doctor, "/api/review/plans?pageNum=1&pageSize=10"],
    ["review.stats", doctor, "/api/review/stats"],
    ["ai.reports", doctor, "/api/ai/health-report/list?elderId=1&pageNum=1&pageSize=10"],
    ["warning-rules.list", doctor, "/api/warning-rules?doctorId=2"],
    ["profile.info", doctor, "/api/auth/info"],
    ["profile.logs", doctor, "/api/profile/logs?pageNum=1&pageSize=20&userId=1"],
    ["profile.messages", doctor, "/api/profile/messages?pageNum=1&pageSize=20&userId=1"],
    ["profile.unread", doctor, "/api/profile/messages/unread-count?userId=1"],
    ["nurse.dashboard.stats", nurse, "/api/nurse/dashboard/stats"],
    ["nurse.dashboard.tasks", nurse, "/api/nurse/dashboard/tasks"],
    ["nurse.records", nurse, "/api/nurse/records?pageNum=1&pageSize=10"],
    ["nurse.records.stats", nurse, "/api/nurse/records/stats"],
    ["nurse.plans", nurse, "/api/nurse/plans?pageNum=1&pageSize=10"],
    ["nurse.plans.stats", nurse, "/api/nurse/plans/stats"],
    ["ai.config", admin, "/api/ai/config"],
  ];
  for (const [name, request, url] of readChecks) await check(name, () => request(url));

  const allTasks = await check("followup.tasks.all-contract", () => doctor("/api/followup/tasks?pageNum=1&pageSize=100"));
  const pendingTasks = await check("followup.tasks.pending-contract", () => doctor("/api/followup/tasks?pageNum=1&pageSize=100&status=0"));
  assert.ok(Number(allTasks?.total || 0) >= Number(pendingTasks?.total || 0), "unfiltered followup tasks must include pending tasks");

  const profileLogs = await doctor("/api/profile/logs?pageNum=1&pageSize=100&userId=1");
  assert.ok((profileLogs?.records || []).every((item) => Number(item.userId) === Number(auth.doctor.userId)), "profile logs leaked another user through userId query spoofing");

  const interventionTimeline = await check("timeline.intervention-contract", () => doctor("/api/timeline/1?pageNum=1&pageSize=100&eventType=11"));
  assert.ok((interventionTimeline?.records || []).every((item) => item.sourceType === "intervention_record"), "event type 11 must contain only intervention timeline records");

  const stamp = Date.now().toString().slice(-10);
  const idSequence = Number(stamp.slice(-3)) || 1;
  const elderData = await check("elder.create", () => doctor("/api/elders", {
    method: "POST",
    body: {
      name: `契约测试老人${stamp}`,
      gender: 1,
      birthDate: "1950-01-02",
      idCard: makeIdCard(idSequence),
      phone: `1${stamp}`.slice(0, 11),
      emergencyContact: "契约测试家属",
      emergencyPhone: `1${stamp.split("").reverse().join("")}`.slice(0, 11),
      community: "本地契约测试社区",
      doctorId: auth.doctor.userId,
      accountStatus: 1,
    },
  }));
  const elderId = createdId(elderData, "elder.create");
  registerCleanup("elder.test-artifacts.purge", () => purgeTestElderArtifacts(elderId));
  registerCleanup("elder.delete", () => doctor(`/api/elders/${elderId}`, { method: "DELETE" }));

  await check("elder.detail", () => doctor(`/api/elders/${elderId}`));
  const originalHealthRecord = await check("elder.health-record.read", () => doctor("/api/elders/1/record"));
  assert.ok(originalHealthRecord?.id, "elder 1 must have a health record so the save test can restore it");
  registerCleanup("elder.health-record.restore", () => doctor("/api/elders/1/record", {
    method: "POST",
    body: originalHealthRecord,
  }));
  await check("elder.health-record.save", () => doctor("/api/elders/1/record", {
    method: "POST",
    body: { ...originalHealthRecord, exerciseFrequency: originalHealthRecord.exerciseFrequency === 3 ? 2 : 3 },
  }));

  const historyId = createdId(await check("health-history.create", () => doctor("/api/health-detail/medical-history", {
    method: "POST",
    body: { elderId, diseaseName: "契约测试病史", diagnoseDate: "2026-07-01", isCured: 0, treatment: "测试治疗" },
  })), "health-history.create");
  registerCleanup("health-history.delete", () => doctor(`/api/health-detail/medical-history/${historyId}`, { method: "DELETE" }));
  await check("health-detail.read", () => doctor(`/api/health-detail/${elderId}`));

  const medicationId = createdId(await check("medication.create", () => doctor("/api/health-detail/medication", {
    method: "POST",
    body: { elderId, drugName: "契约测试药物", dosage: "1片", frequency: "每日一次", route: "口服", startDate: "2026-07-01", status: 1 },
  })), "medication.create");
  registerCleanup("medication.delete", () => doctor(`/api/health-detail/medication/${medicationId}`, { method: "DELETE" }));
  await check("medication.update", () => doctor(`/api/health-detail/medication/${medicationId}`, {
    method: "PUT",
    body: { elderId, drugName: "契约测试药物", dosage: "2片", frequency: "每日一次", route: "口服", startDate: "2026-07-01", status: 1 },
  }));

  const allergyId = createdId(await check("allergy.create", () => doctor("/api/health-detail/allergy", {
    method: "POST",
    body: { elderId, allergen: "契约测试过敏原", allergyType: 4, severity: 1, reaction: "轻微", discoverDate: "2026-07-01" },
  })), "allergy.create");
  registerCleanup("allergy.delete", () => doctor(`/api/health-detail/allergy/${allergyId}`, { method: "DELETE" }));

  const familyId = createdId(await check("family-history.create", () => doctor("/api/health-detail/family-history", {
    method: "POST",
    body: { elderId, diseaseName: "契约测试家族病史", relationship: "父亲", remark: "本地自动化测试" },
  })), "family-history.create");
  registerCleanup("family-history.delete", () => doctor(`/api/health-detail/family-history/${familyId}`, { method: "DELETE" }));

  const plan = {
    elderId,
    doctorId: auth.doctor.userId,
    planName: `契约随访计划${stamp}`,
    diseaseType: 1,
    frequencyType: 2,
    startDate: "2026-07-10",
    endDate: "2026-09-10",
    nextFollowDate: "2026-07-17",
    totalCount: 4,
    completedCount: 0,
    status: 0,
    remark: "本地契约测试",
  };
  const planId = createdId(await check("followup-plan.create", () => doctor("/api/followup/plans", { method: "POST", body: plan })), "followup-plan.create");
  registerCleanup("followup-plan.delete", () => doctor(`/api/followup/plans/${planId}`, { method: "DELETE" }));
  await check("followup-plan.update", () => doctor(`/api/followup/plans/${planId}`, { method: "PUT", body: { ...plan, id: planId, remark: "已验证修改" } }));
  await check("followup-plan.status", () => doctor(`/api/followup/plans/${planId}/status?status=1`, { method: "PUT" }));

  const intervention = {
    elderId,
    doctorId: auth.doctor.userId,
    interventionType: 1,
    interventionTitle: `契约干预${stamp}`,
    interventionContent: "用于验证前端表单与后端字段契约",
    medicationAdjust: "维持当前方案",
    lifestyleGuidance: "规律作息",
    healthEducation: "按时记录",
    effectEvaluation: 2,
    effectDesc: "有效",
    nextPlan: "一周后复查",
    interventionDate: "2026-07-10T10:00:00",
    status: 1,
  };
  const interventionId = createdId(await check("intervention.create", () => doctor("/api/intervention", { method: "POST", body: intervention })), "intervention.create");
  registerCleanup("intervention.delete", () => doctor(`/api/intervention/${interventionId}`, { method: "DELETE" }));
  await check("intervention.detail", () => doctor(`/api/intervention/${interventionId}`));
  await check("intervention.update", () => doctor(`/api/intervention/${interventionId}`, { method: "PUT", body: { ...intervention, id: interventionId, effectEvaluation: 1 } }));

  const assessment = {
    elderId,
    doctorId: auth.doctor.userId,
    assessType: 9,
    assessDate: "2026-07-10",
    score: 88,
    level: "良好",
    result: "综合状态良好",
    suggestion: "维持当前健康管理方案",
  };
  const assessmentId = createdId(await check("assessment.create", () => doctor("/api/assessments", { method: "POST", body: assessment })), "assessment.create");
  registerCleanup("assessment.delete", () => doctor(`/api/assessments/${assessmentId}`, { method: "DELETE" }));
  await check("assessment.detail", () => doctor(`/api/assessments/${assessmentId}`));
  await check("assessment.update", () => doctor(`/api/assessments/${assessmentId}`, { method: "PUT", body: { ...assessment, id: assessmentId, score: 89 } }));

  const exam = {
    elderId,
    doctorId: auth.doctor.userId,
    examDate: "2026-07-10",
    height: 168,
    weight: 62,
    systolicPressure: 128,
    diastolicPressure: 78,
    heartRate: 72,
    bloodSugarFasting: 5.6,
    bloodSugarRandom: 7.1,
    temperature: 36.6,
    bloodOxygen: 98,
    waistline: 82,
    bmi: 21.97,
    examSummary: "契约测试体检",
    doctorAdvice: "保持运动",
    abnormalFlag: 0,
  };
  const examId = createdId(await check("exam.create", () => doctor("/api/exams", { method: "POST", body: exam })), "exam.create");
  registerCleanup("exam.delete", () => doctor(`/api/exams/${examId}`, { method: "DELETE" }));
  await check("exam.detail", () => doctor(`/api/exams/${examId}`));
  await check("exam.update", () => doctor(`/api/exams/${examId}`, { method: "PUT", body: { ...exam, id: examId, weight: 63 } }));
  await check("exam.compare", () => doctor(`/api/exams/compare?elderId=${elderId}`));

  const rule = {
    ruleName: `契约预警规则${stamp}`,
    ruleType: 1,
    metricCode: "systolic",
    conditionExpr: "systolic >= 180",
    warningLevel: 3,
    warningTemplate: "收缩压过高",
    enabled: 1,
    doctorId: auth.doctor.userId,
  };
  const ruleId = createdId(await check("warning-rule.create", () => doctor("/api/warning-rules", { method: "POST", body: rule })), "warning-rule.create");
  registerCleanup("warning-rule.delete", () => doctor(`/api/warning-rules/${ruleId}`, { method: "DELETE" }));
  await check("warning-rule.update", () => doctor(`/api/warning-rules/${ruleId}`, { method: "PUT", body: { ...rule, id: ruleId, warningLevel: 2 } }));
  await check("warning-rule.toggle", () => doctor(`/api/warning-rules/${ruleId}/toggle?enabled=0`, { method: "PUT" }));

  const nursingRecord = {
    elderId,
    nurseId: auth.nurse.userId,
    recordType: 1,
    recordTitle: `契约护理记录${stamp}`,
    recordContent: "完成基础护理",
    nursingMeasures: "测量生命体征",
    observation: "状态稳定",
    evaluation: "护理有效",
    recordDate: "2026-07-10T10:30:00",
    isAbnormal: 0,
    reportStatus: 0,
    doctorReview: 0,
    remark: "本地契约测试",
  };
  const nursingRecordId = createdId(await check("nurse-record.create", () => nurse("/api/nurse/records", { method: "POST", body: nursingRecord })), "nurse-record.create");
  registerCleanup("nurse-record.delete", () => nurse(`/api/nurse/records/${nursingRecordId}`, { method: "DELETE" }));
  await check("nurse-record.detail", () => nurse(`/api/nurse/records/${nursingRecordId}`));
  await check("nurse-record.update", () => nurse(`/api/nurse/records/${nursingRecordId}`, { method: "PUT", body: { ...nursingRecord, id: nursingRecordId, evaluation: "护理效果良好" } }));

  const nursingPlan = {
    elderId,
    nurseId: auth.nurse.userId,
    planName: `契约护理计划${stamp}`,
    planType: 1,
    startDate: "2026-07-10",
    endDate: "2026-08-10",
    frequency: "每日一次",
    nursingGoal: "维持生命体征稳定",
    nursingContent: "基础护理与健康观察",
    status: 0,
    totalCount: 10,
    completedCount: 0,
    effectScore: 4,
    doctorApproval: 0,
    remark: "本地契约测试",
  };
  const nursingPlanId = createdId(await check("nurse-plan.create", () => nurse("/api/nurse/plans", { method: "POST", body: nursingPlan })), "nurse-plan.create");
  registerCleanup("nurse-plan.delete", () => nurse(`/api/nurse/plans/${nursingPlanId}`, { method: "DELETE" }));
  await check("nurse-plan.detail", () => nurse(`/api/nurse/plans/${nursingPlanId}`));
  await check("nurse-plan.update", () => nurse(`/api/nurse/plans/${nursingPlanId}`, { method: "PUT", body: { ...nursingPlan, id: nursingPlanId, frequency: "每日两次" } }));
  await check("nurse-plan.status", () => nurse(`/api/nurse/plans/${nursingPlanId}/status`, { method: "PUT", body: { status: 1 } }));
  await check("nurse-plan.increment", () => nurse(`/api/nurse/plans/${nursingPlanId}/increment`, { method: "POST" }));

  const riskDetail = await check("risk.calculate-single", () => doctor("/api/risk/elders/1/calculate", { method: "POST" }));
  assert.equal(Number(riskDetail?.profile?.elderId), 1, "single risk calculation must return the refreshed elder profile");

  const cleanupResults = await cleanupAll();
  const cleanupFailures = cleanupResults.filter((item) => !item.ok);
  assert.deepEqual(cleanupFailures, [], `cleanup failures: ${JSON.stringify(cleanupFailures)}`);
  for (const [role, authData] of Object.entries(auth)) await logoutAndVerify(role, authData);
  const report = { generatedAt: new Date().toISOString(), baseUrl: BASE_URL, passed: checks.length, failed: 0, checks, cleanupResults };
  await fs.writeFile(path.join(OUT_DIR, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ passed: report.passed, cleanupCount: cleanupResults.length, report: path.join(OUT_DIR, "report.json") }, null, 2));
}

let cleanupResults = [];
try {
  await main();
} catch (error) {
  cleanupResults = await cleanupAll();
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    passed: checks.length,
    failed: 1,
    error: error.stack || error.message,
    checks,
    cleanupResults,
  };
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUT_DIR, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.error(error);
  process.exitCode = 1;
}
