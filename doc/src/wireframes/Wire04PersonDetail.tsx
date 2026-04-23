// Wireframe 04 — Person Detail
import React from "react";
import {
  Title,
  Hand,
  SketchBtn,
  Photo,
  Para,
  PaperEdge,
  StickyNote,
} from "./primitives";

export const WirePersonDetail: React.FC = () => (
  <div
    style={{
      width: 1200,
      minHeight: 900,
      background: "#FFFEF8",
      fontFamily: "'Kaisei Decol', serif",
      position: "relative",
      border: "1.5px solid #1A1915",
    }}
  >
    <div
      style={{
        padding: "14px 48px",
        borderBottom: "1.5px solid #1A1915",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#F5F0E1",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Hand size={12}>← 家系図に戻る</Hand>
        <Hand size={12} color="#8B8574">/ 田中家 / 田中 太郎</Hand>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <SketchBtn small>編集</SketchBtn>
        <SketchBtn small>共有</SketchBtn>
        <SketchBtn small>印刷</SketchBtn>
      </div>
    </div>

    <div
      style={{
        padding: "48px 48px 32px",
        display: "grid",
        gridTemplateColumns: "220px 1fr 280px",
        gap: 48,
        alignItems: "flex-start",
      }}
    >
      <div>
        <Photo w={200} h={260} label="ポートレート写真" />
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <Hand size={10} color="#8B8574">1995年・結婚式</Hand>
        </div>
      </div>

      <div>
        <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.15em" }}>
          ─── 第四世代
        </Hand>
        <Title size={48} style={{ marginTop: 8, lineHeight: 1.1 }}>
          田中 太郎
        </Title>
        <Hand size={14} color="#6B6456" style={{ marginTop: 4 }}>
          たなか たろう
        </Hand>

        <div style={{ display: "flex", gap: 32, marginTop: 24 }}>
          {[
            ["生年月日", "1985年 4月 3日"],
            ["出生地", "東京都 世田谷区"],
            ["続柄", "長男"],
          ].map(([k, v]) => (
            <div key={k}>
              <Hand size={10} color="#8B8574" style={{ letterSpacing: "0.15em" }}>
                {k}
              </Hand>
              <Title size={18} style={{ marginTop: 4 }}>{v}</Title>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <Hand size={10} color="#8B8574" style={{ letterSpacing: "0.15em" }}>
            紹介文
          </Hand>
          <div style={{ marginTop: 8, maxWidth: 560 }}>
            <Para lines={4} />
          </div>
        </div>
      </div>

      <div
        style={{
          border: "1.5px solid #1A1915",
          background: "#F5F0E1",
          padding: "16px 18px",
          boxShadow: "3px 3px 0 #1A1915",
        }}
      >
        <Hand size={10} color="#8B8574" style={{ letterSpacing: "0.15em" }}>家族</Hand>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            ["父", "田中 健一"],
            ["母", "田中 美代"],
            ["配偶者", "田中 花子"],
            ["兄", "田中 一郎"],
            ["妹", "佐藤 恵子"],
            ["長女", "田中 さくら"],
          ].map(([rel, name]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Photo w={32} h={32} round label="" />
              <div>
                <Hand size={10} color="#8B8574">{rel}</Hand>
                <div style={{ fontFamily: "'Kaisei Decol', serif", fontSize: 13, fontWeight: 600 }}>
                  {name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <PaperEdge style={{ margin: "0 48px" }} />

    <div style={{ padding: "32px 48px" }}>
      <Title size={26}>生涯のあゆみ</Title>
      <div style={{ marginTop: 24, position: "relative", paddingLeft: 30 }}>
        <div
          style={{
            position: "absolute",
            left: 10,
            top: 10,
            bottom: 10,
            width: 2,
            background: "#1A1915",
          }}
        />
        {[
          { year: "1985", title: "誕生" },
          { year: "2004", title: "高校卒業" },
          { year: "2008", title: "大学卒業" },
          { year: "2012", title: "結婚" },
          { year: "2015", title: "長女誕生" },
        ].map((e, i) => (
          <div key={i} style={{ marginBottom: 24, position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: -24,
                top: 4,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#C0392B",
                border: "2px solid #FFFEF8",
                boxShadow: "0 0 0 1.5px #1A1915",
              }}
            />
            <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.1em" }}>
              {e.year}年
            </Hand>
            <Title size={18} style={{ marginTop: 2 }}>{e.title}</Title>
            <div style={{ marginTop: 6, maxWidth: 500 }}>
              <Para lines={1} />
            </div>
          </div>
        ))}
      </div>
    </div>

    <PaperEdge style={{ margin: "0 48px" }} />

    <div style={{ padding: "32px 48px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Title size={26}>思い出の写真</Title>
        <Hand size={12} color="#C0392B">すべて見る →</Hand>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 12,
          marginTop: 20,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Photo key={i} w="100%" h={120} label={`${1990 + i * 5}`} />
        ))}
      </div>
    </div>

    <div style={{ position: "absolute", top: 100, right: -50 }}>
      <StickyNote rotate={5}>
        プロフィール＝絵本の<br />登場人物紹介ページ。
      </StickyNote>
    </div>
    <div style={{ position: "absolute", top: 560, left: -50 }}>
      <StickyNote rotate={-3}>
        タイムライン＝<br />巻物（絵巻物）を<br />縦に展開するイメージ。
      </StickyNote>
    </div>
  </div>
);

export default WirePersonDetail;
