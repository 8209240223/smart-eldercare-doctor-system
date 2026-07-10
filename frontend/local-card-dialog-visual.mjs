import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = (process.env.CARD_UI_BASE_URL || "http://127.0.0.1:5173").replace(
  /\/$/,
  "",
);
const OUT_DIR = path.join(
  process.cwd(),
  "test-results",
  "card-dialog-redesign",
);

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function doctorToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS512" }));
  const payload = base64Url(
    JSON.stringify({
      sub: "doctor01",
      userId: 2,
      username: "doctor01",
      userType: 2,
      iat: now,
      exp: now + 7200,
    }),
  );
  const signingInput = `${header}.${payload}`;
  const signature = crypto
    .createHmac(
      "sha512",
      Buffer.from("MedicalDoctorServiceSecretKey2024!@#$%", "utf8"),
    )
    .update(signingInput)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${signingInput}.${signature}`;
}

async function createPage(browser, viewport) {
  const token = doctorToken();
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.addInitScript((authToken) => {
    const userInfo = {
      userId: 2,
      id: 2,
      username: "doctor01",
      realName: "张医生",
      userType: 2,
      role: "doctor",
    };
    localStorage.setItem("token", authToken);
    localStorage.setItem("userInfo", JSON.stringify(userInfo));
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          token: authToken,
          tokenId: null,
          userInfo,
          isAuthenticated: true,
        },
        version: 0,
      }),
    );
  }, token);
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  return { context, page };
}

function planCardFor(page, elderName) {
  return page
    .locator("h3")
    .filter({ hasText: elderName })
    .first()
    .locator("xpath=ancestor::div[.//button[contains(., '查看记录')]][1]");
}

function riskCardFor(page, elderName) {
  return page
    .locator("h3")
    .filter({ hasText: elderName })
    .first()
    .locator("xpath=ancestor::div[.//button[contains(., '查看画像')]][1]");
}

async function assertRealElderNames(page, route, heading, expectedNames) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: heading, exact: true }).waitFor();
  await page.waitForFunction(
    (names) => names.some((name) => document.body.innerText.includes(name)),
    expectedNames,
  );
  const bodyText = await page.locator("body").innerText();
  if (/老人\s*#\s*\d+|档案\s*#\s*\d+|姓名未同步/.test(bodyText)) {
    throw new Error(`${heading}仍包含老人编号占位符`);
  }
  if (!expectedNames.some((name) => bodyText.includes(name))) {
    throw new Error(`${heading}没有显示老人主档真实姓名`);
  }
}

await fs.mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [];

try {
  const desktop = await createPage(browser, { width: 1440, height: 1000 });
  const desktopErrors = [];
  desktop.page.on("pageerror", (error) => desktopErrors.push(String(error)));

  await desktop.page.goto(`${BASE_URL}/followup?elderId=1`, {
    waitUntil: "domcontentloaded",
  });
  await desktop.page.getByRole("heading", { name: "随访计划", exact: true }).waitFor();
  const followupCard = planCardFor(desktop.page, "张安康");
  await followupCard.getByRole("button", { name: "查看记录" }).click();
  const historyDialog = desktop.page.getByRole("dialog").last();
  await historyDialog.getByRole("heading", { name: /张安康.*随访历史/ }).waitFor();
  await historyDialog.getByText("随访结论", { exact: true }).first().waitFor();
  await desktop.page.screenshot({
    path: path.join(OUT_DIR, "followup-history-desktop.png"),
  });
  checks.push("followup-history-card-grid");

  const detailButton = historyDialog.getByRole("button", { name: "查看详情" }).first();
  await detailButton.click();
  const detailDialog = desktop.page.getByRole("dialog").last();
  await detailDialog.getByRole("heading", { name: "随访记录详情" }).waitFor();
  await detailDialog.getByText("关键数据", { exact: true }).waitFor();
  await detailDialog.getByText("记录内容", { exact: true }).waitFor();
  await desktop.page.screenshot({
    path: path.join(OUT_DIR, "followup-detail-desktop.png"),
  });
  checks.push("followup-detail-card-sections");

  await desktop.page.goto(`${BASE_URL}/key-population?elderId=1`, {
    waitUntil: "domcontentloaded",
  });
  await desktop.page.getByText("张安康", { exact: true }).first().waitFor();
  await desktop.page.waitForTimeout(500);
  let riskDialog = desktop.page.getByRole("dialog").last();
  if (!(await riskDialog.isVisible().catch(() => false))) {
    const riskCard = riskCardFor(desktop.page, "张安康");
    await riskCard.getByRole("button", { name: "查看画像" }).click();
    riskDialog = desktop.page.getByRole("dialog").last();
  }
  await riskDialog.getByRole("heading", { name: /张安康.*风险画像/ }).waitFor();
  await riskDialog.getByText("健康管理概况", { exact: true }).waitFor();
  await riskDialog.getByText("风险构成", { exact: true }).waitFor();
  await riskDialog.getByText("管理建议", { exact: true }).waitFor();
  const riskText = await riskDialog.innerText();
  if (/reasonJson|scoreDetails|contextData|\{"/.test(riskText)) {
    throw new Error("风险画像仍显示内部 JSON 或技术字段");
  }
  await desktop.page.screenshot({
    path: path.join(OUT_DIR, "risk-profile-desktop.png"),
  });
  checks.push("risk-profile-structured-cards");
  checks.push("risk-profile-no-raw-json");

  await assertRealElderNames(desktop.page, "/referrals", "转诊协同", [
    "张安康",
    "李秀兰",
  ]);
  checks.push("referrals-use-master-names");
  await assertRealElderNames(desktop.page, "/assessments", "评估记录", [
    "黄玉珍",
    "孙福生",
    "吴春梅",
  ]);
  checks.push("assessments-use-master-names");
  await assertRealElderNames(desktop.page, "/warnings", "预警中心", [
    "孙福生",
    "陈志强",
  ]);
  checks.push("warnings-use-master-names");

  if (desktopErrors.length > 0) {
    throw new Error(`桌面端页面错误: ${desktopErrors.join(" | ")}`);
  }
  await desktop.context.close();

  const mobile = await createPage(browser, { width: 390, height: 844 });
  await mobile.page.goto(`${BASE_URL}/key-population?elderId=1`, {
    waitUntil: "domcontentloaded",
  });
  await mobile.page.getByText("张安康", { exact: true }).first().waitFor();
  await mobile.page.waitForTimeout(500);
  let mobileDialog = mobile.page.getByRole("dialog").last();
  if (!(await mobileDialog.isVisible().catch(() => false))) {
    const mobileRiskCard = riskCardFor(mobile.page, "张安康");
    await mobileRiskCard.getByRole("button", { name: "查看画像" }).click();
    mobileDialog = mobile.page.getByRole("dialog").last();
  }
  await mobileDialog.getByText("健康管理概况", { exact: true }).waitFor();
  const overflow = await mobile.page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    pageWidth: document.documentElement.scrollWidth,
  }));
  if (overflow.pageWidth > overflow.viewport + 1) {
    throw new Error(
      `移动端横向溢出: page=${overflow.pageWidth}, viewport=${overflow.viewport}`,
    );
  }
  await mobile.page.screenshot({
    path: path.join(OUT_DIR, "risk-profile-mobile.png"),
  });
  checks.push("risk-profile-mobile-no-overflow");
  await mobile.context.close();

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    checks,
    passed: checks.length,
    failed: 0,
  };
  await fs.writeFile(
    path.join(OUT_DIR, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
