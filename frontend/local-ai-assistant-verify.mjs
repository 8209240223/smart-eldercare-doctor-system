import { chromium } from "playwright";
import net from "node:net";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const BASE = (process.env.AI_TEST_BASE || "http://localhost:8080").replace(/\/$/, "");
const OUT = path.join(process.cwd(), "test-results", "ai-assistant-verify");
await fs.mkdir(OUT, { recursive: true });

const USER = { username: "doctor01", password: "doctor123", role: "doctor" };
const QUESTION = "告诉我所有关于1号老人的随访计划，用 Markdown 列出计划详情。";

function base64Url(s) {
  return Buffer.from(s).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function signJwt(payload) {
  const enc = `${base64Url(JSON.stringify({alg:"HS512"}))}.${base64Url(JSON.stringify(payload))}`;
  const sig = crypto.createHmac("sha512", "MedicalDoctorServiceSecretKey2024!@#$%").update(enc).digest("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  return `${enc}.${sig}`;
}
function redisGet(key) {
  return new Promise((resolve, reject) => {
    const s = net.createConnection({host:"127.0.0.1",port:6379}); let d=Buffer.alloc(0); s.setTimeout(2500);
    s.on("connect",()=>s.write(`*2\r\n$3\r\nGET\r\n$${Buffer.byteLength(key)}\r\n${key}\r\n`));
    s.on("data",c=>{d=Buffer.concat([d,c]);s.end();});
    s.on("error",reject); s.on("timeout",()=>{s.destroy();reject(new Error("redis timeout"));});
    s.on("end",()=>{
      const t=d.toString("utf8"); if(t.startsWith("$-1"))return resolve(null);
      const i=t.indexOf("\r\n"); if(!t.startsWith("$")||i<0)return reject(new Error("redis:"+t));
      const len=Number(t.slice(1,i)); const v=t.slice(i+2,i+2+len);
      try{const p=JSON.parse(v); if(Array.isArray(p)&&typeof p[1]==="string")return resolve(p[1]); if(typeof p==="string")return resolve(p);}catch{}
      resolve(v);
    });
  });
}
async function apiJson(url,opts={}) {
  const r=await fetch(url,{...opts,headers:{"Content-Type":"application/json",...(opts.headers||{})}});
  return r.json();
}
async function loginViaApi() {
  const cap=await apiJson(`${BASE}/api/auth/captcha`);
  const key=cap?.data?.key; if(!key)throw new Error("no captcha key");
  const code=await redisGet(`medical:captcha:${key}`); if(!code)throw new Error("no captcha code in redis");
  const login=await apiJson(`${BASE}/api/auth/login`,{method:"POST",body:JSON.stringify({username:USER.username,password:USER.password,captchaCode:code,captchaKey:key})});
  if(login.code!==200)throw new Error(`login failed: ${JSON.stringify(login)}`);
  return login.data;
}
async function seedAuth(page, data) {
  await page.addInitScript((d)=>{
    localStorage.setItem("token",d.token);
    if(d.tokenId) localStorage.setItem("tokenId",d.tokenId);
    localStorage.setItem("userInfo",JSON.stringify(d));
    localStorage.setItem("auth-storage",JSON.stringify({state:{token:d.token,tokenId:d.tokenId||null,userInfo:d,isAuthenticated:true},version:0}));
  },data);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs=[]; page.on("pageerror",e=>errs.push(e.message)); page.on("console",m=>{if(m.type()==="error")errs.push(m.text());});

const auth = await loginViaApi();
await seedAuth(page, auth);
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);

// 打开 AI 助手
const petBtn = page.locator(".rana-pet-button").first();
await petBtn.waitFor({ state: "visible", timeout: 10000 }).catch(()=>{});
await petBtn.click().catch(async()=>{ await page.evaluate(()=>{document.querySelector(".rana-pet-button")?.click();}); });
await page.waitForTimeout(1500);

// 输入并发送
const input = page.locator("textarea").first();
await input.waitFor({ state: "visible", timeout: 10000 });
await input.fill(QUESTION);
await page.locator(".rana-composer-button[aria-label='发送消息']").first().click();

// 等待流式完成(最多 60s,看 .rana-agent-step 出现多条 或 markdown 渲染)
const result = { steps: 0, tableWrap: false, markdownRendered: false, done: false, errors: errs };
let waited = 0;
while (waited < 60000) {
  await page.waitForTimeout(2000); waited += 2000;
  const steps = await page.locator(".rana-agent-step").count();
  const table = await page.locator(".rana-markdown-table-wrap").count();
  const done = await page.locator(".rana-agent-step.is-done").count();
  const md = await page.locator(".rana-markdown").count().catch(()=>0) || await page.locator("[class*='markdown']").count();
  result.steps = steps; result.tableWrap = table > 0; result.done = done > 0;
  if (steps > 0) result.markdownRendered = md > 0;
  // 完成条件:出现 done 步骤 或 出现表格 且 步骤>=2
  if (done > 0 || (table > 0 && steps >= 2)) break;
}

await page.screenshot({ path: path.join(OUT, "ai-assistant-steps.png"), fullPage: true });
// 截助手对话框局部
const dialog = page.locator(".rana-assistant-dialog").first();
if (await dialog.count() > 0) {
  await dialog.screenshot({ path: path.join(OUT, "ai-assistant-dialog.png") }).catch(()=>{});
}

result.question = QUESTION.slice(0,60);
result.elapsedMs = waited;
console.log(JSON.stringify(result, null, 2));
await browser.close();

// 判定:步骤>=2(逐条渲染) 且 (有表格 或 有markdown 或 done)
const pass = result.steps >= 2 && (result.tableWrap || result.markdownRendered || result.done);
console.log(pass ? "AI_ASSISTANT_VERIFY_PASS" : "AI_ASSISTANT_VERIFY_FAIL");
process.exit(pass ? 0 : 1);
