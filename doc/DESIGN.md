# ファミリーツリー２ ・ 設計書（SPEC）

作成日: 2026年
最終更新: 2026-04-24（本書＋`IMPLEMENTATION_PLAN.md` で現状反映）
対象バージョン: v0.1（MVP）／ PWA
対象読者: 開発者・デザイナー・プロダクトオーナー

> **実装状況サマリ（2026-04-24 更新）**
> 本設計書は当初の仕様の正本ですが、実装の過程で **意図的に逸脱した箇所** があります。
> 詳細は本書末尾の **付録 B・実装の現状と仕様からの逸脱** を参照。
> 主な逸脱:
> - Zustand は **3 ストア分割ではなく 1 ストアに集約**（`src/stores/familyStore.ts`）
> - d3-hierarchy は不採用、**独自の世代ベースレイアウトエンジン**（`TreeEditorPage.tsx` 内 `layoutFamily()`）
> - TipTap 本文は **JSON ではなく HTML 文字列**として保存
> - 追加ルート: `/terms`・`/privacy`（JSON 駆動の法的文書）
> - **テーマ機能は削除**（`Family.theme` / `themeColor` / `store.theme` / UI 切替とも撤去。Dashboard カードの帯色は固定）
> - アプリアイコンは **`icon-512.svg` 単一ソース**（SVG の vector なので any / maskable を同一ファイルで兼ねる）

---

## 1. プロジェクト概要

### 1.1 目的

家族の歴史を「絵本のように」残すための、**端末内で完結する**家系図アプリを提供する。

- 写真・エピソード・関係性を一つの体験にまとめ、次世代へ引き継ぎやすい形で保存する
- クラウド不使用・サインアップ不要で、プライバシーを最優先する
- 高齢ユーザー（親世代・祖父母世代）でも操作できる平易な UI
- ブラウザ／スマホの PWA として動き、オフラインでも閲覧・編集可能

### 1.2 スコープ

**含むもの（v0.1 MVP）:**
- 家系図の作成・編集・閲覧（複数家系の保持・切替）
- 人物情報（氏名・生没年・写真・備考・関係）
- 思い出ノート（１エピソード＝１ページ、画像最大 10 枚、**閲覧者制御あり**）
- 家系ファイル（.ftree2）の書き出し・取り込み
- PWA インストール・オフライン動作
- 画像書き出し（家系図の PNG 保存）
- 端末内保存（localStorage + IndexedDB）
- レスポンシブ（スマホ・タブレット・PC）

**含まないもの（将来）:**
- クラウド同期・ユーザーアカウント・サーバー通信
- 複数端末間のリアルタイム共有
- GEDCOM インポート
- AI による関係推定・人物抽出
- 商用課金・決済

### 1.3 用語定義

| 用語 | 定義 |
|---|---|
| **家系（Family）** | ひとつの家系図のルート単位。1 ユーザーが複数保持可能。 |
| **人物（Person）** | 家系に属するひとりの人間ノード。 |
| **関係（Relation）** | 人物と人物をつなぐ有向・無向のリンク。夫婦・親子・養子等。 |
| **Union** | 夫婦・パートナー関係を表す中間エンティティ。再婚に対応するため採用。 |
| **ParentChildLink** | 親（Union もしくは単独人物）と子を結ぶリンク。 |
| **思い出ノート（Memory）** | １エピソード＝１ページのリッチテキスト＋写真 10 枚以内の記事。 |
| **書き手（Author）** | 思い出ノートを作成したユーザー＝所有者。常に閲覧可。 |
| **閲覧者（Viewer）** | 書き手が登録した、そのノートを読める人物。書き手以外の閲覧制御はここで行う。 |
| **主人公（Protagonist）** | 思い出ノートで「主に誰の思い出か」を示す任意の人物参照。 |
| **FuzzyDate** | 「元号」「年のみ」「不明」を扱える日付型。 |
| **.ftree2** | 家系データ（JSON）＋画像（Blob）を ZIP 化した交換フォーマット。 |
| **PWA** | Progressive Web App。ホーム追加可・オフライン起動可。 |

### 1.4 技術スタック

