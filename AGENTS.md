# AGENTS.md — family-tree2

このリポジトリで作業する **あらゆる自動コーディングエージェント**（Claude Code / Codex / Cursor / Aider 等）向けの共通運用ルール。Claude Code 固有の詳細は `CLAUDE.md` を参照。

---

## 1. プロジェクトの骨子

| 項目 | 値 |
|---|---|
| 名称 | ファミリーツリー２（family-tree2） |
| 種別 | 日本語 PWA（家系図・思い出ノート） |
| 配信 | GitHub Pages（`base: "/family-tree2/"`） |
| Node | 24.x |
| TS strict | 有効 |
| パッケージマネージャ | npm |
| ルーティング | React Router v6 — **HashRouter** |
| 状態管理 | Zustand 4（`persist` ミドルウェア） |
| 永続化 | localStorage 2 スロット A/B + IndexedDB（写真） |
| 自動テスト | なし（v0.1 は `npx tsc --noEmit` と `vite build` 通過を合格基準とする） |

仕様の正本は `doc/DESIGN.md`、実装進捗・既知の限界は `doc/IMPLEMENTATION_PLAN.md`。

---

## 2. セットアップと主要コマンド

```bash
npm install
npm run dev        # http://localhost:5173/family-tree2/
npm run build      # tsc && vite build
npm run typecheck  # tsc --noEmit
npm run lint
npm run format
```

変更後は **必ず** 以下 2 つを通すこと:

```bash
npx tsc --noEmit
npx vite build
```

---

## 3. ディレクトリ地図

```
src/
├── App.tsx                 ルータ（HashRouter）＋ BootstrapEffects
├── main.tsx                `import "./index.css"` を必ず保持
├── index.css               Tailwind + tokens + スクロール所有権
├── components/             共通 UI プリミティブ
├── pages/                  画面実装
├── modals/                 モーダル・オーバーレイ
├── features/               写真 / 思い出 / .ftree2 の機能横断
├── domain/                 型・FuzzyDate・selectors
├── stores/                 Zustand
├── storage/                localStoreAB + idb
├── pwa/                    SW 登録・storage.persist・install prompt
├── styles/                 tokens.css
├── data/legal/             terms.json / privacy.json + 型
└── types/                  virtual:pwa-register 型
```

完全な地図は `README.md` 参照。

---

## 4. コード規約（厳守）

### フォーマット
- Prettier 管理（ダブルクォート・セミコロン有・末尾カンマ）
- ESLint flat config（`eslint.config.mjs`）
- インデント 2 スペース

### 書き方
- 関数コンポーネントのみ。クラスコンポーネントと HOC は禁止。
- `useState` / `useEffect` / `useRef` / `useMemo` を基本とする。外部ライブラリのフックは必要最小限。
- **コメントは WHY のみ**。関数名・変数名で WHAT を伝える。多段落の docstring は書かない。
- 不要な `try/catch` を追加しない。ストレージ書込・ファイル I/O など失敗し得る箇所のみ。
- 新規ファイルは **UTF-8 / LF** で保存。

### スタイリング
- インラインスタイル（`style={{...}}`）を基本。色は `C.xxx`、フォントは `F.mincho` / `F.hand`（`src/components/ui.tsx` の定数）から参照。
- Tailwind ユーティリティクラスは使っても良いが、新規追加を増やさない。トークンベースに揃える。
- CSS 変数は `src/styles/tokens.css`。同じ色を複数箇所に直書きしない。

### 型
- `any` 禁止。どうしても必要な場合は `unknown` から narrowing するかコメントで理由を書く。
- API 境界（`.ftree2` の JSON・localStorage の文字列）は `unknown` として扱い、手動で validate してから型付け。

### インポート
- 相対パス（`"../components/ui"` 形式）。絶対パスエイリアスは未設定。
- React は `import React from "react"` 形式（副作用 import ではなく default import）。

### 言語
- UI 文言・ユーザー向けトースト・コミットメッセージは **日本語 OK**。
- 技術的な識別子（変数名・関数名）・コードコメントの専門用語は英語のまま可。

---

