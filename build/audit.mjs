/**
 * Runtime audit: axe-core over every page, plus a console/network error watch
 * and a pass/fail over interactive behaviours (cart, filters, search, forms).
 *
 * Exits non-zero on any serious or critical violation so the build fails loudly.
 */

import { chromium } from "playwright-core";
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { start } from "./serve.mjs";

const require = createRequire(import.meta.url);
const AXE = require.resolve("axe-core/axe.min.js");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4179;
const BASE = `http://127.0.0.1:${PORT}`;

const findings = [];
const record = (page, kind, detail) => findings.push({ page, kind, detail });

async function auditPage(ctx, file) {
  const page = await ctx.newPage();
  const errors = [];

  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("requestfailed", (r) => errors.push(`request failed: ${r.url()}`));
  // The console message for a failed subresource omits the URL, so capture the
  // response itself -- otherwise a 404 shows up with nothing to act on.
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
  });

  await page.goto(`${BASE}/${file}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  await page.addScriptTag({ path: AXE });
  const result = await page.evaluate(async () =>
    // eslint-disable-next-line no-undef
    await axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
    })
  );

  for (const v of result.violations) {
    // best-practice tags include advisory rules that are not WCAG failures.
    const blocking = v.impact === "serious" || v.impact === "critical";
    record(file, blocking ? "A11Y-BLOCK" : "A11Y-minor", `${v.id} (${v.impact}): ${v.help} [${v.nodes.length} node(s)] ${v.nodes[0]?.target ?? ""}`);
  }

  for (const e of errors) record(file, "RUNTIME", e);

  /* --- behaviour ------------------------------------------------------- */
  if (file === "index.html" || file === "pasta.html") {
    // Shape filtering
    const before = await page.locator(".pcard:not(.is-hidden)").count();
    await page.locator('[data-tab="fusilli"]').click();
    const after = await page.locator(".pcard:not(.is-hidden)").count();
    if (!(before === 5 && after === 1)) record(file, "BEHAVIOUR", `filter tab: expected 5 -> 1, got ${before} -> ${after}`);
    await page.locator('[data-tab="all"]').click();

    // Every card's Add to Cart must sit on the same baseline, or the row reads
    // as broken even though nothing overflows.
    const buttonTops = await page.$$eval(".pcard", (cards) =>
      cards.map((c) => {
        const b = c.querySelector("[data-add-to-cart]");
        return b ? Math.round(b.getBoundingClientRect().bottom) : null;
      })
    );
    const spread = Math.max(...buttonTops) - Math.min(...buttonTops);
    if (spread > 1) record(file, "LAYOUT", `Add to Cart buttons misaligned by ${spread}px: ${buttonTops.join(", ")}`);

    // Size picker + add to cart
    await page.locator(".pcard").first().locator('.size[data-size="500"]').click();
    const pressed = await page.locator('.pcard').first().locator('.size[data-size="500"]').getAttribute("aria-pressed");
    if (pressed !== "true") record(file, "BEHAVIOUR", "size picker did not set aria-pressed");
    await page.locator(".pcard").first().locator("[data-add-to-cart]").click();
    await page.waitForTimeout(400);
    const count = await page.locator("[data-cart-count]").first().getAttribute("data-count");
    const total = (await page.locator("[data-cart-total]").textContent()).trim();
    if (count !== "1") record(file, "BEHAVIOUR", `cart count after add: expected 1, got ${count}`);
    if (total !== "₹125") record(file, "BEHAVIOUR", `cart total for Desi Penne 500 g: expected ₹125, got ${total}`);

    // Quantity stepper
    await page.locator("[data-inc]").first().click();
    await page.waitForTimeout(250);
    const count2 = await page.locator("[data-cart-count]").first().getAttribute("data-count");
    if (count2 !== "2") record(file, "BEHAVIOUR", `cart count after increment: expected 2, got ${count2}`);
    await page.locator("[data-remove]").first().click();
    await page.waitForTimeout(250);
    const count3 = await page.locator("[data-cart-count]").first().getAttribute("data-count");
    if (count3 !== "0") record(file, "BEHAVIOUR", `cart count after remove: expected 0, got ${count3}`);

    // The drawer stays open after an edit by design; close it before the next phase.
    await page.locator("[data-close-cart]").click();
    await page.waitForTimeout(350);
    const closed = await page.locator("#cart-drawer").evaluate((el) => !el.classList.contains("is-open"));
    if (!closed) record(file, "BEHAVIOUR", "cart drawer did not close");
  }

  if (file === "index.html") {
    // Search drawer
    await page.locator("[data-open-search]").first().click();
    await page.waitForTimeout(300);
    await page.locator("[data-search-input]").fill("tadka");
    await page.waitForTimeout(250);
    const hits = await page.locator(".search__hit").count();
    if (hits < 1) record(file, "BEHAVIOUR", "search for 'tadka' returned no results");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Mobile nav
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-open-menu]").click();
    await page.waitForTimeout(300);
    const navOpen = await page.locator("#mobile-nav").evaluate((el) => el.classList.contains("is-open"));
    if (!navOpen) record(file, "BEHAVIOUR", "mobile nav did not open");
    await page.keyboard.press("Escape");
  }

  if (file === "retailers.html" || file === "contact.html") {
    // Required-field validation must block an empty submit.
    await page.locator("[data-enquiry] button[type=submit]").click();
    await page.waitForTimeout(200);
    const invalid = await page.locator("[data-enquiry]").evaluate((el) => !el.checkValidity());
    const shown = await page.locator("[data-form-status]").isVisible();
    if (!invalid) record(file, "BEHAVIOUR", "form submitted despite invalid required fields");
    if (shown) record(file, "BEHAVIOUR", "success message shown for an invalid submission");
  }

  await page.close();
}

async function main() {
  const server = await start(PORT);
  const browser = await chromium.launch({ channel: "chrome" });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const files = (await readdir(ROOT)).filter((f) => f.endsWith(".html")).sort();

  for (const f of files) {
    process.stdout.write(`  auditing ${f} ... `);
    const before = findings.length;
    await auditPage(ctx, f);
    console.log(findings.length === before ? "ok" : `${findings.length - before} finding(s)`);
  }

  await browser.close();
  server.closeAllConnections?.();
  server.close();

  const blocking = findings.filter((f) => f.kind !== "A11Y-minor");
  const minor = findings.filter((f) => f.kind === "A11Y-minor");

  console.log(`\n${files.length} pages audited`);
  if (minor.length) {
    console.log(`\n${minor.length} advisory:`);
    for (const f of minor) console.log(`  ~ ${f.page}: ${f.detail}`);
  }
  if (blocking.length) {
    console.log(`\n${blocking.length} blocking:`);
    for (const f of blocking) console.log(`  ✗ [${f.kind}] ${f.page}: ${f.detail}`);
    process.exit(1);
  }
  console.log("\n✓ no serious or critical findings");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