| 層 | 採用技術 | 採用理由 |
|---|---|---|
| 言語 | **TypeScript 5.x** | 型安全・エディタ支援 |
| フレームワーク | **React 18** | 経験人口・エコシステム |
| ビルド | **Vite 5** | 高速 DX・PWA プラグイン充実 |
| ルーティング | **React Router v6** | ネストルートとデータ API |
| 状態管理 | **Zustand** | Redux より軽量・React 外でも使える |
| スタイル | **Tailwind CSS + CSS 変数（テーマトークン）** | ユーティリティ速記＋テーマは CSS 変数で切替可能に |
| フォント | Kaisei Decol / Klee One（Google Fonts self-host） | 毛筆明朝＋手書き風 |
| 家系レイアウト | **d3-hierarchy + 自前エンジン** | 再婚・多配偶者に対応のため自前調整 |
| リッチテキスト | **TipTap（ProseMirror）** | 日本語 IME・H1/H2/太字程度で十分 |
| データ（構造） | **localStorage**（ラッパ: idb-keyval 併用） | テキスト軽量・即時読み出し |
| データ（画像） | **IndexedDB**（ライブラリ: `idb`） | Blob 直保存・大容量 |
| ファイル書き出し | **JSZip** + `File System Access API`（対応時） | .ftree2 の構築 |
| PWA | **vite-plugin-pwa（Workbox）** | SW・マニフェスト・プリキャッシュ |
| 画像書き出し | **html-to-image** | 家系図 DOM → PNG |
| テスト | — | v0.1 では自動テストなし |
| Lint / Format | **ESLint v9（flat config）+ Prettier**（ダブルクォート・保存時フォーマット） | 標準構成 |
| Node | **Node 24** | `engines` で明示 |
| 配信 | **GitHub Pages / Cloudflare Pages** | 静的配信で足りる |

---

## 2. 画面設計

### 2.1 画面一覧

全 22 画面。v0.1 で実装するものは ✓。

| # | 画面名 | ルート | v0.1 | 備考 |
|---|---|---|:-:|---|
| 01 | ランディング | `/` | ✓ | 未ログイン時のトップ |
| 02 | ダッシュボード（家系一覧） | `/home` | ✓ | |
| 03 | 家系図エディタ | `/family/:id/tree` | ✓ | 中核画面 |
| 04 | 人物詳細 | `/family/:id/person/:pid` | ✓ | |
| 05 | 人物を追加 | `/family/:id/person/new` | ✓ | モーダル |
| 06 | 思い出ノート一覧 | `/family/:id/memories` | ✓ | |
| 07 | 新規家系の作成 | `/new` | ✓ | モーダル |
| 08 | 家系ファイルを開く | `/open` | ✓ | |
| 09 | 設定・データ管理 | `/settings` | ✓ | |
| 10 | 取り込み | `/import` | ✓ | .ftree2 選択〜取り込み確認 |
| 11 | 取り込みエラー | — | ✓ | モーダル・09/10 から派生 |
| 12 | 家系メニュー（切替・書き出し） | — | ✓ | ドロップダウン |
| 13 | 関係を追加 | — | ✓ | モーダル |
| 14 | 写真ライトボックス | — | ✓ | 最大 10 枚表示 |
| 15 | 思い出を書く（編集） | `/family/:id/memory/:mid/edit`・`new` | ✓ | 閲覧者登録あり |
| 16 | 思い出を読む（詳細） | `/family/:id/memory/:mid` | ✓ | 閲覧者のみ可 |
| 17 | PWA スプラッシュ・オフライン | — | ✓ | SW 管理 |
| 18 | 空状態（6パターン） | — | ✓ | 各画面内 |
| 19 | モバイル（スマホPWA） | — | ✓ | レスポンシブ |
| 20 | 削除の確認 | — | ✓ | モーダル |
| 21 | 容量・エラー警告（6パターン） | — | ✓ | トースト／ダイアログ |
| 22 | 人物を編集 | `/family/:id/person/:pid/edit` | ✓ | モーダル |

### 2.2 共通 UI

**ヘッダー（アプリ内）:**
- 左: 戻る／朱印ロゴ／家系名（メニュー付き）
- 右: 保存ボタン（家系図エディタ）・家系メニュー（切替/書き出し）

**色・タイポグラフィ:**
- 背景: `#FFFEF8`（本文）／ `#E8E2D0`（アプリ外余白）
- 前景: `#1A1915`（墨）／ `#6B6456`（補助）／ `#8B8574`（薄墨）
- アクセント: `#C0392B`（朱）／ `#FDF6C8`（淡黄付箋）
- 見出し: `Kaisei Decol`（毛筆明朝）
- 本文・注釈: `Klee One`（手書き風）

**共通コンポーネント:**
`Hanko`（朱印ロゴ）／ `SketchBtn`（手描き風ボタン）／ `PersonNode`（人物カード）／ `StickyNote`（付箋注釈）／ `Photo`（写真プレースホルダ）／ `Hand`（手書き風テキスト）／ `Title`（明朝見出し）

**共通振る舞い:**
- 破壊的操作は**二重確認ダイアログ**（朱色枠）
- 保存は常にユーザー操作（**自動保存なし**）
- 保存前に離脱しようとすると警告

### 2.3 各画面詳細

#### 01 ランディング `/`
- 構成: ナビ（使い方・はじめる）／ヒーロー／３つの特長／フッター（利用規約・プライバシー）
- CTA: 「無料で家系図をつくる」→ `/new`
- 未スコープ: 料金・お客様の声・FAQ・お問い合わせ

#### 02 ダッシュボード `/home`
- サイドバー: 家系図／思い出／設定
- 本体: 家系カードグリッド（家系名・世代数・人物数・最終更新）
- 操作: 「＋ 新規」「開く」「ファイル取り込み」

