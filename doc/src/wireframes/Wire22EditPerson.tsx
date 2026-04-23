// Wireframe 22 — Edit person (reuses AddPerson layout, edit mode)
import React from "react";
import { Title, Hand, SketchBtn, Photo, StickyNote } from "./primitives";

const Field: React.FC<{ label: string; value?: string; hint?: string; wide?: boolean }> = ({ label, value, hint, wide }) => (
  <div style={{ gridColumn: wide ? "span 2" : undefined }}>
    <Hand size={11} color="#8B8574">{label}</Hand>
    <div style={{ marginTop: 4, padding: "10px 12px", border: "1.5px solid #1A1915", borderRadius: 4, background: "#FFFEF8", minHeight: 22 }}>
      <Hand size={13}>{value || "│"}</Hand>
    </div>
    {hint && <Hand size={10} color="#8B8574" style={{ marginTop: 3, display: "block" }}>{hint}</Hand>}
  </div>
);

export const WireEdit: React.FC = () => (
  <div style={{ width: 1200, minHeight: 900, background: "rgba(26,25,21,0.35)", padding: 40, fontFamily: "'Kaisei Decol', serif", position: "relative" }}>
    <div style={{ width: 880, margin: "20px auto", background: "#FFFEF8", border: "2px solid #1A1915", borderRadius: 6, boxShadow: "6px 6px 0 #1A1915" }}>
      <div style={{ padding: "18px 28px", borderBottom: "1.5px solid #1A1915", display: "flex", alignItems: "center", gap: 12 }}>
        <Hand size={12} color="#C0392B">✎</Hand>
        <Title size={18}>人物の編集 ／ 田中 一郎</Title>
        <Hand size={11} color="#8B8574" style={{ marginLeft: 8 }}>ID: p_0019 ／ 最終更新: 3日前</Hand>
        <div style={{ marginLeft: "auto" }}>
          <Hand size={14}>✕</Hand>
        </div>
      </div>

      <div style={{ padding: 28, display: "grid", gridTemplateColumns: "160px 1fr", gap: 28 }}>
        <div>
          <Photo w={160} h={160} label="肖像" />
          <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
            <SketchBtn small>変更</SketchBtn>
            <SketchBtn small>外す</SketchBtn>
          </div>
          <Hand size={10} color="#8B8574" style={{ marginTop: 8, display: "block" }}>
            家系図のノードに表示される画像
          </Hand>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="姓" value="田中" />
          <Field label="名" value="一郎" />
          <Field label="ふりがな（姓）" value="たなか" />
          <Field label="ふりがな（名）" value="いちろう" />
          <Field label="旧姓" value="—" hint="女性の結婚前の姓などに" />
          <Field label="通称・別名" value="いっちゃん" />
          <Field label="性別" value="男性" />
          <Field label="本人との続柄" value="父" />
          <Field label="生年月日" value="1958年3月12日" hint="「年のみ」「不明」も可" />
          <Field label="没年月日" value="2016年4月8日" />
          <Field label="出生地" value="東京都世田谷区" />
          <Field label="没地" value="神奈川県箱根町" />
          <Field label="備考" value="銀行員として30年勤務。晩年は俳句を嗜む。" wide />
        </div>
      </div>

      <div style={{ padding: "0 28px 20px" }}>
        <Title size={14} style={{ marginBottom: 8 }}>この人の関係</Title>
        <div style={{ border: "1.2px solid #1A1915", borderRadius: 4, overflow: "hidden" }}>
          {[
            ["配偶者", "田中 花子（1962–）", "1985年〜", false],
            ["元配偶者", "佐藤 良子（1959–）", "1982〜1984年", false],
            ["親", "田中 正三（父） ／ 田中 千代（母）", "", false],
            ["子", "田中 太郎（1985–） ／ 田中 さくら（1988–） ／ 田中 健（2001–）", "太郎・さくらは花子との子／健は良子との子", false],
          ].map(([role, names, note], i) => (
            <div key={i} style={{ padding: "10px 14px", borderTop: i ? "1px solid #E8E2D0" : undefined, display: "grid", gridTemplateColumns: "100px 1fr auto", gap: 12, alignItems: "center" }}>
              <Hand size={12} color="#C0392B">{role as string}</Hand>
              <div>
                <Hand size={12}>{names as string}</Hand>
                {note ? <div><Hand size={10} color="#8B8574">{note as string}</Hand></div> : null}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <SketchBtn small>編集</SketchBtn>
                <SketchBtn small>外す</SketchBtn>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          <SketchBtn small>＋ 関係を追加</SketchBtn>
        </div>
      </div>

      <div style={{ padding: "16px 28px", borderTop: "1.5px solid #1A1915", background: "#F5F0E1", display: "flex", alignItems: "center", gap: 12 }}>
        <SketchBtn small>🗑 この人を削除…</SketchBtn>
        <Hand size={11} color="#8B8574">関係も一緒に外れます</Hand>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <SketchBtn small>キャンセル</SketchBtn>
          <SketchBtn small primary>変更を保存</SketchBtn>
        </div>
      </div>
    </div>

    <div style={{ position: "absolute", top: 60, right: 40 }}>
      <StickyNote rotate={-3}>AddPersonと同一構造＋<br />関係セクションと削除導線。</StickyNote>
    </div>
  </div>
);

export default WireEdit;
