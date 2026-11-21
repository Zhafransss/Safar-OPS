// Copies to the clipboard (CHANGELOG 51, 54). The Clipboard API needs HTTPS or localhost.

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
