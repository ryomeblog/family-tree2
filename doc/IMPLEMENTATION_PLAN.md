# ファミリーツリー２ ・ 実装計画書

作成日: 2026-04-23
最終更新: 2026-04-23（Phase 0〜10 の**機能核**が一通り動く版。残課題は §B-9 の「既知の限界」参照）
対象: v0.1（MVP）／ PWA
前提資料: `doc/DESIGN.md`（仕様）／ `doc/Wireframes.html`（デザイン）

---

## 0. 目的とゴール

`DESIGN.md` の仕様に従い、`Wireframes.html` のビジュアル言語（絵本トーン・毛筆明朝・手書き付箋・朱印）で **端末内完結の家系図 PWA** を実装する。

**完成定義（DoD）:**
- 全 22 画面が動作する
- 家系の作成・編集・保存・取り込み／書き出しがオフラインで完結する
- PWA としてインストール可能、Service Worker で完全オフライン起動可能
- 画像は IndexedDB、構造データは localStorage（2 スロット交互書き込み）に保存
- 思い出ノートの閲覧者制御（UI フィルタ）が機能する

---

## 1. 現状確認

| 項目 | 状態 |
|---|---|
| 依存パッケージ（React 18 / Vite 5 / Tailwind / TipTap / Zustand / d3-hierarchy / JSZip / idb / html-to-image / vite-plugin-pwa） | ✅ `package.json` に揃っている |
| `src/App.tsx` | ✅ **HashRouter + 全 22 画面のルート定義済み** |
| `src/pages/*.tsx` | ✅ 11 ページ + NotFound + WireGallery + 4 デモ（Empty / Quota / PWA / Mobile） |
| `src/modals/*.tsx` | ✅ 8 モーダル（NewFamily / AddPerson / EditPerson / RelationAdd / DeleteConfirm / ImportError / FamilyMenu / PhotoLightbox） |
| `src/wireframes/*.tsx` | ✅ 22 画面 + primitives。**デザインの正本** として保守。本番ページは bare モードで再利用 |
| `doc/Wireframes.html` | ✅ `/doc/Wireframes.html` で 22 画面ギャラリー表示可能 |
| `src/pages/WireGalleryPage.tsx` | ✅ 旧ギャラリーを `/#/__wireframes` として保持 |
| `src/features` `stores` `storage` `domain` `components` `pwa` `styles` | ❌ 未作成。**機能は静的ダミー**（ルーティングのみ動作） |
| `vite-plugin-pwa` 設定／`public/icons` ／ `public/fonts` | ❌ 未設定 |
| `vite.config.ts` | ⚠️ 要確認（PWA プラグイン未組込みの想定） |

---

## 2. フェーズ全体像

```
Phase 0  基盤整備                                        ✅ vite base / tokens.css / Tailwind（フォントは CDN）
Phase 1  デザインシステム & ワイヤーフレーム22枚          ✅ 完了
Phase 2  ドメイン層（型・FuzzyDate・selectors）          ✅ src/domain/{types,fuzzyDate,selectors}.ts
Phase 3  ストレージ層（localStore A/B・IndexedDB）        ✅ localStoreAB + idb 写真ストア
Phase 4  状態管理（Zustand 3 ストア）                    ⚠️ familyStore に集約（永続化済み・dirty ガード済み）。appStore/uiStore への 3 分割は未
Phase 5  ルータ & アプリシェル                           ✅ HashRouter + AppHeader + GlobalToast + FamilyMenu 内蔵
Phase 6  ページ実装（中核から外周へ）                    ✅ Dashboard / Tree / PersonDetail / PersonForm / Memory list/detail/editor / Settings が実データ連動
Phase 7  機能横断                                       ✅ 写真クロップ・リサイズ・IDB 保存・Lightbox／.ftree2 write+read（JSZip）／PNG 書き出し（html-to-image）
Phase 8  PWA                                            ✅ vite-plugin-pwa / manifest / SW / `storage.persist`+`estimate` / update 通知
Phase 9  仕上げ                                         ✅ 空状態（Dashboard・Memories）／月 1 リマインド起動チェック／tokens.css ／パターンショーケース (`/_empty /_quota /_pwa /_mobile`)
Phase 10 配信                                           ✅ `.github/workflows/deploy.yml`（Actions → GitHub Pages）
```

**配信パス:** GitHub Pages で `https://<user>.github.io/family-tree2/` を想定。
ローカル dev は `http://localhost:5173/family-tree2/` で起動。HashRouter で画面遷移。

各フェーズは独立してレビュー可能。Phase 1 が完了し「見本」が確定しているため、Phase 2 以降は並行作業も可能。

---

## 3. フェーズ詳細

### Phase 0 — 基盤整備

**目的:** ビルド・スタイル・PWA の土台を整える

| タスク | 成果物 |
|---|---|
| 色トークンの CSS 変数化 | `src/styles/tokens.css` |
| Tailwind に色・フォントを登録 | `tailwind.config.js` 更新 |
| Google Fonts を `public/fonts` に self-host | `public/fonts/{Kaisei,Klee}/*.woff2` ・ `index.html` の `<link>` 撤去 |
| Vite PWA プラグイン組込み | `vite.config.ts` 更新 |
| `tsconfig.json` 確認・厳格モード徹底 | `strict: true` 確認 |
| ESLint v9 flat config 確認 | `eslint.config.mjs` 確認 |

**色・タイポトークン:**
```css
:root {
  --bg-paper: #FFFEF8;
  --bg-tatami: #E8E2D0;
  --ink-sumi: #1A1915;
  --ink-sub: #6B6456;
  --ink-pale: #8B8574;
  --accent-shu: #C0392B;
  --note-yellow: #FDF6C8;
  --font-mincho: "Kaisei Decol", serif;
  --font-hand: "Klee One", cursive;
}
```

**完了基準:** `npm run dev` で空ページが立ち上がり、`tokens.css` の変数が適用される。

---

### Phase 1 — デザインシステム & ワイヤーフレーム ✅ 完了

**目的:** Wireframes.html の絵本トーンを 22 画面分可視化し、本実装の見本にする

