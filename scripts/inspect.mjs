import { chromium } from "playwright";

const BASE = "http://127.0.0.1:5173/family-tree2/";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());

// ── Yamada baseline
await page.goto(`${BASE}#/family/yamada/tree`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const yamadaLines = await inspectSvg(page);
console.log("\n── YAMADA:");
console.log(JSON.stringify(yamadaLines, null, 2));

// ── Create Ishii
await page.goto(`${BASE}#/new`, { waitUntil: "networkidle" });
await page.waitForTimeout(300);
const inputs = page.locator("input[type=text], input:not([type])");
await inputs.nth(0).fill("石井家");
await inputs.nth(1).fill("石井");
await inputs.nth(2).fill("一郎");
await inputs.nth(3).fill("私");
await inputs.nth(4).fill("1990年");
await inputs.nth(5).fill("");
await page.getByRole("button", { name: /家系を作成/ }).click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(400);
const fid = page.url().match(/#\/family\/([^/]+)\//)[1];
const rootPid = await page.evaluate((f) => {
  for (const k of ["ft2.state.v1.a", "ft2.state.v1.b"]) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      return JSON.parse(JSON.parse(raw).payload).state.families[f].rootPersonId;
    } catch {}
  }
}, fid);

// Add parents to root via relate modal
await page.goto(`${BASE}#/family/${fid}/relate?pid=${rootPid}`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(300);
await page.locator('button:has-text("父母 2 人をまとめて登録")').click();
await page.waitForTimeout(200);
const inp = page.locator("input:not([type=radio]):not([type=checkbox]):not([type=button])");
await inp.nth(0).fill("石井");
await inp.nth(1).fill("太郎");
await inp.nth(2).fill("石井");
await inp.nth(3).fill("花子");
await page.getByRole("button", { name: /親を登録/ }).click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(500);
const ishiiLines = await inspectSvg(page);
console.log("\n── ISHII (after parents):");
console.log(JSON.stringify(ishiiLines, null, 2));

// Add grandparents on top of 石井 太郎 as another depth
const p1 = await page.evaluate((f) => {
  for (const k of ["ft2.state.v1.a", "ft2.state.v1.b"]) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const fam = JSON.parse(JSON.parse(raw).payload).state.families[f];
      return Object.values(fam.people).find(
        (p) => p.given === "太郎",
      )?.id;
    } catch {}
  }
}, fid);
console.log("parent1 pid=", p1);

await page.goto(`${BASE}#/family/${fid}/relate?pid=${p1}`, {
  waitUntil: "networkidle",
});
await page.waitForTimeout(300);
await page.locator('button:has-text("父母 2 人をまとめて登録")').click();
await page.waitForTimeout(200);
const inp2 = page.locator("input:not([type=radio]):not([type=checkbox]):not([type=button])");
await inp2.nth(0).fill("石井");
await inp2.nth(1).fill("祖父");
await inp2.nth(2).fill("石井");
await inp2.nth(3).fill("祖母");
await page.getByRole("button", { name: /親を登録/ }).click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(500);
await page.screenshot({ path: "screenshots/06-ishii-3gen.png" });
const ishii3 = await inspectSvg(page);
console.log("\n── ISHII (3 gens):");
console.log(JSON.stringify(ishii3, null, 2));

await browser.close();

async function inspectSvg(page) {
  return await page.evaluate(() => {
    // Find nodes (divs with border, the person cards)
    const canvasRoots = Array.from(document.querySelectorAll("div")).filter(
      (d) =>
        d.style &&
        d.style.transform &&
        d.style.transform.includes("translate"),
    );
    const boxes = [];
    // Actually gather all buttons that are the person cards
    document.querySelectorAll("button").forEach((b) => {
      const s = b.getAttribute("style") ?? "";
      if (s.includes("position: absolute") && s.includes("144") /*NODE_W*/) {
        const rect = b.getBoundingClientRect();
        boxes.push({
          text: b.innerText.replace(/\n/g, " ").slice(0, 40),
          left: Math.round(rect.left),
          top: Math.round(rect.top),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      }
    });
    const svgs = Array.from(document.querySelectorAll("svg"));
    const lines = [];
    svgs.forEach((svg) => {
      svg.querySelectorAll("line").forEach((ln) => {
        const b = ln.getBoundingClientRect();
        // Only lines within the canvas area
        if (b.width + b.height < 2) return;
        lines.push({
          x1: Math.round(+ln.getAttribute("x1")),
          y1: Math.round(+ln.getAttribute("y1")),
          x2: Math.round(+ln.getAttribute("x2")),
          y2: Math.round(+ln.getAttribute("y2")),
        });
      });
    });
    return { boxes, lineCount: lines.length, sampleLines: lines.slice(0, 40) };
  });
}
