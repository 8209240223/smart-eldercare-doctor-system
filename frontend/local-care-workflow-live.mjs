import assert from "node:assert/strict";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = (process.env.CARE_BASE_URL || "http://127.0.0.1:8084").replace(
  /\/$/,
  "",
);
const OUT_DIR = path.join(process.cwd(), "test-results", "care-workflow-live");
const USERS = {
  admin: { username: "admin", password: "admin123" },
  doctor: { username: "doctor01", password: "doctor123" },
  nurse: { username: "nurse02", password: "nurse123" },
};

function redisGet(key) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port: 6379 });
    let data = Buffer.alloc(0);
    socket.setTimeout(2500);
    socket.on("connect", () =>
      socket.write(
        `*2\r\n$3\r\nGET\r\n$${Buffer.byteLength(key)}\r\n${key}\r\n`,
      ),
    );
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
      if (!text.startsWith("$") || lineEnd < 0) {
        reject(new Error(`Unexpected Redis response: ${text}`));
        return;
      }
      const length = Number(text.slice(1, lineEnd));
      const raw = text.slice(lineEnd + 2, lineEnd + 2 + length);
      try {
        const parsed = JSON.parse(raw);
        resolve(Array.isArray(parsed) ? parsed[1] : parsed);
      } catch {
        resolve(raw);
      }
    });
  });
}

async function rawRequest(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, options);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { status: response.status, body };
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
  assert.equal(result.body?.code, 200, `${account.username} login failed`);
  return result.body.data;
}