#### 1-A. 共通プリミティブ ✅ 実装済み

すべて `src/wireframes/primitives.tsx` にまとめた（本番用の `src/components/` はまだ切り出していない）。

実装したプリミティブ:
- `Frame`（端末／ブラウザ枠 — `kind="desktop"|"tablet"|"phone"`）
- `Grid`（原稿用紙背景・濃度調整可）
- `Hanko`（朱印ロゴ — 円＋任意文字）
- `SketchBtn`（手描き風ボタン — 二重線・影・primary/danger 対応）
- `StickyNote`（淡黄付箋 — 微回転）
- `Hand`（Klee One 手書き）／ `Title`（Kaisei Decol 明朝）
- `Photo`（正方形・アスペクト指定可の罫線プレースホルダ — `tone="paper"|"tatami"|"ink"`）
- `AppHeader`（画面共通ヘッダ — 戻る／朱印／家系名／右エリア）
- `PersonCard`（矩形人物ノード — 選択・dim・故人マーク）
- `Chip`（`tone="ink"|"shu"|"mute"`）／ `Row`／`Col`／`Divider`
- `Field`（ラベル付き入力プレースホルダ）／ `InkDot`
- `Toast`（ok / warn / err）／ `DialogCard`（二重確認の朱色枠）／ `Backdrop`
- `Brush`（装飾の毛筆線）

トークンは `C`（色）と `F`（フォント）としてエクスポート。Phase 0 の CSS 変数化は未実施のため、今は TS 定数ベース。

#### 1-B. ワイヤーフレーム ✅ 全 22 画面 実装済み

`src/wireframes/` 配下:
- `primitives.tsx`
- `Wire01Landing.tsx` — ナビ／ヒーロー／小さな家系図イラスト／3 つの特長／フッター
- `Wire02Dashboard.tsx` — サイドバー／家系カードグリッド／新規・開く・取り込み
- `Wire03TreeEditor.tsx` — 左ツールバー／原稿用紙キャンバス／世代間接続線／ミニマップ／ズーム／Inspector
- `Wire04PersonDetail.tsx` — 肖像・ロール切替／生涯タイムライン／備考／関連思い出／家族サイドバー／写真ギャラリー
- `Wire05AddPerson.tsx` — 肖像クロップ／FuzzyDate（西暦・和暦・年のみ・不明）／備考
- `Wire06Memories.tsx` — 縦タイムライン／フィルタ／閲覧者制御の錠前表現
- `Wire07NewFamily.tsx` — 家系名・ルート人物・テーマスウォッチ
- `Wire08OpenFamily.tsx` — ドラッグ&ドロップゾーン／置換 or 追加／最近のファイル
- `Wire09Settings.tsx` — 書き出し／取り込み／使用量バー／PWA／テーマ／危険な操作
- `Wire10Import.tsx` — 3 段ステッパ／プレビュー統計／置換 or 追加
- `Wire11ImportError.tsx` — 壊／版／容 の 3 パターンの朱色枠ダイアログ
- `Wire12FamilyMenu.tsx` — ヘッダ下のドロップダウン（家系切替・書き出し・削除）
- `Wire13RelationAdd.tsx` — 関係タイプ 6 種／既存から or 新規／候補カード
- `Wire14PhotoLightbox.tsx` — 黒背景・正方形・最大 10 枚サムネ帯・左右送り
- `Wire15MemoryEditor.tsx` — タイトル／メタ（主人公・時期・書き手）／TipTap 風ツールバー＋原稿行／写真 0〜10 枚／ViewerPicker（書き手ロック）
- `Wire16MemoryDetail.tsx` — 絵本ページ（ドロップキャップ・蛍光マーカ・署名）／前後ナビ
- `Wire17PWA.tsx` — スプラッシュ／ホーム追加案内／オフラインバッジ／新バージョン通知 の 4 面
- `Wire18Empty.tsx` — 家系ゼロ／人ひとり／思い出ゼロ／写真ゼロ／検索ゼロ／初回起動 の 6 パターン
- `Wire19Mobile.tsx` — スマホ 2 面（ホーム／家系図ボトムシート＋FAB・下部タブ）
- `Wire20Delete.tsx` — 人物／思い出／家系（名前入力必須）／全データ の 4 パターン、朱色枠
- `Wire21Quota.tsx` — 容量不足／永続化未許可／保存失敗／リマインド／使用率バー／互換警告 ＋ トースト例
- `Wire22EditPerson.tsx` — 05 のダイアログを `mode="edit"` で再利用（関係セクション＋削除）
- `index.ts` — 再エクスポート

**動作確認:**
- `npm run dev` → `http://127.0.0.1:5173/` でギャラリー表示
- `http://127.0.0.1:5173/doc/Wireframes.html` で Babel in-browser プレビューも動作
- `npx tsc --noEmit` 通過
- `npx vite build` 通過（237KB / gzip 70KB）

**完了基準:** ✅ `npm run dev` で 22 画面が縦並びで表示される。

---

### Phase 2 — ドメイン層

`src/domain/`

| ファイル | 内容 |
|---|---|
| `types.ts` | `Person` `Union` `ParentChildLink` `Memory` `Family` `AppState` `FuzzyDate` `FuzzyRange` 等。DESIGN.md §3.2 をそのまま |
| `fuzzyDate.ts` | 元号⇄西暦変換、表示フォーマッタ（「昭和43年」「1968年頃」）、比較関数 |
| `selectors.ts` | 派生計算：両親・配偶者・子・兄弟・世代、人物検索、`canViewMemory()`（features/memory に置いてもよい） |

**完了基準:** ドメイン純関数の単体動作確認（手動／簡易デモページ）。

---

### Phase 3 — ストレージ層

`src/storage/`

| ファイル | 内容 |
|---|---|
| `localStoreAB.ts` | キーを `<base>.a` / `<base>.b` 2 スロット交互書き込み、`seq` 番号で最新採用。停電時の半書き込み対策 |
| `idb.ts` | `idb` ラッパ。DB `ft2` / store `photos`（key=PhotoId, value=Blob）。元画像とサムネを別キーで保存 |

