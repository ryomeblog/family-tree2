import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarePage,
  AppHeader,
  Hand,
  Title,
  SketchBtn,
  StickyNote,
  Row,
  Col,
  Brush,
  Chip,
  C,
  F,
} from "../components/ui";
import { previewFtree2, commitImport, ImportError } from "../features/importExport/readFtree2";
import { pickFile } from "../features/photos/ingest";
import { useFamilyStore } from "../stores/familyStore";

export default function OpenFamilyPage() {
  const nav = useNavigate();
  const store = useFamilyStore();
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [hovered, setHovered] = useState(false);

  const handle = async (file: File) => {
    try {
      const preview = await previewFtree2(file);
      await commitImport(preview);
      let effectiveId = preview.family.id;
      if (mode === "replace") {
        store.replaceFamilies({ [preview.family.id]: preview.family });
      } else {
        effectiveId = store.addFamily(preview.family);
      }
      const renamed = effectiveId !== preview.family.id;
      store.showToast(
        "ok",
        renamed
          ? `${preview.family.name} を別家系として取り込みました（ID: ${effectiveId}）`
          : `${preview.family.name} を取り込みました`,
      );
      nav(`/family/${effectiveId}/tree`);
    } catch (e) {
      if (e instanceof ImportError) {
        nav(`/import/error?kind=${e.kind}`);
      } else {
        store.showToast("err", "取り込みに失敗しました");
        console.error(e);
      }
    }
  };

  const onPick = async () => {
    const files = await pickFile(".ftree2,application/zip", false);
    if (files[0]) handle(files[0]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setHovered(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handle(f);
  };

  return (
    <BarePage>
      <AppHeader back backTo="/home" />
      <div style={{ padding: "32px 48px", height: "calc(var(--app-h) - 56px)", overflowY: "auto" }}>
        <Hand size={11} color={C.shu} style={{ letterSpacing: "0.2em" }}>
          ─── OPEN FAMILY
        </Hand>
        <Title size={28}>家系ファイルを開く</Title>
        <Hand size={13} color={C.sub}>
          書き出しておいた <b>.ftree2</b> ファイルを選んで取り込みます。
        </Hand>
        <Brush width={180} color={C.shuSoft} />

        <Row gap={32} align="flex-start" style={{ marginTop: 28 }} wrap>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setHovered(true);
            }}
            onDragLeave={() => setHovered(false)}
            onDrop={onDrop}
            style={{
              flex: 1,
              minWidth: 360,
              minHeight: 320,
              border: `2px dashed ${hovered ? C.shu : C.pale}`,
              borderRadius: 8,
              background: hovered
                ? "#FDE4D4"
                : "repeating-linear-gradient(45deg, #FFFDF2 0 12px, #FBF6E6 12px 24px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
              gap: 18,
              transition: "background 150ms",
            }}
          >
            <div
              style={{
                width: 80,
                height: 100,
                border: `2px solid ${C.sumi}`,
                borderRadius: 4,
                background: C.paper,
                position: "relative",
                boxShadow: `3px 3px 0 ${C.sumi}`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -1,
                  right: -1,
                  width: 20,
                  height: 20,
                  background: C.tatami,
                  borderLeft: `2px solid ${C.sumi}`,
                  borderBottom: `2px solid ${C.sumi}`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: 10,
                  right: 10,
                  fontFamily: F.mincho,
                  fontSize: 11,
                  color: C.shu,
                  textAlign: "center",
                }}
              >
                .ftree2
              </div>
            </div>
            <Title size={18}>ここにファイルをドラッグ＆ドロップ</Title>
            <Hand size={12} color={C.pale}>または</Hand>
            <SketchBtn primary icon="↥" onClick={onPick}>
              ファイルを選ぶ
            </SketchBtn>
            <Hand size={11} color={C.pale}>
              対応: .ftree2（ZIP）
            </Hand>
          </div>

          <Col gap={16} style={{ width: 300 }}>
            <StickyNote rotate={-2} width={"100%"}>
              既に同じ家系を持っている場合、「追加」か「置き換え」を選べます。
            </StickyNote>

            <div
              style={{
                background: "#FBF6E6",
                border: `1px solid ${C.line}`,
                borderRadius: 4,
                padding: 16,
              }}
            >
              <Hand size={12} color={C.shu} bold>
                取り込みオプション
              </Hand>
              <Col gap={10} style={{ marginTop: 10 }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                  <input
                    type="radio"
                    checked={mode === "append"}
                    onChange={() => setMode("append")}
                  />
                  <Hand size={12}>
                    <b>別の家系として追加</b>
                    <br />
                    <span style={{ color: C.pale, fontSize: 11 }}>
                      既存の家系は残ります。
                    </span>
                  </Hand>
                </label>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                  <input
                    type="radio"
                    checked={mode === "replace"}
                    onChange={() => setMode("replace")}
                  />
                  <Hand size={12}>
                    <b>既存の家系を置き換える</b>
                    <br />
                    <span style={{ color: C.pale, fontSize: 11 }}>
                      取り込んだ家系 1 件だけが残ります。
                    </span>
                  </Hand>
                </label>
              </Col>
            </div>

            <div>
              <Hand size={11} color={C.pale}>参考</Hand>
              <Col gap={4} style={{ marginTop: 6 }}>
                <Row
                  justify="space-between"
                  style={{
                    padding: "6px 10px",
                    border: `1px solid ${C.line}`,
                    borderRadius: 3,
                    background: C.paper,
                  }}
                >
                  <Hand size={12}>設定から現在の家系を書き出せます</Hand>
                  <Chip tone="mute">
                    <Link to="/settings">開く</Link>
                  </Chip>
                </Row>
              </Col>
            </div>
          </Col>
        </Row>
      </div>
    </BarePage>
  );
}

// Local Link to keep file self-contained.
const Link: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <a
    href={`#${to}`}
    style={{ textDecoration: "none", color: "inherit" }}
  >
    {children}
  </a>
);
