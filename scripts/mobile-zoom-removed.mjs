// ズームコントロール非表示とピンチズーム存在を複数デバイスで検証。
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
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}#/family/yamada/tree`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const state = await page.evaluate(() => {
    const zoomLabels = [...document.querySelectorAll("button")]
      .map((b) => b.textContent?.trim())
      .filter((t) => t === "＋" || t === "−" || t === "100%");
    const mini = [...document.querySelectorAll("div")].some((d) =>
      d.textContent?.trim().startsWith("全体図"),
    );
    return {
      vw: window.innerWidth,
      vh: window.innerHeight,
      zoomButtons: zoomLabels,
      miniMap: mini ? "present" : "absent",
    };
  });
  console.log(`${dname}: vw=${state.vw} vh=${state.vh}`);
  console.log(`  zoom buttons=${JSON.stringify(state.zoomButtons)} (expected: [])`);
  console.log(`  minimap: ${state.miniMap} (expected: absent)`);

  // 検索シートを開いて、下端のスペースにタップできるか確認
  await page.locator('button[title="検索"]').first().click();
  await page.waitForTimeout(400);
  const sheetGeo = await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="検索"]');
    const sheet = input?.closest('div[style*="position:"]');
    const r = sheet?.getBoundingClientRect();
    return r ? { top: r.top, bottom: r.bottom, height: r.height } : null;
  });
  console.log(`  search sheet: ${JSON.stringify(sheetGeo)}`);

  await page.screenshot({ path: `screenshots/zoom-removed-${dname.replace(/\W+/g, "_")}.png` });
  await ctx.close();
}

await browser.close();
console.log("done");
