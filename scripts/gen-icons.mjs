// SVG アイコンを Playwright でラスタライズして PNG を生成する。
// PWA のインストール基準（Chrome on Android）は少なくとも 1 枚の PNG 必須。
import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const ICON_DIR = join(ROOT, "public/icons");

const sourceSvg = await readFile(join(ICON_DIR, "icon-512.svg"), "utf8");

// maskable 用は safe-zone (内側 80%) に収める必要がある。
// 既存の icon-512.svg は円が viewBox 全体に占めているため、maskable 用は
// 背景を朱色で埋めつつ中央に縮小配置する別バリアントを生成する。
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#E8B8B2" />
  <g transform="translate(256 256) rotate(-3) scale(0.72)">
    <circle cx="0" cy="0" r="196" fill="#FFFEF8" stroke="#A52A1E" stroke-width="20" />
    <text x="0" y="12" text-anchor="middle" dominant-baseline="middle"
          font-family="'Kaisei Decol', 'Yu Mincho', serif" font-weight="700" font-size="240" fill="#A52A1E">家</text>
  </g>
</svg>`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

async function rasterize(svg, size, outPath) {
  const html = `<!doctype html><html><head><style>
    html,body{margin:0;padding:0;background:transparent;}
    svg{display:block;width:${size}px;height:${size}px;}
  </style></head><body>${svg}</body></html>`;
  await page.setContent(html, { waitUntil: "load" });
  await page.setViewportSize({ width: size, height: size });
  await page.evaluate(() => document.fonts.ready);
  const el = await page.$("svg");
  await el.screenshot({ path: outPath, omitBackground: true });
  console.log("wrote", outPath);
}

await rasterize(sourceSvg, 192, join(ICON_DIR, "icon-192.png"));
await rasterize(sourceSvg, 512, join(ICON_DIR, "icon-512.png"));
await rasterize(maskableSvg, 512, join(ICON_DIR, "maskable-512.png"));
// Apple touch icon（180x180 が定番）
await rasterize(sourceSvg, 180, join(ICON_DIR, "apple-touch-icon.png"));

await browser.close();
console.log("done");
