// Low-fidelity primitives for the 22-screen wireframe set.
// Visual language: picture-book, mincho titles (Kaisei Decol),
// handwritten body (Klee One), paper background, vermilion accents.
import React from "react";
import { Link, useNavigate } from "react-router-dom";

// ────────────────────────────────────────────────────────────────────
// FrameMode — "framed" renders the browser-window chrome (wireframe
// gallery). "bare" strips it so the same component works as a real
// page inside the router.
// ────────────────────────────────────────────────────────────────────
type FrameModeValue = "framed" | "bare";
const FrameModeContext = React.createContext<FrameModeValue>("framed");
export const FrameModeProvider = FrameModeContext.Provider;
export const useFrameMode = (): FrameModeValue =>
  React.useContext(FrameModeContext);

// ────────────────────────────────────────────────────────────────────
// Tokens
// ────────────────────────────────────────────────────────────────────
export const C = {
  paper: "#FFFEF8",
  tatami: "#E8E2D0",
  sumi: "#1A1915",
  sub: "#6B6456",
  pale: "#8B8574",
  line: "#D4CEBE",
  shu: "#C0392B",
  shuSoft: "#E8B8B2",
  note: "#FDF6C8",
  noteEdge: "#E8DFA0",
  seal: "#A52A1E",
};

export const F = {
  mincho: "'Kaisei Decol', serif",
  hand: "'Klee One', cursive",
};