## 5. 重要な不文律

### 家系図のレイアウト
`src/pages/TreeEditorPage.tsx` の `layoutFamily()` と `EdgesLayer` を変更する場合:

- **子は夫婦中点から線を下ろす**（片親からではない）
- 両親に別々の祖父母 union がある場合、両 union それぞれから自分の子へ線を出す
- ルート条件：`isTopAncestor(pid)` = 親リンク無し **かつ** 配偶者にも親リンク無し
- 子ユニットの配置は親 union 中点間の中央、兄弟間隔は subtree 幅を足し上げて決定
- 線描画の基本形：`spouse bar` → `midpoint drop` → `distribution bar` → `child drop`

### スクロール所有権
`src/index.css` と `src/components/ui.tsx` の `BarePage` で定義。**1 画面につき縦スクロールバーは最大 1 本**:

- `html` / `body` / `#root` は常に `overflow: hidden`
- `BarePage scroll="fixed"` は `100vh + overflow hidden`（内部 `calc(100% - 56px) + overflowY:auto` が独立スクロール）
- `BarePage scroll="flow"` は `100vh + overflowY:auto`（Landing / 法的文書）
- `src/main.tsx` の `import "./index.css"` を **絶対に消さない**

### 閲覧権限
`src/domain/selectors.ts` の `canViewMemory(m, viewerPersonId)`:

- 書き手（`m.authorId`）は常に閲覧可
- 閲覧者（`m.viewers`）に含まれていれば閲覧可
- 上記以外は不可（一覧も詳細もフィルタ）
- これは UI フィルタであって暗号化ではない

### 自動保存の扱い
- 自動保存は **しない**（DESIGN.md 付録 A 確定事項）
- 保存ボタンで `markClean()` → Zustand `persist` が localStorage へ書く
- `dirty === true` の間、ヘッダに `● 未保存の変更あり` を表示
- `beforeunload` は `App.tsx` の `BootstrapEffects` で仕掛けている

---

## 6. 画面描画の確認方法

エージェントはブラウザレンダリング結果を直接は見えない。視覚不具合（ズレ・消失・重なり等）は以下で確認する:

### Playwright スクリプト（`scripts/*.mjs`）
```bash
npx vite --port 5173 --host 127.0.0.1 &
node scripts/inspect.mjs          # SVG 座標を数値でダンプ
node scripts/dual-ancestor.mjs    # 複数シナリオを seed → スクショ
node scripts/export-test.mjs      # PNG 書き出し結果を取得
node scripts/scroll-audit.mjs     # overflow を発生させている要素の特定
```

出力された PNG を `Read` ツールで開いて目視確認する。

### Playwright MCP
`.mcp.json` に `@playwright/mcp` を登録済み。Claude Code 再起動＋承認後に `mcp__playwright__*` ツールが利用可能。

### ユーザー添付のスクリーンショット
Read ツールは画像を視覚として取得できる。特定の不具合のピンポイント確認には最速。

---

## 7. 永続化とデータモデル

### 型
`src/domain/types.ts` が正本。変更する場合:

1. 型を更新
2. `src/stores/familyStore.ts` のサンプルデータと actions を更新
3. `src/features/importExport/writeFtree2.ts` / `readFtree2.ts` の影響を確認
4. マイグレーション必要なら `persist` の `version` と `migrate` を足す

### ストレージキー
- `ft2.state.v1.a` / `ft2.state.v1.b` — アプリ状態（Zustand persist → localStoreAB）
- IDB `ft2/photos/<PhotoId>` / `<PhotoId>.thumb` — 写真本体とサムネ

キーを変更する場合は **既存データを読める移行パスを用意**する。

### 家系 ID の衝突
`store.addFamily(f: Family)` は **戻り値（実際に使用された id）を返す**。同 id があれば `_2` / `_3` ... を自動付与。Import / Open で「別家系として追加」がきちんと別家系になる。呼び出し側は戻り値を使って `nav()` すること（`preview.family.id` を直接使わない）。

