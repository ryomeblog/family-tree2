// Low-fi wireframe primitives — sketchy b&w with hints of vermillion.
// Usage: import { Hand, Title, SketchBtn, Hanko, Photo, PersonNode, ... } from "./primitives";

import React, { type CSSProperties, type ReactNode } from "react";

type Style = CSSProperties;

export interface BoxProps {
  children?: ReactNode;
  style?: Style;
  className?: string;
}

export const Box: React.FC<BoxProps> = ({ children, style, className = "" }) => (
  <div className={"wf-box " + className} style={style}>
    {children}
  </div>
);

/** Gray bar standing in for a line of copy */
export const Bar: React.FC<{ w?: number | string; h?: number; style?: Style }> = ({
  w = "100%",
  h = 8,
  style,
}) => (
  <div
    style={{
      width: w,
      height: h,
      background: "#D6D1C4",
      borderRadius: 2,
      ...style,
    }}
  />
);

/** Stack of bars to fake a paragraph */
export const Para: React.FC<{ lines?: number; w?: string; gap?: number }> = ({
  lines = 3,
  w = "100%",
  gap = 6,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap }}>
    {Array.from({ length: lines }).map((_, i) => (
      <Bar key={i} w={i === lines - 1 ? "60%" : w} h={7} />
    ))}
  </div>
);

export interface SketchBtnProps {
  children?: ReactNode;
  primary?: boolean;
  small?: boolean;
  style?: Style;
}

export const SketchBtn: React.FC<SketchBtnProps> = ({
  children,
  primary,
  small,
  style,
}) => (
  <div
    className="wf-btn"
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: small ? "6px 14px" : "10px 22px",
      border: "1.5px solid #1A1915",
      borderRadius: 999,
      background: primary ? "#C0392B" : "#FFFEF8",
      color: primary ? "#FFFEF8" : "#1A1915",
      fontFamily: "'Kaisei Decol', 'Klee One', serif",
      fontSize: small ? 12 : 14,
      fontWeight: 500,
      boxShadow: "2px 2px 0 #1A1915",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Handwritten-feel caption */
export const Hand: React.FC<{
  children?: ReactNode;
  size?: number;
  color?: string;
  style?: Style;
}> = ({ children, size = 13, color = "#1A1915", style }) => (
  <span
    style={{
      fontFamily: "'Klee One', 'Kaisei Decol', cursive",
      fontSize: size,
      color,
      fontWeight: 500,
      ...style,
    }}
  >
    {children}
  </span>
);

/** Serif display heading */
export const Title: React.FC<{
  children?: ReactNode;
  size?: number;
  style?: Style;
}> = ({ children, size = 22, style }) => (
  <div
    style={{
      fontFamily: "'Kaisei Decol', serif",
      fontSize: size,
      fontWeight: 700,
      color: "#1A1915",
      letterSpacing: "0.02em",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Yellow sticky-note annotation */
export const StickyNote: React.FC<{
  children?: ReactNode;
  rotate?: number;
  style?: Style;
}> = ({ children, rotate = -2, style }) => (
  <div
    style={{
      background: "#FDF6C8",
      border: "1.2px solid #1A1915",
      padding: "8px 12px",
      fontFamily: "'Klee One', cursive",
      fontSize: 12,
      color: "#1A1915",
      transform: `rotate(${rotate}deg)`,
      boxShadow: "2px 3px 0 rgba(26,25,21,0.4)",
      maxWidth: 220,
      lineHeight: 1.4,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Dashed placeholder box */
export const Photo: React.FC<{
  w?: number | string;
  h?: number | string;
  label?: string;
  round?: boolean;
  style?: Style;
}> = ({ w = 80, h = 80, label = "写真", round, style }) => (
  <div
    style={{
      width: w,
      height: h,
      border: "1.5px dashed #1A1915",
      borderRadius: round ? "50%" : 6,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#8B8574",
      fontFamily: "'Klee One', cursive",
      fontSize: 11,
      background: "#F5F0E1",
      position: "relative",
      ...style,
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(135deg, transparent 48%, #D6D1C4 48%, #D6D1C4 52%, transparent 52%)",
        opacity: 0.4,
        borderRadius: round ? "50%" : 6,
      }}
    />
    <span style={{ position: "relative" }}>{label}</span>
  </div>
);

export type Gender = "m" | "f" | "o";

export interface PersonNodeProps {
  name?: string;
  years?: string;
  emph?: boolean;
  gender?: Gender;
  style?: Style;
}

export const PersonNode: React.FC<PersonNodeProps> = ({
  name = "名前",
  years = "",
  emph,
  gender = "m",
  style,
}) => (
  <div
    style={{
      border: `${emph ? 2.2 : 1.5}px solid #1A1915`,
      borderRadius: 6,
      padding: "6px 10px 8px",
      background:
        gender === "f" ? "#FBE4E0" : gender === "m" ? "#E4EAF2" : "#FFFEF8",
      minWidth: 92,
      textAlign: "center",
      fontFamily: "'Kaisei Decol', serif",
      boxShadow: emph ? "2px 2px 0 #C0392B" : "1.5px 1.5px 0 #1A1915",
      ...style,
    }}
  >
    <div
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: "#1A1915",
        letterSpacing: "0.03em",
      }}
    >
      {name}
    </div>
    {years && (
      <div
        style={{
          fontSize: 9,
          fontFamily: "'Klee One', cursive",
          color: "#6B6456",
          marginTop: 2,
        }}
      >
        {years}
      </div>
    )}
  </div>
);

/** Torn-paper-edge divider */
export const PaperEdge: React.FC<{ style?: Style }> = ({ style }) => (
  <svg
    width="100%"
    height="10"
    viewBox="0 0 400 10"
    preserveAspectRatio="none"
    style={{ display: "block", ...style }}
  >
    <path
      d="M 0 5 Q 20 1, 40 4 T 80 5 T 120 3 T 160 6 T 200 4 T 240 5 T 280 3 T 320 6 T 360 4 T 400 5"
      stroke="#1A1915"
      strokeWidth="1"
      fill="none"
    />
  </svg>
);

/** Red circular hanko / seal stamp — the brand mark */
export const Hanko: React.FC<{ size?: number; text?: string; style?: Style }> = ({
  size = 44,
  text = "家",
  style,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      border: `${size > 40 ? 3 : 2}px solid #C0392B`,
      background: "#C0392B",
      color: "#FFFEF8",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Kaisei Decol', serif",
      fontSize: size * 0.5,
      fontWeight: 700,
      transform: "rotate(-4deg)",
      boxShadow: "inset 0 0 0 2px #FFFEF8",
      ...style,
    }}
  >
    {text}
  </div>
);
