// CHANGELOG 61: chat and report text keep their own layout: line breaks, a tab at the start of a
// paragraph, and numbered or bulleted lines.

// Drops blank lines before the text and spaces after it, but keeps a tab or spaces that open the
// first paragraph, which trim() would remove.
export function tidyText(text: string): string {
  return text.replace(/^(?:[ \t]*\r?\n)+/, "").trimEnd();
}

const BLOCKS = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "TR", "BLOCKQUOTE", "PRE", "SECTION", "ARTICLE", "TABLE"]);
const SKIPPED = new Set(["STYLE", "SCRIPT", "META", "TITLE", "HEAD"]);

// Copied lists arrive as HTML lists; their plain-text version often loses the numbers or bullets
// (Google Docs, Notes). This writes them back as "1. ", "• ", one tab deeper per level. Only the
// text is read; the HTML is parsed in an inert document and never inserted. Null without a list.
export function listTextFromHtml(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc.querySelector("li")) return null;

  const lines: string[] = [];
  let line = "";
  let marker = 0; // Length of the list marker opening `line`.
  const flush = (keepBareMarker: boolean) => {
    const hasText = line.slice(marker).trim() !== "";
    if (!hasText && keepBareMarker) return;
    if (hasText) lines.push(line.trimEnd());
    line = "";
    marker = 0;
  };

  const walk = (node: Node, depth: number) => {
    if (node.nodeType === Node.TEXT_NODE) {
      line += (node.textContent ?? "").replace(/\s+/g, " ");
      return;
    }
    if (!(node instanceof Element) || SKIPPED.has(node.tagName)) return;
    if (node.tagName === "BR") return flush(false);
    if (node.tagName === "UL" || node.tagName === "OL") {
      flush(false);
      let number = Number(node.getAttribute("start")) || 1;
      for (const item of node.children) {
        if (item.tagName !== "LI") {
          walk(item, depth + 1);
          continue;
        }
        flush(false);
        line = "\t".repeat(depth) + (node.tagName === "OL" ? `${number++}. ` : "• ");
        marker = line.length;
        item.childNodes.forEach((child) => walk(child, depth + 1));
        flush(false);
      }
      return;
    }
    const block = BLOCKS.has(node.tagName);
    // A paragraph inside a list item joins the item's marker instead of leaving it on its own line.
    if (block) flush(true);
    node.childNodes.forEach((child) => walk(child, depth));
    if (block) flush(false);
  };

  walk(doc.body, 0);
  flush(false);
  return lines.join("\n");
}
