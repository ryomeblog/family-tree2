// Wireframe 09 — Settings / Data management
import React from "react";
import { Title, Hand, SketchBtn, Hanko, StickyNote } from "./primitives";

const Row: React.FC<{ label: string; value?: string; action?: string; danger?: boolean }> = ({
  label,
  value,
  action,
  danger,
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 0",
      borderBottom: "1px solid #E8E2D0",
    }}
  >
    <div>
      <Hand size={13} color={danger ? "#C0392B" : "#1A1915"}>
        {label}
      </Hand>
      {value && (
        <div style={{ marginTop: 2 }}>
          <Hand size={11} color="#8B8574">
            {value}
          </Hand>
        </div>
      )}
    </div>
    {action && <SketchBtn small primary={danger}>{action}</SketchBtn>}
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <Title size={16} style={{ marginBottom: 8 }}>{title}</Title>
    <div>{children}</div>
  </div>
);

export const WireSettings: React.FC = () => (
  <div
    style={{
      width: 1200,
      minHeight: 900,
      background: "#FFFEF8",
      border: "1.5px solid #1A1915",
      fontFamily: "'Kaisei Decol', serif",
      display: "flex",
    }}
  >
    <div
      style={{
        width: 220,
        borderRight: "1.5px solid #1A1915",
        padding: "24px 20px",
        background: "#F5F0E1",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <Hanko size={28} /> <Title size={14}>ファミリーツリー２</Title>
      </div>
      {[["□", "家系図"], ["□", "思い出"], ["■", "設定・データ"]].map(([i, l]) => (
        <div
          key={l}
          style={{
            padding: "8px 10px",
            fontFamily: "'Klee One', cursive",
            fontSize: 13,
            borderRadius: 4,
            background: l === "設定・データ" ? "#FFFEF8" : "transparent",
            border: l === "設定・データ" ? "1.5px solid #1A1915" : "1.5px solid transparent",
            boxShadow: l === "設定・データ" ? "2px 2px 0 #1A1915" : undefined,
            fontWeight: l === "設定・データ" ? 600 : 400,
            marginBottom: 6,
          }}
        >
          <span style={{ color: "#C0392B" }}>{i}</span> {l}
        </div>
      ))}
    </div>

    <div style={{ flex: 1, padding: "32px 48px", position: "relative" }}>
      <Hand size={12} color="#6B6456">設定</Hand>
      <Title size={32} style={{ marginTop: 4, marginBottom: 28 }}>データの管理</Title>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 48 }}>
        <div>
          <Section title="書き出し・取り込み">
            <Row label="この家系を書き出す（田中家）" value="最終書き出し：5日前" action="書き出す" />
            <Row label="すべての家系を書き出す" value="4家系すべてをZIPで一括" action="すべて書き出す" />
            <Row label="家系ファイルを取り込む" value=".ftree2 を選ぶ ／ 同名は上書き" action="ファイル選択" />
          </Section>

          <Section title="ストレージ">
            <Row label="家系データ（文字）" value="218 KB / 5 MB（端末内）" />
            <Row label="写真・サムネイル" value="47.2 MB （端末内 IndexedDB）" />
            <Row label="家系の数 / 人物 / 思い出" value="4家系 ／ 478人 ／ 32本" />
          </Section>

          <Section title="アプリ">
            <Row label="アプリをホーム画面に追加" value="PWAとしてインストール" action="インストール" />
            <Row label="オフラインで使う" value="最後に開いた家系図を保存中" />
            <Row label="テーマ" value="絵本（デフォルト）" action="変更" />
            <Row label="バージョン" value="v0.1.0（2025年春）" />
          </Section>

          <Section title="危険な操作">
            <Row label="この家系を削除" value="書き出しておくことを強く推奨します" danger action="削除…" />
            <Row label="すべてのデータを消去" value="アプリを工場出荷状態に戻す" danger action="消去…" />
          </Section>
        </div>

        <div>
          <div
            style={{
              border: "1.5px solid #C0392B",
              background: "#FBE4E0",
              borderRadius: 6,
              padding: 16,
              boxShadow: "2px 2px 0 #C0392B",
            }}
          >
            <Hand size={12} color="#C0392B" style={{ letterSpacing: "0.2em" }}>
              ─── 大切なお知らせ
            </Hand>
            <Title size={14} style={{ marginTop: 6 }}>
              月に一度は書き出しを
            </Title>
            <Hand size={11} color="#6B6456" style={{ marginTop: 6, display: "block", lineHeight: 1.6 }}>
              ブラウザの設定や端末の故障でデータが失われることがあります。<br />
              .ftree2 ファイルを外部に保存しておくのが安心です。
            </Hand>
          </div>

          <div style={{ marginTop: 28 }}>
            <StickyNote rotate={4}>
              ローカルストレージは<br />
              自動削除されることもある。<br />
              ユーザーに月1で催促。
            </StickyNote>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default WireSettings;