// ────────────────────────────────────────────────────────────────────
// Frame — a picture-frame that contains one screen.
// Defaults to a desktop ratio; use kind="phone" for mobile screens.
// ────────────────────────────────────────────────────────────────────
export const Frame: React.FC<{
  kind?: "desktop" | "phone" | "tablet";
  width?: number;
  height?: number;
  padding?: number;
  children: React.ReactNode;
  label?: string;
}> = ({ kind = "desktop", width, height, padding, children, label }) => {
  const mode = useFrameMode();
  if (mode === "bare") {
    return (
      <div
        style={{
          height: "100%",
          minHeight: "100%",
          position: "relative",
          background: C.paper,
          color: C.sumi,
          fontFamily: F.mincho,
          padding: padding ?? 0,
        }}
      >
        {children}
      </div>
    );
  }
  const w = width ?? (kind === "phone" ? 390 : kind === "tablet" ? 820 : 1120);
  const h = height ?? (kind === "phone" ? 780 : kind === "tablet" ? 600 : 720);
  const isPhone = kind === "phone";
  return (
    <div
      style={{
        width: w,
        maxWidth: "100%",
        background: C.paper,
        border: `1px solid ${C.pale}`,
        borderRadius: isPhone ? 36 : 10,
        boxShadow:
          "0 22px 48px -20px rgba(26,25,21,0.25), 0 4px 10px -4px rgba(26,25,21,0.1)",
        overflow: "hidden",
        position: "relative",
        fontFamily: F.mincho,
        color: C.sumi,
      }}
    >
      {/* Title-bar for desktop frames */}
      {!isPhone && (
        <div
          style={{
            height: 28,
            background: "#F3EEDF",
            borderBottom: `1px solid ${C.line}`,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            gap: 8,
          }}
        >
          <span style={dot("#E8B8B2")} />
          <span style={dot("#F1DFA4")} />
          <span style={dot("#C8D4B8")} />
          {label && (
            <span
              style={{
                marginLeft: 16,
                fontFamily: F.hand,
                fontSize: 11,
                color: C.pale,
                letterSpacing: "0.1em",
              }}
            >
              {label}
            </span>
          )}
        </div>
      )}
      <div
        style={{
          height: h,
          overflow: "hidden",
          position: "relative",
          padding: padding ?? 0,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const dot = (bg: string): React.CSSProperties => ({
  display: "inline-block",
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: bg,
  border: "1px solid rgba(26,25,21,0.1)",
});

// ────────────────────────────────────────────────────────────────────
// Grid — genkouyoushi-inspired background
// ────────────────────────────────────────────────────────────────────
export const Grid: React.FC<{ opacity?: number; size?: number }> = ({
  opacity = 0.08,
  size = 28,
}) => (
  <div
    aria-hidden
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      backgroundImage: `
        linear-gradient(${C.pale} 1px, transparent 1px),
        linear-gradient(90deg, ${C.pale} 1px, transparent 1px)`,
      backgroundSize: `${size}px ${size}px`,
      opacity,
    }}
  />
);

// ────────────────────────────────────────────────────────────────────
// Hanko — circular red seal logo
// ────────────────────────────────────────────────────────────────────
export const Hanko: React.FC<{ size?: number; label?: string }> = ({
  size = 48,
  label = "家",
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      border: `${Math.max(2, size / 16)}px solid ${C.seal}`,
      color: C.seal,
      display: "grid",
      placeItems: "center",
      fontFamily: F.mincho,
      fontWeight: 700,
      fontSize: size * 0.44,
      background: "rgba(192,57,43,0.04)",
      transform: "rotate(-3deg)",
      flex: "none",
      boxShadow: "inset 0 0 0 1px rgba(165,42,30,0.2)",
    }}
  >
    {label}
  </div>
);

// ────────────────────────────────────────────────────────────────────
// SketchBtn — hand-drawn button with double outline
// ────────────────────────────────────────────────────────────────────
export const SketchBtn: React.FC<{
  children: React.ReactNode;
  primary?: boolean;
  danger?: boolean;
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  full?: boolean;
  disabled?: boolean;
  to?: string;
  onClick?: (e: React.MouseEvent) => void;
  type?: "button" | "submit";
  title?: string;
}> = ({
  children,
  primary,
  danger,
  size = "md",
  icon,
  full,
  disabled,
  to,
  onClick,
  type = "button",
  title,
}) => {
  // children が空（アイコンのみ）かどうか判定。空文字列・null・空配列は icon-only とみなす。
  const isIconOnly =
    !!icon &&
    (children === undefined ||
      children === null ||
      children === "" ||
      (Array.isArray(children) && children.length === 0));
  const pad = isIconOnly
    ? size === "sm"
      ? "6px 8px"
      : size === "lg"
        ? "12px 14px"
        : "8px 10px"
    : size === "sm"
      ? "6px 14px"
      : size === "lg"
        ? "14px 28px"
        : "10px 20px";
  const fs = size === "sm" ? 13 : size === "lg" ? 17 : 14;
  const bg = primary ? C.shu : danger ? "#FFF5F2" : "#FFFDF2";
  const fg = primary ? "#FFFEF8" : danger ? C.shu : C.sumi;
  const border = primary ? C.shu : danger ? C.shu : C.sumi;
  const inner = (
    <>
      {icon && <span style={{ fontSize: fs + 2 }}>{icon}</span>}
      {children}
    </>
  );
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: pad,
    fontFamily: F.hand,
    fontSize: fs,
    color: fg,
    background: bg,
    border: `1.5px solid ${border}`,
    borderRadius: 4,
    boxShadow: `2px 2px 0 ${border}`,
    position: "relative",
    whiteSpace: "nowrap",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    width: full ? "100%" : undefined,
    transform: "rotate(-0.3deg)",
    textDecoration: "none",
    boxSizing: "border-box",
    lineHeight: 1.2,
  };
  if (to && !disabled) {
    return (
      <Link to={to} style={style} title={title}>
        {inner}
      </Link>
    );
  }
  if (onClick || type === "submit") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        title={title}
        style={{ ...style, font: "inherit" }}
      >
        {inner}
      </button>
    );
  }
  return (
    <span style={style} title={title}>
      {inner}
    </span>
  );
};

// ────────────────────────────────────────────────────────────────────
// StickyNote — pale yellow note with slight rotation
// ────────────────────────────────────────────────────────────────────
export const StickyNote: React.FC<{
  children: React.ReactNode;
  rotate?: number;
  width?: number | string;
  color?: string;
}> = ({ children, rotate = -1.5, width = 180, color = C.note }) => (
  <div
    style={{
      width,
      background: color,
      color: C.sumi,
      fontFamily: F.hand,
      fontSize: 13,
      lineHeight: 1.6,
      padding: "14px 16px",
      transform: `rotate(${rotate}deg)`,
      boxShadow:
        "2px 4px 10px -2px rgba(26,25,21,0.18), inset 0 -2px 0 rgba(0,0,0,0.04)",
      borderRadius: 2,
      border: `1px solid ${C.noteEdge}`,
    }}
  >
    {children}
  </div>
);

