// Wireframe 21 — Quota / storage errors
import React from "react";
import { Title, Hand, SketchBtn, StickyNote } from "./primitives";

const Alert: React.FC<{ label: string; icon: string; title: string; children: React.ReactNode; tone?: "warn" | "err" }> = ({ label, icon, title, children, tone = "warn" }) => {
  const color = tone === "err" ? "#C0392B" : "#B58B1B";
  const bg = tone === "err" ? "#FBE4E0" : "#FDF6C8";
  return (
    <div>
      <Hand size={11} color="#8B8574" style={{ letterSpacing: "0.15em" }}>{label}</Hand>
      <div style={{ marginTop: 10, width: 480, background: bg, border: `2px solid ${color}`, borderRadius: 6, boxShadow: `4px 4px 0 ${color}`, padding: 22 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ fontSize: 28 }}>{icon}</div>
          <div style={{ flex: 1 }}>
            <Title size={16} style={{ color }}>{title}</Title>
            <div style={{ marginTop: 6, fontFamily: "'Klee One', cursive", fontSize: 12, lineHeight: 1.8 }}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WireQuota: React.FC = () => (
  <div style={{ width: 1200, minHeight: 820, background: "#E8E2D0", border: "1.5px solid #1A1915", fontFamily: "'Kaisei Decol', serif", padding: 40, position: "relative" }}>
    <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.2em" }}>─── STORAGE & ERRORS</Hand>
    <Title size={26} style={{ marginTop: 4, marginBottom: 24 }}>容量・データ保全の警告</Title>
    <Hand size={12} color="#6B6456">端末内ストレージはブラウザに削除される可能性があるので、先回りして伝える。</Hand>

    <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, justifyItems: "center" }}>
      <Alert label="21-A ／ 容量不足（写真追加時）" icon="📦" title="写真を追加できません" tone="err">
        端末の空き容量が不足しています（残り約 12 MB）。<br />
        次のどれかをお試しください：
        <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
          <li>古い写真を整理する（思い出ノートから）</li>
          <li>家系を .ftree2 に書き出して別家系を削除</li>
          <li>画像サイズを小さくしてから再投入</li>
        </ul>
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <SketchBtn small>写真を整理</SketchBtn>
          <SketchBtn small primary>書き出す</SketchBtn>
        </div>
      </Alert>

      <Alert label="21-B ／ 永続化されていない" icon="⚠" title="端末がこのデータを自動削除する可能性があります">
        ブラウザのシークレットモードや古い設定では、ある日突然データが消えることがあります。<br />
        「<b>永続化を許可</b>」にすると安全です。
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <SketchBtn small>あとで</SketchBtn>
          <SketchBtn small primary>許可する</SketchBtn>
        </div>
      </Alert>

      <Alert label="21-C ／ 保存に失敗" icon="✖" title="保存できませんでした" tone="err">
        書き込み中にエラーが発生しました。前の状態に戻しました。<br />
        大事なデータなので、念のため書き出しをおすすめします。
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <SketchBtn small>もう一度</SketchBtn>
          <SketchBtn small primary>書き出して安全に</SketchBtn>
        </div>
      </Alert>

      <Alert label="21-D ／ 書き出しリマインド（月1）" icon="💾" title="そろそろ書き出しませんか？">
        前回の書き出しから <b>32日</b>が経ちました。<br />
        .ftree2 ファイルを外部に保管しておくと安心です。
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <SketchBtn small>あとで</SketchBtn>
          <SketchBtn small primary>今すぐ書き出す</SketchBtn>
        </div>
      </Alert>

      <Alert label="21-E ／ ストレージ使用状況（設定ページ内）" icon="📊" title="写真が容量の87%を使っています">
        <div style={{ marginTop: 4, height: 12, background: "#FFFEF8", border: "1.2px solid #1A1915", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: "87%", height: "100%", background: "#C0392B" }} />
        </div>
        <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between" }}>
          <Hand size={11} color="#6B6456">47.2 MB / 54 MB</Hand>
          <Hand size={11} color="#C0392B">残り 12 MB</Hand>
        </div>
      </Alert>

      <Alert label="21-F ／ ブラウザ互換警告" icon="🌐" title="このブラウザは一部の機能に対応していません">
        お使いのブラウザでは、写真の保存場所（IndexedDB）が制限されています。<br />
        Chrome／Safari／Edge の最新版をおすすめします。
        <div style={{ marginTop: 10 }}>
          <SketchBtn small>詳しく</SketchBtn>
        </div>
      </Alert>
    </div>

    <div style={{ position: "absolute", top: 32, right: 32 }}>
      <StickyNote rotate={5}>「データを守る」UXが<br />このアプリの肝。</StickyNote>
    </div>
  </div>
);

export default WireQuota;
