import { chromium } from "playwright";

const BASE = "http://localhost:8080";
const TOKEN = process.env.TOKEN;

(async () => {
  if (!TOKEN) {
    console.error("请设置 TOKEN 环境变量");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const logs = [];
  page.on("console", (msg) => logs.push({ type: msg.type(), text: msg.text() }));
  page.on("pageerror", (err) => logs.push({ type: "pageerror", text: err.message }));
  page.on("requestfailed", (req) => logs.push({ type: "network-error", text: `${req.url()} ${req.failure()?.errorText}` }));

  await context.addInitScript((t) => {
    localStorage.setItem("token", t);
    localStorage.setItem("userInfo", JSON.stringify({ userId: 1, username: "admin", realName: "系统管理员", role: "admin" }));
  }, TOKEN);

  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: "debug-dashboard.png", fullPage: true });
  console.log("--- Console logs ---");
  logs.forEach((l) => console.log(`[${l.type}] ${l.text}`));
  console.log("--- Page HTML snippet ---");
  console.log(await page.content().then((html) => html.slice(0, 500)));

  await browser.close();
})();
