// Wireframe 20 — Delete confirm dialogs
import React from "react";
import { Title, Hand, SketchBtn, StickyNote } from "./primitives";

const Dialog: React.FC<{ label: string; children: React.ReactNode; w?: number }> = ({ label, children, w = 440 }) => (
  <div>
    <Hand size={11} color="#8B8574" style={{ letterSpacing: "0.15em" }}>{label}</Hand>
    <div style={{ marginTop: 10, width: w, background: "#FFFEF8", border: "2px solid #C0392B", borderRadius: 6, boxShadow: "4px 4px 0 #C0392B", padding: 24 }}>
      {children}
    </div>
  </div>
);

export const WireDelete: React.FC = () => (
  <div style={{ width: 1200, minHeight: 760, background: "#E8E2D0", border: "1.5px solid #1A1915", fontFamily: "'Kaisei Decol', serif", padding: 40, position: "relative" }}>
    <Hand size={11} color="#C0392B" style={{ letterSpacing: "0.2em" }}>─── DESTRUCTIVE ACTIONS</Hand>
    <Title size={26} style={{ marginTop: 4, marginBottom: 24 }}>削除の確認</Title>
    <Hand size={12} color="#6B6456">取り消せない操作は、必ず２段階。ダイアログは朱色の枠で統一。</Hand>

    <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, justifyItems: "center" }}>
      <Dialog label="20-A ／ 人物の削除（関係あり）">
        <div style={{ fontSize: 32, textAlign: "center" }}>⚠</div>
        <Title size={18} style={{ textAlign: "center", marginTop: 8 }}>
          田中 一郎 を削除しますか？
        </Title>
        <div style={{ marginTop: 16, padding: 14, background: "#FBE4E0", border: "1.2px solid #C0392B", borderRadius: 4 }}>
          <Hand size={12} color="#1A1915" style={{ lineHeight: 1.7 }}>
            次の関係も同時に消えます：
          </Hand>
          <ul style={{ margin: "6px 0 0 18px", padding: 0, fontFamily: "'Klee One', cursive", fontSize: 12, lineHeight: 1.8 }}>
            <li>配偶者：田中 花子（再婚を含む2件）</li>
            <li>親子：3名（太郎・さくら・健）</li>
            <li>思い出ノートからの言及：3本</li>
          </ul>
          <Hand size={11} color="#C0392B" style={{ marginTop: 8, display: "block" }}>
            思い出ノート本体は削除されません（人物リンクだけ外れます）。
          </Hand>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SketchBtn small>キャンセル</SketchBtn>
          <SketchBtn small primary>削除する</SketchBtn>
        </div>
      </Dialog>

      <Dialog label="20-B ／ 家系まるごと削除（二重確認）">
        <div style={{ fontSize: 32, textAlign: "center" }}>🔥</div>
        <Title size={18} style={{ textAlign: "center", marginTop: 8 }}>
          「田中家」を完全に削除しますか？
        </Title>
        <Hand size={12} color="#6B6456" style={{ marginTop: 10, lineHeight: 1.7, display: "block", textAlign: "center" }}>
          148名・32本の思い出・写真 47.2MB が端末から消えます。<br />
          <b style={{ color: "#C0392B" }}>元には戻せません。</b>
        </Hand>

        <div style={{ marginTop: 16, padding: 12, background: "#FDF6C8", border: "1.2px solid #1A1915", borderRadius: 4 }}>
          <Hand size={11} color="#1A1915" style={{ lineHeight: 1.7 }}>
            💾 念のため、先に書き出しておきませんか？
          </Hand>
          <div style={{ marginTop: 6 }}>
            <SketchBtn small>書き出してから削除</SketchBtn>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <Hand size={11} color="#6B6456">
            確認のため「<b>田中家を削除</b>」と入力してください：
          </Hand>
          <div style={{ marginTop: 6, padding: "8px 10px", border: "1.5px solid #1A1915", borderRadius: 4, background: "#FFFEF8" }}>
            <Hand size={12} color="#8B8574">│</Hand>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SketchBtn small>キャンセル</SketchBtn>
          <SketchBtn small primary>完全に削除する</SketchBtn>
        </div>
      </Dialog>

      <Dialog label="20-C ／ 思い出ノート削除">
        <Title size={16}>このノートを削除しますか？</Title>
        <Hand size={12} color="#6B6456" style={{ marginTop: 8, display: "block", lineHeight: 1.7 }}>
          「父との最後の温泉旅行」<br />
          2015年秋 ／ 写真3枚 ／ 824文字
        </Hand>
        <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SketchBtn small>キャンセル</SketchBtn>
          <SketchBtn small primary>削除</SketchBtn>
        </div>
      </Dialog>

      <Dialog label="20-D ／ すべてのデータを消去">
        <div style={{ fontSize: 32, textAlign: "center" }}>☠</div>
        <Title size={18} style={{ textAlign: "center", marginTop: 8 }}>
          アプリを工場出荷状態に戻しますか？
        </Title>
        <Hand size={12} color="#C0392B" style={{ marginTop: 10, display: "block", textAlign: "center", lineHeight: 1.7 }}>
          全 4家系・478名・写真すべてが消えます。
        </Hand>
        <Hand size={11} color="#6B6456" style={{ marginTop: 8, display: "block", textAlign: "center" }}>
          （書き出し済みの .ftree2 ファイルは端末に残ります）
        </Hand>
        <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SketchBtn small>やめる</SketchBtn>
          <SketchBtn small primary>すべて消去</SketchBtn>
        </div>
      </Dialog>
    </div>

    <div style={{ position: "absolute", top: 32, right: 32 }}>
      <StickyNote rotate={-5}>高齢ユーザーを想定:<br />二重確認＋書き出し誘導。</StickyNote>
    </div>
  </div>
);

export default WireDelete;
