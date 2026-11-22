import { z } from "zod";

// CHANGELOG 62: the formatted body of a report, as the editor's JSON. Only these nodes and marks
// exist: paragraphs, bullet and numbered lists, line breaks, and bold, italic and underline. The
// server checks every document against this schema (anything else is dropped or refused) and the
// page draws it with React elements, never as HTML, so a stored body cannot carry markup or script.

export type RichMark = { type: "bold" | "italic" | "underline" };
export type RichInline = { type: "text"; text: string; marks?: RichMark[] } | { type: "hardBreak" };
export type RichParagraph = { type: "paragraph"; content?: RichInline[] };
export type RichListItem = { type: "listItem"; content: RichBlock[] };
export type RichList =
  | { type: "bulletList"; content: RichListItem[] }
  | { type: "orderedList"; attrs?: { start?: number }; content: RichListItem[] };
export type RichBlock = RichParagraph | RichList;
export type RichDoc = { type: "doc"; content: RichBlock[] };

// Deep enough for any real report; a limit keeps a crafted document from recursing without end.
export const MAX_LIST_DEPTH = 6;

const mark = z.object({ type: z.enum(["bold", "italic", "underline"]) });
const inline: z.ZodType<RichInline> = z.union([
  z.object({ type: z.literal("text"), text: z.string().min(1), marks: z.array(mark).max(3).optional() }),
  z.object({ type: z.literal("hardBreak") }),
]);
const paragraph: z.ZodType<RichParagraph> = z.object({
  type: z.literal("paragraph"),
  content: z.array(inline).max(2000).optional(),
});
const listItem: z.ZodType<RichListItem> = z.lazy(() =>
  z.object({ type: z.literal("listItem"), content: z.array(block).min(1).max(50) }),
);
const block: z.ZodType<RichBlock> = z.lazy(() =>
  z.union([
    paragraph,
    z.object({ type: z.literal("bulletList"), content: z.array(listItem).min(1).max(200) }),
    z.object({
      type: z.literal("orderedList"),
      attrs: z.object({ start: z.number().int().min(0).max(100000).optional() }).optional(),
      content: z.array(listItem).min(1).max(200),
    }),
  ]),
);
export const richDocSchema: z.ZodType<RichDoc> = z.object({
  type: z.literal("doc"),
  content: z.array(block).max(500),
});

function depthOf(blocks: readonly RichBlock[]): number {
  let deepest = 0;
  for (const item of blocks) {
    if (item.type === "paragraph") continue;
    for (const entry of item.content) deepest = Math.max(deepest, 1 + depthOf(entry.content));
  }
  return deepest;
}

// The document if it follows the schema and nests lists no deeper than MAX_LIST_DEPTH, else null.
export function parseRichDoc(value: unknown): RichDoc | null {
  const parsed = richDocSchema.safeParse(value);
  if (!parsed.success || depthOf(parsed.data.content) > MAX_LIST_DEPTH) return null;
  return parsed.data;
}

const isBlank = (block: RichBlock) =>
  block.type === "paragraph" && (block.content ?? []).every((piece) => piece.type === "text" && !piece.text.trim());

// Empty paragraphs before and after the text are dropped, like tidyText does for plain text. The
// editor always keeps one at the end, and Enter pressed once too often leaves more.
export function trimRichDoc(doc: RichDoc): RichDoc {
  const content = [...doc.content];
  while (content[0] && isBlank(content[0])) content.shift();
  while (content.length && isBlank(content[content.length - 1] as RichBlock)) content.pop();
  return { ...doc, content };
}

// The plain text of a document, in the layout of CHANGELOG 61: one line per paragraph, list items
// as "1. " or "• ", one tab deeper per level. Used for the stored body (search, previews, checks).
export function richDocText(doc: RichDoc): string {
  const lines: string[] = [];
  const inlineText = (content: readonly RichInline[] = []) =>
    content.map((piece) => (piece.type === "text" ? piece.text : "\n")).join("");
  const walk = (blocks: readonly RichBlock[], depth: number, firstPrefix: string) => {
    blocks.forEach((item, index) => {
      // The first paragraph of a list item carries its marker; later ones line up under it.
      const prefix = index === 0 ? firstPrefix : "\t".repeat(depth);
      if (item.type === "paragraph") {
        lines.push(prefix + inlineText(item.content).replace(/\n/g, `\n${"\t".repeat(depth)}`));
        return;
      }
      const start = item.type === "orderedList" ? (item.attrs?.start ?? 1) : 1;
      item.content.forEach((entry, position) => {
        const marker = item.type === "orderedList" ? `${start + position}. ` : "• ";
        walk(entry.content, depth + 1, "\t".repeat(depth) + marker);
      });
    });
  };
  walk(doc.content, 0, "");
  return lines.join("\n");
}