#### 03 家系図エディタ `/family/:id/tree`
- ツールバー（左側垂直）: 選択／追加／線引き／編集／カメラ／検索
- キャンバス: 原稿用紙風グリッド、ドラッグでパン、ピンチ／ボタンでズーム
- **線描画ルール**: 夫婦の横線の**中点から下**に一本、そこから子の数だけ横に分岐して各子の上に落とす（子の線は両親線の中央から）
- 右ペイン: 選択中の人物（氏名・生没年・続柄・思い出のサムネ）
- 右上: `● 未保存の変更あり`／`↓ 画像を保存`／`保存`／`＋ 人物を追加`
- ミニマップ（左下）・ズームコントロール（右下）

#### 04 人物詳細 `/family/:id/person/:pid`
- 左: 肖像＋氏名＋生没年＋**ロール切替**（祖父として／再婚相手として等）
- 中央: 生涯タイムライン・備考・関連する思い出ノート
- 右: 家族サイドバー（両親・配偶者・子・兄弟）
- 下: 写真ギャラリー（思い出ノートから自動集約）

#### 05 人物を追加（モーダル）
- 氏名・ふりがな・旧姓・性別・**FuzzyDate** 生年月日・続柄・備考
- 肖像アップロード（任意）・正方形切り抜き
- 「保存」か「保存して続けて追加」

#### 06 思い出ノート一覧 `/family/:id/memories`
- 縦タイムライン（年代順）／カード（タイトル・主人公・書き手・写真サムネ・公開範囲）
- フィルタ: 主人公・タグ・書き手・年代
- 自分が**閲覧できるもののみ**表示（書き手本人＋閲覧者に登録済み）

#### 07 新規家系の作成（モーダル）
- 家系名・ルート人物（自分）の基本情報・テーマ色

#### 08 家系ファイルを開く `/open`
- ファイル選択（.ftree2）／ドラッグ＆ドロップ
- 既存家系がある場合は「置き換える／追加する」選択

#### 09 設定・データ管理 `/settings`
- 書き出し・取り込み・ストレージ使用状況・アプリ（PWA・テーマ・バージョン）・危険な操作
- URL 共有は**廃止**

#### 10 取り込み
- 1) ファイル選択 → 2) 中身プレビュー → 3) 取り込み実行

#### 11 取り込みエラー
- 破損ファイル／バージョン不一致／容量不足 の 3 系統メッセージ

#### 12 家系メニュー
- 家系切替・この家系を書き出す・削除…

#### 13 関係を追加（モーダル）
- 起点人物からの関係タイプ選択: 配偶者／元配偶者／親／子／兄弟／養子
- 既存人物から選ぶ or 新規作成

#### 14 写真ライトボックス
- 背景黒・正方形表示・**最大 10 枚**サムネ帯・左右送り・ダウンロード・削除・編集

#### 15 思い出を書く
- タイトル／主人公／時期（FuzzyDate）／書き手／本文（TipTap）／写真（0〜10枚）／関連人物タグ／タグ
- **閲覧者セクション**: 書き手は常にロック／任意の人物を閲覧者に追加できる
- 保存は手動。未保存は `● 未保存の変更があります`

#### 16 思い出を読む
- 絵本ページ風レイアウト。編集／削除（書き手のみ）・前後の思い出へのナビ
- 閲覧権限: 書き手 OR 閲覧者リストに含まれる人物としてアクセスしているときのみ

#### 17 PWA スプラッシュ・オフライン
- スプラッシュ・ホーム追加案内・オフライン表示バッジ・新バージョン通知

#### 18 空状態
- 家系ゼロ・人ひとり・思い出ゼロ・写真ゼロ・検索ゼロ・初回起動

#### 19 モバイル
- 下部タブ（家系／思い出／写真／設定）。ミニマップは md 以上のみ表示。

#### 20 削除の確認
- 人物・家系・思い出・全データ — いずれも**二重確認**。家系削除は「家系名を入力」まで要求。

#### 21 容量・エラー警告
- 容量不足／永続化未許可／保存失敗／月 1 書き出しリマインド／使用状況バー／ブラウザ互換警告

#### 22 人物を編集
- 05 と同構造＋**関係セクション**（配偶者・元配偶者・親・子を行単位で編集／外す）＋削除導線

---

## 3. データ設計

### 3.1 エンティティ ER（概念図）

```
Family ─┬─ Person (N)
        ├─ Union (N)
        │    ├─ partners: Person[]
        │    └─ period: FuzzyRange
        ├─ ParentChildLink (N)
        │    ├─ parent: Union | Person
        │    └─ child: Person
        └─ Memory (N)
             ├─ author: PersonRef        ← 書き手（所有者・常に閲覧可）
             ├─ protagonist: PersonRef?  ← 主人公
             ├─ viewers: PersonRef[]     ← 閲覧者
             ├─ related: PersonRef[]
             ├─ photos: PhotoRef[]   (<= 10)
             └─ body: RichText
```

