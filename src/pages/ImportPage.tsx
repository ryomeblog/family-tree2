import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarePage,
  AppHeader,
  Hand,
  Title,
  SketchBtn,
  Row,
  Col,
  Chip,
  Photo,
  Brush,
  C,
} from "../components/ui";
import {
  previewFtree2,
  commitImport,
  ImportError,
  ImportPreview,
} from "../features/importExport/readFtree2";
import { pickFile } from "../features/photos/ingest";
import { useFamilyStore } from "../stores/familyStore";

const Step: React.FC<{
  n: number;
  t: string;
  active?: boolean;
  done?: boolean;
}> = ({ n, t, active, done }) => (
  <Row gap={8}>
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: done ? C.shu : C.paper,
        border: `1.5px solid ${done || active ? C.shu : C.pale}`,
        display: "grid",
        placeItems: "center",
        fontFamily: "'Kaisei Decol', serif",
        fontSize: 13,
        color: done ? C.paper : C.sub,
        fontWeight: 600,
      }}
    >
      {done ? "✓" : n}
    </div>
    <Hand
      size={12}
      bold={active}
      color={done ? C.shu : active ? C.sumi : C.pale}
    >
      {t}
    </Hand>
  </Row>
);

export default function ImportPage() {
  const nav = useNavigate();
  const store = useFamilyStore();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [error, setError] = useState<string | null>(null);

  const onPick = async () => {
    setError(null);
    const files = await pickFile(".ftree2,application/zip", false);
    if (!files[0]) return;
    try {
      setPreview(await previewFtree2(files[0]));
    } catch (e) {
      if (e instanceof ImportError) {
        nav(`/import/error?kind=${e.kind}`);
      } else {
        setError(String(e));
      }
    }
  };

  const onConfirm = async () => {
    if (!preview) return;
    try {
      await commitImport(preview);
      if (mode === "replace") {
        store.replaceFamilies({ [preview.family.id]: preview.family });
      } else {
        store.addFamily(preview.family);
      }
      store.showToast("ok", `${preview.family.name} を取り込みました`);
      nav(`/family/${preview.family.id}/tree`);
    } catch (e) {
      if (e instanceof ImportError) {
        nav(`/import/error?kind=${e.kind}`);
      } else {
        store.showToast("err", "取り込みに失敗しました");
      }
    }
  };

  return (
    <BarePage>
      <AppHeader back backTo="/home" />
      <div style={{ padding: "28px 48px", height: "calc(100vh - 56px)", overflowY: "auto" }}>
        <Hand size={11} color={C.shu} style={{ letterSpacing: "0.2em" }}>
          ─── IMPORT .ftree2
        </Hand>
        <Title size={28}>取り込み</Title>
        <Brush width={180} color={C.shuSoft} />

        <Row gap={36} style={{ marginTop: 14 }} align="center">
          <Step n={1} t="ファイル選択" done={!!preview} active={!preview} />
          <div style={{ flex: "0 0 40px", height: 1, background: C.line }} />
          <Step n={2} t="プレビュー" done={false} active={!!preview} />
          <div style={{ flex: "0 0 40px", height: 1, background: C.line }} />
          <Step n={3} t="取り込み実行" />
        </Row>

        {!preview && (
          <div
            style={{
              marginTop: 28,
              background: "#FBF6E6",
              border: `1px dashed ${C.pale}`,
              borderRadius: 6,
              padding: 40,
              textAlign: "center",
            }}
          >
            <Title size={18}>.ftree2 ファイルを選択してください</Title>
            <Hand size={12} color={C.sub} style={{ display: "block", marginTop: 10 }}>
              バージョン "1" のみ対応しています。
            </Hand>
            <div style={{ marginTop: 20 }}>
              <SketchBtn primary icon="↥" onClick={onPick}>
                ファイルを選ぶ
              </SketchBtn>
            </div>
            {error && (
              <Hand size={11} color={C.shu} style={{ display: "block", marginTop: 10 }}>
                {error}
              </Hand>
            )}
          </div>
        )}

        {preview && (
          <>
            <div
              style={{
                marginTop: 28,
                background: C.paper,
                border: `1px solid ${C.sumi}`,
                borderRadius: 6,
                boxShadow: `3px 3px 0 ${C.sumi}`,
                padding: "20px 24px",
              }}
            >
              <Row justify="space-between" align="flex-start" wrap>
                <Col gap={4} style={{ flex: 1, minWidth: 240 }}>
                  <Hand size={11} color={C.pale}>
                    選択されたファイル
                  </Hand>
                  <Title size={20}>{preview.family.name}</Title>
                  <Hand size={12} color={C.sub}>
                    バージョン {preview.manifest.version} ／ 書き出し日時{" "}
                    {new Date(preview.manifest.exportedAt)
                      .toLocaleString("ja-JP")
                      .replace(/\//g, "-")}
                  </Hand>
                </Col>
                <Row gap={6}>
                  <Chip tone="shu">互換性 OK</Chip>
                  <Chip tone="mute">写真 {preview.photoCount}</Chip>
                </Row>
              </Row>

              <div style={{ height: 1, background: C.line, margin: "16px 0" }} />

              <Row gap={24} align="flex-start" wrap>
                <Col gap={8} style={{ flex: 1 }}>
                  <Hand size={12} color={C.shu} bold>
                    内容プレビュー
                  </Hand>
                  <Row gap={18}>
                    <Col gap={2}>
                      <Title size={28} color={C.shu}>1</Title>
                      <Hand size={10} color={C.pale}>家系</Hand>
                    </Col>
                    <Col gap={2}>
                      <Title size={28}>
                        {Object.keys(preview.family.people).length}
                      </Title>
                      <Hand size={10} color={C.pale}>人物</Hand>
                    </Col>
                    <Col gap={2}>
                      <Title size={28}>
                        {Object.keys(preview.family.memories).length}
                      </Title>
                      <Hand size={10} color={C.pale}>思い出ノート</Hand>
                    </Col>
                    <Col gap={2}>
                      <Title size={28}>{preview.photoCount}</Title>
                      <Hand size={10} color={C.pale}>写真</Hand>
                    </Col>
                    <Col gap={2}>
                      <Title size={28}>{preview.family.generations}</Title>
                      <Hand size={10} color={C.pale}>世代</Hand>
                    </Col>
                  </Row>
                </Col>
                <Row gap={8} wrap style={{ maxWidth: 240 }}>
                  {Array.from({ length: Math.min(6, preview.photoCount) }).map((_, i) => (
                    <Photo key={i} size={56} label={`写${i + 1}`} />
                  ))}
                </Row>
              </Row>
            </div>

            <div
              style={{
                marginTop: 20,
                background: "#FBF6E6",
                border: `1px solid ${C.line}`,
                borderRadius: 4,
                padding: 18,
              }}
            >
              <Hand size={12} color={C.shu} bold>
                既存の家系がある場合の動作
              </Hand>
              <Row gap={20} style={{ marginTop: 10 }} wrap>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="radio"
                    checked={mode === "append"}
                    onChange={() => setMode("append")}
                  />
                  <Hand size={12}>別の家系として追加（推奨）</Hand>
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="radio"
                    checked={mode === "replace"}
                    onChange={() => setMode("replace")}
                  />
                  <Hand size={12}>取り込み家系だけに置き換える</Hand>
                </label>
              </Row>
            </div>

            <Row justify="space-between" style={{ marginTop: 24 }}>
              <SketchBtn onClick={onPick}>← ファイルを選び直す</SketchBtn>
              <Row gap={10}>
                <SketchBtn to="/home">キャンセル</SketchBtn>
                <SketchBtn primary icon="✓" onClick={onConfirm}>
                  取り込む
                </SketchBtn>
              </Row>
            </Row>
          </>
        )}
      </div>
    </BarePage>
  );
}
