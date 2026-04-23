// Wireframe 16 — Memory detail (read-only view)
import React from "react";
import { Title, Hand, SketchBtn, Photo, Hanko, StickyNote } from "./primitives";

export const WireMemoryDetail: React.FC = () => (
  <div style={{ width: 1200, minHeight: 900, background: "#FFFEF8", border: "1.5px solid #1A1915", fontFamily: "'Kaisei Decol', serif", position: "relative" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 32px", borderBottom: "1.5px solid #1A1915" }}>
      <Hanko size={28} />
      <Hand size={11} color="#6B6456">← 思い出ノート一覧</Hand>
      <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
        <SketchBtn small>✎ 編集</SketchBtn>
        <SketchBtn small>🗑 削除</SketchBtn>
      </div>
    </div>

    <div style={{ maxWidth: 760, margin: "48px auto", padding: "0 32px" }}>
      <Hand size={12} color="#C0392B" style={{ letterSpacing: "0.3em" }}>
        ─── 2015年 秋 ・ 田中 一郎（父）の思い出
      </Hand>
      <Title size={42} style={{ marginTop: 12, lineHeight: 1.3 }}>
        父との最後の温泉旅行
      </Title>
      <Hand size={12} color="#8B8574" style={{ marginTop: 8, display: "block" }}>
        書き手：田中 太郎 ／ 2016年1月 執筆
      </Hand>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
        <Photo w={480} h={480} label="〔 正方形写真 480×480 〕" />
      </div>
      <div style={{ textAlign: "center", marginTop: 10 }}>
        <Hand size={11} color="#8B8574">箱根湯本駅にて</Hand>
      </div>

      <div style={{ marginTop: 40, lineHeight: 2.1, fontFamily: "'Klee One', cursive", fontSize: 15 }}>
        <Title size={24} style={{ marginBottom: 12 }}>箱根、秋</Title>
        <p style={{ margin: "0 0 18px" }}>
          父と二人で行った<b>最後の温泉旅行</b>でした。紅葉はすでに終わりかけで、朝晩は冷え込んでいたのを覚えています。
        </p>
        <p style={{ margin: "0 0 18px" }}>
          旅館の夕食で、父は「こんなに魚を食べたのは久しぶりだ」と笑っていました。そのひと言を、今でもときどき思い出します。
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "24px 0" }}>
          <Photo w="100%" h={220} label="〔 写真 〕" />
          <Photo w="100%" h={220} label="〔 写真 〕" />
        </div>
        <p style={{ margin: 0 }}>
          翌春、父は静かに眠るように旅立ちました。あの温泉の湯気を、今も忘れられません。
        </p>
      </div>

      <div style={{ marginTop: 48, padding: 20, background: "#F5F0E1", border: "1.2px dashed #1A1915" }}>
        <Hand size={11} color="#8B8574" style={{ letterSpacing: "0.2em" }}>─── RELATED</Hand>
        <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["田中 一郎（父）★", "田中 太郎", "田中 花子（母）"].map((n) => (
            <div key={n} style={{ padding: "6px 12px", border: "1.2px solid #1A1915", borderRadius: 999, background: "#FFFEF8" }}>
              <Hand size={12}>{n}</Hand>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between" }}>
        <Hand size={12} color="#C0392B">← 前の思い出</Hand>
        <Hand size={12} color="#C0392B">次の思い出 →</Hand>
      </div>
    </div>

    <div style={{ position: "absolute", top: 120, right: 40 }}>
      <StickyNote rotate={-4}>絵本のページ感。<br />写真と本文が交互に。</StickyNote>
    </div>
  </div>
);

export default WireMemoryDetail;
