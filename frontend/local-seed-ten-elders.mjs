import assert from "node:assert/strict";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";

const BASE_URL = (process.env.SEED_API_BASE_URL || "http://127.0.0.1:8082").replace(/\/$/, "");
const OUT_DIR = path.join(process.cwd(), "test-results", "seed-ten-elders");
const USERS = {
  admin: { username: "admin", password: "admin123" },
  doctor: { username: "doctor01", password: "doctor123" },
  nurse: { username: "nurse02", password: "nurse123" },
};

const elderSeeds = [
  { name: "张安康", gender: 1, birthDate: "1948-03-12", community: "幸福社区", disease: "高血压", height: 168, weight: 76, systolic: 168, diastolic: 98, heartRate: 88, fasting: 8.6, random: 12.4, oxygen: 95, waistline: 98, smoking: 2, drinking: 1, exercise: 1, living: 2 },
  { name: "李秀兰", gender: 2, birthDate: "1949-07-08", community: "和平社区", disease: "2型糖尿病", height: 156, weight: 63, systolic: 142, diastolic: 86, heartRate: 76, fasting: 9.2, random: 13.1, oxygen: 97, waistline: 91, smoking: 0, drinking: 0, exercise: 1, living: 1 },
  { name: "王建国", gender: 1, birthDate: "1946-11-21", community: "建设社区", disease: "冠心病", height: 172, weight: 72, systolic: 150, diastolic: 88, heartRate: 82, fasting: 6.4, random: 8.2, oxygen: 96, waistline: 94, smoking: 2, drinking: 1, exercise: 1, living: 1 },
  { name: "刘桂英", gender: 2, birthDate: "1952-02-16", community: "阳光社区", disease: "骨质疏松", height: 153, weight: 54, systolic: 132, diastolic: 78, heartRate: 72, fasting: 5.5, random: 7.0, oxygen: 98, waistline: 80, smoking: 0, drinking: 0, exercise: 1, living: 2 },
  { name: "陈志强", gender: 1, birthDate: "1947-05-03", community: "解放社区", disease: "慢阻肺", height: 170, weight: 68, systolic: 138, diastolic: 82, heartRate: 92, fasting: 5.9, random: 7.8, oxygen: 90, waistline: 88, smoking: 2, drinking: 1, exercise: 0, living: 2 },
  { name: "杨淑华", gender: 2, birthDate: "1955-09-27", community: "人民社区", disease: "高脂血症", height: 158, weight: 58, systolic: 126, diastolic: 76, heartRate: 68, fasting: 5.2, random: 6.8, oxygen: 99, waistline: 79, smoking: 0, drinking: 0, exercise: 2, living: 1 },
  { name: "周国华", gender: 1, birthDate: "1949-01-19", community: "文化社区", disease: "脑卒中后遗症", height: 166, weight: 70, systolic: 158, diastolic: 92, heartRate: 80, fasting: 6.8, random: 9.0, oxygen: 96, waistline: 93, smoking: 2, drinking: 0, exercise: 1, living: 3 },
  { name: "吴春梅", gender: 2, birthDate: "1953-06-14", community: "东风社区", disease: "慢性肾病", height: 155, weight: 60, systolic: 146, diastolic: 90, heartRate: 74, fasting: 6.1, random: 8.0, oxygen: 97, waistline: 86, smoking: 0, drinking: 0, exercise: 1, living: 2 },
  { name: "孙福生", gender: 1, birthDate: "1945-12-02", community: "立新社区", disease: "高血压合并糖尿病", height: 169, weight: 82, systolic: 182, diastolic: 106, heartRate: 96, fasting: 11.3, random: 16.2, oxygen: 93, waistline: 105, smoking: 1, drinking: 2, exercise: 0, living: 2 },
  { name: "黄玉珍", gender: 2, birthDate: "1951-04-25", community: "胜利社区", disease: "高血压", height: 157, weight: 61, systolic: 144, diastolic: 84, heartRate: 70, fasting: 5.8, random: 7.4, oxygen: 98, waistline: 84, smoking: 0, drinking: 0, exercise: 2, living: 1 },
];

