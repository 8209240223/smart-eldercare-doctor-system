import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "..");
const OUT_DIR = path.join(process.cwd(), "test-results", "main-parity-audit");
const MAIN_APP = execFileSync("git", ["show", "origin/main:src/main/resources/static/pages/app.js"], {
  cwd: ROOT,
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});

const CURRENT_FILES = [];
const backendFallbackPath = path.join(ROOT, "src", "main", "java", "com", "medical", "controller", "SpaForwardController.java");
let backendFallbackSource = "";
try {
  backendFallbackSource = await fs.readFile(backendFallbackPath, "utf8");
} catch {
  backendFallbackSource = "";
}
async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) CURRENT_FILES.push(full);
  }
}

function extractTabs(source, name) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*\\[([\\s\\S]*?)\\];`));
  if (!match) return [];
  return [...match[1].matchAll(/key:\s*'([^']+)'\s*,\s*label:\s*'([^']+)'/g)].map((item) => ({
    key: item[1],
    label: item[2],
  }));
}

function extractApiPaths(source) {
  const paths = new Set();
  const patterns = [
    /["'`]((?:\/api\/)[^"'`]+)["'`]/g,
    /this\.api\(`([^`]+)`/g,
    /this\.api\('([^']+)'/g,
    /this\.api\("([^"]+)"/g,
    /api<[^>]+>\("([^"]+)"/g,
    /api\("([^"]+)"/g,
    /post<[^>]+>\("([^"]+)"/g,
    /useApiQuery<[^>]+>\([^,]+,\s*`([^`]+)`/g,
    /useApiQuery<[^>]+>\([^,]+,\s*"([^"]+)"/g,
    /useApiMutation<[^>]+>\("([^"]+)"/g,
    /useApiMutation<[^>]+>\(`([^`]+)`/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const raw = match[1];
      if (raw.includes("/api/")) {
        paths.add(raw.replace(/\$\{[^}]+\}/g, "{param}").replace(/\?.*$/, ""));
      }
    }
  }
  return [...paths].sort();
}

function extractCurrentRoutes(source) {
  return [...source.matchAll(/path="([^"]+)"/g)].map((item) => item[1]);
}

function hasAny(source, needles) {
  return needles.some((needle) => source.includes(needle));
}

await walk(path.join(process.cwd(), "src"));
const currentSourceParts = await Promise.all(CURRENT_FILES.map((file) => fs.readFile(file, "utf8")));
const currentSource = currentSourceParts.join("\n");
function sourceFor(relativePath) {
  const normalizedSuffix = path.normalize(relativePath);
  const index = CURRENT_FILES.findIndex((file) => file.endsWith(normalizedSuffix));
  return index >= 0 ? currentSourceParts[index] : "";
}
const headerSource = sourceFor(path.join("components", "layout", "Header.tsx"));
const healthRecordSource = sourceFor(path.join("components", "elders", "HealthRecordDialog.tsx"));
const followupTaskSource = sourceFor(path.join("pages", "FollowupTasks.tsx"));
const followupSource = sourceFor(path.join("pages", "FollowUp.tsx"));
const followupRecordSource = sourceFor(path.join("components", "followup", "FollowupRecordDialog.tsx"));
const warningsSource = sourceFor(path.join("pages", "Warnings.tsx"));
const interventionDialogSource = sourceFor(path.join("components", "interventions", "InterventionDialog.tsx"));
const interventionPageSource = sourceFor(path.join("pages", "Interventions.tsx"));
const referralDialogSource = sourceFor(path.join("components", "referrals", "ReferralDialog.tsx"));
const timelineSource = sourceFor(path.join("pages", "Timeline.tsx"));
const adminDashboardSource = sourceFor(path.join("pages", "AdminDashboard.tsx"));
const directRoleReads = CURRENT_FILES.filter((file) => !file.endsWith(path.join("store", "auth.ts")))
  .map((file, index) => ({ file, source: currentSourceParts[index] }))
  .filter((item) => item.source.includes("userInfo?.role"));
const appSource = await fs.readFile(path.join(process.cwd(), "src", "App.tsx"), "utf8");

const mainTabs = {
  doctor: extractTabs(MAIN_APP, "TAB_META"),
  admin: extractTabs(MAIN_APP, "ADMIN_TAB_META"),
  nurse: extractTabs(MAIN_APP, "NURSE_TAB_META"),
};

const currentRoutes = extractCurrentRoutes(appSource);
const expectedFeatureMap = [
  { key: "dashboard", route: "/", roles: ["doctor"], markers: ["useDashboardStats", "useDashboardTodo"] },
  { key: "admin-dashboard", route: "/admin-dashboard", roles: ["admin"], markers: ["AdminDashboard"] },
  { key: "nurse-dashboard", route: "/nurse-dashboard", roles: ["nurse"], markers: ["NurseDashboard", "/api/nurse/dashboard"] },
  { key: "elders", route: "/elders", roles: ["admin", "doctor", "nurse"], markers: ["/api/elders", "ElderDialog"] },
  { key: "warnings", route: "/warnings", roles: ["admin", "doctor", "nurse"], markers: ["/api/warnings", "EventSource"] },
  { key: "keyPopulation", route: "/key-population", roles: ["admin", "doctor"], markers: ["/api/risk", "KeyPopulation", "Risk"] },
  { key: "followup", route: "/followup", roles: ["admin", "doctor", "nurse"], markers: ["/api/followup/plans", "/api/followup/records"] },
  { key: "intervention", route: "/interventions", roles: ["admin", "doctor"], markers: ["/api/intervention"] },
  { key: "assessment", route: "/assessments", roles: ["admin", "doctor", "nurse"], markers: ["/api/assessments"] },
  { key: "referral", route: "/referrals", roles: ["admin", "doctor"], markers: ["/api/referrals"] },
  { key: "vitals", route: "/vitals", roles: ["admin", "doctor", "nurse"], markers: ["/api/vitals"] },
  { key: "exam", route: "/exams", roles: ["admin", "doctor"], markers: ["/api/exams"] },
  { key: "review", route: "/nurse-review", roles: ["doctor"], markers: ["/api/review"] },
  { key: "timeline", route: "/timeline", roles: ["admin", "doctor", "nurse"], markers: ["/api/timeline"] },
  { key: "profile", route: "/profile", roles: ["admin", "doctor", "nurse"], markers: ["/api/profile/info", "/api/profile/password", "/api/profile/messages"] },
  { key: "followup-tasks", route: "/followup-tasks", roles: ["doctor", "nurse"], markers: ["/api/followup/tasks", "FollowupTasks"] },
  { key: "admin-ai-config", route: "/admin-ai-config", roles: ["admin"], markers: ["/api/ai/config", "AiConfig"] },
  { key: "warning-rules", route: "/warning-rules", roles: ["admin"], markers: ["/api/warning-rules", "WarningRules"] },
  { key: "nurse-records", route: "/nurse-records", roles: ["nurse"], markers: ["/api/nurse/records", "NurseRecord"] },
  { key: "nurse-plans", route: "/nurse-plans", roles: ["nurse"], markers: ["/api/nurse/plans", "NursePlan"] },
];

const featureCoverage = expectedFeatureMap.map((feature) => {
  const routePresent = feature.route ? currentRoutes.includes(feature.route) : false;
  const markerPresent = hasAny(currentSource, feature.markers);
  let status = "missing";
  if (routePresent && markerPresent) status = "covered";
  else if (routePresent || markerPresent) status = "partial";
  return { ...feature, routePresent, markerPresent, status };
});

const mainApis = extractApiPaths(MAIN_APP);
const currentApis = extractApiPaths(currentSource);
const currentApiSet = new Set(currentApis);
const missingApiFamilies = [
  { name: "风险分层", prefix: "/api/risk", present: currentApis.some((p) => p.startsWith("/api/risk")) },
  { name: "随访记录", prefix: "/api/followup/records", present: currentApis.some((p) => p.startsWith("/api/followup/records")) },
  { name: "随访任务", prefix: "/api/followup/tasks", present: currentApis.some((p) => p.startsWith("/api/followup/tasks")) },
  { name: "护士工作台", prefix: "/api/nurse/dashboard", present: currentApis.some((p) => p.startsWith("/api/nurse/dashboard")) },
  { name: "护理记录", prefix: "/api/nurse/records", present: currentApis.some((p) => p.startsWith("/api/nurse/records")) },
  { name: "护理计划", prefix: "/api/nurse/plans", present: currentApis.some((p) => p.startsWith("/api/nurse/plans")) },
  { name: "AI配置", prefix: "/api/ai/config", present: currentApis.some((p) => p.startsWith("/api/ai/config")) },
  { name: "预警规则", prefix: "/api/warning-rules", present: currentApis.some((p) => p.startsWith("/api/warning-rules")) },
  { name: "个人资料保存", prefix: "/api/profile/info", present: currentApis.some((p) => p.startsWith("/api/profile/info")) },
  { name: "头像上传", prefix: "/api/profile/avatar", present: currentApis.some((p) => p.startsWith("/api/profile/avatar")) },
  { name: "系统消息", prefix: "/api/profile/messages", present: currentApis.some((p) => p.startsWith("/api/profile/messages")) },
  { name: "健康档案详情", prefix: "/api/health-detail", present: currentApis.some((p) => p.startsWith("/api/health-detail")) },
  { name: "老人健康档案", prefix: "/api/elders/{param}/record", present: currentApis.some((p) => p.includes("/api/elders/{param}/record") || p.includes("/api/elders/") && p.includes("/record")) },
  { name: "体检对比", prefix: "/api/exams/compare", present: currentApis.some((p) => p.startsWith("/api/exams/compare")) },
  { name: "慢病概览", prefix: "/api/dashboard/chronic-overview", present: currentApis.some((p) => p.startsWith("/api/dashboard/chronic-overview")) },
  { name: "审核数量", prefix: "/api/dashboard/review-counts", present: currentApis.some((p) => p.startsWith("/api/dashboard/review-counts")) },
];

const hardProblems = [
  {
    name: "Dashboard 待办数据结构不匹配",
    evidence: currentSource.includes("todos?.map") && currentSource.includes("/api/dashboard/todo"),
    detail: "React 将 /api/dashboard/todo 当数组 map，main 和后端返回的是待办计数字段对象。",
  },
  {
    name: "登录响应结构不匹配",
    evidence: currentSource.includes("const { token, userInfo } = res.data"),
    detail: "后端登录返回平铺用户字段，React 读取 res.data.userInfo，会导致角色和用户信息丢失。",
  },
  {
    name: "角色字段未对齐 userType",
    evidence: directRoleReads.length > 0,
    detail: "main 使用 userType=1/2/3，React 菜单和个人中心大量使用 role 字段。",
  },
  {
    name: "部署路由缺少 SPA fallback",
    evidence: currentSource.includes("BrowserRouter") && !backendFallbackSource.includes("forward:/index.html"),
    detail: "当前 React 使用 BrowserRouter，Spring Boot 静态部署直连二级路径会 404。",
  },
  {
    name: "当前前端源码含中文乱码",
    evidence: /[锟�]|[绯荤粺]|[宸ヤ綔]|[鏅烘収]/.test(currentSource),
    detail: "多处中文文本已损坏，影响可读性和操作识别。",
  },
  {
    name: "退出登录未注销后端会话",
    evidence: !headerSource.includes("/api/auth/logout"),
    detail: "退出按钮必须调用后端 logout 并携带 tokenId，不能只清理 localStorage。",
  },
  {
    name: "用药记录缺少编辑入口",
    evidence: !healthRecordSource.includes("useUpdateMedicationRecord") || !healthRecordSource.includes("编辑用药记录"),
    detail: "旧版健康档案允许维护用药，当前界面必须保留 PUT 更新能力。",
  },
  {
    name: "随访任务缺少逾期范围",
    evidence: !followupTaskSource.includes("useOverdueFollowupTasks") || !followupTaskSource.includes('scope') || !followupTaskSource.includes("逾期任务"),
    detail: "任务页必须能直接调用 overdue 端点并从工作台定位到逾期范围。",
  },
  {
    name: "预警实时统计未渲染",
    evidence: !warningsSource.includes("useWarningRealtimeStats") || !warningsSource.includes("WarningRealtimeSnapshot"),
    detail: "旧版的风险等级待处理数量、24小时趋势和最近预警必须继续可见。",
  },
  {
    name: "终态随访计划仍暴露记录入口",
    evidence: !followupSource.includes("canRecordFollowup") || !followupRecordSource.includes("recordingDisabled"),
    detail: "已完成、已终止或次数已满的计划在列表、历史弹窗和提交层都必须禁止新增记录。",
  },
  {
    name: "随访下次日期默认值回归",
    evidence: followupRecordSource.includes("nextFollowDate: plan.nextFollowDate") || !followupRecordSource.includes('nextFollowDate: ""'),
    detail: "新增记录的下次随访日期应默认留空，由后端按频率计算；手填时必须晚于本次日期。",
  },
  {
    name: "干预状态或日期契约不匹配",
    evidence: interventionDialogSource.includes("待执行") || interventionDialogSource.includes("执行中") || interventionDialogSource.includes("已终止") || !interventionPageSource.includes("T00:00:00"),
    detail: "干预状态只能是正常/已取消，date 输入提交前必须转换为 LocalDateTime。",
  },
  {
    name: "转诊表单未严格要求转出机构",
    evidence: !referralDialogSource.includes("errors.fromOrg") || !referralDialogSource.includes("转出机构不能为空"),
    detail: "origin/main 要求 fromOrg 和 toOrg 均必填，当前表单不得放宽。",
  },
  {
    name: "时间轴缺少独立业务事件类型",
    evidence: !timelineSource.includes('value: 10') || !timelineSource.includes('value: 11') || !timelineSource.includes('value: 12'),
    detail: "风险分层、健康干预和 AI 报告必须使用独立类型，不能再与评估或转诊混算。",
  },
  {
    name: "管理员工作台业务统计回归",
    evidence: !hasAny(adminDashboardSource, ["useAssessmentStats"]) || !hasAny(adminDashboardSource, ["useReferralStats"]) || !hasAny(adminDashboardSource, ["useExamStats"]) || !hasAny(adminDashboardSource, ["useInterventionStats"]),
    detail: "管理员工作台必须保留评估、转诊、体检、干预概览和最新业务入口。",
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  mainTabs,
  currentRoutes,
  featureCoverage,
  apiFamilies: missingApiFamilies,
  mainApiCount: mainApis.length,
  currentApiCount: currentApis.length,
  mainOnlyApiSamples: mainApis.filter((api) => !currentApiSet.has(api)).slice(0, 80),
  hardProblems: hardProblems.filter((item) => item.evidence),
};

await fs.mkdir(OUT_DIR, { recursive: true });
await fs.writeFile(path.join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2), "utf8");

const lines = [];
lines.push("# Main 功能一致性本地审计");
lines.push("");
lines.push(`生成时间：${report.generatedAt}`);
lines.push("");
lines.push("## 关键硬问题");
for (const item of report.hardProblems) lines.push(`- ${item.name}：${item.detail}`);
lines.push("");
lines.push("## 页面/模块覆盖");
for (const item of report.featureCoverage) {
  lines.push(`- ${item.key}：${item.status}，route=${item.route || "无"}，routePresent=${item.routePresent}，markerPresent=${item.markerPresent}`);
}
lines.push("");
lines.push("## API 家族覆盖");
for (const item of report.apiFamilies) {
  lines.push(`- ${item.name} (${item.prefix})：${item.present ? "已出现" : "未出现"}`);
}
await fs.writeFile(path.join(OUT_DIR, "report.md"), lines.join("\n"), "utf8");

console.log(JSON.stringify({
  reportJson: path.join(OUT_DIR, "report.json"),
  reportMd: path.join(OUT_DIR, "report.md"),
  missingFeatures: featureCoverage.filter((item) => item.status !== "covered").map((item) => item.key),
  missingApiFamilies: missingApiFamilies.filter((item) => !item.present).map((item) => item.name),
  hardProblems: report.hardProblems.map((item) => item.name),
}, null, 2));