**ストレージキー:**
- `ft2.state.v1`：`AppState`
- `ft2.family.<id>.v1`：個別家系
- `ft2.meta.v1`：最終書き出し等

**完了基準:** ブラウザ DevTools の Application タブで A/B 書き込みと写真 Blob が確認できる。

---

### Phase 4 — 状態管理（Zustand 3 ストア）

`src/stores/`

#### `familyStore.ts`
```ts
useFamily = create<{
  family?: Family;
  dirty: boolean;
  load(id: string): Promise<void>;
  save(): Promise<void>;            // 手動。成功時のみ dirty=false
  addPerson(p: Person): void;
  updatePerson(id: PersonId, patch: Partial<Person>): void;
  addUnion(u: Union): void;
  addParentChild(link: ParentChildLink): void;
  addMemory(m: Memory): void;
  updateMemory(id: MemoryId, patch: Partial<Memory>): void;
  addViewer(mid: MemoryId, pid: PersonId): void;
  removeViewer(mid: MemoryId, pid: PersonId): void;
}>();
```

#### `appStore.ts`
- `activeFamilyId / families[] / currentViewerPersonId / reminderShownAt`

#### `uiStore.ts`
- `lightbox / dialog / toast`

**完了基準:**
- `familyStore.save()` 成功時のみ `dirty=false` ＋ localStorage へ書き込み
- `App` で `beforeunload` に `dirty` ガードを取り付け、未保存離脱で警告

---

### Phase 5 — ルータ & アプリシェル

**作業:**
- `App.tsx` を「ワイヤーギャラリー」から **本番ルータ** に差し替え
- 旧 App.tsx は `WireGalleryPage` として残し、`/__wireframes` 等の隠しルートで参照可能に

#### ルート定義（DESIGN.md §4.2 通り）
```
/                              → LandingPage
/home                          → DashboardPage
/new                           → NewFamilyModal（/home の上）
/open                          → OpenFamilyPage
/import                        → ImportPage
/settings                      → SettingsPage

/family/:fid/
  tree                         → TreeEditorPage
  person/new                   → AddPersonModal
  person/:pid                  → PersonDetailPage
  person/:pid/edit             → EditPersonModal
  memories                     → MemoriesListPage
  memory/new                   → MemoryEditorPage
  memory/:mid                  → MemoryDetailPage   ※ガード: canViewMemory()
  memory/:mid/edit             → MemoryEditorPage   ※ガード: author のみ
```

#### `AppShell`
- ヘッダ：戻る／朱印ロゴ／家系名メニュー／（家系図エディタのみ）保存ボタン
- `<GlobalLightbox />` ／ `<GlobalDialog />` ／ `<Toast />`

#### ガード
- `family/*` 共通：該当 Family が localStorage に存在しなければ `/home` へ
- `memory/:mid`：`canViewMemory()` が false なら 403 的空状態
- `memory/:mid/edit`：`author === currentViewerPersonId` のみ許可

**完了基準:** 全ルートが空ページでも表示される（中身は次フェーズで詰める）。

---

### Phase 6 — ページ実装（中核から外周へ）

優先順序を「動かして確認できる順」に並べる。

#### 6-1. ダッシュボード起点で最小ループを通す
1. **02 DashboardPage** — 家系一覧グリッド、「＋ 新規」「開く」「取り込み」
2. **07 NewFamilyModal** — 家系名・ルート人物・テーマ色 → 作成 → 03 へ遷移

#### 6-2. 家系図エディタ（最重要・工数最大）
3. **03 TreeEditorPage**
   - `features/tree/layout.ts`
     - d3-hierarchy で世代の y 座標を決定
     - **Union 中心**に独自補正（再婚・複数配偶者で破綻しないよう x 座標を再配置）
   - `features/tree/TreeEdges.tsx`
     - **線描画ルール**: 夫婦の横線の中点から下に一本、そこから子の数だけ横に分岐して各子の上に落とす
   - `features/tree/PersonNode.tsx`
   - `features/tree/MiniMap.tsx`
   - `Toolbar`（左側垂直）／ `Inspector`（右ペイン）
   - パン（ドラッグ）／ ズーム（ピンチ・ボタン・ホイール）— CSS transform ベース
   - 右上：`● 未保存の変更あり` ／ `↓ 画像を保存` ／ `保存` ／ `＋ 人物を追加`

#### 6-3. 人物まわり
4. **04 PersonDetailPage**（左：肖像・ロール切替／中央：タイムライン・備考・関連思い出／右：家族サイドバー／下：写真ギャラリー）
5. **22 EditPersonModal**（05 同構造＋関係セクション＋削除導線）
6. **05 AddPersonModal**（FuzzyDate 入力・肖像クロップ・「保存して続けて追加」）
7. **13 RelationAddModal**（配偶者／元配偶者／親／子／兄弟／養子）

#### 6-4. 思い出
8. **06 MemoriesListPage**（縦タイムライン、`canViewMemory` フィルタ、フィルタ UI）
9. **15 MemoryEditorPage**
   - `features/memory/RichText.tsx`：TipTap（StarterKit + Placeholder + Link）
   - `features/memory/PhotoGrid.tsx`：max=10、+ ボタンの活殺
   - `features/memory/ViewerPicker.tsx`：書き手はロック、任意の人物を閲覧者に追加
   - `RelatedPeoplePicker` ／ `TagPicker`
10. **16 MemoryDetailPage**（絵本ページ風、編集／削除は author のみ、前後ナビ）

#### 6-5. 周辺
11. **08 OpenFamilyPage**（ファイル選択／ドラッグ＆ドロップ／置換 or 追加）
12. **10 ImportPage**（選択 → プレビュー → 取り込み）
13. **09 SettingsPage**（書き出し／取り込み／ストレージ使用状況／PWA／テーマ／バージョン／危険操作）
14. **01 LandingPage**（ナビ／ヒーロー／3 つの特長／フッター・CTA → `/new`）

**完了基準:** 各画面が Wireframes.html のレイアウトと同等のトーンで表示され、操作が一通り完結する。

---

### Phase 7 — 機能横断

