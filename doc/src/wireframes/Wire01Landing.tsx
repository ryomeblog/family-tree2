// Wireframe 01 — Landing / Home page (marketing)
import React from "react";
import {
  Hanko,
  Title,
  Hand,
  SketchBtn,
  Para,
  PersonNode,
  PaperEdge,
  StickyNote,
} from "./primitives";

export const WireLanding: React.FC = () => (
  <div
    style={{
      width: 1200,
      minHeight: 800,
      background: "#FFFEF8",
      fontFamily: "'Kaisei Decol', serif",
      position: "relative",
      border: "1.5px solid #1A1915",
      overflow: "hidden",
    }}
  >
    {/* Top navigation */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 48px",
        borderBottom: "1.5px solid #1A1915",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Hanko size={36} text="家" />
        <Title size={20}>ファミリーツリー２</Title>
      </div>
      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        <Hand>使い方</Hand>
        <SketchBtn small primary>はじめる</SketchBtn>
      </div>
    </div>

    {/* Hero */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 48,
        padding: "72px 48px 56px",
        alignItems: "center",
      }}
    >
      <div>
        <Hand size={14} color="#C0392B" style={{ letterSpacing: "0.2em" }}>
          ─── ご家族の物語を、絵本のように
        </Hand>
        <Title size={52} style={{ marginTop: 16, lineHeight: 1.25 }}>
          あなたの家系を、<br />
          次の世代へ。
        </Title>
        <div style={{ marginTop: 24, maxWidth: 440 }}>
          <Para lines={3} />
        </div>
        <div style={{ marginTop: 36, display: "flex", gap: 16, alignItems: "center" }}>
          <SketchBtn primary>無料で家系図をつくる</SketchBtn>
          <SketchBtn>動画で見る ▶</SketchBtn>
        </div>
        <div style={{ marginTop: 24, display: "flex", gap: 16, alignItems: "center" }}>
          <Hand size={11} color="#6B6456">★★★★★ 4.8 / 12,400件のレビュー</Hand>
        </div>
      </div>

      {/* Hero illustration placeholder */}
      <div
        style={{
          position: "relative",
          height: 440,
          border: "1.5px dashed #1A1915",
          borderRadius: 8,
          background: "#F5F0E1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Hand size={14} color="#8B8574">〔 絵本風の家系図イラスト 〕</Hand>
          <div style={{ marginTop: 8 }}>
            <Hand size={11} color="#8B8574">手描き・水彩・桜の木</Hand>
          </div>
        </div>
        <div style={{ position: "absolute", top: 40, left: "50%", transform: "translateX(-50%)" }}>
          <PersonNode name="祖父母" years="1930–" />
        </div>
        <div style={{ position: "absolute", top: 160, left: 80 }}>
          <PersonNode name="父" years="1958–" gender="m" />
        </div>
        <div style={{ position: "absolute", top: 160, right: 80 }}>
          <PersonNode name="母" years="1960–" gender="f" />
        </div>
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)" }}>
          <PersonNode name="私" years="1985–" emph />
        </div>
      </div>
    </div>

    <PaperEdge />

    {/* Feature row */}
    <div style={{ padding: "48px 48px", background: "#F5F0E1" }}>
      <Title size={28} style={{ textAlign: "center", marginBottom: 36 }}>
        ３つの特長
      </Title>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
        {[
          { num: "壱", title: "かんたん操作", body: "クリックだけで家族を追加" },
          { num: "弐", title: "写真と思い出", body: "写真・エピソードを保存" },
          { num: "参", title: "本として印刷", body: "絵本スタイルで製本可能" },
        ].map((f) => (
          <div
            key={f.num}
            style={{
              background: "#FFFEF8",
              border: "1.5px solid #1A1915",
              padding: "28px 24px",
              boxShadow: "3px 3px 0 #1A1915",
            }}
          >
            <Hanko size={40} text={f.num} />
            <Title size={18} style={{ marginTop: 16 }}>{f.title}</Title>
            <div style={{ marginTop: 10 }}>
              <Para lines={2} />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Footer */}
    <div
      style={{
        borderTop: "1.5px solid #1A1915",
        padding: "24px 48px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Hand size={11} color="#6B6456">© 2026 ファミリーツリー２</Hand>
      <div style={{ display: "flex", gap: 20 }}>
        <Hand size={11}>利用規約</Hand>
        <Hand size={11}>プライバシー</Hand>
      </div>
    </div>

    {/* Sticky note annotations */}
    <div style={{ position: "absolute", top: 80, right: -40 }}>
      <StickyNote rotate={6}>
        ロゴ＝朱印風の「家」マーク。<br />
        タイトルは毛筆明朝。
      </StickyNote>
    </div>
    <div style={{ position: "absolute", top: 360, left: -60 }}>
      <StickyNote rotate={-4}>
        ヒーロー：物語のはじまり感。<br />
        手描きイラストが主役。
      </StickyNote>
    </div>
  </div>
);

export default WireLanding;
