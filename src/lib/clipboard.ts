// Copies to the clipboard (CHANGELOG 51, 54, 55). The Clipboard API needs HTTPS or localhost.

// Text: older browsers fall back to a hidden text field. Returns whether the copy worked.
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      field.remove();
    }
  }
}

// One photo, as PNG: browsers accept only PNG images on the clipboard, and only one at a time.
// Safari requires write() to start inside the tap itself, so the image is passed as a promise
// rather than awaited first; call this before any other await in the click handler.
export async function copyImage(url: string): Promise<boolean> {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) return false;
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": pngOf(url) })]);
    return true;
  } catch {
    return false;
  }
}

export type CopyAllResult = "copied" | "shared" | "cancelled" | "failed";

// Several photos at once (CHANGELOG 55). Safari takes several images; Chrome holds only one
// ("Support for multiple ClipboardItems is not implemented", Chrome 157). Where the clipboard
// refuses, the photos open in the system share sheet instead, to send them all to WhatsApp or save
// them. `files` should be fetched before the tap, so the share sheet opens while the tap still
// counts as the user's action.
export async function copyImages(urls: string[], files: Promise<File[]>): Promise<CopyAllResult> {
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write(urls.map((url) => new ClipboardItem({ "image/png": pngOf(url) })));
      return "copied";
    } catch {
      // Falls through to the share sheet.
    }
  }
  try {
    const list = await files;
    if (!navigator.canShare?.({ files: list })) return "failed";
    await navigator.share({ files: list });
    return "shared";
  } catch (error) {
    return error instanceof DOMException && error.name === "AbortError" ? "cancelled" : "failed";
  }
}

// The stored photos (JPEG) as files for the share sheet.
export function photoFiles(urls: string[]): Promise<File[]> {
  return Promise.all(
    urls.map(async (url, index) => {
      const blob = await (await fetch(url)).blob();
      return new File([blob], `foto-${index + 1}.jpg`, { type: blob.type || "image/jpeg" });
    }),
  );
}

async function pngOf(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`photo ${response.status}`);
  const bitmap = await createImageBitmap(await response.blob());
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("png"))), "image/png"),
  );
}