#### 7-A. 写真
`src/features/photos/`
- `cropSquare.ts`：Canvas で正方形クロップ
- `resize.ts`：最大辺 1600px、`image/jpeg quality=0.82`、サムネ 320px
- `Lightbox.tsx`（14）：背景黒・正方形・最大 10 枚サムネ帯・左右送り・ダウンロード・削除・編集

#### 7-B. 取り込み／書き出し（.ftree2）
`src/features/importExport/`
- `writeFtree2.ts`：JSZip で `manifest.json` + `family.json` + `/photos/<id>.jpg` + `/photos/<id>.thumb.jpg`
- `readFtree2.ts`：`version` を検査、非互換なら 11 取り込みエラーへ
- ファイル選択：`File System Access API`（PC）→ `<input type=file>` フォールバック（モバイル・Safari）

#### 7-C. 家系図 PNG 書き出し
`src/features/tree/exportImage.ts`
- `html-to-image` で TreeCanvas → PNG。フォントは self-host 済み＋ `cacheBust`

#### 7-D. 共通モーダル
- **20 DeleteConfirmModal**：人物・家系・思い出・全データ。家系削除は「家系名入力」必須、朱色枠の二重確認
- **11 ImportErrorModal**：破損／バージョン不一致／容量不足の 3 系統メッセージ
- **12 FamilyMenu**：家系切替・書き出し・削除（ヘッダから開くドロップダウン）

**完了基準:** `.ftree2` で書き出して別ブラウザで取り込めば、家系・写真とも復元される。

---

### Phase 8 — PWA

`src/pwa/`

#### `manifest.webmanifest`
```json
{
  "name": "ファミリーツリー２",
  "short_name": "家系図",
  "display": "standalone",
  "start_url": "/",
  "background_color": "#FFFEF8",
  "theme_color": "#C0392B",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

#### Service Worker（vite-plugin-pwa GenerateSW）
- プリキャッシュ：HTML・JS・CSS・フォント・ロゴ
- ランタイムキャッシュ：画像 CacheFirst（IndexedDB 経由なので保険）
- 更新検知：`registerSW({ onNeedRefresh })` → 17-D 新バージョン通知 → `updateSW(true)`

#### 永続化
- `pwa/persist.ts`：`navigator.storage.persist()` を初回 or Settings から要求
- `navigator.storage.estimate()` で使用率取得 → 21-E 使用率バー反映
- 87% 超過で 21-A／21-B を先回り表示

**完了基準:** スマホで「ホーム画面に追加」→ オフラインで起動・閲覧・編集ができる。

---

### Phase 9 — 仕上げ

| タスク | 該当画面 |
|---|---|
| 18 空状態 6 パターン（家系ゼロ／人ひとり／思い出ゼロ／写真ゼロ／検索ゼロ／初回起動） | 各ページに差し込み |
| 21 容量・エラー警告 6 パターン（容量不足／永続化未許可／保存失敗／月 1 リマインド／使用率バー／互換警告） | トースト・ダイアログ |
| 19 モバイル：下部タブ（家系／思い出／写真／設定）、ミニマップは `md:` 以上のみ | TreeEditor・各ページ |
| 月 1 書き出しリマインドの起動時チェック | `appStore.reminderShownAt` |
| 二重確認の朱色枠ダイアログ統一 | `DeleteConfirmModal` の派生で統一 |

**完了基準:** 6 パターン × 2 種が UI で確認できる。

---

### Phase 10 — 配信

- `vite.config.ts` の `base` を配信先に合わせる（GitHub Pages: `/family-tree2/`、Cloudflare Pages: `/`）
- `vite build` 成果物を確認、SW スコープが正しいか確認
- GitHub Actions で `gh-pages` ブランチへ自動デプロイ（任意）

**完了基準:** 公開 URL からインストール可能。

---

## 4. 工数の目安

| フェーズ | 規模 |
|---|---|
| Phase 0 | 半日 |
| Phase 1 | 2〜3 日（22 画面分のワイヤー） |
| Phase 2 | 半日 |
| Phase 3 | 半日 |
| Phase 4 | 半日 |
| Phase 5 | 半日 |
| Phase 6 | **1〜2 週間（大半は 03 と 15）** |
| Phase 7 | 2〜3 日 |
| Phase 8 | 1 日 |
| Phase 9 | 2 日 |
| Phase 10 | 半日 |

**合計:** 約 3〜4 週間（1 名フルタイム想定）

---

## 5. 主なリスクと対処

| リスク | 対処 |
|---|---|
| **線描画ルール**が再婚・養子で破綻しやすい | `layout.ts` を Union 中心の独自レイアウトにし、d3-hierarchy は世代の y 座標決定だけに使う |
| **localStorage 2MB 上限** | 1 家系を超えそうな場合は警告（21）、画像は必ず IndexedDB に逃がす |
| **Safari は File System Access API 非対応** | `<input type=file>` ＋ `<a download>` フォールバック |
| **TipTap の日本語 IME** | StarterKit + Placeholder で問題なし。実機確認は必須 |
| **`html-to-image` がフォントを取り込まない事故** | フォント self-host ＋ `cacheBust: true` |
| **画像クロップ／リサイズの OffscreenCanvas 非対応ブラウザ** | 通常 Canvas にフォールバック |
| **iOS Safari の IndexedDB が低空き容量で消える** | `navigator.storage.persist()` を必ず取得、月 1 書き出しリマインドで保険 |

---

## 6. 着手提案

**マイルストーン M1（最初の引き渡し）**:
- Phase 0 完了
- Phase 1-A の primitives ＋ Phase 1-B の **3 画面（01・03・15）** を実装
- `Wireframes.html` を開いてトーンが合うことを確認

→ ここで一度レビューし、以降の方針（残り 19 画面 → 本実装）を確定する。

**マイルストーン M2**:
- Phase 1 残り 19 画面
- Phase 2〜5 完了

**マイルストーン M3**:
- Phase 6（中核 3 画面：02 / 03 / 15）

**マイルストーン M4 以降**: 残ページ → 機能横断 → PWA → 仕上げ → 配信

---

## 付録 A・既存ファイルの扱い

| 既存 | 扱い |
|---|---|
| `src/App.tsx`（ワイヤーギャラリー） | Phase 5 で本番ルータに差し替え。元の中身は `pages/WireGalleryPage.tsx` として残し、開発時のみアクセス可能に |
| `doc/Wireframes.html` | ✅ Phase 1 完了後に動作。デザインの正本として保守。Vite dev から `/doc/Wireframes.html` で開く |
| `doc/DESIGN.md` | 仕様の正本。実装中に判明した事項は本書または DESIGN.md に追記 |
| `doc/IMPLEMENTATION_PLAN.md`（本書） | フェーズ進行に応じて「完了」マークを付けていく |
| `doc/src/`（旧ミラー） | 空の `wireframes/` ＋ 古い `App.tsx` / `main.tsx` / `index.css`。新しいソースは **リポジトリ直下の `src/` のみ**。`doc/src/` は使われていないので削除してよい |

---

## 付録 B・**未実装** として残している機能

**2026-04-23 時点:** 全画面は `src/pages/` と `src/modals/` として実装済み。HashRouter で URL を持ち、ヘッダ・主要 CTA・家系カード・思い出カード経由で遷移可能。中身は静的ダミーで、以下の機能は意図的に残している。

### B-1. 全画面共通（まだ動いていないもの）

| 項目 | 現状 | 実装先 |
|---|---|---|
| ルーティング（React Router） | ✅ `HashRouter` + 全ルート定義済み | — |
| ルートガード（存在しない家系 → `/home`、`canViewMemory()` 等） | 未実装 | Phase 4〜5 |
| Zustand ストア | ✅ `src/stores/familyStore.ts` が動作。家系の作成・編集・削除／人物 CRUD／思い出 CRUD／トースト／リマインド／テーマ／閲覧者切替 | 3 ストアへの分離は残作業（Phase 4） |
| **永続化**（localStorage A/B 2 スロット／IndexedDB） | ❌ 現在はメモリのみ。**リロードでリセット** | Phase 3 |
| `beforeunload` の未保存ガード | `store.dirty` は立つ／UI 表示もするが警告は未接続 | Phase 4 |
| ヘッダの「家系名 ▾」インプレース展開 | 現在は別ルート `/family/:fid/menu` に遷移 | Phase 5 |
| 朱印ロゴのフォント（Self-host） | Google Fonts CDN のまま | Phase 0 |
| `src/styles/tokens.css` | 未作成。色は `primitives.tsx` の TS 定数 `C` のみ | Phase 0 |
| `src/components/` への切り出し | `wireframes/primitives.tsx` に同居。`BarePage`・`Field`・`SketchBtn` 等は本番でも使用中 | Phase 6 後半 |
| ルート定義と DESIGN.md §4.2 のズレ | `/family/:fid/menu`・`/family/:fid/delete`・`/family/:fid/relate`・`/settings/delete-all`・`/_empty /_quota /_pwa /_mobile` を追加 | Phase 5 |
| 画像本体 | すべて `Photo` プレースホルダ。`<input type=file>` すら未接続 | Phase 7 |
| TipTap | 未。本文は単純な `<textarea>` に罫線背景を重ねて表現 | Phase 6 |
| d3-hierarchy | 未。TreeEditor は固定レイアウトエンジン `layoutFamily()`（gen 単位の均等配置）で暫定 | Phase 6 |

### B-2. ルーティング — 動く遷移

以下は **ブラウザで実際にクリックして遷移する** ルート。

```
/                  → LandingPage（CTA → /new ・ /import ・ /home）
/home              → DashboardPage（カード → /family/:fid/tree、ヘッダ各ボタン）
/new               → NewFamilyModal（家系を作成 → /family/yamada/tree）
/open              → OpenFamilyPage
/import            → ImportPage
/import/error      → ImportErrorModal（3 パターン表示）
/settings          → SettingsPage（取り込み → /import、削除 → /family/:fid/delete）
/settings/delete-all → DeleteConfirmModal（全データ初期化）

