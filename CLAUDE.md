# Claude Code ガイド（family-tree2）

Claude Code がこのリポジトリで作業する際の運用指針。ユーザーからの直接指示が優先。曖昧なときは本書のルールに従う。

---

## プロジェクトの要点（30 秒で把握）

- **日本語専用**の家系図 PWA。端末内完結・クラウドなし・オフライン動作。
- React 18 + TypeScript + Vite 5 + Tailwind 3 + Zustand 4 + TipTap + JSZip + idb + html-to-image + vite-plugin-pwa。
- GitHub Pages 配信（`base: "/family-tree2/"`、HashRouter）。
- 永続化は localStorage A/B スロット（`ft2.state.v1.{a,b}`）＋ IndexedDB（写真）。
- 仕様の正本は `doc/DESIGN.md`。実装進捗と残課題は `doc/IMPLEMENTATION_PLAN.md`。
- 全機能は **1 つの Zustand ストア**（`src/stores/familyStore.ts`）に集約。DESIGN.md では 3 ストア想定だが現状は 1。

---

## 作業前チェックリスト

1. **仕様変更が絡む場合** — `doc/DESIGN.md` 該当節を先に読む（§2.3 画面詳細・§3.2 型・§4.2 ルート・付録 A 確定事項）。
2. **型を触る場合** — `src/domain/types.ts` を先に読む（正本）。
3. **レイアウトを触る場合** — `src/pages/TreeEditorPage.tsx` の `layoutFamily()` と `EdgesLayer`。子は夫婦中点から線を引く（DESIGN.md §2.3 03）。
4. **ストアに触る場合** — `src/stores/familyStore.ts`。`persist` ミドルウェアで `localStoreAB` に書く。キーは `ft2.state.v1`。

---

## ビルド / 検証コマンド

```bash
npm install
npm run dev        # http://localhost:5173/family-tree2/
npm run build      # tsc && vite build（必ず両方通す）
npm run typecheck
npm run lint
npm run format
```

コード変更後は **必ず `npx tsc --noEmit` と `npx vite build` を通す**。型エラー・ビルドエラーを残してタスク完了と報告しない。

---

## 画面確認の方法（重要）

Claude Code にはブラウザ描画結果を目で見る能力がありません。視覚不具合（ずれ・スクロール・線の消失など）は以下の手段で検証します。

### 方法 A — Playwright スクリプト（確実）

```bash
# 初回セットアップ（完了済のことが多い）
npm install --no-save --legacy-peer-deps playwright
npx playwright install chromium

# 使い方
npx vite --port 5173 --host 127.0.0.1 &
node scripts/<name>.mjs   # 既存スクリプトを参考に
# スクショは screenshots/ 配下に保存。Read ツールで PNG を開いて目視確認。
```

既存スクリプト:
- `scripts/inspect.mjs` — SVG 座標・ノード位置を数値ダンプ
- `scripts/dual-ancestor.mjs` — localStorage を seed して複数シナリオを比較
- `scripts/export-test.mjs` — PNG 書き出し検証（ダウンロードをインターセプト）
- `scripts/scroll-audit.mjs` / `scroll-audit2.mjs` — スクロール発生箇所の特定
- `scripts/yearpicker.mjs` — YearPicker の動作確認

### 方法 B — Playwright MCP（再起動後に利用可）

`.mcp.json` に `@playwright/mcp` を設定済み。Claude Code 再起動＋承認で `mcp__playwright__*` ツールが使える。

### 方法 C — ユーザーからスクショ

ユーザーが貼り付けた画像は Read ツールで視覚として読める。特定のズレを指摘する場合はこれが最速。

---

## コード規約

- **言語**: UI・コメント・コミットメッセージは日本語 OK。技術用語は英語のままで可。
- **引用符**: ダブルクォート統一（Prettier 設定）。
- **コメント**: 「なぜ」だけ書く。「何」は識別子で伝える。長いドキストリングは書かない。
- **import パス**: `"../components/ui"` のような相対パス。絶対パスエイリアスは未設定。
- **JSX**: 関数コンポーネント＋フック。クラスコンポーネントは使わない。
- **CSS**: インラインスタイル（`style={{...}}`）が基本。Tailwind クラスは最小限。色・フォントは `src/components/ui.tsx` の `C` / `F` 定数を参照（または CSS 変数 `--ink-sumi` など）。
- **トースト**: `useFamilyStore.getState().showToast("ok"|"warn"|"err", text)`。
- **ストア書き込み**: 必ず mutator アクション（`addPerson`、`patchMemory` など）経由。直接 `set` は使わない。

