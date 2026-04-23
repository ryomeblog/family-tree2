import React from "react";
import {
  BarePage,
  Hanko,
  Hand,
  Title,
  SketchBtn,
  Brush,
  Col,
  Row,
  C,
} from "../components/ui";

export default function NotFoundPage() {
  return (
    <BarePage>
      <div
        style={{
          height: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
        }}
      >
        <Col gap={14} style={{ alignItems: "center", textAlign: "center" }}>
          <Hanko size={72} label="？" />
          <Title size={36}>このページは見つかりません</Title>
          <Brush width={140} color={C.shuSoft} />
          <Hand size={13} color={C.sub}>
            URL を確認するか、下のリンクから戻ってください。
          </Hand>
          <Row gap={10} style={{ marginTop: 10 }}>
            <SketchBtn to="/">表紙へ</SketchBtn>
            <SketchBtn primary to="/home">家系一覧へ</SketchBtn>
          </Row>
        </Col>
      </div>
    </BarePage>
  );
}
