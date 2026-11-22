import { describe, expect, it } from "vitest";

import { tidyText } from "@/lib/text-layout";

describe("tidyText (CHANGELOG 61)", () => {
  it("keeps the tab that opens the first paragraph", () => {
    expect(tidyText("\tParagraf satu.\n\tParagraf dua.")).toBe("\tParagraf satu.\n\tParagraf dua.");
  });

  it("keeps line breaks and list markers", () => {
    expect(tidyText("Mohon dicek:\n1. Stok\n2. Kas\n- gudang A")).toBe("Mohon dicek:\n1. Stok\n2. Kas\n- gudang A");
  });

  it("drops blank lines before the text and spaces after it", () => {
    expect(tidyText("\n  \n\tIsi\n\n  ")).toBe("\tIsi");
  });

  it("leaves nothing for blank text", () => {
    expect(tidyText(" \n\t \n")).toBe("");
  });
});