// ────────────────────────────────────────────────────────────────────
// Hand / Title — text primitives
// ────────────────────────────────────────────────────────────────────
export const Hand: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  bold?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
  style?: React.CSSProperties;
}> = ({ children, size = 13, color = C.sub, bold, as: As = "span", style }) => (
  <As
    style={{
      fontFamily: F.hand,
      fontSize: size,
      color,
      fontWeight: bold ? 600 : 400,
      lineHeight: 1.7,
      ...style,
    }}
  >
    {children}
  </As>
);

export const Title: React.FC<{
  children: React.ReactNode;
  size?: number;
  color?: string;
  as?: keyof React.JSX.IntrinsicElements;
  weight?: number;
  style?: React.CSSProperties;
}> = ({
  children,
  size = 28,
  color = C.sumi,
  as: As = "h3",
  weight = 700,
  style,
}) => (
  <As
    style={{
      fontFamily: F.mincho,
      fontSize: size,
      fontWeight: weight,
      color,
      margin: 0,
      letterSpacing: "0.02em",
      lineHeight: 1.3,
      ...style,
    }}
  >
    {children}
  </As>
);

// ────────────────────────────────────────────────────────────────────
// Photo — ruled placeholder frame (or real image)
// ────────────────────────────────────────────────────────────────────
export const Photo: React.FC<{
  size?: number | string;
  aspect?: string;
  label?: string;
  rounded?: number;
  tone?: "paper" | "tatami" | "ink";
  style?: React.CSSProperties;
}> = ({ size = 120, aspect, label, rounded = 4, tone = "paper", style }) => {
  const bg = tone === "ink" ? "#2B2823" : tone === "tatami" ? C.tatami : "#F6F0DE";
  const fg = tone === "ink" ? C.pale : C.pale;
  return (
    <div
      style={{
        width: size,
        height: aspect ? undefined : size,
        aspectRatio: aspect,
        background: bg,
        border: `1px dashed ${C.pale}`,
        borderRadius: rounded,
        display: "grid",
        placeItems: "center",
        color: fg,
        fontFamily: F.hand,
        fontSize: 11,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* crossed diagonals */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, opacity: 0.35 }}
      >
        <line x1="0" y1="0" x2="100" y2="100" stroke={C.pale} strokeWidth="0.4" />
        <line x1="100" y1="0" x2="0" y2="100" stroke={C.pale} strokeWidth="0.4" />
      </svg>
      {label && <span style={{ position: "relative" }}>{label}</span>}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────
// Row / Col / Divider — layout helpers
// ────────────────────────────────────────────────────────────────────
export const Row: React.FC<{
  children: React.ReactNode;
  gap?: number;
  align?: React.CSSProperties["alignItems"];
  justify?: React.CSSProperties["justifyContent"];
  wrap?: boolean;
  style?: React.CSSProperties;
}> = ({ children, gap = 12, align = "center", justify, wrap, style }) => (
  <div
    style={{
      display: "flex",
      gap,
      alignItems: align,
      justifyContent: justify,
      flexWrap: wrap ? "wrap" : "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Col: React.FC<{
  children: React.ReactNode;
  gap?: number;
  style?: React.CSSProperties;
}> = ({ children, gap = 8, style }) => (
  <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>
    {children}
  </div>
);

export const Divider: React.FC<{
  vertical?: boolean;
  color?: string;
  style?: React.CSSProperties;
}> = ({ vertical, color = C.line, style }) => (
  <div
    style={{
      background: color,
      ...(vertical
        ? { width: 1, alignSelf: "stretch" }
        : { height: 1, width: "100%" }),
      ...style,
    }}
  />
);

// ────────────────────────────────────────────────────────────────────
// AppHeader — in-app header shared by many screens
// ────────────────────────────────────────────────────────────────────
export const AppHeader: React.FC<{
  familyName?: string;
  back?: boolean;
  backTo?: string;
  right?: React.ReactNode;
  /** @deprecated prefer `showFamilyMenu` which opens inplace. */
  menuTo?: string;
  homeTo?: string;
  /** When true the family label becomes a dropdown toggle. */
  showFamilyMenu?: boolean;
  familyId?: string;
}> = ({
  familyName = "ご家族の家系",
  back,
  backTo,
  right,
  menuTo,
  homeTo = "/home",
  showFamilyMenu,
  familyId,
}) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // タップ領域を 44x44 に確保しつつ、内側に ← のグリフを表示。
  const backAreaStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
    flex: "none",
  };
  const BackArrow = () => (
    <span style={backAreaStyle} aria-hidden>
      <Hand size={20} color={C.sumi}>
        ←
      </Hand>
    </span>
  );
  const HistoryBackButton = () => {
    const navigate = useNavigate();
    return (
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="戻る"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          font: "inherit",
          lineHeight: 1,
          ...backAreaStyle,
        }}
      >
        <Hand size={20} color={C.sumi}>
          ←
        </Hand>
      </button>
    );
  };
  const FamilyLabel = (
    <>
      <Title size={17}>{familyName}</Title>
      <Hand size={11} color={C.pale} style={{ marginLeft: -4 }}>
        ▾
      </Hand>
    </>
  );

  let label: React.ReactNode;
  if (showFamilyMenu && familyId) {
    label = (
      <div style={{ position: "relative" }} ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: open ? "#F6F0DE" : "transparent",
            border: open ? `1px solid ${C.line}` : "1px solid transparent",
            borderRadius: 3,
            padding: "4px 8px",
            cursor: "pointer",
            fontFamily: F.mincho,
            color: "inherit",
          }}
        >
          {FamilyLabel}
        </button>
        {open && (
          <FamilyMenuDropdown
            familyId={familyId}
            onNavigate={() => setOpen(false)}
          />
        )}
      </div>
    );
  } else if (menuTo) {
    label = (
      <Link
        to={menuTo}
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {FamilyLabel}
      </Link>
    );
  } else {
    label = (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {FamilyLabel}
      </div>
    );
  }

  return (
    <div
      style={{
        height: 56,
        borderBottom: `1px solid ${C.line}`,
        background: C.paper,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        gap: 12,
        flex: "none",
      }}
    >
      {back &&
        (backTo ? (
          <Link to={backTo} style={{ textDecoration: "none" }}>
            <BackArrow />
          </Link>
        ) : (
          <HistoryBackButton />
        ))}
      <Link
        to={homeTo}
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "flex",
          flex: "none",
        }}
      >
        <Hanko size={34} />
      </Link>
      <div style={{ flex: "none" }}>{label}</div>
      <div style={{ flex: 1, minWidth: 0 }} />
      {right && (
        <div
          style={{
            flex: "0 1 auto",
            minWidth: 0,
            overflowX: "auto",
            overflowY: "hidden",
            display: "flex",
            alignItems: "center",
            gap: 8,
            // iOS: スクロールを滑らかに。スクロールバーの視覚ノイズは非表示。
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
        >
          {right}
        </div>
      )}
    </div>
  );
};

