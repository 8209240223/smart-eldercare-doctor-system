import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = (process.env.VISUAL_BASE_URL || "http://127.0.0.1:8081").replace(/\/$/, "");
const OUT_DIR = path.join(process.cwd(), "test-results", "visual-parity");

const USERS = {
  admin: { userId: 1, username: "admin", realName: "系统管理员", userType: 1, role: "admin" },
  doctor: { userId: 2, username: "doctor01", realName: "张医生", userType: 2, role: "doctor" },
};

function base64Url(value) {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function authFor(role) {
  const user = USERS[role];
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS512" }));
  const payload = base64Url(JSON.stringify({ sub: user.username, userId: user.userId, username: user.username, userType: user.userType, iat: now, exp: now + 7200 }));
  const input = `${header}.${payload}`;
  const signature = crypto.createHmac("sha512", Buffer.from("MedicalDoctorServiceSecretKey2024!@#$%", "utf8"))
    .update(input)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return { ...user, token: `${input}.${signature}` };
}

async function seedAuth(page, role) {
  const auth = authFor(role);
  await page.addInitScript((data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userInfo", JSON.stringify(data));
    localStorage.setItem("auth-storage", JSON.stringify({ state: { token: data.token, tokenId: null, userInfo: data, isAuthenticated: true }, version: 0 }));
  }, auth);
}

async function inspectLayout(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const bodyText = document.body.innerText.trim();
    const overflowingControls = [...document.querySelectorAll("button, [role='button'], input, select")]
      .filter((element) => {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") return false;
        return element.scrollWidth > element.clientWidth + 3;
      })
      .slice(0, 10)
      .map((element) => ({ text: (element.textContent || element.getAttribute("aria-label") || "").trim().slice(0, 80), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }));
    return {
      bodyTextLength: bodyText.length,
      viewportWidth: window.innerWidth,
      documentWidth: root.scrollWidth,
      horizontalOverflow: root.scrollWidth > window.innerWidth + 2,
      overflowingControls,
    };
  });
}

async function runScenario(browser, scenario) {
  const context = await browser.newContext({ viewport: scenario.viewport });
  const page = await context.newPage();
  await seedAuth(page, scenario.role);
  const consoleErrors = [];
  const pageErrors = [];
  const badResponses = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400 && (response.url().includes("/api/") || response.url().includes("/assets/"))) {
      badResponses.push({ status: response.status(), url: response.url() });
    }
  });

  const response = await page.goto(`${BASE_URL}${scenario.route}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  assert.equal(response?.status(), 200, `${scenario.name} page status`);
  await page.locator("main").waitFor({ state: "visible", timeout: 15_000 }).catch(() => page.locator("body").waitFor({ state: "visible", timeout: 15_000 }));
  await page.waitForTimeout(1600);
  if (scenario.interact) await scenario.interact(page);
  await page.waitForTimeout(500);
  const layout = await inspectLayout(page);
  const screenshot = path.join(OUT_DIR, `${scenario.name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  const screenshotSize = (await fs.stat(screenshot)).size;

  assert.ok(layout.bodyTextLength > 100, `${scenario.name} rendered too little text`);
  assert.equal(layout.horizontalOverflow, false, `${scenario.name} has horizontal overflow`);
  assert.deepEqual(layout.overflowingControls, [], `${scenario.name} has clipped controls`);
  assert.deepEqual(pageErrors, [], `${scenario.name} page errors`);
  assert.deepEqual(badResponses, [], `${scenario.name} bad responses`);
  assert.ok(screenshotSize > 20_000, `${scenario.name} screenshot appears blank`);

  await context.close();
  return { name: scenario.name, route: scenario.route, role: scenario.role, viewport: scenario.viewport, layout, consoleErrors, pageErrors, badResponses, screenshot, screenshotSize };
}

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };
const scenarios = [
  { name: "admin-dashboard-desktop", role: "admin", route: "/admin-dashboard", viewport: desktop },
  { name: "warnings-desktop", role: "doctor", route: "/warnings", viewport: desktop },
  { name: "followup-overdue-desktop", role: "doctor", route: "/followup-tasks?scope=overdue", viewport: desktop },
  {
    name: "timeline-desktop",
    role: "doctor",
    route: "/timeline",
    viewport: desktop,
    interact: async (page) => {
      const select = page.getByLabel("老人档案").or(page.locator("select").first());
      if (await select.count()) await select.selectOption({ index: 1 }).catch(() => undefined);
      await page.waitForTimeout(600);
    },
  },
  {
    name: "medication-edit-desktop",
    role: "doctor",
    route: "/elders",
    viewport: desktop,
    interact: async (page) => {
      await page.getByRole("button", { name: "健康详情" }).first().click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("tab", { name: "用药" }).click();
      const edit = dialog.getByRole("button", { name: "编辑" }).first();
      if (await edit.count()) await edit.click();
    },
  },
  { name: "warnings-mobile", role: "doctor", route: "/warnings", viewport: mobile },
  { name: "followup-overdue-mobile", role: "doctor", route: "/followup-tasks?scope=overdue", viewport: mobile },
];

await fs.rm(OUT_DIR, { recursive: true, force: true });
await fs.mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const scenario of scenarios) results.push(await runScenario(browser, scenario));
} finally {
  await browser.close();
}
const report = { generatedAt: new Date().toISOString(), baseUrl: BASE_URL, passed: results.length, failed: 0, results };
await fs.writeFile(path.join(OUT_DIR, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ passed: report.passed, report: path.join(OUT_DIR, "report.json"), screenshots: results.map((item) => item.screenshot) }, null, 2));