function apiClient(auth) {
  return async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${auth.token}`);
    if (auth.tokenId) headers.set("X-Token-Id", auth.tokenId);
    if (options.body !== undefined)
      headers.set("Content-Type", "application/json");
    return rawRequest(url, {
      ...options,
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  };
}

async function createContext(browser, auth, viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript((value) => {
    const userInfo = {
      ...value,
      role:
        value.role ||
        (Number(value.userType) === 1
          ? "admin"
          : Number(value.userType) === 3
            ? "nurse"
            : "doctor"),
    };
    localStorage.setItem("token", value.token);
    if (value.tokenId) localStorage.setItem("tokenId", value.tokenId);
    localStorage.setItem("userInfo", JSON.stringify(userInfo));
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          token: value.token,
          tokenId: value.tokenId || null,
          userInfo,
          isAuthenticated: true,
        },
        version: 0,
      }),
    );
  }, auth);
  return context;
}

async function openAndCheck(page, route, heading) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: heading, exact: true }).waitFor();
}

await fs.mkdir(OUT_DIR, { recursive: true });
const auth = {
  admin: await login(USERS.admin),
  doctor: await login(USERS.doctor),
  nurse: await login(USERS.nurse),
};
const doctorApi = apiClient(auth.doctor);
const nurseApi = apiClient(auth.nurse);

const elderList = await doctorApi("/api/elders?pageNum=1&pageSize=100");
assert.equal(elderList.body?.code, 200);
assert.equal(Number(elderList.body.data.total), 10);
const elder = elderList.body.data.records.find(
  (item) => item.name === "张安康",
);
assert.ok(elder?.id, "张安康主档不存在");

const before = await doctorApi(
  `/api/care-workflows/elders/${elder.id}/summary`,
);
assert.equal(before.body?.code, 200);
const generated = await doctorApi(
  `/api/care-workflows/elders/${elder.id}/generate`,
  {
    method: "POST",
  },
);
assert.equal(generated.body?.code, 200);
assert.equal(generated.body.data.plan.data.id, before.body.data.plan.data.id);
assert.equal(generated.body.data.plan.reused, true);
const generatedAgain = await doctorApi(
  `/api/care-workflows/elders/${elder.id}/generate`,
  {
    method: "POST",
  },
);
assert.equal(generatedAgain.body?.code, 200);
assert.equal(
  generatedAgain.body.data.plan.data.id,
  generated.body.data.plan.data.id,
);
assert.equal(
  generatedAgain.body.data.task.data.id,
  generated.body.data.task.data.id,
);
assert.equal(
  generatedAgain.body.data.report.data.id,
  generated.body.data.report.data.id,
);
assert.equal(generatedAgain.body.data.plan.reused, true);
assert.equal(generatedAgain.body.data.task.reused, true);

const denied = await nurseApi(
  `/api/care-workflows/elders/${elder.id}/generate`,
  {
    method: "POST",
  },
);
assert.equal(Number(denied.body?.code), 403);

const browser = await chromium.launch({ headless: true });
const checks = [];
try {
  for (const role of ["doctor", "admin", "nurse"]) {
    const context = await createContext(browser, auth[role], {
      width: 1440,
      height: 1000,
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await openAndCheck(page, `/elders/${elder.id}/care-journey`, "照护全流程");
    for (const label of [
      "老人档案",
      "健康资料",
      "风险分层",
      "随访计划",
      "随访任务",
      "AI 健康报告",
      "护理协同",
    ]) {
      await page.getByText(label, { exact: true }).first().waitFor();
    }
    const generateButton = page.getByRole("button", {
      name: "一键生成 / 刷新健康管理流程",
      exact: true,
    });
    if (role === "nurse") assert.equal(await generateButton.count(), 0);
    else assert.equal(await generateButton.count(), 1);
    assert.deepEqual(pageErrors, []);
    await page.screenshot({
      path: path.join(OUT_DIR, `${role}-care-journey-desktop.png`),
      fullPage: true,
    });
    checks.push(`${role}:care-journey`);
    await context.close();
  }

  const doctorContext = await createContext(browser, auth.doctor, {
    width: 1440,
    height: 1000,
  });
  const doctorPage = await doctorContext.newPage();
  await openAndCheck(doctorPage, "/elders", "老人档案");
  assert.equal(
    await doctorPage
      .getByRole("button", { name: "新增老人档案", exact: true })
      .count(),
    1,
  );
  await doctorPage
    .getByRole("button", { name: "新增老人档案", exact: true })
    .click();
  const onboarding = doctorPage.getByRole("dialog").filter({
    hasText: "新增老人并建立健康管理档案",
  });
  await onboarding
    .getByRole("tab", { name: "基本档案", exact: true })
    .waitFor();
  await onboarding
    .getByRole("tab", { name: "健康概况", exact: true })
    .waitFor();
  await onboarding
    .getByRole("tab", { name: "初始体检", exact: true })
    .waitFor();
  await onboarding
    .getByRole("button", { name: "保存并建档", exact: true })
    .waitFor();
  await doctorPage.screenshot({
    path: path.join(OUT_DIR, "doctor-onboarding-dialog.png"),
    fullPage: true,
  });
  await onboarding.getByRole("button", { name: "取消", exact: true }).click();
  checks.push("doctor:onboarding-dialog");

  await openAndCheck(
    doctorPage,
    `/ai-reports?elderId=${elder.id}`,
    "AI 健康报告",
  );
  await doctorPage.getByText("张安康 · 健康评估报告", { exact: true }).first().waitFor();
  await doctorPage
    .getByRole("button", { name: "查看", exact: true })
    .first()
    .click();
  const reportDialog = doctorPage
    .getByRole("dialog")
    .filter({ hasText: "AI 健康报告详情" });
  await reportDialog.getByText("数据完整性", { exact: true }).waitFor();
  assert.equal(
    (await reportDialog.innerText()).includes('"schemaVersion"'),
    false,
  );
  await doctorPage.screenshot({
    path: path.join(OUT_DIR, "doctor-structured-report.png"),
    fullPage: true,
  });
  checks.push("doctor:structured-report");
  await doctorContext.close();

  const nurseContext = await createContext(browser, auth.nurse, {
    width: 1440,
    height: 1000,
  });
  const nursePage = await nurseContext.newPage();
  await openAndCheck(nursePage, "/elders", "老人档案");
  assert.equal(
    await nursePage
      .getByRole("button", { name: "新增老人档案", exact: true })
      .count(),
    0,
  );
  assert.equal(
    await nursePage.getByRole("button", { name: "编辑", exact: true }).count(),
    0,
  );
  assert.equal(
    await nursePage.getByRole("button", { name: "删除", exact: true }).count(),
    0,
  );
  assert.ok(
    (await nursePage
      .getByRole("button", { name: "照护全流程", exact: true })
      .count()) >= 1,
  );
  checks.push("nurse:elder-readonly");
  await nurseContext.close();

  const mobileContext = await createContext(browser, auth.doctor, {
    width: 390,
    height: 844,
  });
  const mobilePage = await mobileContext.newPage();
  await openAndCheck(
    mobilePage,
    `/elders/${elder.id}/care-journey`,
    "照护全流程",
  );
  const overflow = await mobilePage.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  assert.ok(overflow <= 1, `mobile horizontal overflow: ${overflow}px`);
  await mobilePage.screenshot({
    path: path.join(OUT_DIR, "doctor-care-journey-mobile.png"),
    fullPage: true,
  });
  checks.push("doctor:mobile-no-overflow");
  await mobileContext.close();
} finally {
  await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  elder: { id: elder.id, name: elder.name },
  checks,
  api: {
    elderCount: 10,
    idempotentPlanId: generated.body.data.plan.data.id,
    idempotentTaskId: generated.body.data.task.data.id,
    idempotentReportId: generated.body.data.report.data.id,
    nurseGenerateDenied: true,
  },
};
await fs.writeFile(
  path.join(OUT_DIR, "report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
console.log(
  JSON.stringify(
    { report: path.join(OUT_DIR, "report.json"), checks },
    null,
    2,
  ),
);
