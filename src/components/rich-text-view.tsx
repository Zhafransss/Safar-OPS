import type { ReactNode } from "react";

import type { RichBlock, RichDoc, RichInline } from "@/lib/rich-text";

// CHANGELOG 62: draws a formatted report body with React elements, so nothing in it is ever read as
// HTML. The document has already passed parseRichDoc on the server.
function Inline({ piece }: { piece: RichInline }) {
  if (piece.type === "hardBreak") return <br />;
  let node: ReactNode = piece.text;
  for (const { type } of piece.marks ?? []) {
    if (type === "bold") node = <strong>{node}</strong>;
    if (type === "italic") node = <em>{node}</em>;
    if (type === "underline") node = <u>{node}</u>;
  }
  return <>{node}</>;
}

function Blocks({ blocks }: { blocks: readonly RichBlock[] }) {
  return blocks.map((block, index) => {
    if (block.type === "paragraph") {
      // An empty paragraph is a blank line, as in the editor; without the break it has no height.
      const pieces = block.content ?? [];
      return (
        <p key={index}>{pieces.length ? pieces.map((piece, at) => <Inline key={at} piece={piece} />) : <br />}</p>
      );
    }
    const items = block.content.map((item, at) => (
      <li key={at}>
        <Blocks blocks={item.content} />
      </li>
    ));
    return block.type === "orderedList" ? (
      <ol key={index} start={block.attrs?.start ?? 1}>
        {items}
      </ol>
    ) : (
      <ul key={index}>{items}</ul>
    );
  });
}

export function RichTextView({ doc, className = "" }: { doc: RichDoc; className?: string }) {
  return (
    <div className={`rt-view ${className}`}>
      <Blocks blocks={doc.content} />
    </div>
  );
}