### 3.2 TypeScript 型

```ts
// 年月日はゆるく扱う（昭和・不明に対応）
type FuzzyDate =
  | { kind: "exact";   y: number; m?: number; d?: number }
  | { kind: "year";    y: number }
  | { kind: "era";     era: "明治"|"大正"|"昭和"|"平成"|"令和"; year: number; m?: number; d?: number }
  | { kind: "unknown" };

interface FuzzyRange { from?: FuzzyDate; to?: FuzzyDate }

type PersonId = string;   // "p_xxxx"
type UnionId  = string;   // "u_xxxx"
type MemoryId = string;   // "m_xxxx"
type PhotoId  = string;   // "img_xxxx"

interface Person {
  id: PersonId;
  surname: string; given: string;
  kanaSurname?: string; kanaGiven?: string;
  maidenName?: string; alias?: string;
  gender?: "m"|"f"|"other"|"unknown";
  birth?: FuzzyDate; death?: FuzzyDate;
  birthPlace?: string; deathPlace?: string;
  portrait?: PhotoId;
  note?: string;
  createdAt: number; updatedAt: number;
}

interface Union {
  id: UnionId;
  partners: PersonId[];          // 通常 2
  kind: "marriage"|"partnership"|"unknown";
  period?: FuzzyRange;
  dissolved?: boolean;           // 離別・死別
}

interface ParentChildLink {
  parent: { kind: "union"; unionId: UnionId } | { kind: "person"; personId: PersonId };
  child: PersonId;
  relationship: "biological"|"adopted"|"step"|"unknown";
}

interface Memory {
  id: MemoryId;
  title: string;
  body: RichTextJSON;          // TipTap JSON
  period?: FuzzyDate;
  author: PersonId;              // 書き手・常に閲覧可
  protagonist?: PersonId;
  viewers: PersonId[];           // 閲覧者（書き手以外で読める人）
  related: PersonId[];
  tags: string[];
  photos: PhotoId[];             // <= 10
  createdAt: number; updatedAt: number;
}

interface Family {
  id: string;
  name: string;
  rootPerson: PersonId;
  theme?: "picture-book"|"scroll"|"modern";
  persons: Record<PersonId, Person>;
  unions:  Record<UnionId,  Union>;
  links:   ParentChildLink[];
  memories: Record<MemoryId, Memory>;
  meta: {
    version: "1";
    createdAt: number; updatedAt: number;
    lastExportAt?: number;
  };
}

interface AppState {
  activeFamilyId?: string;
  families: Record<string, Family>;   // metadata only in localStorage
  settings: { theme: "picture-book"; reminderShownAt?: number };
}
```

### 3.3 ストレージ戦略

| 種別 | 保存先 | キー／ストア | 備考 |
|---|---|---|---|
| アプリ状態 | localStorage | `ft2.state.v1` | `AppState` を 2 スロット交互書き込み（`.a` / `.b`）で安全に |
| 家系本体 | localStorage | `ft2.family.<id>.v1` | サイズ < 2MB 想定 |
| 画像 Blob | IndexedDB | DB: `ft2`, store: `photos`（key=PhotoId） | 元画像 + サムネ |
| メタ（最終書き出し等） | localStorage | `ft2.meta.v1` | |

**閲覧権限チェック（クライアント内）:**

```ts
function canViewMemory(m: Memory, viewerPersonId: PersonId | null): boolean {
  if (viewerPersonId == null) return false;       // 閲覧者未選択時は不可
  if (m.author === viewerPersonId) return true;   // 書き手は常に可
  return m.viewers.includes(viewerPersonId);
}
```

※ v0.1 は「現在のユーザー＝誰として見ているか」を設定に保持（`settings.currentViewerPersonId`）。
  ネットワーク越しの強制ではなく UI レベルのフィルタ（端末内単独アプリのため）。

### 3.4 画像処理

- アップロード時に Canvas で正方形クロップ、最大辺 **1600px** に縮小、`image/jpeg quality=0.82` で保存
- サムネは 320px を別途生成
- 1 思い出ノートあたり **最大 10 枚**（UI で + ボタンを無効化）

### 3.5 .ftree2 ファイル形式

ZIP アーカイブ。中身:

```
/manifest.json                 // { version:"1", exportedAt, family: {id,name} }
/family.json                   // Family（画像は PhotoId 参照のまま）
/photos/<PhotoId>.jpg          // 元画像
/photos/<PhotoId>.thumb.jpg    // サムネ
```

取り込み時は `version` を検査し、非互換なら 11 取り込みエラーへ。

---

## 4. コンポーネント設計

### 4.1 状態管理（Zustand）

3 ストアに分割:

