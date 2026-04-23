# Handoff: ファミリーツリー２（日本の家系図 PWA）

Claude Code でのローカル実装用ハンドオフパッケージ。

---

## 概要（Overview）

「絵本のように」家族の歴史を残せる、**端末内完結型**の家系図 Web アプリ。
高齢の日本語ユーザーが写真・エピソード・関係性を記録し、次世代へ引き継げる体験を提供する。

- **言語**: 日本語のみ
- **対象**: シニア世代（親・祖父母）
- **配信**: GitHub Pages（静的）
- **PWA**: ホーム追加・オフライン動作
- **データ**: クラウド非利用、localStorage + IndexedDB のみ

## このバンドルについて（About the Design Files）

同梱の HTML／TSX ファイルはすべて**デザインリファレンス**です。
意図した見た目と挙動を示す**ワイヤーフレーム（低忠実度）プロトタイプ**であり、そのままコピペして本番に投入するコードではありません。

タスクは、このワイヤーフレームをもとに、本 README と `DESIGN.md` に沿って
**Vite + React + TypeScript + Tailwind CSS** のプロジェクトを新規に立ち上げ、
機能を段階的に実装していくことです。

## 忠実度（Fidelity）

**低忠実度（Lo-fi）ワイヤーフレーム** です。

- 目的: 画面構成・情報階層・主要インタラクションの確定
- スタイル: 墨 + 朱 + クリーム背景の「絵本スケッチ」調。手描き風フォントで最終ビジュアルではないことを明示
- 開発者はレイアウトと機能をこれらから読み取り、**最終的なビジュアル方向性は別途ハイファイ UI キットで確定**する
- 現段階では正しい**構造・要素・コピーライティング・情報密度**を再現することを優先

## 画面一覧（22 画面）

詳細は `DESIGN.md §2` 参照。

| # | 画面 | ルート | 役割 |
|---|---|---|---|
| 01 | ランディング | `/` | 未ログイン時のトップ |
| 02 | ダッシュボード | `/home` | 家系切替・一覧 |
| 03 | 家系図エディタ | `/family/:id/tree` | **中核画面** |
| 04 | 人物詳細 | `/family/:id/person/:pid` | 人物プロフィール |
| 05 | 人物を追加 | `/family/:id/person/new` | モーダル |
| 06 | 思い出一覧 | `/family/:id/memories` | タイムライン |
| 07 | 新規家系作成 | `/new` | モーダル |
| 08 | ファイルを開く | `/open` | .ftree2 取り込み入口 |
| 09 | 設定 | `/settings` | データ管理 |
| 10 | 取り込み | `/import` | .ftree2 プレビュー |
| 11 | 取り込みエラー | — | モーダル |
| 12 | 家系メニュー | — | ドロップダウン |
| 13 | 関係を追加 | — | モーダル |
| 14 | 写真ライトボックス | — | 最大 10 枚 |
| 15 | 思い出を書く | `/family/:id/memory/:mid/edit` | **閲覧者登録あり** |
| 16 | 思い出を読む | `/family/:id/memory/:mid` | 閲覧ガード |
| 17 | PWA スプラッシュ / オフライン | — | SW 制御 |
| 18 | 空状態（6種） | — | 各画面内 |
| 19 | モバイル版 | — | レスポンシブ |
| 20 | 削除の確認 | — | 二重確認モーダル |
| 21 | 容量・エラー警告 | — | トースト／ダイアログ |
| 22 | 人物を編集 | `/family/:id/person/:pid/edit` | モーダル |

各画面のワイヤーフレームは `wireframes/Wire01Landing.tsx` 〜 `Wire22EditPerson.tsx` を参照。
統合ビューは `Wireframes.html` をブラウザで開けば確認可。

## 確定事項（重要）