/family/:fid/tree                → TreeEditorPage（＋人物を追加 → person/new 等）
/family/:fid/menu                → FamilyMenu（12 ドロップダウンを単体ページとして）
/family/:fid/delete              → DeleteConfirmModal
/family/:fid/relate              → RelationAddModal
/family/:fid/photo/:pid          → PhotoLightbox

/family/:fid/person/new          → AddPersonModal
/family/:fid/person/:pid         → PersonDetailPage
/family/:fid/person/:pid/edit    → EditPersonModal

/family/:fid/memories            → MemoriesListPage（カード → memory/:mid）
/family/:fid/memory/new          → MemoryEditorPage
/family/:fid/memory/:mid         → MemoryDetailPage
/family/:fid/memory/:mid/edit    → MemoryEditorPage

/_empty /_quota /_pwa /_mobile   → 18・21・17・19 のパターンショーケース
/__wireframes                    → WireGalleryPage（デザイン参考用）
*                                → NotFoundPage
```

### B-3. 画面ごとに残している機能

✓ = 動作する ／ ⚠ = 見た目のみ ／ ✗ = 未実装

| 画面 | 状態 | 詳細 |
|---|---|---|
| 01 Landing | ✓ | ナビ・CTA が `/new` `/import` `/home` へリンク。静的コピー。 |
| 02 Dashboard | ✓ | 家系カードは **ストアから描画**。クリックで `/family/:fid/tree`。新規・開く・取り込み遷移可。**スクロールなしの固定レイアウト**。 |
| 03 TreeEditor | ✓ | `layoutFamily()` で世代間隔 180px・人物間隔 48px。**ドラッグでパン**、**Ctrl+ホイール／ボタンでズーム（40〜180%）**、**ミニマップ／選択枠強調**。ツールバーはモード切替＋「追加」でモーダル／「編集」でノードクリック時に編集ルート。**Inspector は開閉可**（‹ボタン）で選択なし時は空状態を表示。保存ボタンは `markClean()` ＋トースト。PNG 書き出しはトーストで Phase 7 予告。**d3-hierarchy 未**・ノードのドラッグ移動未。 |
| 04 PersonDetail | ⚠ | ワイヤーそのまま（山田 春子固定）。実データ結合は Phase 6 後半。 |
| 05 AddPerson | ✓ | **フル編集可能**。姓／名／ふりがな／旧姓／続柄／性別（ラジオ）／出生地／備考（テキストエリア）／**FuzzyDate**（西暦・和暦・年のみ・不明モード切替、年月日、西暦換算プレビュー）／「保存」「保存して続けて追加」。肖像の Canvas クロップは未。 |
| 06 Memories | ✓ | ストアから表示。**主人公・書き手・年代**の 3 フィルタ動作。検索ボタンは Phase 6 予告トースト。 |
| 07 NewFamily | ✓ | **フル編集可能**。家系名／姓名／続柄／性別／生年／出生地／テーマ 3 択。保存で `addFamily()` → `/family/:fid/tree` へ遷移＋トースト。 |
| 08 OpenFamily | ⚠ | UI のみ。File System Access API 未。 |
| 09 Settings | ✓ | **動くトグル**：月 1 リマインドはストア永続（セッション内）／テーマ（ストア）／閲覧者切替（`currentViewerPersonId`）。書き出し／取り込み／永続化／写真整理はトーストで Phase 予告。削除は 20 へ遷移。 |
| 10 Import | ⚠ | UI のみ／`readFtree2` 未。 |
| 11 ImportError | ⚠ | 3 パターン表示／判定ロジック未。 |
| 12 FamilyMenu | ⚠ | 単体ページ描画。ドロップダウンのインプレース展開は未。 |
| 13 RelationAdd | ⚠ | UI のみ／Union/ParentChildLink 生成は未。 |
| 14 PhotoLightbox | ⚠ | UI のみ／IndexedDB Blob 読込は未。 |
| 15 MemoryEditor | ✓ | **フル編集可能**。タイトル入力、主人公／時期／書き手を **flex-start 揃え**（hint による高さズレ解消）、罫線背景付きテキストエリアで本文、写真は +/− で枚数調整（最大 10）、タグは Enter 追加／× 削除、閲覧者は候補から追加／× 削除（書き手は 🔒 ロック）、保存でストアに書き込み＆遷移。TipTap 本体は未。 |
| 16 MemoryDetail | ✓ | ストアから描画。前後ナビは存在時のみ有効化。閲覧ガード（`canViewMemory`）未。 |
| 17 PWA | ⚠ | `/_pwa` で 4 パターンのビジュアル。SW 登録は未。 |
| 18 Empty | ⚠ | `/_empty` で 6 パターンのビジュアル。各ページへの条件埋込は未。 |
| 19 Mobile | ⚠ | `/_mobile` で 2 面プレビュー。実ページのメディアクエリ未。 |
| 20 Delete | ⚠ | 4 パターン表示／実削除は未（`removeFamily` / `removeMemory` / `removePerson` はストアにある）。 |
| 21 Quota | ⚠ | `/_quota` で 6 パターンのビジュアル／`navigator.storage.estimate()` 未。 |
| 22 EditPerson | ✓ | 05 と共通の `PersonForm` を `mode="edit"` で再利用。**フル編集可能**＋関係セクション（関係の追加遷移は動作／編集・外すはトースト）。削除ボタンはストアから削除＋ツリーへ戻る。 |

### B-4. 画面以外の既実装

| ファイル | 役割 |
|---|---|
| `vite.config.ts` | **base: "/family-tree2/"** 設定済み。GitHub Pages 想定 |
| `src/stores/familyStore.ts` | Zustand ストア。Family / Person / Memory / 操作アクション／トースト／テーマ／リマインド |
| `src/wireframes/primitives.tsx` | **FrameModeProvider + BarePage**（`scroll="fixed"|"flow"`）／**SketchBtn** に `to`・`onClick` ／**Field** に `onChange` 対応＋`reserveHint` で高さ揃え／**GlobalToast** |
| `src/App.tsx` | `HashRouter` + `GlobalToast` + 全ルート |
| `src/modals/PersonForm.tsx` | **編集可能な人物フォーム**（add / edit モード切替）。FuzzyDateInput はここに内包 |
| `src/modals/NewFamilyModal.tsx` | **編集可能な家系作成フォーム** |
| `src/pages/TreeEditorPage.tsx` | **独自レイアウトエンジン**・パン・ズーム・Inspector 開閉 |
| `src/pages/MemoryEditorPage.tsx` | **編集可能な思い出エディタ**（タイトル／メタ／本文／写真／タグ／閲覧者） |
| `src/pages/DashboardPage.tsx` | **ストア駆動・スクロールなし** |
| `src/pages/SettingsPage.tsx` | **トグル・セレクト動作・確認トースト** |
| `src/pages/MemoriesListPage.tsx` | ストア駆動・フィルタ動作 |
| `src/pages/MemoryDetailPage.tsx` | ストア駆動・前後ナビ |

### B-5. 機能横断 — 未実装のモジュール（パス）

```
src/domain/
  types.ts          ☐   Person / Union / ParentChildLink / Memory / Family 等
  fuzzyDate.ts      ☐   元号⇄西暦・比較・表示フォーマッタ
  selectors.ts      ☐   両親・配偶者・子・世代・検索・canViewMemory

