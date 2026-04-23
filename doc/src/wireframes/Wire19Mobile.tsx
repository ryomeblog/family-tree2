// Wireframe 19 — Mobile (responsive at sm/md)
import React from "react";
import { Title, Hand, SketchBtn, Hanko, PersonNode, Photo, StickyNote } from "./primitives";

const Phone: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <Hand size={11} color="#8B8574" style={{ letterSpacing: "0.15em" }}>{label}</Hand>
    <div style={{ marginTop: 10, width: 300, height: 620, border: "2px solid #1A1915", borderRadius: 28, background: "#FFFEF8", boxShadow: "4px 4px 0 #1A1915", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  </div>
);

const TabBar = () => (
  <div style={{ display: "flex", borderTop: "1.5px solid #1A1915", background: "#F5F0E1", padding: "6px 0" }}>
    {["🌳", "📖", "📷", "⚙"].map((i, idx) => (
      <div key={idx} style={{ flex: 1, textAlign: "center", padding: "4px 0" }}>
        <div style={{ fontSize: 18 }}>{i}</div>
        <Hand size={9} color={idx === 0 ? "#C0392B" : "#8B8574"}>{["家系", "思い出", "写真", "設定"][idx]}</Hand>
      </div>
    ))}
  </div>
);

const TopBar: React.FC<{ title: string; back?: boolean }> = ({ title, back }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1.5px solid #1A1915" }}>
    {back ? <Hand size={14}>←</Hand> : <Hanko size={20} />}
    <Title size={14} style={{ flex: 1 }}>{title}</Title>
    <Hand size={14}>⋯</Hand>
  </div>
);

export const WireMobile: React.FC = () => (
  <div style={{ width: 1200, minHeight: 820, background: "#E8E2D0", border: "1.5px solid #1A1915", fontFamily: "'Kaisei Decol', serif", padding: 36, position: "relative" }}>
    <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.2em" }}>─── MOBILE (sm: 640px以下)</Hand>
    <Title size={26} style={{ marginTop: 4, marginBottom: 20 }}>スマホ版（PWA）</Title>
    <Hand size={12} color="#6B6456">PC版をレスポンシブで同時実装。編集もフル対応。ミニマップはmd以上のみ表示。</Hand>

    <div style={{ marginTop: 28, display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
      <Phone label="19-A ／ ダッシュボード">
        <TopBar title="マイ家系図" />
        <div style={{ flex: 1, padding: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <div style={{ flex: 1, border: "1.2px solid #1A1915", borderRadius: 4, padding: "6px 10px" }}>
              <Hand size={10} color="#8B8574">🔍 検索…</Hand>
            </div>
            <div style={{ border: "1.2px solid #1A1915", borderRadius: 4, padding: "6px 10px" }}>
              <Hand size={10}>更新 ▼</Hand>
            </div>
          </div>
          {["田中家・148名", "山本家（母方）・67名", "祖父の本家・221名"].map((c) => (
            <div key={c} style={{ border: "1.2px solid #1A1915", borderRadius: 4, padding: 10, marginBottom: 8, background: "#FFFEF8", boxShadow: "2px 2px 0 #1A1915", display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 44, height: 44, background: "#F5F0E1", border: "1px dashed #1A1915" }} />
              <Hand size={12}>{c}</Hand>
            </div>
          ))}
          <SketchBtn small primary>＋ 新規</SketchBtn>
        </div>
        <TabBar />
      </Phone>

      <Phone label="19-B ／ ツリー（ズーム・パン）">
        <TopBar title="田中家" />
        <div style={{ padding: "6px 10px", borderBottom: "1.5px solid #E8E2D0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Hand size={10} color="#C0392B">● 未保存</Hand>
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ width: 26, height: 26, border: "1.2px solid #1A1915", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>↶</div>
            <div style={{ width: 26, height: 26, border: "1.2px solid #1A1915", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>↷</div>
            <SketchBtn small primary>保存</SketchBtn>
          </div>
        </div>
        <div style={{ flex: 1, background: "repeating-linear-gradient(0deg, transparent 0 23px, #F0EBDC 23px 24px), repeating-linear-gradient(90deg, transparent 0 23px, #F0EBDC 23px 24px)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 40, left: 20 }}><PersonNode name="祖父" years="1930–" gender="m" /></div>
          <div style={{ position: "absolute", top: 40, left: 150 }}><PersonNode name="祖母" years="1933–" gender="f" /></div>
          <div style={{ position: "absolute", top: 160, left: 85 }}><PersonNode name="父" years="1958–" gender="m" emph /></div>
          <div style={{ position: "absolute", top: 280, left: 30 }}><PersonNode name="私" years="1985–" gender="m" /></div>
          <div style={{ position: "absolute", top: 280, left: 150 }}><PersonNode name="妹" years="1988–" gender="f" /></div>
          <div style={{ position: "absolute", bottom: 10, right: 10, background: "#FFFEF8", border: "1.2px solid #1A1915", borderRadius: 999, padding: "4px 8px", display: "flex", gap: 6, alignItems: "center" }}>
            <Hand size={10}>⊖ 100% ⊕</Hand>
          </div>
        </div>
        <TabBar />
      </Phone>

      <Phone label="19-C ／ 人物詳細（ドロワー）">
        <TopBar title="田中 一郎" back />
        <div style={{ padding: 14, textAlign: "center", borderBottom: "1.5px solid #E8E2D0" }}>
          <Photo w={120} h={120} round label="肖像" style={{ margin: "0 auto" }} />
          <Title size={16} style={{ marginTop: 10 }}>田中 一郎</Title>
          <Hand size={10} color="#6B6456">1958年 – 2016年 ／ 父</Hand>
          <div style={{ marginTop: 10, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            {["祖父として", "再婚相手として"].map(t => (
              <div key={t} style={{ padding: "2px 8px", border: "1px solid #C0392B", borderRadius: 999, fontSize: 9, fontFamily: "'Klee One', cursive", color: "#C0392B" }}>{t}</div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, padding: 12, overflow: "hidden" }}>
          <Hand size={10} color="#8B8574" style={{ letterSpacing: "0.1em" }}>─── 家族</Hand>
          {["田中 花子（妻）", "田中 太郎（長男）", "田中 さくら（娘）"].map(n => (
            <div key={n} style={{ padding: "6px 10px", borderBottom: "1px solid #E8E2D0" }}>
              <Hand size={11}>{n}</Hand>
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <Hand size={10} color="#8B8574" style={{ letterSpacing: "0.1em" }}>─── 思い出（3件）</Hand>
            <div style={{ padding: "6px 10px", borderBottom: "1px solid #E8E2D0" }}>
              <Hand size={11}>父との最後の温泉旅行</Hand>
            </div>
          </div>
        </div>
        <TabBar />
      </Phone>
    </div>

    <div style={{ position: "absolute", top: 32, right: 32 }}>
      <StickyNote rotate={6}>タブバー: 家系/思い出/写真/設定<br />ミニマップはmd以上のみ。</StickyNote>
    </div>
  </div>
);

export default WireMobile;
