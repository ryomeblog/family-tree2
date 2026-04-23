import React from "react";
import {
  BarePage,
  Hanko,
  Hand,
  Title,
  SketchBtn,
  Row,
  Col,
  Brush,
  Chip,
  C,
  F,
} from "../components/ui";
import { Link } from "react-router-dom";
import type { LegalDoc } from "../data/legal/types";

/**
 * Generic legal-text page driven by a JSON document. Pass the parsed
 * JSON object — schema defined in src/data/legal/types.ts.
 */
export default function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <BarePage scroll="flow">
      {/* mini-nav — same visual language as Landing so the user
          understands they're still in the same product. */}
      <Row
        style={{ padding: "18px 40px", borderBottom: `1px solid ${C.line}` }}
        justify="space-between"
      >
        <Link
          to="/"
          style={{
            textDecoration: "none",
            color: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Hanko size={34} />
          <Title size={18}>ファミリーツリー２</Title>
        </Link>
        <Row gap={10}>
          <SketchBtn size="sm" to="/">
            ← 表紙へ
          </SketchBtn>
          <SketchBtn size="sm" primary to="/home">
            はじめる
          </SketchBtn>
        </Row>
      </Row>

      {/* document body */}
      <div
        style={{
          maxWidth: 780,
          margin: "0 auto",
          padding: "48px 40px 80px",
        }}
      >
        <Hand
          size={12}
          color={C.shu}
          style={{ letterSpacing: "0.25em" }}
        >
          ─── {doc.id.toUpperCase()}
        </Hand>
        <Title size={40} style={{ marginTop: 6, lineHeight: 1.3 }}>
          {doc.title}
        </Title>

        <Row gap={8} wrap style={{ marginTop: 14 }}>
          <Chip tone="shu">バージョン {doc.version}</Chip>
          <Chip tone="mute">施行日 {doc.effectiveDate}</Chip>
          <Chip tone="mute">最終更新 {doc.lastUpdatedAt}</Chip>
        </Row>

        <Brush width={180} color={C.shuSoft} />

        {doc.intro && (
          <p
            style={{
              marginTop: 24,
              fontFamily: F.mincho,
              fontSize: 15,
              lineHeight: 2,
              color: C.sumi,
            }}
          >
            {doc.intro}
          </p>
        )}

        <Col gap={28} style={{ marginTop: 28 }}>
          {doc.sections.map((s, i) => (
            <section key={i}>
              <Title size={20} style={{ marginBottom: 10 }}>
                {s.heading}
              </Title>
              {s.body.map((p, j) => (
                <p
                  key={j}
                  style={{
                    fontFamily: F.mincho,
                    fontSize: 15,
                    lineHeight: 2,
                    color: C.sumi,
                    margin: "0 0 12px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {p}
                </p>
              ))}
            </section>
          ))}
        </Col>

        {doc.contact && (
          <div
            style={{
              marginTop: 40,
              padding: "18px 20px",
              background: "#FBF6E6",
              border: `1px solid ${C.line}`,
              borderRadius: 4,
            }}
          >
            <Hand size={12} color={C.shu} bold>
              {doc.contact.label}
            </Hand>
            <div
              style={{
                marginTop: 4,
                fontFamily: F.mincho,
                fontSize: 14,
                color: C.sumi,
              }}
            >
              {doc.contact.value}
            </div>
          </div>
        )}

        {/* cross-link between the two legal docs */}
        <Row gap={10} wrap style={{ marginTop: 40 }}>
          <SketchBtn
            size="sm"
            to={doc.id === "terms" ? "/privacy" : "/terms"}
          >
            {doc.id === "terms"
              ? "プライバシーポリシーを見る →"
              : "利用規約を見る →"}
          </SketchBtn>
          <SketchBtn size="sm" to="/">
            表紙に戻る
          </SketchBtn>
        </Row>
      </div>
    </BarePage>
  );
}