| # | 項目 | 決定 |
|---|---|---|
| Q1 | 複数家系の切替 | マイ家系図画面で切替可 |
| Q2 | 同名家系取り込み | **両方残す**。家系は ID で管理 |
| Q3 | クラウド同期 | **今後も実装しない** |
| Q4 | 画像最大辺 | **1600px**（JPEG 0.82・サムネ 320px） |
| Q5 | パスコード保護 | 実装しない（閲覧者制御は UI フィルタのみ） |
| Q6 | スタイル | **Tailwind + CSS 変数** 併用 |
| Q7 | リッチテキスト | **TipTap**（H1/H2・太字・斜体・引用・リスト） |
| Q8 | 自動テスト | v0.1 では**実装しない** |
| Q9 | Lint / Format | **ESLint v9（flat config）+ Prettier**、ダブルクォート、保存時フォーマット |
| Q10 | Node | **Node 24** |
| — | **自動保存** | **なし**（手動保存ボタンのみ） |
| — | URL 共有 | 廃止 |
| — | 印刷 | 廃止、「画像保存」のみ |

## 技術スタック

詳細は `DESIGN.md §1.4` 参照。

- React 18 / TypeScript 5 / Vite 5 / Tailwind 3
- React Router v6
- Zustand（3ストア: family / app / ui）
- TipTap（@tiptap/react, @tiptap/pm, @tiptap/starter-kit, @tiptap/extension-placeholder, @tiptap/extension-link）
- d3-hierarchy（家系レイアウト）
- idb（IndexedDB）
- jszip（.ftree2 生成・展開）
- html-to-image（家系図 PNG 保存）
- vite-plugin-pwa / workbox-window

## データモデル（要点）

詳細型定義は `DESIGN.md §3.2`。

```ts
interface Family {
  id: string;
  name: string;
  rootPerson: PersonId;
  persons: Record<PersonId, Person>;
  unions:  Record<UnionId,  Union>;       // 夫婦中間エンティティ（再婚対応）
  links:   ParentChildLink[];             // 親(Union|Person) → 子
  memories: Record<MemoryId, Memory>;
  meta: { version: "1"; createdAt; updatedAt; lastExportAt? };
}

interface Memory {
  id: MemoryId;
  title: string;
  body: RichTextJSON;          // TipTap JSON
  period?: FuzzyDate;
  author: PersonId;              // 書き手・常に閲覧可
  protagonist?: PersonId;        // 主人公
  viewers: PersonId[];           // 閲覧者（書き手以外で読める人）
  related: PersonId[];
  tags: string[];
  photos: PhotoId[];             // <= 10
  createdAt: number; updatedAt: number;
}
```

**重要なルール:**

- 子は**夫婦（Union）の中点**から接続線を下ろす（片親からではない）
- `Memory` の閲覧権限は `canViewMemory(m, viewerPersonId)`:
  - `viewerPersonId === m.author` → 可
  - `m.viewers.includes(viewerPersonId)` → 可
  - それ以外 → 不可
- FuzzyDate は元号・年のみ・不明に対応

## ストレージ戦略

| 種別 | 保存先 | キー |
|---|---|---|
| アプリ状態 | localStorage | `ft2.state.v1`（A/B 2 スロット交互） |
| 家系本体 | localStorage | `ft2.family.<id>.v1` |
| 画像 Blob | IndexedDB | DB:`ft2` store:`photos` key:`PhotoId` |

`.ftree2` は ZIP 形式:
```
/manifest.json        { version:"1", exportedAt, family:{id,name} }
/family.json          Family 構造（画像は PhotoId 参照）
/photos/<id>.jpg      元画像（最大辺 1600px）
/photos/<id>.thumb.jpg サムネ 320px
```

## ルーティング・コンポーネント

`DESIGN.md §4.2` を正として実装。主要ガード:

- `family/*` 共通: 対象 Family が localStorage に無ければ `/home` へ
- `memory/:mid` 入口: `canViewMemory()` が false なら 403 空状態
- `memory/:mid/edit` は author のみ許可

