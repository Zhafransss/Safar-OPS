import { describe, expect, it } from "vitest";

import { MAX_LIST_DEPTH, parseRichDoc, richDocText, trimRichDoc, type RichBlock } from "@/lib/rich-text";

const p = (text: string, marks: ("bold" | "italic" | "underline")[] = []) => ({
  type: "paragraph" as const,
  content: [{ type: "text" as const, text, ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {}) }],
});
const item = (...content: RichBlock[]) => ({ type: "listItem" as const, content });

describe("parseRichDoc (CHANGELOG 62)", () => {
  it("accepts paragraphs, lists and the three marks", () => {
    const doc = {
      type: "doc",
      content: [
        p("Mohon dicek", ["bold", "underline"]),
        { type: "bulletList", content: [item(p("Gudang A", ["italic"]))] },
        { type: "orderedList", attrs: { start: 3 }, content: [item(p("Kas"))] },
      ],
    };
    expect(parseRichDoc(doc)).toEqual(doc);
  });

  it("drops attributes it does not know", () => {
    const doc = { type: "doc", content: [{ type: "orderedList", attrs: { start: 1, type: null }, content: [item(p("A"))] }] };
    expect(parseRichDoc(doc)).toEqual({ type: "doc", content: [{ type: "orderedList", attrs: { start: 1 }, content: [item(p("A"))] }] });
  });

  it("refuses other nodes and marks, such as links, headings and images", () => {
    expect(parseRichDoc({ type: "doc", content: [{ type: "heading", content: [] }] })).toBeNull();
    expect(parseRichDoc({ type: "doc", content: [{ type: "image", attrs: { src: "x" } }] })).toBeNull();
    const linked = { type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] };
    expect(parseRichDoc({ type: "doc", content: [linked] })).toBeNull();
    expect(parseRichDoc("<script>alert(1)</script>")).toBeNull();
  });

  it("refuses lists nested deeper than the limit", () => {
    let blocks: RichBlock[] = [p("dasar")];
    for (let level = 0; level <= MAX_LIST_DEPTH; level++) blocks = [{ type: "bulletList", content: [item(p("x"), ...blocks)] }];
    expect(parseRichDoc({ type: "doc", content: blocks })).toBeNull();
  });
});

describe("trimRichDoc (CHANGELOG 62)", () => {
  it("drops empty paragraphs before and after the text, keeping those between", () => {
    const empty = { type: "paragraph" as const };
    const doc = { type: "doc" as const, content: [empty, p("A"), empty, p("B"), empty, empty] };
    expect(trimRichDoc(doc).content).toEqual([p("A"), empty, p("B")]);
  });
});

describe("richDocText (CHANGELOG 62)", () => {
  it("writes lists with numbers, bullets and one tab per level", () => {
    const doc = parseRichDoc({
      type: "doc",
      content: [
        p("Mohon dicek:"),
        {
          type: "orderedList",
          content: [item(p("Stok")), item(p("Kas"), { type: "bulletList", content: [item(p("bon bensin")), item(p("bon parkir"))] })],
        },
        p("Terima kasih"),
      ],
    });
    expect(doc && richDocText(doc)).toBe("Mohon dicek:\n1. Stok\n2. Kas\n\t• bon bensin\n\t• bon parkir\nTerima kasih");
  });

  it("keeps a tab that opens a paragraph and turns line breaks into new lines", () => {
    const doc = parseRichDoc({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "\tBaris satu" }, { type: "hardBreak" }, { type: "text", text: "baris dua" }] }],
    });
    expect(doc && richDocText(doc)).toBe("\tBaris satu\nbaris dua");
  });
});
