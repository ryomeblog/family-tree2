---
name: qiita-article
description: プロジェクトを分析し、Playwright MCPで取得したスクリーンショットを使ってQiita記事を作成する
allowed-tools: Read, Glob, Grep, Bash, Write, Agent, mcp__playwright__browser_navigate, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_resize, mcp__playwright__browser_snapshot, mcp__playwright__browser_click, mcp__playwright__browser_evaluate, mcp__playwright__browser_wait_for, mcp__playwright__browser_close
---

# Qiita記事作成スキル

プロジェクトのソースコードを分析し、**Playwright MCP でスクリーンショットを動的に取得**して、Qiita向けの技術記事を作成します。

## 入力

ユーザーは `$ARGUMENTS` として以下の情報を提供します。

- 記事で扱う画面リスト（URL パスと説明、例: `/home — ダッシュボード`）
- 記事の出力先フォルダ（省略時は `qiita/`）
- 記事のテーマや強調したい点（任意）
- dev サーバ URL（省略時は `http://127.0.0.1:5173/family-tree2/`）

ユーザーが画面リストを指定しなかった場合は、CLAUDE.md とソースコードから主要画面を推定して提案する。

## 手順

### Step 1: プロジェクト分析

以下のファイルを読み取り、プロジェクトの全体像を把握する。

1. **CLAUDE.md** — プロジェクト概要・技術スタック・ディレクトリ構成
2. **package.json** — 依存関係とスクリプト
3. **CI/CDファイル** — `.github/workflows/` 配下のYAML
4. **主要なソースコード** — Agentツール(Explore)を使い、以下を重点的に調査:
   - アーキテクチャ上の工夫（状態管理、データフロー）
   - 外部制約への対応（ランタイム制約、ライブラリ非互換）
   - パフォーマンスやUXの最適化
   - 一般的でない実装手法（自前実装、独自アルゴリズム等）

### Step 2: dev サーバの起動確認

スクリーンショット取得には dev サーバが起動している必要がある。

```bash
# 既に起動しているか確認
curl -s -o /dev/null -w "%{http_code}\n" <dev URL>
# 200 でなければユーザーに起動を依頼するか、Bashで起動する
# 例: npx vite --port 5173 --host 127.0.0.1
```

### Step 3: 画面スクリーンショットの取得（Playwright MCP）

Playwright MCP を使って、各画面のスクリーンショットを記事フォルダに保存する。

```
1. mcp__playwright__browser_resize で viewport を統一（PC: 1280x800、モバイル: 375x667 等）
2. mcp__playwright__browser_navigate で各画面の URL に遷移
3. 必要なら mcp__playwright__browser_wait_for でレンダリング完了を待つ
4. mcp__playwright__browser_take_screenshot で PNG を保存
```

#### スクリーンショット取得ルール

- **保存先**: 記事フォルダ配下の `images/` または同階層に `001-<screen>.png` 形式で連番＋識別子
- **viewport**: 記事の流れに合わせて使い分ける
  - 全体俯瞰・PC スクショ: 1280×800（または 1440×900）
  - モバイル UI 強調: iPhone SE 相当の 375×667
- **状態の準備**: ストアにシードデータが入っている前提。必要なら `mcp__playwright__browser_evaluate` で `localStorage` を操作してから navigate
- **終了処理**: 全取得後 `mcp__playwright__browser_close` でブラウザを閉じる

#### 例

```
mcp__playwright__browser_navigate { url: "http://127.0.0.1:5173/family-tree2/#/home" }
mcp__playwright__browser_take_screenshot {
  filename: "qiita/images/001-dashboard.png",
  type: "png",
  fullPage: false
}
```

#### 取得後

各スクショは Read ツールで開いて視覚的に確認し、記事内の説明文と一致するか検証する。期待と異なる場合は再撮影する（例: シードがリセットされている、モーダルが閉じている、など）。

### Step 4: 記事構成の決定

以下の構成をベースに、プロジェクトの特徴に応じて調整する。

```
1. はじめに（概要 + メイン画像）
2. アーキテクチャ（技術スタック表 + 構成図）
3. 機能紹介（各画像を使った機能説明）
4. 工夫した点（技術的な深堀り、コード例付き）
5. CI/CDパイプライン
6. ハマったこと・知見
7. まとめ
```

### Step 5: SVG図の作成

以下の場合にSVG図を作成し、記事と同じフォルダに配置する。

- **アーキテクチャ概要図** — コンポーネント間の関係、デプロイフロー
- **データフロー図** — 特徴的なデータの流れ（圧縮、変換等）
- その他、スクリーンショットだけでは伝わりにくい仕組み

SVG作成ルール:
- `font-family="sans-serif"` を使用
- 背景色は `#f8fafc`、角丸 `rx="12"`
- 各コンポーネントは色分けしてカテゴリを視覚的に区別する
- テキストは日本語で記述
- viewBoxを適切に設定し、レスポンシブに表示されるようにする

### Step 6: 記事の執筆

Qiita Markdownで記事を書く。以下のルールに従う。

#### フロントマター

```yaml
---
title: 【技術キーワード】〜を作った / 〜してみた
tags: 関連技術タグ（最大5つ）
---
```

#### 画像の参照

Step 3 で保存したスクリーンショットを相対パスで参照する。

```markdown
![説明文](images/001-dashboard.png)
```

#### コードブロック

- 言語を必ず指定する（`typescript`, `yaml`, `bash` 等）
- 長すぎるコードは要点のみ抜粋し、コメントで省略を示す
- 実際のソースコードから引用する（創作しない）

#### 注意書き

Qiitaの記法を使用する。

```markdown
:::note warn
注意書きの内容
:::
```

#### 文体

- 「です・ます」調で統一
- 技術用語は正確に使用し、初出時は簡単な説明を添える
- 「〜してみた」「〜だった」など、体験ベースの語り口

### Step 7: ファイル出力

出力先フォルダ（デフォルト: `qiita/`）に以下を配置する。

- `article.md` — 記事本体
- `images/*.png` — Playwright MCP で取得したスクリーンショット
- `*.svg` — 作成した図（あれば）

## 注意事項

- **dev サーバが起動していない**と Playwright MCP の `browser_navigate` が失敗する。事前に確認・起動する。
- **HashRouter を使うプロジェクト**では URL に `#/path` を含める（例: `http://127.0.0.1:5173/family-tree2/#/home`）。
- **シードデータの状態**：撮影前に `localStorage.clear()` してから一度トップへ遷移し、デフォルトシードが書き込まれた状態で各画面を撮ると安定する。
- **モーダル系の画面**：直接 URL で開けるルート（例: `/new`、`/family/:fid/relate`）は navigate だけで撮れる。トリガーボタン経由でしか出ないモーダルは `mcp__playwright__browser_click` で開いてから撮影する。
- UIテキストが日本語のプロジェクトは、記事も日本語で書く
- コード例は実際のソースから引用し、必要に応じて簡略化する
- 記事の長さは3000〜6000文字程度を目安とする
- スクリーンショットの説明文は、視覚的に確認した内容に基づいて書く（推測で書かない）