function redisGet(key) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port: 6379 });
    let data = Buffer.alloc(0);
    socket.setTimeout(2500);
    socket.on("connect", () => socket.write(`*2\r\n$3\r\nGET\r\n$${Buffer.byteLength(key)}\r\n${key}\r\n`));
    socket.on("data", (chunk) => { data = Buffer.concat([data, chunk]); socket.end(); });
    socket.on("error", reject);
    socket.on("timeout", () => { socket.destroy(); reject(new Error("Redis read timeout")); });
    socket.on("end", () => {
      const text = data.toString("utf8");
      const lineEnd = text.indexOf("\r\n");
      if (!text.startsWith("$") || lineEnd < 0) return reject(new Error(`Unexpected Redis response: ${text}`));
      const length = Number(text.slice(1, lineEnd));
      const raw = text.slice(lineEnd + 2, lineEnd + 2 + length);
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return resolve(parsed[1]);
        if (typeof parsed === "string") return resolve(parsed);
      } catch {}
      resolve(raw);
    });
  });
}

async function rawRequest(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, options);
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { throw new Error(`${options.method || "GET"} ${url} returned non-JSON: ${text.slice(0, 240)}`); }
  return { response, body };
}

async function login(account) {
  const captcha = await rawRequest("/api/auth/captcha");
  const captchaKey = captcha.body.data.key;
  const captchaCode = await redisGet(`medical:captcha:${captchaKey}`);
  const result = await rawRequest("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...account, captchaKey, captchaCode }),
  });
  assert.equal(result.body.code, 200, `${account.username} login failed`);
  return result.body.data;
}