## 状態管理

`DESIGN.md §4.1` 参照。Zustand 3 ストア:

- `useFamily` — 開いている家系のドメイン＋`dirty`／`save()` 手動
- `useApp` — 家系リスト・アクティブ家系
- `useUI` — ライトボックス・ダイアログ・トースト

**自動保存はしない。** `dirty===true` で離脱しようとしたら `beforeunload` で警告。

## ビジュアルトークン（ワイヤー時点）

本実装前にハイファイ UI キットで確定予定ですが、ワイヤーは以下を使用:

- 背景: `#FFFEF8`（本文）／ `#F5F0E1`（薄クリーム）／ `#E8E2D0`（アプリ外余白）
- 前景: `#1A1915`（墨）／ `#6B6456`（補助）／ `#8B8574`（薄墨）
- アクセント: `#C0392B`（朱印・強調）／ `#FDF6C8`（付箋）
- 見出し: `Kaisei Decol`（毛筆明朝）
- 本文・注釈: `Klee One`（手書き風）

これらは `:root` の CSS 変数として定義し、Tailwind の `theme.extend.colors` でエイリアスを張る運用。

## ディレクトリ構成

`DESIGN.md §6` が正。主な骨格のみ再掲:

```
src/
├── main.tsx / App.tsx
├── pages/          画面（01〜22 の page 部分）
├── modals/         モーダル系
├── features/
│   ├── tree/       TreeCanvas, TreeEdges, layout, exportImage
│   ├── memory/     RichText, PhotoGrid, ViewerPicker, accessControl
│   ├── photos/     Lightbox, cropSquare, resize
│   └── importExport/  writeFtree2, readFtree2
├── stores/         familyStore, appStore, uiStore
├── storage/        localStoreAB, idb
├── domain/         types, fuzzyDate, selectors
├── components/     共通 UI（Hanko, SketchBtn, Photo, Dialog, Toast 等）
├── pwa/            registerSW, persist
├── styles/         tokens.css, global.css
└── wireframes/     低忠実度プレビュー（開発時のみ。ハイファイ版ができたら削除可）
```

## 開発コマンド

```bash
nvm use 24            # Node 24
npm install
npm run dev           # 開発サーバー
npm run build         # tsc + vite build
npm run preview
npm run typecheck
npm run lint
npm run format
```

VS Code で開くと `.vscode/settings.json` により保存時に Prettier 整形 + ESLint 自動修正。

## ファイル

本パッケージに含まれるファイル:

- `README.md`（本書）
- `DESIGN.md` — 設計書（1 概要 / 2 画面設計 / 3 データ / 4 コンポーネント / 5 PWA / 6 ディレクトリ）
- `Wireframes.html` — 22 画面のプレビュー（ブラウザで直接開ける）
- `src/wireframes/` — 各画面 TSX（22 ファイル + `primitives.tsx` + `index.ts`）
- `package.json` / `tsconfig.json` / `vite.config.ts` / `tailwind.config.js` / `postcss.config.js`
- `.prettierrc.json` / `eslint.config.mjs`
- `.vscode/settings.json` / `.vscode/extensions.json`

## 実装の進め方（推奨順）

1. `npm install` で依存解決を確認
2. `DESIGN.md §6` に従い空のディレクトリ構造を作成
3. `domain/types.ts` と `domain/fuzzyDate.ts` を実装
4. `storage/localStoreAB.ts` と `storage/idb.ts` を実装
5. `stores/*` の骨組み
6. ルーティング・App シェル
7. 画面を 03 家系図エディタ → 02 ダッシュボード → 04 人物詳細 の順で肉付け
8. 思い出系（06 → 15 → 16）を実装（`accessControl.ts` を先に）
9. インポート／エクスポート（10・08・09）
10. PWA 化（17）・空状態（18）・モバイル調整（19）
11. ワイヤー段階の UI を、後続のハイファイ UI キットに差し替え
