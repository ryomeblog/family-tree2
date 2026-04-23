// Wireframe 12 — Family card menu (dashboard popover: rename/export/duplicate/delete)
import React from "react";
import { Title, Hand, StickyNote } from "./primitives";

const Item: React.FC<{ icon: string; label: string; hint?: string; danger?: boolean; disabled?: boolean }> = ({
  icon,
  label,
  hint,
  danger,
  disabled,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 14px",
      borderRadius: 4,
      cursor: "pointer",
      color: disabled ? "#B8B1A2" : danger ? "#C0392B" : "#1A1915",
    }}
  >
    <span style={{ fontSize: 16 }}>{icon}</span>
    <div>
      <Hand size={13} color={disabled ? "#B8B1A2" : danger ? "#C0392B" : "#1A1915"}>
        {label}
      </Hand>
      {hint && (
        <div>
          <Hand size={10} color="#8B8574">
            {hint}
          </Hand>
        </div>
      )}
    </div>
  </div>
);

export const WireFamilyMenu: React.FC = () => (
  <div
    style={{
      width: 1200,
      height: 780,
      background: "#FFFEF8",
      border: "1.5px solid #1A1915",
      fontFamily: "'Kaisei Decol', serif",
      padding: 48,
      position: "relative",
    }}
  >
    <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.2em" }}>
      ─── CARD MENU
    </Hand>
    <Title size={26} style={{ marginTop: 4, marginBottom: 20 }}>
      家系カードのメニュー
    </Title>

    {/* Card */}
    <div style={{ position: "relative", width: 340, margin: "60px 0 0 40px" }}>
      <div
        style={{
          border: "1.5px solid #1A1915",
          borderRadius: 6,
          background: "#FFFEF8",
          padding: 20,
          boxShadow: "3px 3px 0 #1A1915",
        }}
      >
        <div
          style={{
            height: 120,
            background: "#F5F0E1",
            border: "1.2px dashed #1A1915",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <Hand size={10} color="#8B8574">〔 家系図サムネ 〕</Hand>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Title size={18}>田中家</Title>
          <div
            style={{
              width: 28,
              height: 28,
              border: "1.5px solid #C0392B",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Kaisei Decol', serif",
              color: "#C0392B",
              fontWeight: 700,
            }}
          >
            ⋯
          </div>
        </div>
        <Hand size={11} color="#6B6456" style={{ marginTop: 4, display: "block" }}>
          12世代・148名
        </Hand>
      </div>

      {/* Popover */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 320,
          width: 260,
          background: "#FFFEF8",
          border: "1.5px solid #1A1915",
          borderRadius: 6,
          padding: 6,
          boxShadow: "4px 4px 0 #1A1915",
          zIndex: 2,
        }}
      >
        <Item icon="✎" label="名前を変更" />
        <Item icon="📤" label="書き出す" hint=".ftree2 ファイルとして" />
        <Item icon="❏" label="複製する" hint="同じ内容の新しい家系" />
        <div style={{ height: 1, background: "#E8E2D0", margin: "6px 0" }} />
        <Item icon="🗑" label="削除…" danger hint="あとで元に戻せません" />
      </div>
    </div>

    {/* Confirm delete dialog */}
    <div
      style={{
        position: "absolute",
        top: 300,
        right: 120,
        width: 380,
        background: "#FFFEF8",
        border: "1.5px solid #C0392B",
        boxShadow: "4px 4px 0 #C0392B",
        padding: 22,
      }}
    >
      <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.2em" }}>
        ─── CONFIRM
      </Hand>
      <Title size={18} style={{ marginTop: 4 }}>
        「田中家」を削除しますか？
      </Title>
      <Hand size={12} color="#6B6456" style={{ marginTop: 8, display: "block", lineHeight: 1.6 }}>
        148名の情報と、写真642枚がこの端末から消えます。<br />
        <b>あとで元に戻せません。</b>
      </Hand>

      <div
        style={{
          marginTop: 14,
          padding: 10,
          background: "#FBE4E0",
          border: "1.2px dashed #C0392B",
          borderRadius: 4,
        }}
      >
        <Hand size={11}>
          ☐ 削除前に .ftree2 として書き出す（おすすめ）
        </Hand>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <div
          style={{
            padding: "6px 14px",
            border: "1.5px solid #1A1915",
            borderRadius: 999,
            fontFamily: "'Klee One', cursive",
            fontSize: 12,
            boxShadow: "2px 2px 0 #1A1915",
            background: "#FFFEF8",
          }}
        >
          キャンセル
        </div>
        <div
          style={{
            padding: "6px 14px",
            border: "1.5px solid #C0392B",
            borderRadius: 999,
            fontFamily: "'Klee One', cursive",
            fontSize: 12,
            boxShadow: "2px 2px 0 #C0392B",
            background: "#C0392B",
            color: "#FFFEF8",
          }}
        >
          削除する
        </div>
      </div>
    </div>

    <div style={{ position: "absolute", bottom: 40, left: 48 }}>
      <StickyNote rotate={-4}>
        削除は常に二段階確認＋<br />
        書き出しを勧める。
      </StickyNote>
    </div>
  </div>
);

export default WireFamilyMenu;
