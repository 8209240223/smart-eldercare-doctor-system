import { chromium } from "playwright";
import net from "node:net";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "test-results", "local-full-smoke");
const API_BASE_URL = (process.env.SMOKE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const BUILD_TARGETS = (process.env.SMOKE_BUILD_TARGETS || `http://localhost:5173,${API_BASE_URL}`)
  .split(",")
  .map((item) => item.trim().replace(/\/$/, ""))
  .filter(Boolean);
const USERS = [
  { role: "admin", username: "admin", password: "admin123" },
  { role: "doctor", username: "doctor01", password: "doctor123" },
  { role: "nurse", username: "nurse02", password: "nurse123" },
];
const ROUTES = [
  "/",
  "/admin-dashboard",
  "/nurse-dashboard",
  "/elders",
  "/warnings",
  "/key-population",
  "/followup",
  "/followup-tasks",
  "/interventions",
  "/assessments",
  "/referrals",
  "/vitals",
  "/exams",
  "/timeline",
  "/nurse-records",
  "/nurse-plans",
  "/nurse-review",
  "/ai-reports",
  "/warning-rules",
  "/admin-ai-config",
  "/profile",
];

const FALLBACK_USERS = {
  admin: { userId: 1, username: "admin", realName: "系统管理员", userType: 1 },
  doctor: { userId: 2, username: "doctor01", realName: "张医生", userType: 2 },
  nurse: { userId: 6, username: "nurse02", realName: "陈护士", userType: 3 },
};

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt(payload) {
  const header = { alg: "HS512" };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha512", Buffer.from("MedicalDoctorServiceSecretKey2024!@#$%", "utf8"))
    .update(signingInput)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${signingInput}.${signature}`;
}

function fallbackAuth(role) {
  const user = FALLBACK_USERS[role];
  const now = Math.floor(Date.now() / 1000);
  return {
    ...user,
    token: signJwt({
      sub: user.username,
      userId: user.userId,
      username: user.username,
      userType: user.userType,
      iat: now,
      exp: now + 7200,
    }),
  };
}

function redisGet(key) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port: 6379 });
    let data = Buffer.alloc(0);
    socket.setTimeout(2500);
    socket.on("connect", () => {
      const command = `*2\r\n$3\r\nGET\r\n$${Buffer.byteLength(key)}\r\n${key}\r\n`;
      socket.write(command);
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
      if (text.startsWith("$-1")) return resolve(null);
      const firstLineEnd = text.indexOf("\r\n");
      if (!text.startsWith("$") || firstLineEnd < 0) return reject(new Error(`Unexpected Redis response: ${text}`));
      const len = Number(text.slice(1, firstLineEnd));
      const valueStart = firstLineEnd + 2;
      const rawValue = text.slice(valueStart, valueStart + len);
      try {
        const parsed = JSON.parse(rawValue);
        if (Array.isArray(parsed) && typeof parsed[1] === "string") {
          return resolve(parsed[1]);
        }
        if (typeof parsed === "string") {
          return resolve(parsed);
        }
      } catch {
        // Redis may return a plain string when serializer settings differ.
      }
      resolve(rawValue);
    });
  });
}

async function apiJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from ${url}: ${text.slice(0, 200)}`);
  }
}

