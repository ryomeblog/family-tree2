// Wireframe 18 — Empty states
import React from "react";
import { Title, Hand, SketchBtn, Hanko, StickyNote } from "./primitives";

const Empty: React.FC<{ label: string; icon: string; title: string; body: string; cta: string }> = ({ label, icon, title, body, cta }) => (
  <div>
    <Hand size={11} color="#8B8574" style={{ letterSpacing: "0.15em" }}>{label}</Hand>
    <div style={{ marginTop: 10, width: 360, height: 300, border: "1.5px solid #1A1915", borderRadius: 6, background: "#FFFEF8", boxShadow: "3px 3px 0 #1A1915", padding: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 10 }}>
      <div style={{ fontSize: 48 }}>{icon}</div>
      <Title size={18}>{title}</Title>
      <Hand size={12} color="#6B6456" style={{ lineHeight: 1.6 }}>{body}</Hand>
      <div style={{ marginTop: 8 }}>
        <SketchBtn small primary>{cta}</SketchBtn>
      </div>
    </div>
  </div>
);

export const WireEmpty: React.FC = () => (
  <div style={{ width: 1200, minHeight: 780, background: "#E8E2D0", border: "1.5px solid #1A1915", fontFamily: "'Kaisei Decol', serif", padding: 40, position: "relative" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Hanko size={32} />
      <div>
        <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.2em" }}>─── EMPTY STATES</Hand>
        <Title size={26} style={{ marginTop: 2 }}>なにもないとき</Title>
      </div>
    </div>

    <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, justifyItems: "center" }}>
      <Empty label="18-A ／ 家系図ゼロ" icon="🌱" title="最初の家系図をつくりましょう" body="まずはあなた自身から。おじいちゃん・おばあちゃんまで、少しずつ育てていけます。" cta="＋ 新規作成" />
      <Empty label="18-B ／ 家系に人がひとり" icon="🌳" title="家族を足していきましょう" body="ノードから線を引き出すと、両親・配偶者・お子さんを追加できます。" cta="関係を追加" />
      <Empty label="18-C ／ 思い出ゼロ" icon="📖" title="最初の思い出を書いてみましょう" body="家系図の「人」と結びついた短いエピソードを残せます。写真は10枚まで。" cta="✎ 書く" />
      <Empty label="18-D ／ 写真ゼロ（人物）" icon="📷" title="この人の写真はまだありません" body="思い出ノートを書くと、そこに載せた写真がここにも並びます。" cta="＋ 写真を追加" />
      <Empty label="18-E ／ 検索結果なし" icon="🔍" title="「○○」に当てはまる家族はいません" body="ひらがな・カタカナ・漢字で試してみてください。旧姓でも検索できます。" cta="検索をクリア" />
      <Empty label="18-F ／ 初回起動" icon="🏠" title="ファミリーツリー２へようこそ" body="新しく始めるか、以前に書き出した .ftree2 ファイルから取り込めます。" cta="はじめる" />
    </div>

    <div style={{ position: "absolute", top: 32, right: 32 }}>
      <StickyNote rotate={-5}>空状態は学ぶ場。<br />できることを１つ提示。</StickyNote>
    </div>
  </div>
);

export default WireEmpty;