src/storage/
  localStoreAB.ts   ☐   2 スロット交互書き込み（.a / .b）
  idb.ts            ☐   idb ラッパ（photos ストア）

src/stores/
  familyStore.ts    ☐   現在家系のドメインデータ（手動 save）
  appStore.ts       ☐   家系一覧・アクティブ家系・リマインド
  uiStore.ts        ☐   lightbox / dialog / toast

src/components/     ☐   本番用コンポーネント（Phase 6 で primitives から切り出し）

src/features/
  tree/
    layout.ts       ☐   d3-hierarchy + Union 中心の自前補正
    TreeEdges.tsx   ☐   夫婦線の中点 → 子への接続
    PersonNode.tsx  ☐   実データ版
    MiniMap.tsx     ☐   実データ版
    exportImage.ts  ☐   html-to-image（フォント self-host + cacheBust）
  memory/
    RichText.tsx    ☐   TipTap StarterKit + Placeholder + Link
    PhotoGrid.tsx   ☐   max=10／+ ボタンの活殺
    ViewerPicker.tsx☐   書き手ロック＋候補追加
    accessControl.ts☐   canViewMemory
  photos/
    Lightbox.tsx    ☐   14 の本実装
    cropSquare.ts   ☐   Canvas で正方形クロップ
    resize.ts       ☐   1600px / quality 0.82 / サムネ 320
  importExport/
    writeFtree2.ts  ☐   JSZip で .ftree2 生成
    readFtree2.ts   ☐   version 検査・プレビュー

