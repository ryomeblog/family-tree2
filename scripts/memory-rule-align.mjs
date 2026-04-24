// 思い出ノートの本文が罫線に乗っているか確認する。
// 各段落の最終行のベースラインと、背景罫線のY位置の差を測定してダンプ。
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = "screenshots";
const BASE = "http://127.0.0.1:5173/family-tree2/";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && console.log("[err]", m.text()));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());

// 既存の yamada 家系の m_rose を編集画面で開く。
await page.goto(`${BASE}#/family/yamada/memory/m_rose/edit`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

// TipTap の contenteditable に本文を注入（ある程度長く、複数段落）。
const lines = [
  "祖母の手の温もりを、いまも指先が覚えている。",
  "縁側に腰かけて、柿の木の影が伸びる午後のことだった。",
  "昭和四十年代の暮らしは、質素だけれど豊かだった。",
  "味噌汁の匂い、畳の匂い、雨上がりの土の匂い。",
  "そのひとつひとつが、私の原風景になっている。",
];
await page.evaluate((ls) => {
  const ed = document.querySelector(".ft-prose .tiptap");
  if (!ed) throw new Error("editor not found");
  ed.innerHTML = ls.map((t) => `<p>${t}</p>`).join("");
  ed.dispatchEvent(new InputEvent("input", { bubbles: true }));
}, lines);
await page.waitForTimeout(400);

// 測定：editor のクライアント矩形、padding-top、各段落の rect、罫線ピッチ。
const metrics = await page.evaluate(() => {
  const ed = document.querySelector(".ft-prose .tiptap");
  const edRect = ed.getBoundingClientRect();
  const cs = getComputedStyle(ed);
  const padTop = parseFloat(cs.paddingTop);
  const lineHeight = parseFloat(cs.lineHeight);
  const fontSize = parseFloat(cs.fontSize);
  // 罫線は padding-box top + 10px(offset) + n*30 + 29 の位置。
  const bgMatch = cs.backgroundPosition.match(/\s(-?\d+(?:\.\d+)?)px$/);
  const bgPosY = bgMatch ? parseFloat(bgMatch[1]) : 0;
  const ruleOffset = 29;
  const pitch = 30;
  const ps = Array.from(ed.querySelectorAll("p")).map((p, i) => {
    const r = p.getBoundingClientRect();
    const topInEd = r.top - edRect.top;
    const bottomInEd = r.bottom - edRect.top;
    // 行ボックスの中でのベースライン：fontSize 相当を下端から少し上に仮定。
    // 実測には Range を使ったほうが正確なので別途取る。
    return { i, topInEd, bottomInEd, h: r.height, text: p.textContent.slice(0, 18) };
  });
  // 各段落の最初と最後のテキストノードの rect で baseline を概算。
  const baselines = [];
  for (const p of ed.querySelectorAll("p")) {
    if (!p.firstChild) continue;
    const range = document.createRange();
    range.selectNodeContents(p);
    const rects = Array.from(range.getClientRects());
    rects.forEach((r) => {
      baselines.push({
        top: r.top - edRect.top,
        bottom: r.bottom - edRect.top,
        // 近い罫線Yを計算
      });
    });
  }
  // 最初の rule 位置群
  const rules = [];
  for (let i = 0; i < 15; i++) {
    rules.push(bgPosY + i * pitch + ruleOffset);
  }
  return { padTop, lineHeight, fontSize, bgPosY, ruleOffset, pitch, ps, baselines, rules };
});

console.log("padding-top:", metrics.padTop);
console.log("line-height:", metrics.lineHeight);
console.log("font-size:", metrics.fontSize);
console.log("rules (Y in padding-box):", metrics.rules.slice(0, 8).join(", "));
console.log("\nparagraph rects (top/bottom in editor):");
metrics.ps.forEach((p) =>
  console.log(`  p${p.i}: top=${p.topInEd.toFixed(1)} bottom=${p.bottomInEd.toFixed(1)} h=${p.h.toFixed(1)} — ${p.text}`),
);
console.log("\nline rects (baseline ~= bottom - 4):");
metrics.baselines.slice(0, 8).forEach((b, i) => {
  const baseline = b.bottom - 4;
  const nearestRule =
    Math.round((baseline - metrics.bgPosY - metrics.ruleOffset) / metrics.pitch) * metrics.pitch +
    metrics.bgPosY +
    metrics.ruleOffset;
  const diff = baseline - nearestRule;
  console.log(
    `  line${i}: top=${b.top.toFixed(1)} bot=${b.bottom.toFixed(1)} baseline≈${baseline.toFixed(1)} nearestRule=${nearestRule} diff=${diff.toFixed(1)}`,
  );
});

await page.screenshot({ path: `${OUT}/memory-ruled-paper.png`, fullPage: false });

// クロップしてより拡大したショットも
const edBox = await page.evaluate(() => {
  const ed = document.querySelector(".ft-prose .tiptap");
  const r = ed.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
});
await page.screenshot({
  path: `${OUT}/memory-ruled-closeup.png`,
  clip: { x: edBox.x, y: edBox.y, width: Math.min(edBox.w, 700), height: Math.min(edBox.h, 260) },
});

await browser.close();
console.log("\ndone");
