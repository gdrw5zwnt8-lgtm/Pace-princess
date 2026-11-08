// End-to-end test: the whole subscription path, on a phone (390px) and a computer (1280px).
// Usage: npm run build && npm run e2e        (starts `next start` itself)
//        BASE_URL=https://… npm run e2e      (runs against a live deploy)
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const PORT = 3100;
let BASE = process.env.BASE_URL;
let server;
const SHOTS = "shots";
mkdirSync(SHOTS, { recursive: true });

async function startServer() {
  server = spawn("npx", ["next", "start", "-p", String(PORT)], { stdio: "ignore", detached: true });
  BASE = `http://localhost:${PORT}`;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not start");
}

const VIEWPORTS = [
  { name: "phone", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { name: "desktop", viewport: { width: 1280, height: 860 } },
];

async function run(browser, vp) {
  const ctx = await browser.newContext({ viewport: vp.viewport, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  const shot = (n) => page.screenshot({ path: `${SHOTS}/${vp.name}-${n}.png`, fullPage: true, animations: "disabled" });
  const noHScroll = async (where) => {
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(over <= 1, `${vp.name} ${where}: horizontal scroll (${over}px)`);
  };

  // 1. Landing: no prices (funnel rule).
  await page.goto(`${BASE}/`);
  await page.getByRole("heading", { name: /train with your cycle/i }).waitFor();
  const landing = await page.locator("main").innerText();
  assert.ok(!/\$\d/.test(landing), "landing page must not show prices");
  await noHScroll("landing");
  await shot("01-landing");

  // 2. Train page before onboarding: empty state.
  await page.goto(`${BASE}/train`);
  await page.getByTestId("train-empty").waitFor();
  await shot("02-train-empty");

  // 3. Onboarding -> peak -> pricing card.
  await page.goto(`${BASE}/onboarding`);
  await page.getByRole("heading", { name: /last period/i }).waitFor();
  await shot("03-onboarding-1");
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("heading", { name: /your cycle/i }).waitFor();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: "4", exact: true }).click();
  await shot("04-onboarding-3");
  await page.getByRole("button", { name: /build my plan/i }).click();
  await page.getByTestId("phase-reveal").waitFor();
  const card = page.getByTestId("pricing-card");
  await card.waitFor();
  const cardText = await card.innerText();
  assert.match(cardText, /PacePrincess AI Pro/);
  assert.match(cardText, /\$12\.99/);
  assert.match(cardText, /\/month/);
  assert.match(cardText, /\$0\.43 a day/);
  await noHScroll("onboarding peak");
  await shot("05-peak-pricing");

  // 4. Free user is locked, enforced by the server.
  const freeApi = await page.evaluate(() => fetch("/api/training").then((r) => r.json()));
  assert.equal(freeApi.plan, "free");
  assert.equal(freeApi.week, undefined, "free users must not receive the week plan");
  const side = await ctx.newPage();
  side.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await side.goto(`${BASE}/train`);
  await side.getByTestId("locked").waitFor();
  await side.screenshot({ path: `${SHOTS}/${vp.name}-05b-train-locked.png`, fullPage: true, animations: "disabled" });
  await side.close();

  // 5. In-page checkout: declined card, then success.
  await page.getByRole("button", { name: /subscribe to pro/i }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name on card").waitFor();
  assert.equal(new URL(page.url()).pathname, "/onboarding", "checkout must stay inside the page");
  await dialog.getByLabel("Name on card").fill("Paula Runner");
  await dialog.getByLabel("Card number").fill("4000000000000002");
  await dialog.getByLabel("Expiry").fill("1234");
  await dialog.getByLabel("CVC").fill("123");
  await shot("06-checkout");
  await dialog.getByRole("button", { name: /pay \$12\.99/i }).click();
  await dialog.getByRole("alert").filter({ hasText: /declined/i }).waitFor();
  await shot("07-checkout-declined");
  await dialog.getByLabel("Card number").fill("4242424242424242");
  await dialog.getByRole("button", { name: /pay \$12\.99/i }).click();
  await page.getByTestId("checkout-success").waitFor();
  await page.waitForTimeout(1300); // let the checkmark animation finish
  await shot("08-checkout-success");

  // 6. Pro unlocked immediately.
  await page.getByRole("link", { name: /see today's run/i }).click();
  await page.getByTestId("train-pro").waitFor();
  await page.getByTestId("today-run").waitFor();
  const days = await page.locator(".week .day").count();
  assert.equal(days, 7);
  await noHScroll("train pro");
  await shot("09-train-pro");

  // 7. Account settings: view, cancel, resume.
  await page.goto(`${BASE}/account`);
  const panel = page.getByTestId("subscription-panel");
  await panel.getByText("Active").waitFor();
  const panelText = await panel.innerText();
  assert.match(panelText, /PacePrincess AI Pro/);
  assert.match(panelText, /\$12\.99\/month/);
  assert.match(panelText, /•••• 4242/);
  await shot("10-account-active");
  await panel.getByRole("button", { name: /cancel subscription/i }).click();
  await panel.getByRole("button", { name: /yes, cancel/i }).click();
  await panel.getByText(/^Cancels /).waitFor();
  await shot("11-account-canceling");
  await panel.getByRole("button", { name: /resume subscription/i }).click();
  await panel.getByText("Active").waitFor();

  // 8. A forged cookie is rejected by the server.
  const forged = await browser.newContext();
  const payload = Buffer.from(JSON.stringify({ userId: "x", subscription: { planId: "pp_pro_monthly", currentPeriodEnd: "2099-01-01" } })).toString("base64url");
  await forged.addCookies([{ name: "pp_session", value: `${payload}.bad`, url: BASE }]);
  const fp = await forged.newPage();
  await fp.goto(`${BASE}/`);
  const forgedApi = await fp.evaluate(() => fetch("/api/session").then((r) => r.json()));
  assert.equal(forgedApi.plan, "free", "forged cookie must not grant Pro");
  await forged.close();

  assert.deepEqual(errors, [], `${vp.name}: console errors`);
  await ctx.close();
  console.log(`✓ ${vp.name}: full subscription path passed, 0 console errors`);
}

let code = 0;
try {
  if (!BASE) await startServer();
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) await run(browser, vp);
  await browser.close();
  console.log(`All e2e checks passed. Screenshots in ${SHOTS}/`);
} catch (e) {
  console.error("✗ e2e failed:", e.message);
  code = 1;
} finally {
  if (server) {
    try {
      process.kill(-server.pid, "SIGTERM"); // whole group: npx + next-server
    } catch {}
  }
  process.exit(code);
}
