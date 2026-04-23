# ファミリーツリー２

「絵本のように」家族の歴史を残せる、**端末内完結型**の家系図 PWA。
日本語専用・シニア世代向け・オフライン動作・サインアップ不要。

- **リポジトリ**: `family-tree2`
- **配信**: GitHub Pages（`https://<user>.github.io/family-tree2/`）
- **ルーティング**: HashRouter（静的ホスティング対応）
- **言語**: 日本語のみ（UI・ドキュメント）

---

## 主な機能

- 家系の作成・切替・書き出し（`.ftree2`）・取り込み — **複数家系対応**
- 人物の追加・編集・削除、肖像写真のアップロード（Canvas で 1600px にリサイズ＋ 320px サムネ）
- 関係の追加（**配偶者 ／ 元配偶者 ／ 親2人 ／ 子複数 ／ 兄弟姉妹 ／ 養子**）
- 思い出ノート（TipTap リッチテキスト本文、写真最大 10 枚、**閲覧者フィルタ**）
- FuzzyDate（西暦・和暦・年のみ・不明）対応の生没年
- 家系図：世代別自動レイアウト、パン／ズーム、人物ノードクリックで詳細遷移
- 家系図 PNG 書き出し（UI 要素なし・ノード全体を自然サイズで出力）
- 利用規約・プライバシーポリシー（JSON 駆動、バージョン管理）
- PWA：`manifest.webmanifest`、Service Worker、`beforeinstallprompt` 対応、永続化要求

---

## クイックスタート

```bash
# Node 24
nvm use 24 || nvm install 24
npm install
npm run dev        # http://localhost:5173/family-tree2/
npm run build
npm run preview
npm run typecheck  # tsc --noEmit
npm run lint
npm run format
```

本番 URL と同じベースパス `/family-tree2/` で dev も起動します（`vite.config.ts` で `base` 指定）。

### デプロイ

`.github/workflows/deploy.yml` が `main` への push で GitHub Pages に自動デプロイします。リポジトリ Settings → Pages で Source を `GitHub Actions` に設定してください。

---

## アプリのルート

| ルート | 画面 |
|---|---|
| `/#/` | ランディング |
| `/#/home` | ダッシュボード（家系一覧） |
| `/#/new` | 新規家系作成 |
| `/#/open` | `.ftree2` ファイルを開く |
| `/#/import` | 取り込み（プレビュー → 確定） |
| `/#/settings` | 設定 |
| `/#/terms` | 利用規約（JSON 駆動） |
| `/#/privacy` | プライバシーポリシー |
| `/#/family/:fid/tree` | 家系図エディタ |
| `/#/family/:fid/memories` | 思い出一覧 |
| `/#/family/:fid/memory/new` | 思い出を書く |
| `/#/family/:fid/memory/:mid` | 思い出を読む |
| `/#/family/:fid/memory/:mid/edit` | 思い出編集 |
| `/#/family/:fid/person/new` | 人物を追加 |
| `/#/family/:fid/person/:pid` | 人物詳細 |
| `/#/family/:fid/person/:pid/edit` | 人物編集 |
| `/#/family/:fid/relate` | 関係を追加 |
| `/#/family/:fid/delete` | 家系削除 |
| `/#/family/:fid/photo/:pid` | 写真ライトボックス |

---

## 技術スタック

| 層 | 採用技術 |
|---|---|
| 言語 | TypeScript 5.5 |
| フレームワーク | React 18 |
| ビルド | Vite 5 |
| ルーティング | React Router v6（HashRouter） |
| 状態管理 | Zustand 4（`persist` ミドルウェア + 独自 A/B slot storage） |
| スタイル | Tailwind 3 + CSS 変数（`src/styles/tokens.css`） |
| フォント | Kaisei Decol（明朝） / Klee One（手書き）— Google Fonts |
| 家系レイアウト | **独自世代ベースエンジン**（`src/pages/TreeEditorPage.tsx` 内 `layoutFamily()`） |
| リッチテキスト | TipTap（StarterKit + Placeholder + Link） |
| ストレージ（構造） | localStorage、2 スロット A/B 交互書き込み（`src/storage/localStoreAB.ts`） |
| ストレージ（画像） | IndexedDB `idb` ラッパ（`src/storage/idb.ts`） |
| ファイル I/O | JSZip（`.ftree2` ZIP 生成・展開） |
| 画像書き出し | `html-to-image` |
| PWA | `vite-plugin-pwa`（GenerateSW） |
| Lint/Format | ESLint v9 (flat config) + Prettier（ダブルクォート） |
| Node | 24.x |

