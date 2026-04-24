import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BarePage,
  DialogCard,
  Hand,
  SketchBtn,
  Row,
  Col,
  Grid,
  C,
  F,
} from "../components/ui";

const Card: React.FC<{
  mark: string;
  color: string;
  title: string;
  body: React.ReactNode;
  actions: React.ReactNode;
}> = ({ mark, color, title, body, actions }) => (
  <DialogCard title={title} danger width={440}>
    <Row gap={16} align="flex-start">
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: color,
          color: C.paper,
          display: "grid",
          placeItems: "center",
          fontFamily: F.mincho,
          fontSize: 22,
          fontWeight: 700,
          flex: "none",
        }}
      >
        {mark}
      </div>
      <div>
        <Hand size={13} color={C.sumi}>
          {body}
        </Hand>
      </div>
    </Row>
    <Row justify="flex-end" gap={10} style={{ marginTop: 20 }}>
      {actions}
    </Row>
  </DialogCard>
);

export default function ImportErrorModal() {
  const nav = useNavigate();
  const [search] = useSearchParams();
  const kind = (search.get("kind") ?? "all") as
    | "corrupt"
    | "version"
    | "quota"
    | "all";

  return (
    <BarePage>
      <div
        style={{
          height: "var(--app-h)",
          background: C.tatami,
          padding: 24,
          position: "relative",
          overflow: "auto",
        }}
      >
        <Grid opacity={0.08} />
        {kind === "all" ? (
          <Row gap={20} wrap align="flex-start" style={{ position: "relative", zIndex: 1 }}>
            <Card
              mark="壊"
              color={C.shu}
              title="ファイルが読めません"
              body={
                <>
                  ZIP 構造または <b>manifest.json</b> が壊れているようです。
                  別のファイルでお試しください。
                </>
              }
              actions={
                <>
                  <SketchBtn to="/home">閉じる</SketchBtn>
                  <SketchBtn primary to="/import">
                    別のファイルを選ぶ
                  </SketchBtn>
                </>
              }
            />
            <Card
              mark="版"
              color="#D1A23A"
              title="バージョンが合いません"
              body={
                <>
                  このファイルは非互換バージョンで書き出されています。
                  アプリを最新に更新してお試しください。
                </>
              }
              actions={
                <>
                  <SketchBtn to="/home">閉じる</SketchBtn>
                  <SketchBtn primary to="/settings">
                    アップデートを確認
                  </SketchBtn>
                </>
              }
            />
            <Card
              mark="容"
              color="#6B6456"
              title="容量が足りません"
              body={
                <>
                  取り込みに必要な領域が確保できません。
                  写真を整理するか、不要な家系を書き出して削除してください。
                </>
              }
              actions={
                <>
                  <SketchBtn to="/home">閉じる</SketchBtn>
                  <SketchBtn primary to="/settings">
                    ストレージを整理
                  </SketchBtn>
                </>
              }
            />
          </Row>
        ) : (
          <Col
            gap={0}
            style={{
              position: "relative",
              zIndex: 1,
              minHeight: "calc(var(--app-h) - 48px)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {kind === "corrupt" && (
              <Card
                mark="壊"
                color={C.shu}
                title="ファイルが読めません"
                body={
                  <>
                    ZIP 構造または <b>manifest.json</b> が壊れているようです。
                    書き出し時に処理が中断された可能性があります。
                    別のファイルでお試しください。
                  </>
                }
                actions={
                  <>
                    <SketchBtn onClick={() => nav(-1)}>閉じる</SketchBtn>
                    <SketchBtn primary to="/import">
                      別のファイルを選ぶ
                    </SketchBtn>
                  </>
                }
              />
            )}
            {kind === "version" && (
              <Card
                mark="版"
                color="#D1A23A"
                title="バージョンが合いません"
                body={
                  <>
                    このファイルは非互換バージョンで書き出されています。
                    アプリを最新に更新してお試しください。
                  </>
                }
                actions={
                  <>
                    <SketchBtn onClick={() => nav(-1)}>閉じる</SketchBtn>
                    <SketchBtn primary to="/settings">
                      アップデートを確認
                    </SketchBtn>
                  </>
                }
              />
            )}
            {kind === "quota" && (
              <Card
                mark="容"
                color="#6B6456"
                title="容量が足りません"
                body={
                  <>
                    取り込みに必要な領域が確保できません。
                    使っていない写真を整理するか、不要な家系を書き出して削除してください。
                  </>
                }
                actions={
                  <>
                    <SketchBtn onClick={() => nav(-1)}>閉じる</SketchBtn>
                    <SketchBtn primary to="/settings">
                      ストレージを整理
                    </SketchBtn>
                  </>
                }
              />
            )}
          </Col>
        )}
      </div>
    </BarePage>
  );
}