```ts
// familyStore: 現在開いている家系のドメインデータ
useFamily = create<{
  family?: Family;
  dirty: boolean;
  load(id: string): Promise<void>;
  save(): Promise<void>;               // ← 手動呼び出し（自動保存なし）
  addPerson(p: Person): void;
  updatePerson(id: PersonId, patch: Partial<Person>): void;
  addUnion(u: Union): void;
  addParentChild(link: ParentChildLink): void;
  addMemory(m: Memory): void;
  updateMemory(id: MemoryId, patch: Partial<Memory>): void;
  // viewers
  addViewer(mid: MemoryId, pid: PersonId): void;
  removeViewer(mid: MemoryId, pid: PersonId): void;
}>();

// appStore: 家系リスト・アクティブ家系・書き出しリマインド
useApp = create<{ activeFamilyId?: string; families: FamilyMeta[]; ... }>();

// uiStore: モーダル／ライトボックス／トースト
useUI = create<{ lightbox?: {photos:PhotoId[]; index:number}; dialog?: ...; toast?: ... }>();
```

- `familyStore.save()` 成功時にのみ `dirty=false`、localStorage へ書き込み
- ページ離脱前に `dirty === true` なら `beforeunload` で警告

### 4.2 ルーティング設計

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

**ガード:**
- `family/*` 共通ガード: 該当 Family が localStorage に存在すること、なければ `/home` へ
- `memory/:mid` 入口ガード: `canViewMemory()` が false なら 403 的空状態を表示（「この思い出は閲覧者に登録された方のみ読めます」）
- `memory/:mid/edit` は `author === currentViewerPersonId` のみ許可

**コンポーネント階層（抜粋）:**

```
<App>
  <Router>
    <AppShell>                  // ヘッダ・トースト・ダイアログ枠
      <Outlet />                // ルートごとのページ
    </AppShell>
  </Router>
  <GlobalLightbox />
  <GlobalDialog />
</App>

<TreeEditorPage>
  <Toolbar />
  <TreeCanvas>                  // d3 + SVG 線描画
    <TreeEdges />               // 夫婦線の中点から子への接続を描画
    <PersonNodeLayer />
    <MiniMap />
  </TreeCanvas>
  <Inspector />
</TreeEditorPage>

<MemoryEditorPage>
  <MemoryTitleField />
  <MetaRow />                   // 主人公・時期・書き手
  <RichTextToolbar /> <RichTextBody />
  <PhotoGrid max={10} />
  <RelatedPeoplePicker />
  <ViewerPicker />              // ← 閲覧者登録 UI
  <TagPicker />
</MemoryEditorPage>
```

---

## 5. PWA / ネイティブ設計

### 5.1 PWA

- `vite-plugin-pwa`（GenerateSW モード）
- `manifest.webmanifest`:
  - `name`: ファミリーツリー２
  - `short_name`: 家系図
  - `display`: `standalone`
  - `start_url`: `/`
  - `background_color`: `#FFFEF8`
  - `theme_color`: `#C0392B`
  - アイコン: 192 / 512 / maskable 512

### 5.2 Service Worker

- **プリキャッシュ**: アプリシェル（HTML・JS・CSS・フォント・ロゴ）
- **ランタイムキャッシュ**: 画像は CacheFirst（IndexedDB 経由なので基本不要、フォールバック用）
- **更新検知**: `registerSW({onNeedRefresh})` で 17-D「新バージョン通知」表示 → `updateSW(true)`
- **オフライン**: 全ページ SPA・ローカルデータ前提なので完全オフライン動作

### 5.3 永続化

- 初回 or Settings から `navigator.storage.persist()` を要求
- `navigator.storage.estimate()` で使用量を取得し、21-E の使用率バーに反映
- 87% 超過で 21-A／21-B を先回り表示

### 5.4 将来のネイティブ化

- PWA で十分な体験を提供するが、必要になれば **Capacitor** でそのまま iOS/Android ラップを想定
- ファイル選択は `File System Access API`（PC）と `<input type=file>`（モバイル）でフォールバック

---

## 6. ディレクトリ構成

