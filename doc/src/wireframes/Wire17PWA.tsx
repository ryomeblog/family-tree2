// Wireframe 17 — PWA splash + offline
import React from "react";
import { Title, Hand, SketchBtn, Hanko, StickyNote } from "./primitives";

const Phone: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <div>
    <Hand size={11} color="#8B8574" style={{ letterSpacing: "0.15em" }}>{label}</Hand>
    <div style={{ marginTop: 10, width: 280, height: 560, border: "2px solid #1A1915", borderRadius: 28, background: "#FFFEF8", boxShadow: "4px 4px 0 #1A1915", padding: 18, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 80, height: 18, background: "#1A1915", borderRadius: 999 }} />
      {children}
    </div>
  </div>
);

export const WirePWA: React.FC = () => (
  <div style={{ width: 1200, minHeight: 760, background: "#FFFEF8", border: "1.5px solid #1A1915", fontFamily: "'Kaisei Decol', serif", padding: 40, position: "relative" }}>
    <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.2em" }}>─── PWA</Hand>
    <Title size={26} style={{ marginTop: 4, marginBottom: 24 }}>スマホで開いたとき</Title>

    <div style={{ display: "flex", gap: 36, justifyContent: "center" }}>
      <Phone label="17-A ／ スプラッシュ（起動）">
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <Hanko size={72} />
          <Title size={20}>ファミリーツリー２</Title>
          <Hand size={11} color="#6B6456">家族の記録を、この端末に</Hand>
          <div style={{ marginTop: 14 }}>
            <Hand size={10} color="#8B8574">読み込み中…</Hand>
          </div>
        </div>
      </Phone>

      <Phone label="17-B ／ インストール案内">
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 10, gap: 10 }}>
          <Hanko size={36} />
          <Title size={14}>ホーム画面に追加</Title>
          <Hand size={10} color="#6B6456" style={{ lineHeight: 1.6 }}>
            アプリとして保存すると、ブラウザを開かずに起動でき、オフラインでも家系図を見られます。
          </Hand>
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            <SketchBtn small primary>＋ ホームに追加</SketchBtn>
            <Hand size={10} color="#8B8574" style={{ textAlign: "center" }}>あとで</Hand>
          </div>
        </div>
      </Phone>

      <Phone label="17-C ／ オフライン">
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 10 }}>
          <div style={{ padding: "6px 10px", background: "#FDF6C8", border: "1.2px solid #1A1915", borderRadius: 4, marginBottom: 10 }}>
            <Hand size={10}>📡 オフライン表示中</Hand>
          </div>
          <Title size={14}>田中家</Title>
          <Hand size={10} color="#6B6456">12世代・148名</Hand>
          <div style={{ marginTop: 12, flex: 1, background: "#F5F0E1", border: "1.2px dashed #1A1915", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Hand size={11} color="#8B8574">〔 家系図 〕</Hand>
          </div>
          <Hand size={10} color="#8B8574" style={{ marginTop: 8, textAlign: "center" }}>
            最終同期：起動時（端末内）
          </Hand>
        </div>
      </Phone>

      <Phone label="17-D ／ 新バージョン通知">
        <div style={{ flex: 1, padding: 10, display: "flex", flexDirection: "column" }}>
          <Title size={14}>田中家</Title>
          <div style={{ flex: 1, background: "#F5F0E1", border: "1.2px dashed #1A1915", marginTop: 10 }} />
          <div style={{ marginTop: 10, padding: 10, background: "#FBE4E0", border: "1.5px solid #C0392B", borderRadius: 4 }}>
            <Hand size={10} color="#C0392B">🔄 新しいバージョンがあります</Hand>
            <div style={{ marginTop: 6 }}>
              <SketchBtn small primary>再読込</SketchBtn>
            </div>
          </div>
        </div>
      </Phone>
    </div>

    <div style={{ position: "absolute", top: 40, right: 40 }}>
      <StickyNote rotate={4}>GitHub Pages配信＋SW。<br />オフラインでも起動。</StickyNote>
    </div>
  </div>
);

export default WirePWA;