### 写真
- アップロード時：`src/features/photos/resize.ts` で最大辺 1600px・JPEG quality 0.82、サムネは 320px **正方形＋黒レターボックス**（中央クロップしない）
- ストア：`src/features/photos/ingest.ts` で IDB に保存 → `PhotoId` を発行
- 表示：`src/features/photos/PhotoFromIdb.tsx` が Blob URL をキャッシュして `<img>` を描画。`objectFit: "contain"` + 黒背景で端切れなし。
- 拡大：`/family/:fid/photo/:pid?ids=a,b,c&i=N` で `PhotoLightbox` が開く。`ids` / `i` を付けて呼べば前後ナビ＋サムネストリップ対応。
- 代表写真：Memory は `heroPhotoId` を持てる（未設定なら `photoIds[0]`）。MemoryEditor でクリックで切替（青枠＋右下「代表写真」バッジ）。

---

## 8. `.ftree2` ファイル形式

```
/manifest.json        { version: "1", exportedAt, family: { id, name } }
/family.json          Family 構造（JSON、写真は PhotoId 参照）
/photos/<id>.jpg      元画像
/photos/<id>.thumb.jpg サムネ
```

`version` が `"1"` 以外なら `ImportErrorModal` で "version" エラー。ZIP 構造不正は "corrupt"、容量不足は "quota"。

---

## 9. リリース / デプロイ

- `.github/workflows/deploy.yml` が `main` ブランチへの push で GitHub Pages に自動デプロイ。
- PR マージ前に **必ず `npm run build`** が通ること。
- 手動デプロイ：Settings → Pages → Source: GitHub Actions。

---

## 10. やってはいけないこと

- **`src/main.tsx` から `import "./index.css"` を外す** — body の既定 margin 8px が復活してスクロールが発生する。
- **`src/index.css` で `@import` を `@tailwind` の後に書く** — Vite/PostCSS が `@import must precede all other statements` エラーを吐く。`@import "./styles/tokens.css"` は必ずファイル先頭。
- **Zustand の `set` を直接呼ぶ** — 必ずアクション（`addPerson` など）経由。`persist` + `partialize` で書き込み対象を制御している。
- **`any` 型の濫用** — 型エラーを握り潰すために `any` を入れない。
- **未検証の破壊的操作** — 家系削除・全データ削除などは `DeleteConfirmModal` 経由。`store.wipe()` 直呼びは UI からのみ。
- **`<select>` のフォントサイズを 14px 未満に** — iOS Safari がフォーカス時に自動ズームする。
- **placeholder を value で上書き** — 新規追加系のフォームは初期値を空文字に統一（ユーザー要望）。性別のみ「男性」既定。
- **Enter 送信の `<input>` で IME 変換確定を吸収する** — `if (e.nativeEvent.isComposing \|\| e.keyCode === 229) return;` を onKeyDown の先頭に入れる（思い出エディタのタグ入力で実施済み）。
- **`store.addFamily(f)` の戻り値を無視** — id 衝突時は `_2` 等が付く。戻り値で `nav()` すること。
- **人物モーダルの `backTo` に固定 URL を入れる** — `nav(-1)` による履歴戻りに任せる。編集を開いたソース（tree / 人物詳細）へ戻る挙動を壊さない。
- **画像を中央クロップで正方形化する** — `cropSquareJpeg` / `PhotoFromIdb` とも **contain + 黒背景** で統一。新しい写真表示でも合わせる。
- **ヘッダの家系名をハードコード** — `useFamilyStore((s) => s.families[fid]?.name)` で現在の家系を引く。「山田家」を直書きしない。

---

## 11. 完了の定義

タスク完了を報告する前に以下すべて:

1. `npx tsc --noEmit` が `exit 0`
2. `npx vite build` が成功
3. 変更画面は Playwright で最低 1 枚スクショ確認（視覚崩れ系の修正では必須）
4. ユーザーの指示事項を全項目反映
5. 仕様・設計・残課題に影響があれば `doc/DESIGN.md` または `doc/IMPLEMENTATION_PLAN.md` を更新

以上。ユーザーの明確な指示と本書が食い違った場合は **ユーザー指示を優先** し、必要なら本書の更新も提案する。