// Rendered lazily so that primitives.tsx avoids a static dependency
// cycle with the store on module load.
const FamilyMenuDropdown: React.FC<{
  familyId: string;
  onNavigate: () => void;
}> = ({ familyId, onNavigate }) => {
  const Lazy = React.useMemo(
    () => React.lazy(() => import("../modals/FamilyMenuDropdown")),
    [],
  );
  return (
    <React.Suspense fallback={null}>
      <Lazy familyId={familyId} onNavigate={onNavigate} />
    </React.Suspense>
  );
};

// ────────────────────────────────────────────────────────────────────
// PersonCard — a rectangular node used in tree + person lists
// ────────────────────────────────────────────────────────────────────
export const PersonCard: React.FC<{
  name: string;
  dates?: string;
  role?: string;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
  deceased?: boolean;
  dim?: boolean;
}> = ({ name, dates, role, selected, size = "md", deceased, dim }) => {
  const w = size === "sm" ? 110 : size === "lg" ? 180 : 140;
  const h = size === "sm" ? 56 : size === "lg" ? 96 : 76;
  return (
    <div
      style={{
        width: w,
        height: h,
        background: C.paper,
        border: `${selected ? 2 : 1}px solid ${selected ? C.shu : C.sumi}`,
        borderRadius: 4,
        padding: "6px 10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        boxShadow: selected ? `2px 2px 0 ${C.shu}` : `2px 2px 0 ${C.sumi}`,
        opacity: dim ? 0.45 : 1,
        position: "relative",
      }}
    >
      {deceased && (
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 6,
            fontFamily: F.hand,
            fontSize: 10,
            color: C.pale,
          }}
        >
          ✿
        </span>
      )}
      {role && (
        <Hand size={10} color={C.pale}>
          {role}
        </Hand>
      )}
      <Title size={size === "sm" ? 13 : 15} weight={500}>
        {name}
      </Title>
      {dates && (
        <Hand size={10} color={C.sub}>
          {dates}
        </Hand>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────
// Chip — small rounded label
// ────────────────────────────────────────────────────────────────────
export const Chip: React.FC<{
  children: React.ReactNode;
  tone?: "ink" | "shu" | "mute";
}> = ({ children, tone = "ink" }) => {
  const map = {
    ink: { bg: "#F3EEDF", fg: C.sumi, bd: C.line },
    shu: { bg: "#FCE9E5", fg: C.shu, bd: C.shuSoft },
    mute: { bg: "transparent", fg: C.pale, bd: C.pale },
  }[tone];
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 999,
        fontFamily: F.hand,
        fontSize: 11,
        color: map.fg,
        background: map.bg,
        border: `1px solid ${map.bd}`,
      }}
    >
      {children}
    </span>
  );
};

