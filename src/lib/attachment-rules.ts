// CHANGELOG 57: documents sent in the report chat. Shared by the composer and the server.

export const ATTACHMENT_TYPES = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  csv: "text/csv",
  md: "text/markdown",
} as const;

export type AttachmentExtension = keyof typeof ATTACHMENT_TYPES;

export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
// Vercel refuses request bodies over 4.5 MB, so a file goes up in parts of this size.
export const ATTACHMENT_PART_BYTES = 3 * 1024 * 1024;
export const MAX_ATTACHMENT_PARTS = Math.ceil(MAX_ATTACHMENT_BYTES / ATTACHMENT_PART_BYTES);

// For the file picker.
export const ATTACHMENT_ACCEPT = Object.keys(ATTACHMENT_TYPES)
  .map((extension) => `.${extension}`)
  .join(",");

export function attachmentExtension(fileName: string): AttachmentExtension | null {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return extension in ATTACHMENT_TYPES && fileName.includes(".") ? (extension as AttachmentExtension) : null;
}

export function attachmentPartCount(sizeBytes: number): number {
  return Math.max(1, Math.ceil(sizeBytes / ATTACHMENT_PART_BYTES));
}

// "820 KB", "1,4 MB" (Indonesian decimal comma).
export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