---

## よく触るファイル（地図）

| やりたいこと | 触るファイル |
|---|---|
| 人物追加フォーム | `src/modals/PersonForm.tsx` |
| 関係追加ロジック | `src/modals/RelationAddModal.tsx`（`ChildFlow` / `ParentFlow` / `SpouseFlow` / `SiblingFlow`） |
| 家系図のレイアウト | `src/pages/TreeEditorPage.tsx` — `layoutFamily()` と `EdgesLayer` と `PrintTree` |
| 思い出本文 | `src/pages/MemoryEditorPage.tsx` + `src/features/memory/RichEditor.tsx`（TipTap） |
| 永続化 | `src/stores/familyStore.ts`（store）・`src/storage/localStoreAB.ts`（2 slot）・`src/storage/idb.ts`（写真） |
| 写真処理 | `src/features/photos/{ingest,resize,PhotoFromIdb}.ts(x)` |
| `.ftree2` | `src/features/importExport/{writeFtree2,readFtree2}.ts` |
| PWA | `src/pwa/{registerSW,persist,install,reminder}.ts` / `vite.config.ts` / `public/icons/*` |
| 利用規約・プライバシー文面 | `src/data/legal/{terms,privacy}.json` — スキーマは `types.ts` |
| デザイントークン | `src/components/ui.tsx`（`C`, `F`） / `src/styles/tokens.css` |

---

## 家系図レイアウトの不文律

- **子は夫婦中点から**接続線を下ろす（片親からは出さない）
- 子の位置は **両側の親 union の中点の中間**に置く（父側のみなら父 union 直下）
- 兄弟間隔は下層に子孫が多いほど自動で広がる（subtree 幅を足し上げる）
- **片側にしか grandparent がない場合**も、他方の配偶者 union から線を出す（両親 union 独立処理）
- `isTopAncestor` ルール：親リンク無し **かつ** 配偶者にも親リンク無し の人物のみルート候補。配偶者が子扱いされる人物はルートから除外（同世代並列の誤配置を防止）

---

## スクロール所有権（絶対に崩さない）

```
html / body / #root       overflow: hidden, height: 100%/100vh
BarePage scroll="fixed"   height: 100vh, overflow: hidden（内部で overflowY:auto が独立に動く）
BarePage scroll="flow"    height: 100vh, overflowY: auto（Landing/法的文書）
```

`src/main.tsx` で `import "./index.css"` を **必ず** 忘れないこと。これを落とすと body の既定 margin 8px が復活して `<html>` が 16px 分スクロールする。

---

## ルートガード（未実装分の扱い）

- `family/:fid/*` で `fid` が未知の場合 → 現状はそのまま表示して空データになる。`/home` リダイレクトガードは未実装。新規に作る場合は `App.tsx` のルート定義で wrapper を入れる。
- `memory/:mid/edit` の `author` チェック → 未実装。

---

## 禁止 / 注意事項

- `<select>` のフォントサイズを `14px` 未満にしない（iOS Safari でフォーカス時に自動ズームする）。
- `@tiptap/react` の `Editor` は `useEditor` で得た値を直接 state に入れない（無限ループになる）。`onUpdate` で HTML を抽出して state へ。
- `localStoreAB.saveAB` は QuotaExceededError を上位に投げる。必ずキャッチしてトースト表示。
- `storage.persist()` はユーザーアクション起因で呼ぶ（Settings の「許可を要求」ボタン）。自動起動で呼ばない。
- 自動保存は **しない**。`保存` ボタン押下で `markClean()` → Zustand `persist` で自動的にストレージへ書かれる。`dirty` 中はヘッダに `● 未保存の変更あり`。

---

## 検索・参照優先順位

1. このリポジトリ内のファイル（`Grep` / `Glob` / `Read`）
2. `doc/DESIGN.md` と `doc/IMPLEMENTATION_PLAN.md`
3. 型定義（`src/domain/types.ts`）
4. 過去のコミット（`git log`）

Web 検索や外部 MCP は、上記で解決しない場合のみ。

---

## 作業完了の定義

以下をすべて満たしてから完了を報告する:

1. `npx tsc --noEmit` が `exit 0`
2. `npx vite build` が成功（警告は許容）
3. 変更した画面・フローは Playwright スクリプトで最低 1 パターン描画確認（視覚崩れ系の修正では必須）
4. ユーザーの指示事項が全項目反映されている
5. `doc/IMPLEMENTATION_PLAN.md` に影響がある場合は更新
