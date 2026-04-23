// Wireframe 11 — Import / Quota error states
import React from "react";
import { Title, Hand, SketchBtn, StickyNote } from "./primitives";

const ErrorCard: React.FC<{
  icon: string;
  title: string;
  body: string;
  actions: string[];
}> = ({ icon, title, body, actions }) => (
  <div
    style={{
      width: 460,
      background: "#FFFEF8",
      border: "1.5px solid #C0392B",
      boxShadow: "4px 4px 0 #C0392B",
      padding: "28px 32px",
    }}
  >
    <div style={{ fontSize: 36 }}>{icon}</div>
    <Title size={20} style={{ marginTop: 8 }}>
      {title}
    </Title>
    <Hand size={12} color="#6B6456" style={{ marginTop: 10, display: "block", lineHeight: 1.7 }}>
      {body}
    </Hand>
    <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
      {actions.map((a, i) => (
        <SketchBtn key={a} small primary={i === 0}>
          {a}
        </SketchBtn>
      ))}
    </div>
  </div>
);

export const WireImportError: React.FC = () => (
  <div
    style={{
      width: 1200,
      minHeight: 780,
      background: "#E8E2D0",
      border: "1.5px solid #1A1915",
      padding: 48,
      fontFamily: "'Kaisei Decol', serif",
      position: "relative",
    }}
  >
    <Hand size={12} color="#C0392B" style={{ letterSpacing: "0.2em" }}>
      ─── ERROR STATES
    </Hand>
    <Title size={26} style={{ marginTop: 4, marginBottom: 24 }}>
      うまくいかないとき
    </Title>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
      <div>
        <Hand size={11} color="#8B8574" style={{ letterSpacing: "0.15em" }}>
          11-A ／ ファイル形式が違う
        </Hand>
        <div style={{ marginTop: 10 }}>
          <ErrorCard
            icon="⚠️"
            title="このファイルは読み込めません"
            body="選ばれたファイルは .ftree2 ではないか、壊れている可能性があります。別のファイルをお試しください。"
            actions={["別のファイルを選ぶ", "キャンセル"]}
          />
        </div>
      </div>

      <div>
        <Hand size={11} color="#8B8574" style={{ letterSpacing: "0.15em" }}>
          11-B ／ バージョンが新しすぎる
        </Hand>
        <div style={{ marginTop: 10 }}>
          <ErrorCard
            icon="🕰"
            title="このアプリより新しい形式です"
            body="このファイルは、アプリの新しいバージョンで書き出されたものです。アプリを最新版に更新してからお試しください。"
            actions={["アプリを更新", "キャンセル"]}
          />
        </div>
      </div>

      <div>
        <Hand size={11} color="#8B8574" style={{ letterSpacing: "0.15em" }}>
          11-C ／ 容量が足りない（QuotaExceeded）
        </Hand>
        <div style={{ marginTop: 10 }}>
          <ErrorCard
            icon="💾"
            title="端末の容量が足りません"
            body="写真の取り込みに必要な空きが足りません。不要な家系や古い写真を削除するか、書き出してから整理してください。"
            actions={["設定を開く", "書き出す", "キャンセル"]}
          />
        </div>
      </div>

      <div>
        <Hand size={11} color="#8B8574" style={{ letterSpacing: "0.15em" }}>
          11-D ／ IndexedDBが使えない
        </Hand>
        <div style={{ marginTop: 10 }}>
          <ErrorCard
            icon="🔒"
            title="お使いの環境では写真が保存できません"
            body="プライベートブラウジングでは写真を保存できない場合があります。通常のタブで開き直すと使えます。"
            actions={["わかりました"]}
          />
        </div>
      </div>
    </div>

    <div style={{ position: "absolute", top: 36, right: 36 }}>
      <StickyNote rotate={4}>
        エラーは絶対に怒らない。<br />
        「どうすればいいか」を<br />
        必ず提示する。
      </StickyNote>
    </div>
  </div>
);

export default WireImportError;