```
family-tree-2/
├── README.md
├── DESIGN.md                        ← 本文書
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── public/
│   ├── icons/                       ← PWA アイコン
│   └── fonts/                       ← Kaisei Decol / Klee One（self-host）
└── src/
    ├── main.tsx                     ← entry
    ├── App.tsx                      ← ルータ・シェル
    │
    ├── pages/
    │   ├── LandingPage.tsx          (01)
    │   ├── DashboardPage.tsx        (02)
    │   ├── TreeEditorPage.tsx       (03)
    │   ├── PersonDetailPage.tsx     (04)
    │   ├── MemoriesListPage.tsx     (06)
    │   ├── MemoryEditorPage.tsx     (15)
    │   ├── MemoryDetailPage.tsx     (16)
    │   ├── OpenFamilyPage.tsx       (08)
    │   ├── ImportPage.tsx           (10)
    │   └── SettingsPage.tsx         (09)
    │
    ├── modals/
    │   ├── NewFamilyModal.tsx       (07)
    │   ├── AddPersonModal.tsx       (05)
    │   ├── EditPersonModal.tsx      (22)
    │   ├── RelationAddModal.tsx     (13)
    │   ├── DeleteConfirmModal.tsx   (20)
    │   └── ImportErrorModal.tsx     (11)
    │
    ├── features/
    │   ├── tree/
    │   │   ├── TreeCanvas.tsx
    │   │   ├── TreeEdges.tsx        ← 夫婦線の中点から子への接続
    │   │   ├── PersonNode.tsx
    │   │   ├── MiniMap.tsx
    │   │   ├── layout.ts            ← d3-hierarchy 補正
    │   │   └── exportImage.ts       ← ↓ 画像を保存
    │   ├── memory/
    │   │   ├── RichText.tsx         ← TipTap
    │   │   ├── PhotoGrid.tsx
    │   │   ├── ViewerPicker.tsx
    │   │   └── accessControl.ts     ← canViewMemory()
    │   ├── photos/
    │   │   ├── Lightbox.tsx         (14)
    │   │   ├── cropSquare.ts
    │   │   └── resize.ts
    │   └── importExport/
    │       ├── writeFtree2.ts
    │       └── readFtree2.ts
    │
    ├── stores/
    │   ├── familyStore.ts
    │   ├── appStore.ts
    │   └── uiStore.ts
    │
    ├── storage/
    │   ├── localStoreAB.ts          ← 2 スロット交互書き込み
    │   └── idb.ts                   ← 写真 Blob
    │
    ├── domain/
    │   ├── types.ts                 ← Person/Union/Memory 等
    │   ├── fuzzyDate.ts
    │   └── selectors.ts             ← 家系構造の派生計算
    │
    ├── components/                  ← 共通 UI
    │   ├── Hanko.tsx
    │   ├── SketchBtn.tsx
    │   ├── StickyNote.tsx
    │   ├── Hand.tsx
    │   ├── Title.tsx
    │   ├── Photo.tsx
    │   ├── Toast.tsx
    │   └── Dialog.tsx
    │
    ├── pwa/
    │   ├── registerSW.ts
    │   └── persist.ts               ← navigator.storage.persist / estimate
    │
    ├── styles/
    │   ├── tokens.css               ← 色・タイポ変数
    │   └── global.css
    │
    └── wireframes/                  ← 低忠実度プレビュー（開発時のみ）
        ├── primitives.tsx
        ├── Wire01Landing.tsx
        ├── …
        └── Wire22EditPerson.tsx
```

---

## 付録 A・確定事項

| # | 項目 | 決定 |
|---|---|---|
| Q1 | 複数家系の切替 | **マイ家系図画面で切替可**（02 ダッシュボード＝家系一覧） |
| Q2 | 取り込み時の同名家系 | **両方残す**。家系は **ID で管理**、同名でも別家系として共存 |
| Q3 | クラウド同期 | **今後も実装しない**（完全に端末内で完結） |
| Q4 | 画像最大辺 | **1600px**（JPEG quality 0.82・サムネ 320px） |
| Q5 | パスコード保護 | **実装しない**。16 閲覧者制御は UI フィルタのみ |
| Q6 | スタイル | Tailwind + CSS 変数（テーマトークン）の併用 |
| Q7 | リッチテキスト | TipTap（H1/H2・太字・斜体・引用・リスト） |
| Q8 | 自動テスト | v0.1 では実装しない |
| Q9 | Lint / Format | ESLint v9（flat config）+ Prettier ／ ダブルクォート ／ 保存時フォーマット |
| Q10 | Node | Node 24（`engines` 明示） |

---

## 付録 B・実装の現状と仕様からの逸脱（2026-04-24）

本節は当初仕様（§1〜§6）に対して、実装で確定した現実を記録する。仕様側を将来修正するか、実装を仕様に寄せるかの判断材料。

### B.1 ルーティングの追加・差異

DESIGN.md §4.2 に追加・変更があったルート:

| 追加 | 役割 |
|---|---|
| `/terms` | 利用規約（`src/data/legal/terms.json` 駆動） |
| `/privacy` | プライバシーポリシー（`src/data/legal/privacy.json` 駆動） |
| `/family/:fid/delete` | 家系削除（家系名入力確認） |
| `/family/:fid/relate` | 関係追加モーダル |
| `/family/:fid/photo/:pid` | 写真ライトボックス |
| `/family/:fid/person/:pid/delete` | 人物削除確認 |
| `/family/:fid/memory/:mid/delete` | 思い出削除確認 |
| `/settings/delete-all` | 全データ初期化 |

`/family/:fid/menu` は **未ルート化**。AppHeader の「家系名 ▾」クリックで **インプレース・ドロップダウン**（`src/modals/FamilyMenuDropdown.tsx`）として展開する実装に変更。

### B.2 データモデルの差異

#### B.2.1 Memory.body の型

**仕様**: `body: RichTextJSON`（TipTap の JSON）
**実装**: `body: string`（TipTap の **HTML** 文字列を保存）