src/pwa/
  registerSW.ts     ☐   vite-plugin-pwa 側の SW 登録
  persist.ts        ☐   storage.persist() / estimate()

public/
  icons/            ☐   192 / 512 / maskable-512
  fonts/            ☐   Kaisei Decol / Klee One self-host

vite.config.ts      ☐   vite-plugin-pwa GenerateSW 組込み
src/styles/tokens.css ☐ 色・タイポの CSS 変数化
```

### B-6. 次の一歩（推奨順）

1. **Phase 0** — tokens.css ／ Tailwind 設定 ／ フォント self-host ／ vite-plugin-pwa 組込み（半日）
2. **Phase 2** — `domain/` 型と FuzzyDate（半日）
3. **Phase 3** — `storage/` の A/B 2 スロット＋ IDB（半日）
4. **Phase 4** — `stores/` の 3 ストア＋ルートガード接続（半日）
5. **Phase 6** — 各ページに実データ結線。最重量は **03 TreeEditor（レイアウト engine）** と **15 MemoryEditor（TipTap + ViewerPicker）**（1〜2 週間）
6. **Phase 7** — 写真クロップ／リサイズ／Lightbox Blob 読込／`.ftree2` の write/read（2〜3 日）
7. **Phase 8** — PWA 有効化（1 日）
8. **Phase 9** — 空状態／容量警告／モバイル層の実ページ組込（2 日）

**確認方法（現時点）:**
```bash
npm install
npm run dev
# 開発サーバは GitHub Pages と同じ base で立ち上がる
# → http://localhost:5173/family-tree2/

# 実アプリ（HashRouter）:
#   /family-tree2/#/              Landing
#   /family-tree2/#/home          Dashboard（スクロールなし）
#   /family-tree2/#/new           新規家系（全項目入力可）
#   /family-tree2/#/family/yamada/tree     家系図（パン・ズーム・選択）
#   /family-tree2/#/family/yamada/person/new   人物追加（FuzzyDate 動作）
#   /family-tree2/#/family/yamada/memory/new   思い出エディタ（タイトル／本文／写真／タグ／閲覧者）
#   /family-tree2/#/settings      設定（トグル動作）

# デザイン参照:
#   /family-tree2/#/__wireframes