---

## ディレクトリ構成

```
src/
├── App.tsx                ルータ + グローバルトースト + PWA 起動処理
├── main.tsx               エントリ (`import "./index.css"`)
├── index.css              Tailwind + トークン import + スクロール所有権
├── components/
│   ├── ui.tsx             プリミティブ (BarePage, Frame, Hanko, SketchBtn, Field, ...)
│   └── YearPicker.tsx     スクロール追加読込の年セレクタ
├── pages/
│   ├── LandingPage.tsx          (/)
│   ├── DashboardPage.tsx        (/home)  カードにケバブメニュー
│   ├── TreeEditorPage.tsx       (/family/:fid/tree) ★中核
│   ├── PersonDetailPage.tsx
│   ├── MemoriesListPage.tsx
│   ├── MemoryDetailPage.tsx
│   ├── MemoryEditorPage.tsx
│   ├── OpenFamilyPage.tsx
│   ├── ImportPage.tsx
│   ├── SettingsPage.tsx
│   ├── NotFoundPage.tsx
│   ├── LegalPage.tsx            共通ビューア
│   ├── TermsPage.tsx            /terms
│   └── PrivacyPage.tsx          /privacy
├── modals/
│   ├── NewFamilyModal.tsx
│   ├── AddPersonModal.tsx
│   ├── EditPersonModal.tsx
│   ├── PersonForm.tsx           add/edit 共通
│   ├── RelationAddModal.tsx     ★親2人 ／ 子複数 対応
│   ├── DeleteConfirmModal.tsx   person / memory / family(名前入力必須) / all
│   ├── ImportErrorModal.tsx
│   ├── FamilyMenuDropdown.tsx   ヘッダからインプレース展開
│   ├── PhotoLightbox.tsx
│   └── SearchPopover.tsx        人物・思い出横断検索
├── features/
│   ├── importExport/
│   │   ├── writeFtree2.ts       JSZip でパッケージング
│   │   └── readFtree2.ts        preview + commit、ImportError クラス
│   ├── memory/
│   │   └── RichEditor.tsx       TipTap
│   └── photos/
│       ├── resize.ts            1600px / 320px サムネ
│       ├── ingest.ts            <input type=file> ＋ IDB 保存
│       └── PhotoFromIdb.tsx     PhotoId → Blob URL
├── domain/
│   ├── types.ts                 Person / Union / ParentChildLink / Memory / Family
│   ├── fuzzyDate.ts             元号⇄西暦、比較、フォーマッタ
│   └── selectors.ts             canViewMemory / parentsOf / spousesOf / childrenOf / siblingsOf / memoriesOfPerson
├── stores/
│   └── familyStore.ts           Zustand（現在は 1 ストア）＋ persist → localStoreAB
├── storage/
│   ├── localStoreAB.ts          .a / .b 2 スロット + seq 書き込み
│   └── idb.ts                   写真 Blob ストア、URL キャッシュ
├── pwa/
│   ├── registerSW.ts            virtual:pwa-register
│   ├── persist.ts               storage.persist / estimate
│   ├── install.ts               beforeinstallprompt 捕捉
│   └── reminder.ts              月 1 書き出しリマインド
├── styles/
│   └── tokens.css               CSS 変数
├── data/
│   └── legal/
│       ├── terms.json           version / effectiveDate / lastUpdatedAt / sections
│       ├── privacy.json         同上
│       └── types.ts
└── types/
    └── pwa.d.ts                 virtual:pwa-register 型

doc/
├── DESIGN.md                   仕様・設計書（正本）
├── IMPLEMENTATION_PLAN.md      実装計画書＋進捗＋残タスク
└── Wireframes.html             初期ワイヤー（現在未使用・参考）

public/
└── icons/                      icon-192.svg / icon-512.svg / maskable-512.svg

scripts/                        Playwright ベースの目視検証スクリプト
  snap.mjs / inspect.mjs / dual-ancestor.mjs / yearpicker.mjs / export-test.mjs / scroll-audit.mjs
```

