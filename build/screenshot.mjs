/**
 * Screenshot every page at desktop and mobile so the build can be eyeballed.
 * Uses the installed Chrome via playwright-core so no browser download is needed.
 */

import { chromium } from "playwright-core";
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { start } from "./serve.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "build", "shots");
const PORT = 4178;
const BASE = `http://127.0.0.1:${PORT}`;

const VIEWPORTS = [
  { tag: "desktop", width: 1440, height: 1000 },
  { tag: "mobile", width: 390, height: 844 },
];

const only = process.argv.slice(2);

async function main() {
  await mkdir(OUT, { recursive: true });
  const server = await start(PORT);

  const browser = await chromium.launch({ channel: "chrome" });
  const pages = (await readdir(ROOT)).filter((f) => f.endsWith(".html")).sort();

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();

    for (const file of pages) {
      const name = file.replace(/\.html$/, "");
      if (only.length && !only.includes(name)) continue;

      await page.goto(`${BASE}/${file}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      // A full-page capture stitches without scrolling, so lazy images below
      // the fold never fetch. Force them eager, walk the page to decode, then
      // return. The wait is bounded so an image that never resolves cannot hang
      // the whole run.
      await page.evaluate(async () => {
        document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = "eager"; });

        const step = window.innerHeight * 0.8;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 70));
        }
        window.scrollTo(0, 0);

        const pending = Array.from(document.images).filter((i) => !i.complete);
        await Promise.race([
          Promise.all(
            pending.map(
              (i) =>
                new Promise((r) => {
                  i.addEventListener("load", r, { once: true });
                  i.addEventListener("error", r, { once: true });
                })
            )
          ),
          new Promise((r) => setTimeout(r, 4000)),
        ]);
      });
      await page.waitForTimeout(400);

      const out = join(OUT, `${name}-${vp.tag}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.log(`  ${name}-${vp.tag}.png`);
    }
    await ctx.close();
  }

  await browser.close();
  server.closeAllConnections?.();
  server.close();
  console.log("\nshots -> build/shots");
  // Keep-alive sockets from the browser keep the event loop alive otherwise.
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