理由: TipTap の `editor.getHTML()` を直接保存することでシリアライズが単純化。`<p>`・`<strong>`・`<a>` などのタグをそのまま `dangerouslySetInnerHTML` で描画。プレーンテキストも同じフィールドに混在可能。

影響: `.ftree2` ファイルの `family.json` に HTML 文字列が入る。バージョン `"1"` は HTML、将来の JSON 化時は `version: "2"` で分岐。

#### B.2.2 Family 構造の差異

仕様では `persons` `unions` `memories` が `Record`、`links` が配列。実装は次の通り:

```ts
interface Family {
  people: Record<PersonId, Person>;       // ← 仕様の `persons` → `people`
  unions: Union[];                         // ← 仕様は Record、実装は配列
  links: ParentChildLink[];
  memories: Record<MemoryId, Memory>;
  // 仕様にない追加フィールド:
  generations: number;                     // 集計値（UI 表示用）
  lastUpdated: string;                     // 集計値（UI 表示用）
  // 仕様の `theme` / `themeColor` は **削除**（2026-04-24）
  // 仕様の `meta: {...}` は未実装（外側の Zustand で `lastExportAt` を持つ）
}

interface Union {
  id: UnionId;
  partnerA: PersonId;
  partnerB: PersonId;
  // 仕様の kind/period/dissolved は未実装
}

interface Memory {
  id: MemoryId;
  title: string;
  body: string;                  // HTML 文字列（上記参照）
  periodLabel: string;            // 仕様の FuzzyDate period は未。人間可読テキストで保持
  authorId: PersonId;            // 仕様の `author`
  protagonistId?: PersonId;
  viewers: PersonId[];
  related: PersonId[];
  tags: string[];
  photos: number;                // 枚数カウント（UI 表示用）
  photoIds?: PhotoId[];          // ← 仕様の `photos: PhotoId[]` に相当
  heroPhotoId?: PhotoId;         // 代表写真（MemoryDetail ヒーロー／一覧サムネで優先表示）
  year: string; era?: string;    // 表示用プレフィックス
  locked?: boolean;              // UI 表示用
}
```

将来的な仕様合わせの方向性:
- `persons` ↔ `people` は呼称ゆれなので統一（実装側に合わせる or 仕様に合わせる）
- Union の `period` / `dissolved` は相応の UI 追加時に再開

### B.3 ストレージ戦略の差異

**仕様** (§3.3)
- `ft2.state.v1`（AppState、2 スロット A/B）
- `ft2.family.<id>.v1`（個別家系）

**実装**
- `ft2.state.v1.a` / `ft2.state.v1.b`（Zustand `persist` → 独自の `localStoreAB` 経由、**家系はすべてここに包含**）
- 個別家系キー（`ft2.family.<id>.v1`）は **未採用**

Zustand の `persist` で `families: Record<fid, Family>` を丸ごと書き込む方が実装が簡潔で、家系サイズが 2MB を超える想定は v0.1 では考えない。将来的に大容量化したら分割する。

### B.4 状態管理：1 ストア集約

**仕様** (§4.1): `useFamily` / `useApp` / `useUI` の 3 ストア分割。

**実装**: `src/stores/familyStore.ts` に集約。

| 仕様ストア | 実装の格納先 |
|---|---|
| `useFamily` | `families` / `activeFamilyId` / `dirty` / `addPerson`, `patchPerson`, ... |
| `useApp` | 同じ store 内の `reminderEnabled` / `reminderShownAt` / `theme` / `currentViewerPersonId` / `lastExportAt` / `persistGranted` / `storageEstimate` |
| `useUI` | 同じ store 内の `toast` / `showToast()` / `clearToast()` |

トレードオフ: 「1 ファイルで全部見える」反面、セレクタの粒度が粗くなり、不要な再レンダが発生しがち。v0.2 以降で分割するかは未定。

### B.5 家系図レイアウトエンジン

**仕様** (§1.4 / §4.2): d3-hierarchy + 自前エンジン。

**実装**: **d3-hierarchy は未使用**。`src/pages/TreeEditorPage.tsx` 内の `layoutFamily()` が世代ベースの独自レイアウトを提供。

アルゴリズム:
1. 各人物に **世代番号** を割り当て（親リンクで `child ≥ parent+1`、配偶者は同世代に揃える、収束まで反復）
2. 各世代ごとにグループ化（union ＝ 2 人、単独 ＝ 1 人）
3. 各グループの **理想 x 座標** を親ユニットの中点の平均から算出
4. 理想 x の昇順で左から配置、衝突時は右に押す（`COUPLE_GAP` で隣接ユニット間の最小間隔を確保）
5. 配偶者両側に親 union があるケースでは、両親 union 中点間の距離に合わせて **SPOUSE_GAP を拡張**（親ユニットが衝突しない幅を自動確保）