# 状態パターン:
#   /family-tree2/#/_empty / _quota / _pwa / _mobile
```

### B-7. 今回のセッションで済ませた事項（2026-04-23・午後）

1. **`vite.config.ts` に `base: "/family-tree2/"`**
2. **BarePage のスクロール制御**：`scroll="fixed"`（デフォルト）でヘッダ固定・body 内スクロール。Landing のみ `"flow"`。
3. **AddPerson/EditPerson ダイアログ** のサイズを `calc(100vh - 120px)` に制限し、**外側スクロール禁止・内側 body のみスクロール**。
4. **MemoryEditor の主人公／時期／書き手** を `align="flex-start"` + `reserveHint` で高さ統一（"あなた" の hint による崩れを修正）。
5. **家系図エディタ**：世代間 180px・人物間 48px の再レイアウト／ドラッグでパン／Ctrl+ホイール・ボタンでズーム／Inspector は開閉可、選択なし時は空状態／ツールバーのモード切替／保存／PNG 書き出し案内。
6. **Zustand ストア** 導入。家系・人物・思い出・トースト・リマインド・テーマ・閲覧者を Mutation 可能に。
7. **Field プリミティブ** を controlled 化（`onChange` で real `<input>`/`<textarea>` を描画）。
8. **NewFamily / AddPerson / EditPerson / MemoryEditor** は全項目編集可能に。保存でストアに反映＆トースト。
9. **Dashboard** をストア駆動にし、グリッドはビューポート内にフィット（外側スクロールなし・内部グリッドのみ折返し）。
10. **Settings** の月 1 リマインドトグル／テーマ／閲覧者選択／各種ボタンが動作（未実装機能はトーストで明示）。
11. **GlobalToast** をアプリ全体で表示。

### B-8. 今回のセッションで新たに実装した事項（2026-04-23・夕方）

#### 永続化
- `src/storage/localStoreAB.ts`：`.a`／`.b` の 2 スロット交互書き込み（`seq` 番号で最新採用）。
- `src/storage/idb.ts`：IndexedDB `ft2` / store `photos`（`<id>` 本体＋`<id>.thumb`）。`getPhotoUrl` でキャッシュ付き Blob URL。
- `src/stores/familyStore.ts` に `persist` ミドルウェア → `localStoreAB` 経由で自動永続化。**リロードしても家系／人物／思い出／写真が残る。**
- `beforeunload` で `dirty` 時に警告（`App.tsx`）。

#### ドメイン層
- `src/domain/types.ts`（型の正本）／ `fuzzyDate.ts`（元号変換・比較・表示）／ `selectors.ts`（`canViewMemory` / `parentsOf` / `childrenOf` / `spousesOf` / `siblingsOf` / `memoriesOfPerson`）。

#### UI の接続
- **ヘッダ「家系名 ▾」** をインプレース・ドロップダウン化（`FamilyMenuDropdown`）。家系切替／新規／取り込み／書き出し／テーマ／削除。
- **PersonDetail** を完全にストア連動（肖像・ふりがな・生没・ロール編集・備考・関連思い出のみ `canViewMemory` フィルタ・家族サイドバー click で移動・「この人物を削除」で 20 へ）。
- **20 Delete** を 4 パターン切替＋**実削除**。家系は名前一致チェック＋「先に書き出す」導線。全データ初期化で `idb.clearPhotos()` ＋ `familyStore.wipe()`。

#### Phase 7 — 写真と .ftree2
- `src/features/photos/resize.ts`：Canvas リサイズ（最大辺 1600px・JPEG q=0.82）＋正方形クロップ（サムネ 320px）。
- `src/features/photos/ingest.ts`：`<input type=file>` ピッカー＋ `ingestFile` で IDB へ保存。
- `src/features/photos/PhotoFromIdb.tsx`：任意 `PhotoId` を受け取って Blob URL を描画。
- `src/modals/PhotoLightbox.tsx`：実 Blob を `<img>` で表示・左右送り・キーボード操作・ダウンロード。
- `src/features/importExport/writeFtree2.ts`：JSZip で `manifest.json` + `family.json` + `photos/*.jpg` / `*.thumb.jpg` を同梱。File System Access API が使える環境では save picker、なければ `<a download>` フォールバック。
- `src/features/importExport/readFtree2.ts`：`previewFtree2` + `commitImport`（`version` 検査→ `ImportError(corrupt|version|quota)`）。
- **Open (08)／Import (10)／Settings (09) 書き出し** が実ファイル動作。**11 取り込みエラー**は query-string `kind` で 3 パターン分岐。

#### Phase 6 — TipTap + 家系図
- `src/features/memory/RichEditor.tsx`：StarterKit + Placeholder + Link。見出/本文/太字/斜体/引用/箇条書き/番号/リンク/Undo/Redo。原稿用紙罫線を維持。
- **MemoryEditor** で本文が TipTap HTML に／**MemoryDetail** は HTML を生描画（`dangerouslySetInnerHTML` + カスタム CSS）。プレーンテキストにはドロップキャップを維持。
- **MemoryEditor の写真** は実 `<input type=file>` → リサイズ → IDB、サムネを `PhotoFromIdb` で描画。削除で IDB エントリも消す。

#### Phase 6 — 閲覧者フィルタ
- **Memories list** と **MemoryDetail** が `canViewMemory(m, currentViewerPersonId)` を適用。非公開思い出は「自分を切り替える」導線で Settings へ。

#### Phase 8 — PWA
- `vite.config.ts`：`vite-plugin-pwa`（GenerateSW）、manifest、`workbox.runtimeCaching` で Google Fonts を CacheFirst、`registerType: "prompt"`。
- `public/icons/`：`icon-192.svg` / `icon-512.svg` / `maskable-512.svg`（家紋風）。
- `src/pwa/registerSW.ts`：`onNeedRefresh` で更新通知、10 秒後に自動反映。
- `src/pwa/persist.ts`：`navigator.storage.persist()` 要求 ＋ `estimate()` で Settings バー実測。
- `src/pwa/reminder.ts`：起動時に月経過＋未書き出しなら WARN トースト＋ `reminderShownAt` 記録。
- `src/types/pwa.d.ts`：`virtual:pwa-register` 型宣言。

#### Phase 0 / 9 / 10
- `src/styles/tokens.css`：色・フォントを CSS 変数化（`--bg-paper`, `--ink-sumi`, `--accent-shu`, `--font-mincho` 等）。`index.css` から `@import`。
- Dashboard／Memories に空状態の埋め込み。
- `.github/workflows/deploy.yml`：main push で `npm ci && npm run build` → `actions/upload-pages-artifact` → `actions/deploy-pages`。

### B-9. 追加実装（2026-04-23・夜）— 関係と思い出の残欠落を埋める

- **13 RelationAddModal** を実動作に：起点人物 + 6 関係タイプ + 既存人物ピッカー/新規人物作成 + 期間/解消。`addUnion` / `addParentChildLink` / `addPerson` を実際に呼ぶ。兄弟は「起点の親リンクを新人物にもコピー」で表現。
- **22 EditPerson の「関係」セクション** をハードコードから剥がし、`parentsOf` / `spousesOf` / `childrenOf` 経由でストアから描画。各行の「外す」が `removeUnion` / `removeParentChildLink` を呼び出して即反映。
- **familyStore** に `removeUnion` / `removeParentChildLink` を追加。union 削除時は依存する parent-child link も削除。
- **15 MemoryEditor に「関連する人物」** セレクト picker を復活。Chip で追加/削除、保存時に `memory.related` に永続化。
- **03 TreeEditor の「／ 線」ツール** を実動作に：1 人目クリックで源、2 人目クリックで `?pid=&partner=` 付きで RelationAddModal へ遷移。
- **RelationAddModal** が `partner` クエリを読み、相手を自動選択済みで開く。

### B-10. 既知の限界（残課題）

- **Zustand 3 ストア分離**：現状は `familyStore` に全て同居。DESIGN.md §4.1 の `appStore` / `uiStore` 分割は未。
- **d3-hierarchy**：未使用。`TreeEditorPage.layoutFamily()` は世代単位の均等配置で、多世代・再婚・養子が複雑化した場合は破綻し得る。
- **ノードのドラッグ個別移動**：パン／ズームは実装済みだが、個別ノードを掴んで移動する操作は未。
- **モバイル下部タブ**：`/_mobile` のデザイン参考のみ。実ルートへのメディアクエリ適用は未。
- **フォント self-host**：Google Fonts CDN のまま。
- **`storage.persist()` が許可されないブラウザ** ではリロード時の永続化保証なし（ただし A/B 書き込み自体は動作）。
- **家系図 PNG 書き出し**：`html-to-image` で実装済みだが、ズーム・パン状態を反映した見た目をそのまま出力。「fit to page」相当のオートフィットは未。
- **Union の期間 / 解消フラグ**：RelationAddModal の UI は入っているが、Union 型に `period`/`dissolved` を書き込む結線は未（DESIGN.md §3.2 の FuzzyRange を待つ）。
- **Import の 3 段ステッパ** は現在 2 段（選択 → プレビュー / 実行）で十分機能するが、DESIGN.md の 3 分割とは揃っていない。
