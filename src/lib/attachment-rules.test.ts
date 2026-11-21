import { describe, expect, it } from "vitest";

import {
  ATTACHMENT_ACCEPT,
  attachmentExtension,
  attachmentPartCount,
  formatFileSize,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_PARTS,
} from "@/lib/attachment-rules";

describe("attachment rules (CHANGELOG 57)", () => {
  it("accepts the agreed formats, in any case", () => {
    for (const name of ["a.pdf", "a.doc", "a.docx", "a.xls", "a.xlsx", "a.pptx", "a.csv", "a.md", "Laporan.Final.XLSX"]) {
      expect(attachmentExtension(name)).not.toBeNull();
    }
  });

  it("refuses other formats and names without an extension", () => {
    for (const name of ["a.exe", "a.html", "a.ppt", "a.zip", "pdf", "a."]) expect(attachmentExtension(name)).toBeNull();
  });

  it("splits a 5 MB file into parts under the Vercel request limit", () => {
    expect(MAX_ATTACHMENT_PARTS).toBe(2);
    expect(attachmentPartCount(MAX_ATTACHMENT_BYTES)).toBe(2);
    expect(attachmentPartCount(1000)).toBe(1);
  });

  it("lists every format for the file picker", () => {
    expect(ATTACHMENT_ACCEPT).toBe(".pdf,.doc,.docx,.xls,.xlsx,.pptx,.csv,.md");
  });

  it("shows sizes in KB or MB with a decimal comma", () => {
    expect(formatFileSize(300)).toBe("1 KB");
    expect(formatFileSize(820 * 1024)).toBe("820 KB");
    expect(formatFileSize(1.4 * 1024 * 1024)).toBe("1,4 MB");
  });
});