---

## データモデル（要点）

完全な型は `src/domain/types.ts` 参照。

```ts
interface Family {
  id: string;
  name: string;
  theme: "picture-book" | "scroll" | "modern";
  themeColor: string;
  rootPersonId: PersonId;
  people: Record<PersonId, Person>;
  unions: Union[];             // {id, partnerA, partnerB}
  links: ParentChildLink[];    // {parentUnion? | parentId?, childId}
  memories: Record<MemoryId, Memory>;
  generations: number;
  lastUpdated: string;
}

interface Memory {
  id: MemoryId;
  title: string;
  body: string;                // TipTap HTML (rich text) — プレーンテキスト保存時はそのまま
  periodLabel: string;
  authorId: PersonId;          // 書き手・常に閲覧可
  protagonistId?: PersonId;    // 主人公
  viewers: PersonId[];         // 閲覧者
  related: PersonId[];
  tags: string[];
  photos: number;
  photoIds?: PhotoId[];        // IndexedDB の写真キー
  year: string;
  era?: string;
}
```

### 線描画ルール（家系図）

- **子は夫婦（Union）の中点から**接続線を下ろす
- 親が 2 union（A 側祖父母・B 側祖父母）の場合は **両 union それぞれから** 該当する子へ線を出す
- レイアウトは `TreeEditorPage.tsx` の `layoutFamily()`：各世代を計算 → 同世代内で理想位置＋衝突回避で左右配置 → 子ユニットは両親 union 中点間に幅を取って配置

### 閲覧制御

`src/domain/selectors.ts` の `canViewMemory(m, viewerPersonId)`:
- `viewerPersonId === m.authorId` → 可
- `m.viewers.includes(viewerPersonId)` → 可
- それ以外 → 不可（一覧・詳細ともフィルタ）

### 永続化

| 種別 | 保存先 | キー / ストア |
|---|---|---|
| アプリ状態（家系・設定） | localStorage | `ft2.state.v1.a` / `ft2.state.v1.b`（交互書込・`seq` で最新採用） |
| 写真 Blob | IndexedDB | DB:`ft2` ・ store:`photos` ・ key:`PhotoId` / `PhotoId.thumb` |

Zustand の `persist` ミドルウェアから `localStoreAB` にブリッジ（`src/stores/familyStore.ts`）。

### `.ftree2` フォーマット

```
/manifest.json                 { version:"1", exportedAt, family:{id,name} }
/family.json                   Family 構造
/photos/<PhotoId>.jpg
/photos/<PhotoId>.thumb.jpg
```

`version: "1"` のみ対応。不一致は `ImportErrorModal` に遷移。

---

## 開発時のビジュアル検証

私自身の描画確認手段がないため、Playwright で実ページをスクショし、吐き出された PNG を目視で確認する方式を採っています。

```bash
npm install --no-save --legacy-peer-deps playwright
npx playwright install chromium
npx vite --port 5173 --host 127.0.0.1 &    # 別プロセスで dev
node scripts/inspect.mjs                   # 例：家系図の SVG 座標ダンプ
node scripts/export-test.mjs               # 例：PNG 書き出し検証
```

保存先は `screenshots/` 配下。

`.mcp.json` で **Playwright MCP** も設定済みです（`@playwright/mcp`）。Claude Code のセッションを再起動して `.mcp.json` を承認すると、エージェントが能動的にブラウザを操作できます。

---

## 既知の限界 / 今後の課題

`doc/IMPLEMENTATION_PLAN.md` 付録 B を参照。主要なものだけ:

- Zustand のストア分割（現状は `familyStore` に集約）
- d3-hierarchy 採用と個別ノードのドラッグ移動
- モバイル下部タブの実ルートへの適用
- フォントの self-host
- Union の `period` / `dissolved` フィールドへの実書き込み
- PNG 書き出しのオートフィット（現状は自然サイズ）

---

## ライセンス・連絡

内部プロジェクト。ライセンスと連絡先は `src/data/legal/{terms,privacy}.json` を編集すると `/terms`・`/privacy` ページに反映されます。
