// 代表写真選択の動作確認
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const OUT = "screenshots";
const BASE = "http://127.0.0.1:5173/family-tree2/";
await mkdir(OUT, { recursive: true });

// 3枚のダミー JPEG を一時ファイルとして作成
const tmpDir = "/tmp/ft2-test-imgs";
await mkdir(tmpDir, { recursive: true });

// 最小 JPEG はキャンバス生成に頼れないので、node で作る方がハマる。
// 代わりに 1x1 ~ 数x数 ピクセルの純色 PNG（最小 base64 コード） でも良いが、
// このアプリは JPEG エンコード前提。なので実画像を同梱したほうが楽。
// 純色 PNG を 3 色作って file として渡す。ingest は blobToBitmap で PNG も読める。
const makePng = (w, h, r, g, b) => {
  // chunk-based PNG builder
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
  // IHDR
  const ihdr = new Uint8Array(13);
  ihdr.set(u32(w)); ihdr.set(u32(h), 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  // IDAT: raw filter=0 per scanline, RGB bytes
  const row = new Uint8Array(1 + w * 3);
  for (let x = 0; x < w; x++) {
    row[1 + x * 3] = r; row[2 + x * 3] = g; row[3 + x * 3] = b;
  }
  const raw = new Uint8Array(row.length * h);
  for (let y = 0; y < h; y++) raw.set(row, y * row.length);
  // zlib store (uncompressed)
  const deflate = (input) => {
    const out = [];
    out.push(0x78, 0x01); // header
    let pos = 0;
    while (pos < input.length) {
      const len = Math.min(65535, input.length - pos);
      const last = pos + len >= input.length ? 1 : 0;
      out.push(last, len & 255, (len >>> 8) & 255, ~len & 255, (~len >>> 8) & 255);
      for (let i = 0; i < len; i++) out.push(input[pos + i]);
      pos += len;
    }
    // adler32
    let a = 1, b = 0;
    for (const byte of input) {
      a = (a + byte) % 65521;
      b = (b + a) % 65521;
    }
    out.push((b >>> 8) & 255, b & 255, (a >>> 8) & 255, a & 255);
    return new Uint8Array(out);
  };
  const idat = chunk("IDAT", deflate(raw));
  const iend = chunk("IEND", new Uint8Array(0));
  const ihdrChunk = chunk("IHDR", ihdr);
  const sig = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);
  const out = new Uint8Array(sig.length + ihdrChunk.length + idat.length + iend.length);
  out.set(sig); out.set(ihdrChunk, sig.length);
  out.set(idat, sig.length + ihdrChunk.length);
  out.set(iend, sig.length + ihdrChunk.length + idat.length);
  return out;
};

const red = makePng(120, 80, 220, 40, 40);
const blue = makePng(120, 80, 40, 80, 220);
const green = makePng(120, 80, 40, 180, 80);
await writeFile(`${tmpDir}/a-red.png`, red);
await writeFile(`${tmpDir}/b-blue.png`, blue);
await writeFile(`${tmpDir}/c-green.png`, green);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && console.log("[err]", m.text()));
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());

// まず一度リロードしてシードが persist されるのを待つ
await page.goto(`${BASE}#/family/yamada/memory/m_rose/edit`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);

// filechooser で 3枚追加
page.on("filechooser", async (chooser) => {
  await chooser.setFiles([
    `${tmpDir}/a-red.png`,
    `${tmpDir}/b-blue.png`,
    `${tmpDir}/c-green.png`,
  ]);
});
await page.getByRole("button", { name: /追加/ }).first().click();
await page.waitForTimeout(1200);

await page.screenshot({ path: `${OUT}/hero-editor-default.png`, fullPage: false });

const divBtns = await page.evaluate(() =>
  Array.from(document.querySelectorAll('div[role="button"]')).map((d) => ({
    title: d.getAttribute("title"),
    rect: (() => {
      const r = d.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) };
    })(),
  })),
);
console.log("thumbs:", divBtns);

// 2枚目をクリックで代表写真切り替え
if (divBtns.length >= 2) {
  const thumbs = page.locator('div[role="button"]');
  await thumbs.nth(1).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/hero-editor-switched.png`, fullPage: false });
}

// 保存ボタン
const btns = await page.evaluate(() =>
  Array.from(document.querySelectorAll("button")).map((b) => b.textContent.trim()),
);
console.log("buttons:", btns);

// SketchBtn(icon="✓", text="保存") → accessible name may be " 保存" with space.
await page.locator("button").filter({ hasText: /^\s*✓\s*保存\s*$/ }).click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(800);

// 詳細ページ
await page.screenshot({ path: `${OUT}/hero-detail.png`, fullPage: false });

const detail = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll("img"));
  return imgs.map((i) => ({
    w: i.width,
    h: i.height,
    src: i.currentSrc.slice(0, 20),
  }));
});
console.log("detail imgs:", detail);

await browser.close();
console.log("done");