function client(auth) {
  return async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${auth.token}`);
    if (auth.tokenId) headers.set("X-Token-Id", auth.tokenId);
    if (options.body !== undefined) headers.set("Content-Type", "application/json");
    const result = await rawRequest(url, { ...options, headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) });
    assert.equal(result.body?.code, 200, `${options.method || "GET"} ${url} failed: ${JSON.stringify(result.body)}`);
    return result.body.data;
  };
}

function makeIdCard(birthDate, sequence) {
  const body = `110101${birthDate.replaceAll("-", "")}${String(sequence).padStart(3, "0")}`;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checksums = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
  const sum = [...body].reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  return `${body}${checksums[sum % 11]}`;
}

function onboardingPayload(seed, index, doctorId) {
  const phoneSuffix = String(index + 1).padStart(4, "0");
  return {
    elder: {
      name: seed.name,
      gender: seed.gender,
      birthDate: seed.birthDate,
      idCard: makeIdCard(seed.birthDate, index + 1),
      phone: `1390000${phoneSuffix}`,
      emergencyContact: `${seed.name.slice(0, 1)}家属`,
      emergencyPhone: `1380000${phoneSuffix}`,
      nation: "汉族",
      maritalStatus: 2,
      education: 2,
      address: `${seed.community}健康服务中心示范住址${index + 1}号`,
      community: seed.community,
      medicalInsuranceType: 1,
      doctorId,
      accountStatus: 1,
    },
    healthRecord: {
      height: seed.height,
      weight: seed.weight,
      smokingStatus: seed.smoking,
      drinkingStatus: seed.drinking,
      exerciseFrequency: seed.exercise,
      livingAbility: seed.living,
      disabilityStatus: seed.living >= 3 ? "部分失能" : "",
      currentMedication: seed.disease.includes("高血压") ? "降压药规律服用" : seed.disease.includes("糖尿病") ? "口服降糖药" : "按医嘱用药",
      createDoctorId: doctorId,
    },
    initialExam: {
      elderId: 0,
      doctorId,
      examDate: "2026-07-10",
      height: seed.height,
      weight: seed.weight,
      systolicPressure: seed.systolic,
      diastolicPressure: seed.diastolic,
      heartRate: seed.heartRate,
      bloodSugarFasting: seed.fasting,
      bloodSugarRandom: seed.random,
      temperature: 36.6,
      bloodOxygen: seed.oxygen,
      waistline: seed.waistline,
      examSummary: `${seed.disease}健康管理建档体检`,
      doctorAdvice: "纳入社区医养结合连续健康管理",
    },
    medicalHistories: [{ diseaseName: seed.disease, diagnoseDate: "2020-01-15", isCured: 0, treatment: "长期规范管理", remark: "统一演示数据" }],
    generateWorkflow: true,
  };
}

await fs.mkdir(OUT_DIR, { recursive: true });
const auth = { admin: await login(USERS.admin), doctor: await login(USERS.doctor), nurse: await login(USERS.nurse) };
const admin = client(auth.admin);
const doctor = client(auth.doctor);
const nurse = client(auth.nurse);
const before = await admin("/api/elders?pageNum=1&pageSize=1");
assert.equal(Number(before.total), 0, "seed script requires an empty elder database");

const created = [];
for (let index = 0; index < elderSeeds.length; index += 1) {
  const seed = elderSeeds[index];
  const onboard = await doctor("/api/elders/onboard", { method: "POST", body: onboardingPayload(seed, index, auth.doctor.userId) });
  const elderId = Number(onboard.elder.id);
  const planId = Number(onboard.workflow?.plan?.data?.id || 0);
  const taskId = Number(onboard.workflow?.task?.data?.id || 0);
  const reportId = Number(onboard.workflow?.report?.data?.id || 0);
  assert.ok(elderId && planId && taskId && reportId, `${seed.name} workflow is incomplete`);

  await doctor("/api/assessments", { method: "POST", body: { elderId, doctorId: auth.doctor.userId, assessType: 9, assessDate: "2026-07-10", score: Math.max(45, 95 - index * 4), level: index < 3 ? "重点关注" : "一般", result: `${seed.name}综合健康评估`, suggestion: "按统一健康管理流程持续随访" } });
  await nurse("/api/nurse/plans", { method: "POST", body: { elderId, nurseId: auth.nurse.userId, planName: `${seed.name}基础护理计划`, planType: seed.living >= 3 ? 2 : 1, startDate: "2026-07-10", endDate: "2026-10-10", frequency: "每周一次", nursingGoal: "维持健康状态并观察慢病风险", nursingContent: "生命体征观察、用药提醒与生活指导", status: 1, totalCount: 12, completedCount: 0, effectScore: 4, doctorApproval: 0, remark: "十人统一演示数据" } });
  await nurse("/api/nurse/records", { method: "POST", body: { elderId, nurseId: auth.nurse.userId, recordType: 1, recordTitle: `${seed.name}建档护理记录`, recordContent: "完成首次健康访视与生活能力观察", nursingMeasures: "核对用药并测量生命体征", observation: "已纳入连续照护", evaluation: "当前护理计划可执行", recordDate: `2026-07-10T${String(9 + (index % 8)).padStart(2, "0")}:00:00`, isAbnormal: index < 3 ? 1 : 0, abnormalDesc: index < 3 ? "慢病指标需持续观察" : "", reportStatus: index < 3 ? 1 : 0, doctorReview: 0, remark: "十人统一演示数据" } });
  await doctor("/api/intervention", { method: "POST", body: { elderId, doctorId: auth.doctor.userId, interventionType: 4, interventionTitle: `${seed.name}健康教育`, interventionContent: `围绕${seed.disease}开展饮食、运动和用药教育`, lifestyleGuidance: "规律作息，按能力进行适量运动", healthEducation: "识别异常指标并及时联系医护人员", effectEvaluation: 2, effectDesc: "老人及家属已理解", nextPlan: "随访任务中继续评估执行情况", interventionDate: "2026-07-10T10:00:00", status: 1 } });
  await doctor(`/api/vitals/mock/${elderId}?days=7`, { method: "POST" });
  if (index < 5) {
    await doctor("/api/vitals/devices", { method: "POST", body: { elderId, deviceName: `${seed.name}智能手环`, deviceSn: `DEMO-2026-${String(index + 1).padStart(3, "0")}`, deviceType: 1, bindStatus: 1 } });
  }
  await doctor(`/api/warning-rules/evaluate?elderId=${elderId}`, { method: "POST", body: { systolic: seed.systolic, diastolic: seed.diastolic, heartRate: seed.heartRate, bloodSugarFasting: seed.fasting, bloodSugarRandom: seed.random, spo2: seed.oxygen, temperature: 36.6 } });

  let followRecordId = 0;
  if (index < 3) {
    const record = await doctor("/api/followup/records", { method: "POST", body: { planId, elderId, doctorId: auth.doctor.userId, followDate: `2026-07-10T${String(14 + index).padStart(2, "0")}:00:00`, followType: 2, diseaseType: 1, symptomDesc: "完成首次统一演示随访", systolicPressure: seed.systolic, diastolicPressure: seed.diastolic, heartRate: seed.heartRate, bloodSugarFasting: seed.fasting, weight: seed.weight, medicationCompliance: 1, currentMedication: "按医嘱规律服药", followResult: "继续执行个性化健康管理计划", remark: "统一演示闭环记录" } });
    followRecordId = Number(record.id || record);
    await doctor(`/api/followup/tasks/${taskId}/finish?followRecordId=${followRecordId}`, { method: "PUT" });
  }
  if (index === 0) await doctor(`/api/ai/health-report/${reportId}/confirm`, { method: "PUT", body: {} });
  if (index < 2) {
    await doctor("/api/referrals", { method: "POST", body: { elderId, referralType: 1, fromOrg: `${seed.community}卫生服务中心`, fromDoctorId: auth.doctor.userId, fromDoctorName: auth.doctor.realName, toOrg: "市医养结合中心医院", toDoctorId: auth.doctor.userId, toDoctorName: auth.doctor.realName, toDept: "老年医学科", diagnosis: seed.disease, referralReason: "进一步完成专科评估", urgencyLevel: index === 0 ? 2 : 1, bedReserved: 0, status: 0, remark: "十人统一演示数据" } });
  }

  created.push({ name: seed.name, elderId, planId, taskId, reportId, followRecordId });
}

for (const [role, request] of Object.entries({ admin, doctor, nurse })) {
  const list = await request("/api/elders?pageNum=1&pageSize=100");
  assert.equal(Number(list.total), 10, `${role} must see all ten elder master records`);
  assert.deepEqual(new Set(list.records.map((elder) => elder.name)), new Set(elderSeeds.map((elder) => elder.name)), `${role} elder names mismatch`);
}

const masterIds = new Set(created.map((item) => item.elderId));
const taskList = await admin("/api/followup/tasks?pageNum=1&pageSize=100");
assert.ok(taskList.records.every((task) => masterIds.has(Number(task.elderId))), "followup task references a non-master elder");
for (const item of created) {
  const summary = await nurse(`/api/care-workflows/elders/${item.elderId}/summary`);
  assert.equal(Number(summary.elder.id), item.elderId, `${item.name} nurse workflow summary mismatch`);
  const reports = await admin(`/api/ai/health-report/list?elderId=${item.elderId}&pageNum=1&pageSize=10`);
  assert.ok(Number(reports.total) >= 1, `${item.name} AI report missing`);
  const plans = await admin(`/api/followup/plans?pageNum=1&pageSize=10&elderId=${item.elderId}`);
  assert.ok(Number(plans.total) >= 1, `${item.name} followup plan missing`);
  const nursingPlans = await admin(`/api/nurse/plans?pageNum=1&pageSize=10&elderId=${item.elderId}`);
  assert.ok(Number(nursingPlans.total) >= 1, `${item.name} nursing plan missing`);
}

const report = { generatedAt: new Date().toISOString(), baseUrl: BASE_URL, elderCount: created.length, created, roleVisibility: { admin: 10, doctor: 10, nurse: 10 } };
await fs.writeFile(path.join(OUT_DIR, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ report: path.join(OUT_DIR, "report.json"), elderCount: created.length, names: created.map((item) => item.name) }, null, 2));