// ────────────────────────────────────────────────────────────────────
// Field — labelled input. When `onChange` is provided it renders a
// real <input>/<textarea> (controlled). Without onChange it renders a
// static display box (reads like a wireframe placeholder).
// ────────────────────────────────────────────────────────────────────
export const Field: React.FC<{
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  width?: number | string;
  textarea?: boolean;
  rows?: number;
  type?: "text" | "number";
  children?: React.ReactNode;
  reserveHint?: boolean;
}> = ({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
  width,
  textarea,
  rows,
  type = "text",
  children,
  reserveHint,
}) => {
  const boxStyle: React.CSSProperties = {
    background: C.paper,
    border: `1px solid ${C.sumi}`,
    borderRadius: 3,
    padding: textarea ? "10px 12px" : "8px 12px",
    minHeight: textarea ? 72 : 34,
    fontFamily: F.mincho,
    fontSize: 14,
    color: C.sumi,
    boxShadow: `2px 2px 0 ${C.sumi}`,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    alignItems: textarea ? "flex-start" : "center",
    lineHeight: 1.4,
    resize: textarea ? "vertical" : "none",
  };
  let input: React.ReactNode;
  if (children) {
    input = children;
  } else if (onChange) {
    if (textarea) {
      input = (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows ?? 3}
          style={boxStyle}
        />
      );
    } else {
      input = (
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={boxStyle}
        />
      );
    }
  } else {
    input = (
      <div
        style={{
          ...boxStyle,
          color: value ? C.sumi : C.pale,
        }}
      >
        {value ?? placeholder ?? " "}
      </div>
    );
  }
  return (
    <div
      style={{
        // 明示的な width を指定していても、親コンテナの幅を超えないように maxWidth: 100%。
        // 狭いビューポート（モバイル）で Row wrap と合わせて 1 列に折り返せる。
        width,
        maxWidth: "100%",
        flex: width !== undefined ? `0 1 ${typeof width === "number" ? `${width}px` : width}` : undefined,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <Hand size={12} color={C.sub} bold>
          {label}
        </Hand>
        {required && <Hand size={11} color={C.shu}>※</Hand>}
      </div>
      {input}
      {hint ? (
        <Hand size={10.5} color={C.pale}>
          {hint}
        </Hand>
      ) : reserveHint ? (
        <Hand size={10.5} color="transparent" style={{ userSelect: "none" }}>
          &nbsp;
        </Hand>
      ) : null}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────
// InkDot — a simple bullet
// ────────────────────────────────────────────────────────────────────
export const InkDot: React.FC<{ color?: string; size?: number }> = ({
  color = C.sumi,
  size = 6,
}) => (
  <span
    style={{
      display: "inline-block",
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      marginRight: 8,
      verticalAlign: "middle",
    }}
  />
);

// ────────────────────────────────────────────────────────────────────
// Toast
// ────────────────────────────────────────────────────────────────────
export const Toast: React.FC<{
  children: React.ReactNode;
  tone?: "ok" | "warn" | "err";
}> = ({ children, tone = "ok" }) => {
  const map = {
    ok: { bg: C.sumi, fg: C.paper, bd: C.sumi },
    warn: { bg: "#FFF1D6", fg: C.sumi, bd: "#D1A23A" },
    err: { bg: "#FFF5F2", fg: C.shu, bd: C.shu },
  }[tone];
  return (
    <div
      style={{
        padding: "10px 16px",
        background: map.bg,
        color: map.fg,
        border: `1.5px solid ${map.bd}`,
        borderRadius: 4,
        fontFamily: F.hand,
        fontSize: 13,
        boxShadow: "0 8px 20px -6px rgba(26,25,21,0.25)",
        maxWidth: 320,
      }}
    >
      {children}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────
// DialogCard — vermilion-bordered modal body
// ────────────────────────────────────────────────────────────────────
export const DialogCard: React.FC<{
  title: string;
  children: React.ReactNode;
  danger?: boolean;
  width?: number;
}> = ({ title, children, danger, width = 420 }) => (
  <div
    style={{
      width,
      // 狭いビューポートではコンテナ幅に自動で縮む。親のパディング 16px×2 を考慮。
      maxWidth: "min(100%, calc(100vw - 32px))",
      background: C.paper,
      border: `2px solid ${danger ? C.shu : C.sumi}`,
      borderRadius: 6,
      boxShadow:
        "0 30px 60px -20px rgba(26,25,21,0.35), 0 8px 16px -8px rgba(26,25,21,0.2)",
      padding: 20,
      position: "relative",
      boxSizing: "border-box",
    }}
  >
    <Title size={20} color={danger ? C.shu : C.sumi}>
      {title}
    </Title>
    <div style={{ marginTop: 14 }}>{children}</div>
  </div>
);

// ────────────────────────────────────────────────────────────────────
// Backdrop — darkened background for modals displayed within a Frame
// ────────────────────────────────────────────────────────────────────
export const Backdrop: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "rgba(26,25,21,0.36)",
      display: "grid",
      placeItems: "center",
      padding: 24,
    }}
  >
    {children}
  </div>
);

// ────────────────────────────────────────────────────────────────────
// BarePage — wraps a wireframe so it acts as a real page: full
// viewport height, scrolls as a normal document, no browser-chrome
// Frame decoration.
// ────────────────────────────────────────────────────────────────────
export const BarePage: React.FC<{
  children: React.ReactNode;
  /**
   * "fixed" (default) — viewport-locked. BarePage is var(--app-h) and never
   * scrolls itself; if the wire needs scrolling it has its own inner
   * `calc(100% - 56px) + overflowY:auto` pane (Tree / Memory list
   * etc.). No bar appears on #root because the page fits exactly.
   *
   * "flow" — document-flow. BarePage takes var(--app-h) and scrolls
   * vertically on its own (the SINGLE scrollbar for Landing / long
   * forms).
   */
  scroll?: "fixed" | "flow";
}> = ({ children, scroll = "fixed" }) => (
  <FrameModeProvider value="bare">
    <div
      style={
        scroll === "fixed"
          ? {
              height: "var(--app-h)",
              overflow: "hidden",
              position: "relative",
              background: C.paper,
            }
          : {
              height: "var(--app-h)",
              overflowY: "auto",
              overflowX: "hidden",
              position: "relative",
              background: C.paper,
            }
      }
    >
      {children}
    </div>
  </FrameModeProvider>
);

// ────────────────────────────────────────────────────────────────────
// GlobalToast — a bottom-right toast driven by the store.
// ────────────────────────────────────────────────────────────────────
import { useFamilyStore } from "../stores/familyStore";

export const GlobalToast: React.FC = () => {
  const toast = useFamilyStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <Toast tone={toast.tone}>{toast.text}</Toast>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────
// ModalOverlay — backdrop that sits over whatever page is behind it
// ────────────────────────────────────────────────────────────────────
export const ModalOverlay: React.FC<{
  children: React.ReactNode;
  onClose?: () => void;
}> = ({ children, onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(26,25,21,0.38)",
      display: "grid",
      placeItems: "center",
      padding: 20,
      zIndex: 50,
      overflowY: "auto",
    }}
  >
    <div onClick={(e) => e.stopPropagation()}>{children}</div>
  </div>
);

// ────────────────────────────────────────────────────────────────────
// Dashed brush stroke — decorative separator
// ────────────────────────────────────────────────────────────────────
export const Brush: React.FC<{ width?: number | string; color?: string }> = ({
  width = 120,
  color = C.shu,
}) => (
  <svg width={width} height="10" viewBox="0 0 120 10" style={{ display: "block" }}>
    <path
      d="M2 6 Q 30 1 60 5 T 118 4"
      stroke={color}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);
