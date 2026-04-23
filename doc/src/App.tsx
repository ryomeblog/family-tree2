// App entry — the design-canvas preview of all wireframes.
import React from "react";
import {
  WireLanding,
  WireDashboard,
  WireTreeEditor,
  WirePersonDetail,
  WireAddPerson,
  WireMemories,
  WireNewFamily,
  WireOpenFamily,
  WireSettings,
  WireImport,
  WireImportError,
  WireFamilyMenu,
  WireRelationAdd,
  WirePhotoLightbox,
  WireMemoryEditor,
  WireMemoryDetail,
  WirePWA,
  WireEmpty,
  WireMobile,
  WireDelete,
  WireQuota,
  WireEdit,
} from "./wireframes";

interface SectionProps {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ id, title, description, children }) => (
  <section id={id} data-screen-label={title} style={{ marginBottom: 96 }}>
    <header style={{ marginBottom: 24, maxWidth: 900, margin: "0 auto 24px" }}>
      <div style={{ fontFamily: "'Klee One', cursive", fontSize: 13, color: "#C0392B", letterSpacing: "0.2em" }}>
        ─── {id.toUpperCase()}
      </div>
      <h2 style={{ fontFamily: "'Kaisei Decol', serif", fontSize: 32, fontWeight: 700, color: "#1A1915", margin: "4px 0 6px" }}>
        {title}
      </h2>
      {description && (
        <p style={{ fontFamily: "'Klee One', cursive", fontSize: 14, color: "#6B6456", margin: 0 }}>
          {description}
        </p>
      )}
    </header>
    <div style={{ display: "flex", flexDirection: "column", gap: 80, alignItems: "center" }}>
      {children}
    </div>
  </section>
);

const Labeled: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <div style={{ fontFamily: "'Klee One', cursive", fontSize: 12, color: "#8B8574", marginBottom: 10, letterSpacing: "0.1em" }}>
      {label}
    </div>
    {children}
  </div>
);

export const App: React.FC = () => (
  <div style={{ padding: "48px 24px 96px", background: "#E8E2D0", minHeight: "100vh" }}>
    <header style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 64px" }}>
      <div style={{ fontFamily: "'Klee One', cursive", fontSize: 13, color: "#C0392B", letterSpacing: "0.3em" }}>
        ─── WIREFRAMES v0.2
      </div>
      <h1 style={{ fontFamily: "'Kaisei Decol', serif", fontSize: 52, fontWeight: 700, margin: "8px 0 12px", color: "#1A1915" }}>
        ファミリーツリー２
      </h1>
      <p style={{ fontFamily: "'Klee One', cursive", fontSize: 14, color: "#6B6456", margin: 0 }}>
        日本の家系図アプリ・絵本スタイル・端末内保存・PWA ／ 22画面
      </p>
    </header>

    <Section id="marketing" title="① マーケティング" description="お客さまが最初に出会う画面">
      <Labeled label="01 ランディングページ"><WireLanding /></Labeled>
    </Section>

    <Section id="onboarding" title="② オンボーディング ／ 家系の開閉" description="新規作成・取り込み・切替">
      <Labeled label="07 新規家系の作成"><WireNewFamily /></Labeled>
      <Labeled label="08 家系ファイルを開く"><WireOpenFamily /></Labeled>
      <Labeled label="10 取り込み（書き出し取り込み）"><WireImport /></Labeled>
      <Labeled label="11 取り込みエラー"><WireImportError /></Labeled>
      <Labeled label="12 家系メニュー（切替・書き出し）"><WireFamilyMenu /></Labeled>
    </Section>

    <Section id="app-core" title="③ アプリの中核" description="ダッシュボード・家系図エディタ">
      <Labeled label="02 ダッシュボード"><WireDashboard /></Labeled>
      <Labeled label="18 空状態（６パターン）"><WireEmpty /></Labeled>
      <Labeled label="03 家系図エディタ"><WireTreeEditor /></Labeled>
    </Section>

    <Section id="person" title="④ 人物" description="プロフィール・追加・編集・関係">
      <Labeled label="04 人物詳細"><WirePersonDetail /></Labeled>
      <Labeled label="05 人物を追加"><WireAddPerson /></Labeled>
      <Labeled label="22 人物を編集"><WireEdit /></Labeled>
      <Labeled label="13 関係を追加（関係タイプ選択）"><WireRelationAdd /></Labeled>
    </Section>

    <Section id="memories" title="⑤ 思い出" description="絵本のような物語ノート">
      <Labeled label="06 思い出ノート一覧"><WireMemories /></Labeled>
      <Labeled label="15 思い出を書く（編集）"><WireMemoryEditor /></Labeled>
      <Labeled label="16 思い出を読む（詳細）"><WireMemoryDetail /></Labeled>
      <Labeled label="14 写真ライトボックス"><WirePhotoLightbox /></Labeled>
    </Section>

    <Section id="settings" title="⑥ 設定・データ保全" description="書き出し／取り込み／容量／削除">
      <Labeled label="09 設定・データ管理"><WireSettings /></Labeled>
      <Labeled label="21 容量・エラー警告（６パターン）"><WireQuota /></Labeled>
      <Labeled label="20 削除の確認"><WireDelete /></Labeled>
    </Section>

    <Section id="platforms" title="⑦ プラットフォーム" description="PWA・モバイル対応">
      <Labeled label="17 PWA スプラッシュ・オフライン"><WirePWA /></Labeled>
      <Labeled label="19 モバイル（スマホPWA）"><WireMobile /></Labeled>
    </Section>
  </div>
);

export default App;
