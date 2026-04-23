// Wireframe 14 — Photo lightbox
import React from "react";
import { Title, Hand, StickyNote, Photo } from "./primitives";

export const WirePhotoLightbox: React.FC = () => (
  <div
    style={{
      width: 1200,
      height: 780,
      background: "#1A1915",
      border: "1.5px solid #1A1915",
      fontFamily: "'Kaisei Decol', serif",
      color: "#FFFEF8",
      padding: 40,
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}
  >
    {/* Top bar */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Hand size={11} color="#FDF6C8" style={{ letterSpacing: "0.2em" }}>
          ─── PHOTO 4 / 10
        </Hand>
        <Title size={20} style={{ marginTop: 4, color: "#FFFEF8" }}>
          結婚式の朝
        </Title>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {["⤢", "⬇", "✏︎", "🗑", "✕"].map((i) => (
          <div
            key={i}
            style={{
              width: 34,
              height: 34,
              border: "1.5px solid #FFFEF8",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
            }}
          >
            {i}
          </div>
        ))}
      </div>
    </div>

    {/* Main image */}
    <div
      style={{
        flex: 1,
        marginTop: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: "1.5px solid #FFFEF8",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        ←
      </div>

      <div
        style={{
          width: 480,
          height: 480,
          border: "2px solid #FFFEF8",
          background: "#2A2824",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Hand size={13} color="#8B8574">〔 正方形写真（480×480） 〕</Hand>
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            background: "rgba(255,254,248,0.12)",
            border: "1px solid #FFFEF8",
            padding: "3px 8px",
            borderRadius: 4,
          }}
        >
          <Hand size={10} color="#FFFEF8">1:1 ・ 正方形保存</Hand>
        </div>
      </div>

      <div
        style={{
          width: 48,
          height: 48,
          border: "1.5px solid #FFFEF8",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        →
      </div>
    </div>

    {/* Caption */}
    <div style={{ textAlign: "center", marginTop: 16 }}>
      <Hand size={13} color="#FDF6C8">
        1983年11月3日・神前式。お父さんが一番緊張していました。
      </Hand>
    </div>

    {/* Thumbs strip */}
    <div
      style={{
        marginTop: 16,
        display: "flex",
        gap: 6,
        justifyContent: "center",
      }}
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 52,
            height: 52,
            border: i === 3 ? "2px solid #C0392B" : "1px solid #8B8574",
            background: "#2A2824",
            opacity: i === 3 ? 1 : 0.6,
          }}
        />
      ))}
    </div>

    <div style={{ position: "absolute", bottom: 28, right: 28 }}>
      <StickyNote rotate={-4}>
        画像は正方形前提。<br />
        はみ出しは黒余白で。
      </StickyNote>
    </div>
  </div>
);

export default WirePhotoLightbox;
