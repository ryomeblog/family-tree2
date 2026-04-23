// Wireframe 08 — Open family (replaces login) — landing CTA target
import React from "react";
import { Title, Hand, SketchBtn, Hanko, StickyNote } from "./primitives";

export const WireOpenFamily: React.FC = () => (
  <div
    style={{
      width: 1200,
      height: 760,
      background: "#FFFEF8",
      border: "1.5px solid #1A1915",
      fontFamily: "'Kaisei Decol', serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 48,
      position: "relative",
    }}
  >
    <div style={{ maxWidth: 640, width: "100%", textAlign: "center" }}>
      <Hanko size={56} />
      <Hand size={12} color="#C0392B" style={{ letterSpacing: "0.3em", marginTop: 20, display: "block" }}>
        ─── はじめましょう
      </Hand>
      <Title size={40} style={{ marginTop: 10 }}>
        家系図をはじめる
      </Title>
      <Hand size={14} color="#6B6456" style={{ marginTop: 10, display: "block" }}>
        このアプリは、あなたの端末のなかにだけ家族の記録を保存します。<br />
        アカウントはいりません。
      </Hand>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 40 }}>
        <div
          style={{
            border: "1.5px solid #1A1915",
            borderRadius: 8,
            padding: 28,
            background: "#FFFEF8",
            boxShadow: "3px 3px 0 #1A1915",
            textAlign: "left",
          }}
        >
          <div style={{ fontSize: 32 }}>🌳</div>
          <Title size={18} style={{ marginTop: 8 }}>
            新しくつくる
          </Title>
          <Hand size={12} color="#6B6456" style={{ marginTop: 6, display: "block" }}>
            空の家系図からはじめます。最初の一人を登録すると、木が育ち始めます。
          </Hand>
          <div style={{ marginTop: 16 }}>
            <SketchBtn primary>＋ 新規作成</SketchBtn>
          </div>
        </div>

        <div
          style={{
            border: "1.5px dashed #1A1915",
            borderRadius: 8,
            padding: 28,
            background: "#F5F0E1",
            textAlign: "left",
          }}
        >
          <div style={{ fontSize: 32 }}>📂</div>
          <Title size={18} style={{ marginTop: 8 }}>
            家系ファイルから
          </Title>
          <Hand size={12} color="#6B6456" style={{ marginTop: 6, display: "block" }}>
            以前に書き出した <b>.ftree2</b> ファイルがあれば、ここから取り込めます。
          </Hand>
          <div style={{ marginTop: 16 }}>
            <SketchBtn>📁 ファイルを選ぶ</SketchBtn>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", top: 60, right: 60 }}>
        <StickyNote rotate={-5}>
          認証・クラウドなし。<br />
          データは全部この端末。
        </StickyNote>
      </div>
    </div>
  </div>
);

export default WireOpenFamily;
