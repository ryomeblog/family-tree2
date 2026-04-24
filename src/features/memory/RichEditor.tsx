import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { C, F, Hand } from "../../components/ui";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const Btn: React.FC<{
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}> = ({ active, onClick, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    style={{
      padding: "4px 10px",
      background: active ? C.sumi : "transparent",
      color: active ? C.paper : C.sub,
      border: `1px solid ${active ? C.sumi : "transparent"}`,
      borderRadius: 3,
      fontFamily: F.hand,
      fontSize: 12,
      cursor: "pointer",
    }}
  >
    {children}
  </button>
);

const RichEditor: React.FC<Props> = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "ここに本文を書きます。ゆっくり、思い出すままに。",
      }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) {
    return (
      <div
        style={{
          minHeight: 260,
          border: `1px solid ${C.line}`,
          borderRadius: 4,
          padding: "20px 24px",
          fontFamily: F.mincho,
          color: C.pale,
        }}
      >
        <Hand color={C.pale}>読み込み中...</Hand>
      </div>
    );
  }

  return (
    <div
      style={{
        border: `1px solid ${C.line}`,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "#FBF6E6",
          borderBottom: `1px solid ${C.line}`,
          padding: "6px 10px",
          display: "flex",
          gap: 4,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Btn
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="大見出し"
        >
          見出1
        </Btn>
        <Btn
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="中見出し"
        >
          見出2
        </Btn>
        <Btn
          active={editor.isActive("paragraph")}
          onClick={() => editor.chain().focus().setParagraph().run()}
          title="本文"
        >
          本文
        </Btn>
        <span style={{ color: C.pale, padding: "0 4px" }}>|</span>
        <Btn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="太字"
        >
          <b>B</b>
        </Btn>
        <Btn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="斜体"
        >
          <i>I</i>
        </Btn>
        <Btn
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="引用"
        >
          引用
        </Btn>
        <Btn
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="箇条書き"
        >
          ・
        </Btn>
        <Btn
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="番号付き"
        >
          １
        </Btn>
        <Btn
          active={editor.isActive("link")}
          onClick={() => {
            const url = window.prompt("リンク先 URL", editor.getAttributes("link").href ?? "https://");
            if (url === null) return;
            if (url === "") {
              editor.chain().focus().unsetLink().run();
            } else {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          title="リンク"
        >
          リンク
        </Btn>
        <span style={{ color: C.pale, padding: "0 4px" }}>|</span>
        <Btn onClick={() => editor.chain().focus().undo().run()} title="元に戻す">
          ↶
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="やり直し">
          ↷
        </Btn>
      </div>
      <EditorContent
        editor={editor}
        className="ft-prose"
      />
      <style>{`
        /*
         * 罫線ノートのフィール：
         *   line-height を罫ピッチ(30px)に合わせ、
         *   各行のベースラインが罫線の直上に落ちるよう padding-top を調整。
         *   段落・見出し・リストの margin は 30 の倍数または 0 にして
         *   グリッドのリズムを崩さない。
         */
        .ft-prose .tiptap {
          min-height: 270px;
          padding: 4px 24px 20px;
          font-family: ${F.mincho};
          font-size: 15px;
          color: ${C.sumi};
          line-height: 30px;
          outline: none;
          background-color: ${C.paper};
          background-image: repeating-linear-gradient(transparent 0 29px, ${C.line} 29px 30px);
          background-size: 100% 30px;
          background-origin: padding-box;
          background-position: 0 2px;
        }
        .ft-prose .tiptap p { margin: 0; }
        .ft-prose .tiptap h1 { font-size: 22px; line-height: 30px; margin: 0; }
        .ft-prose .tiptap h2 { font-size: 18px; line-height: 30px; margin: 0; }
        .ft-prose .tiptap blockquote {
          border-left: 3px solid ${C.shu};
          padding-left: 12px;
          color: ${C.sub};
          margin: 0;
        }
        .ft-prose .tiptap ul, .ft-prose .tiptap ol { padding-left: 22px; margin: 0; }
        .ft-prose .tiptap li { line-height: 30px; }
        .ft-prose .tiptap a { color: ${C.shu}; text-decoration: underline; }
        .ft-prose .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: ${C.pale};
          float: left;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
};

export default RichEditor;