async function loginViaApi(baseApi, user) {
  const captcha = await apiJson(`${baseApi}/api/auth/captcha`);
  const key = captcha?.data?.key;
  if (!key) throw new Error(`Captcha key missing for ${user.username}`);
  const code = await redisGet(`medical:captcha:${key}`);
  if (!code) throw new Error(`Captcha code missing in Redis for key ${key}`);
  const login = await apiJson(`${baseApi}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: user.username,
      password: user.password,
      captchaCode: code,
      captchaKey: key,
    }),
  });
  if (login.code !== 200) {
    throw new Error(`Login failed for ${user.username}: ${JSON.stringify(login)}`);
  }
  return login.data;
}

async function seedAuth(page, authData) {
  await page.addInitScript((data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userInfo", JSON.stringify(data));
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          token: data.token,
          userInfo: data,
          isAuthenticated: true,
        },
        version: 0,
      })
    );
  }, authData);
}

function summarizeConsole(messages) {
  return messages
    .filter((item) => ["error", "warning"].includes(item.type))
    .map((item) => `${item.type.toUpperCase()}: ${item.text}`)
    .slice(0, 8);
}

async function testRoute(browser, baseUrl, route, authData, label) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleMessages = [];
  const pageErrors = [];
  const badResponses = [];
  page.on("console", (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("response", (res) => {
    const status = res.status();
    const url = res.url();
    if (status >= 400 && (url.includes("/api/") || url.includes("/assets/") || url.endsWith(".js") || url.endsWith(".css"))) {
      badResponses.push({ status, url });
    }
  });
  await seedAuth(page, authData);
  const url = `${baseUrl}${route}`;
  let status = null;
  let textLength = 0;
  let title = "";
  let screenshot = "";
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    status = response?.status() ?? null;
    await page.waitForTimeout(2200);
    textLength = (await page.locator("body").innerText().catch(() => "")).trim().length;
    title = await page.title().catch(() => "");
    const failed = status >= 400 || textLength < 20 || pageErrors.length > 0;
    if (failed) {
      const safeRoute = route === "/" ? "root" : route.replace(/\W+/g, "_");
      screenshot = path.join(OUT_DIR, `${label}-${safeRoute}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
    }
    return {
      label,
      route,
      url,
      status,
      title,
      textLength,
      pageErrors,
      console: summarizeConsole(consoleMessages),
      badResponses: badResponses.slice(0, 8),
      screenshot,
      ok: status !== null && status < 400 && textLength >= 20 && pageErrors.length === 0,
    };
  } catch (error) {
    const safeRoute = route === "/" ? "root" : route.replace(/\W+/g, "_");
    screenshot = path.join(OUT_DIR, `${label}-${safeRoute}-exception.png`);
    await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
    return {
      label,
      route,
      url,
      status,
      title,
      textLength,
      pageErrors: [...pageErrors, error.message],
      console: summarizeConsole(consoleMessages),
      badResponses: badResponses.slice(0, 8),
      screenshot,
      ok: false,
    };
  } finally {
    await page.close().catch(() => {});
  }
}

async function testUiLogin(browser, baseUrl, baseApi) {
  const auth = await loginViaApi(baseApi, USERS[0]);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleMessages = [];
  const pageErrors = [];
  page.on("console", (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on("pageerror", (err) => pageErrors.push(err.message));
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.evaluate((data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userInfo", "undefined");
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          token: data.token,
          isAuthenticated: true,
        },
        version: 0,
      })
    );
  }, auth);
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(2500);
  const bodyText = (await page.locator("body").innerText().catch(() => "")).trim();
  const result = {
    baseUrl,
    finalUrl: page.url(),
    textLength: bodyText.length,
    preview: bodyText.slice(0, 160),
    pageErrors,
    console: summarizeConsole(consoleMessages),
    ok: bodyText.length >= 20 && pageErrors.length === 0,
  };
  if (!result.ok) {
    result.screenshot = path.join(OUT_DIR, `login-flow-${baseUrl.replace(/\W+/g, "_")}.png`);
    await page.screenshot({ path: result.screenshot, fullPage: true });
  }
  await page.close();
  return result;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const authByRole = {};
  for (const user of USERS) {
    try {
      authByRole[user.role] = await loginViaApi(API_BASE_URL, user);
    } catch (error) {
      console.warn(`Login fallback for ${user.role}: ${error.message}`);
      authByRole[user.role] = fallbackAuth(user.role);
    }
  }

  const browser = await chromium.launch({ headless: true });
  const results = {
    generatedAt: new Date().toISOString(),
    authUsers: Object.fromEntries(
      Object.entries(authByRole).map(([role, data]) => [role, { userId: data.userId, username: data.username, realName: data.realName, userType: data.userType }])
    ),
    apiBaseUrl: API_BASE_URL,
    buildTargets: BUILD_TARGETS,
    loginFlow: [],
    routes: [],
  };

  for (const base of results.buildTargets) {
    results.loginFlow.push(await testUiLogin(browser, base, API_BASE_URL));
  }

  for (const base of results.buildTargets) {
    for (const [role, auth] of Object.entries(authByRole)) {
      for (const route of ROUTES) {
        results.routes.push(await testRoute(browser, base, route, auth, `${role}-${base.includes("5173") ? "dev" : "boot"}`));
      }
    }
  }
  await browser.close();

  const reportPath = path.join(OUT_DIR, "report.json");
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2), "utf8");

  const failedRoutes = results.routes.filter((item) => !item.ok);
  const failedLogin = results.loginFlow.filter((item) => !item.ok);
  console.log(JSON.stringify({
    reportPath,
    loginFlowTotal: results.loginFlow.length,
    loginFlowFailed: failedLogin.length,
    routeTotal: results.routes.length,
    routeFailed: failedRoutes.length,
    failedLogin,
    failedRoutes: failedRoutes.slice(0, 30),
  }, null, 2));
  if (failedRoutes.length || failedLogin.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