線描画:
- 配偶者バー → 中点から下降 → 分岐バー（子の中心 x 範囲に跨る水平線）→ 各子へ垂直下降
- 単独親の子（`parentId`）は親下辺中央から同じパターン
- **両側に親 union がある子**は、両 union それぞれから独立に線が出る（DESIGN.md 要求の「中点から下ろす」原則を各 union で満たす）

未実装の高度なケース:
- ノードの個別ドラッグ移動
- ノード同士の交差最小化（Sugiyama の厳密解）
- 「両側共に grandparent がある × 横同士にも結婚相手」のように subtree が絡むケース（1 側のみ正しく表示される）

### B.6 ワイヤーフレーム（`src/wireframes/`）の削除

DESIGN.md §6 と §7 にあったワイヤーフレームディレクトリは **削除済み**。共通プリミティブは `src/components/ui.tsx` に集約（`BarePage` / `Frame` / `Hanko` / `SketchBtn` / `Field` など）。旧 `primitives.tsx` は同ファイルに改名・移動。

### B.7 追加された機能（仕様に無かったもの）

- **`/terms`・`/privacy` ページ**（JSON 駆動、`version` / `effectiveDate` / `lastUpdatedAt` 付き）
- **ケバブメニュー**（Dashboard の家系カード右下、「開く」「書き出し」「削除」）
- **インプレース家系メニュー**（AppHeader の「家系名 ▾」クリック展開）。現在のページ種別（tree / memories）を維持したまま別家系へ切替できる。
- **`YearPicker`**（生年選択：現在から 20 年、スクロールで +20 年）— 思い出ノートの時期欄で使用
- **`FuzzyDateInput`**（`src/components/FuzzyDateInput.tsx`）— 西暦／和暦／年のみ／不明 の 4 モード切替。PersonForm と NewFamilyModal で共用。保存時に `FuzzyDate` に変換。
- **`SearchPopover`**（人物・思い出横断検索。TreeEditor・Memories 両方で使用）
- **画像を正方形化する際の黒レターボックス**（`resize.ts::cropSquareJpeg` は中央クロップではなく contain 方式。`PhotoFromIdb` も `objectFit: contain` + `background: #000` で端切れを防ぐ）
- **写真ライトボックスへのリンク整備**：`/family/:fid/photo/:pid?ids=a,b,c&i=N` を Memory詳細のヒーロー／写真の記録／PersonDetail の写真の記録・一覧サムネから直接開ける
- **代表写真（`heroPhotoId`）**：Memory に代表写真を設定可能。MemoryEditor の写真サムネはクリックで代表に切替（青枠＋「代表写真」バッジ）。
- **思い出ノート前後ナビ強化**：閲覧可能なノートだけで並び順を決定、`←`/`→` キーで前後移動、下部カードもクリック可能な `<Link>`、遷移時に本文スクロールを top:0 に戻す
- **画面横断ナビゲーション**：TreeEditor ヘッダに「思い出ノート」ボタン、MemoriesList ヘッダに「家系図」ボタン、双方向に 1 クリック遷移
- **設定画面の書き出し対象セレクト**：書き出す家系をプルダウンで選べる（既定はアクティブ家系）
- **`addFamily` の自動 ID 衝突回避**：同 ID が存在すれば `_2` / `_3` と枝番、戻り値で最終 id を返す。Import / Open で「上書きされた」を防ぐ。
- **Playwright による視覚検証スクリプト**（`scripts/*.mjs`）
- **`.mcp.json`**（Playwright MCP 設定）

### B.8 PWA

仕様 §5 通り実装済み:
- `vite.config.ts` に `VitePWA({ strategies: "generateSW" })`
- `public/icons/icon-512.svg` **単一ソース**（SVG vector なので `sizes: "any"` で全サイズ対応、manifest は `purpose: "any"` と `"maskable"` の 2 エントリで同一 SVG を指定）
- `index.html` に `<link rel="icon" type="image/svg+xml">` / `<link rel="apple-touch-icon">` / `<meta name="theme-color">` を追加
- `src/pwa/registerSW.ts` — `virtual:pwa-register` を動的 import、`onNeedRefresh` で再読込トースト
- `src/pwa/persist.ts` — `navigator.storage.persist()` / `.estimate()` — Settings に実測値表示
- `src/pwa/install.ts` — `beforeinstallprompt` を捕捉して Settings のボタンから呼び出し
- `src/pwa/reminder.ts` — 起動時に月経過＋未書き出しなら WARN トースト

### B.9 配信

GitHub Actions（`.github/workflows/deploy.yml`）で `main` push → Pages デプロイ。Vite の `base` は `"/family-tree2/"`。

---

## 付録 C・運用ガイド（エージェント向け）

- **Claude Code 向け**: `CLAUDE.md`
- **一般コーディングエージェント向け**: `AGENTS.md`
- **プロジェクト README**: `README.md`

エージェントが作業するとき、仕様書が先、実装観察が次、と優先順位を決める。本書の数値が実装と食い違う場合、まず本書の B 節を確認し、それでも不明なら実装側のソースを Read / Grep する。
