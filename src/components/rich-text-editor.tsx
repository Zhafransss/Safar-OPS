"use client";

import { Placeholder } from "@tiptap/extensions";
import { EditorContent, Extension, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import type { RichDoc } from "@/lib/rich-text";

// CHANGELOG 62: Tab and Shift+Tab as in Word. In a list they move the item a level in or out (the
// list's own keys); elsewhere Tab types a tab to open a paragraph and Shift+Tab removes one before
// the caret. Either way the key stays in the editor instead of moving to the next field.
const TabKeys = Extension.create({
  name: "tabKeys",
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) =>
        editor.isActive("listItem") ? editor.commands.sinkListItem("listItem") || true : editor.commands.insertContent("\t"),
      "Shift-Tab": ({ editor }) => {
        if (editor.isActive("listItem")) return editor.commands.liftListItem("listItem") || true;
        const { from, empty } = editor.state.selection;
        if (empty && editor.state.doc.textBetween(from - 1, from) === "\t") {
          editor.commands.deleteRange({ from: from - 1, to: from });
        }
        return true;
      },
    };
  },
});

type Tool = { label: string; title: string; active: boolean; run: () => void; className?: string };

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      bullet: current.isActive("bulletList"),
      ordered: current.isActive("orderedList"),
    }),
  });
  const chain = () => editor.chain().focus();
  const tools: Tool[] = [
    { label: "B", title: "Tebal (Ctrl+B)", active: state.bold, run: () => chain().toggleBold().run(), className: "rt-b" },
    { label: "I", title: "Miring (Ctrl+I)", active: state.italic, run: () => chain().toggleItalic().run(), className: "rt-i" },
    { label: "U", title: "Garis bawah (Ctrl+U)", active: state.underline, run: () => chain().toggleUnderline().run(), className: "rt-u" },
    { label: "•", title: "Bullet", active: state.bullet, run: () => chain().toggleBulletList().run() },
    { label: "1.", title: "Penomoran", active: state.ordered, run: () => chain().toggleOrderedList().run() },
  ];
  return (
    <div className="rt-toolbar" role="toolbar" aria-label="Format teks">
      {tools.map((tool) => (
        <button
          key={tool.title}
          type="button"
          className={`${tool.className ?? ""} ${tool.active ? "is-on" : ""}`}
          title={tool.title}
          aria-label={tool.title}
          aria-pressed={tool.active}
          // Keeps the selection in the editor while the button is pressed.
          onMouseDown={(event) => event.preventDefault()}
          onClick={tool.run}
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
}

// The report body editor: bold, italic, underline, bullet and numbered lists. Formatted text pasted
// from Word or Google Docs keeps those; anything else it carries (links, headings, colours, images)
// is left out, matching the schema the server accepts (src/lib/rich-text.ts).
export function RichTextEditor({
  id,
  placeholder,
  onChange,
}: {
  id: string;
  placeholder: string;
  onChange: (doc: RichDoc, text: string) => void;
}) {
  const editor = useEditor({
    // Next.js renders on the server first; the editor starts in the browser.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        strike: false,
        horizontalRule: false,
        link: false,
      }),
      Placeholder.configure({ placeholder }),
      TabKeys,
    ],
    editorProps: { attributes: { id, class: "rt-content", "aria-multiline": "true", role: "textbox" } },
    onUpdate: ({ editor: current }) => onChange(current.getJSON() as RichDoc, current.getText({ blockSeparator: "\n" })),
  });

  return (
    <div className="rt-editor">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
