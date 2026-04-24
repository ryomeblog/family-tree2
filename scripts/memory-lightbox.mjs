// 写真の記録→ライトボックスモーダルの動作確認
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const OUT = "screenshots";
const BASE = "http://127.0.0.1:5173/family-tree2/";
await mkdir(OUT, { recursive: true });

// 小さな PNG を 3 枚
const tmpDir = "/tmp/ft2-lb";
await mkdir(tmpDir, { recursive: true });
const makePng = (r, g, b) => {
  const crc32Table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc32Table[n] = c >>> 0;
  }
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crc32Table[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const u32 = (v) => Uint8Array.of((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255);
  const chunk = (type, data) => {
    const t = new TextEncoder().encode(type);
    const td = new Uint8Array(t.length + data.length);
    td.set(t); td.set(data, t.length);
    const crc = crc32(td);
    const out = new Uint8Array(4 + t.length + data.length + 4);
    out.set(u32(data.length)); out.set(td, 4); out.set(u32(crc), 4 + td.length);
    return out;
  };
  const w = 80, h = 60;
  const ihdr = new Uint8Array(13);
  ihdr.set(u32(w)); ihdr.set(u32(h), 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const row = new Uint8Array(1 + w * 3);
  for (let x = 0; x < w; x++) {
    row[1 + x * 3] = r; row[2 + x * 3] = g; row[3 + x * 3] = b;
  }
  const raw = new Uint8Array(row.length * h);
  for (let y = 0; y < h; y++) raw.set(row, y * row.length);
  const deflate = (input) => {
    const out = [0x78, 0x01];
    let pos = 0;
    while (pos < input.length) {
      const len = Math.min(65535, input.length - pos);
      const last = pos + len >= input.length ? 1 : 0;
      out.push(last, len & 255, (len >>> 8) & 255, ~len & 255, (~len >>> 8) & 255);
      for (let i = 0; i < len; i++) out.push(input[pos + i]);
      pos += len;
    }
    let a = 1, bb = 0;
    for (const byte of input) { a = (a + byte) % 65521; bb = (bb + a) % 65521; }
    out.push((bb >>> 8) & 255, bb & 255, (a >>> 8) & 255, a & 255);
    return new Uint8Array(out);
  };
  const idat = chunk("IDAT", deflate(raw));
  const iend = chunk("IEND", new Uint8Array(0));
  const ihdrChunk = chunk("IHDR", ihdr);
  const sig = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);
  const out = new Uint8Array(sig.length + ihdrChunk.length + idat.length + iend.length);
  out.set(sig);
  out.set(ihdrChunk, sig.length);
  out.set(idat, sig.length + ihdrChunk.length);
  out.set(iend, sig.length + ihdrChunk.length + idat.length);
  return out;
};
await writeFile(`${tmpDir}/a.png`, makePng(220, 40, 40));
await writeFile(`${tmpDir}/b.png`, makePng(40, 80, 220));
await writeFile(`${tmpDir}/c.png`, makePng(40, 180, 80));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && console.log("[err]", m.text()));
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());

// 3 枚アップして m_rose を保存
await page.goto(`${BASE}#/family/yamada/memory/m_rose/edit`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
page.on("filechooser", async (chooser) => {
  await chooser.setFiles([`${tmpDir}/a.png`, `${tmpDir}/b.png`, `${tmpDir}/c.png`]);
});
await page.getByRole("button", { name: /追加/ }).first().click();
await page.waitForTimeout(1000);
await page.locator("button").filter({ hasText: /^\s*✓\s*保存\s*$/ }).click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(800);

// 詳細画面：写真の記録エリアまでスクロール
console.log("detail url:", page.url());
await page.evaluate(() => {
  const s = [...document.querySelectorAll("div")].find((d) => {
    const cs = getComputedStyle(d);
    return cs.overflowY === "auto" && d.scrollHeight > d.clientHeight;
  });
  s?.scrollTo({ top: 9999 });
});
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/lb-detail-bottom.png`, fullPage: false });

// 「写真の記録」グリッドの 2 枚目（blue）をクリック
const gridLinks = page.locator('a[title*="写真"]');
console.log("grid link count:", await gridLinks.count());
await gridLinks.nth(1).click();
await page.waitForTimeout(600);
console.log("url after 2nd click:", page.url());
await page.screenshot({ path: `${OUT}/lb-open-2.png`, fullPage: false });

// → キーで次
await page.keyboard.press("ArrowRight");
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/lb-next.png`, fullPage: false });

// ← キーで前へ 2 回（もとの 2 枚目→1枚目）
await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(200);
await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/lb-prev.png`, fullPage: false });

// Escape で閉じる（nav(-1) で戻る）
await page.keyboard.press("Escape");
await page.waitForTimeout(500);
console.log("url after Escape:", page.url());

await browser.close();
console.log("done");
