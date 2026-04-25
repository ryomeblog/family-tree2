// 家系図ヘッダの 4 ボタンが各スマホ幅でどう並ぶか確認。
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = "http://127.0.0.1:5173/family-tree2/";
await mkdir("screenshots", { recursive: true });

const browser = await chromium.launch();

for (const dname of ["iPhone SE (3rd gen)", "Pixel 5", "Galaxy S9+"]) {
  const ctx = await browser.newContext({
    ...devices[dname],
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}#/family/yamada/tree`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);

  const info = await page.evaluate(() => {
    const titles = ["思い出ノート", "画像を保存", "保存", "人物を追加"];
    const found = titles.map((t) => {
      const el = document.querySelector(`[title="${t}"]`);
      if (!el) return { title: t, found: false };
      const r = el.getBoundingClientRect();
      return {
        title: t,
        found: true,
        x: Math.round(r.x),
        right: Math.round(r.right),
        w: Math.round(r.width),
        // viewport より右に飛び出していたら scroll が必要
        offscreen: r.right > window.innerWidth + 1,
      };
    });
    return { vw: window.innerWidth, buttons: found };
  });
  console.log(`\n=== ${dname} (vw=${info.vw}) ===`);
  for (const b of info.buttons) {
    console.log(
      `  ${b.title.padEnd(8)} ${b.found ? `x=${b.x} right=${b.right} w=${b.w}${b.offscreen ? " ⚠OFFSCREEN" : ""}` : "NOT FOUND"}`,
    );
  }
  await page.screenshot({
    path: `screenshots/tree-header-${dname.replace(/\W+/g, "_")}.png`,
    clip: { x: 0, y: 0, width: info.vw, height: 80 },
  });
  await ctx.close();
}

await browser.close();
console.log("\ndone");
