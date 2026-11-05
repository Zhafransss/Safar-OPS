import "server-only";

import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

// Local disk for now. Hosting is undecided (A-04): Vercel has no persistent disk, so a Vercel
// deployment needs a Blob driver behind these same functions. Callers never see the storage.
function storageRoot(): string {
  return process.env.PHOTO_STORAGE_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), ".uploads");
}

export const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // Under the 4.5 MB Vercel function body limit.

type PhotoExtension = "jpg" | "png" | "webp";

const CONTENT_TYPES: Record<PhotoExtension, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const KEY_PATTERN = /^([a-z0-9-]+)\/[0-9a-f-]{36}\.(jpg|png|webp)$/i;

// Trust the file's bytes, never the browser's declared type.
export function detectExtension(bytes: Uint8Array): PhotoExtension | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

export function newPhotoKey(userId: string, extension: PhotoExtension): string {
  return `${userId}/${randomUUID()}.${extension}`;
}

// A key is only attachable by the person who uploaded it.
export function isOwnKey(key: string, userId: string): boolean {
  return KEY_PATTERN.exec(key)?.[1] === userId;
}

// turbopackIgnore: runtime data, so the bundler must not pull the whole project into the deployment.
function resolveKey(key: string): string {
  if (!KEY_PATTERN.test(key)) throw new Error("Invalid photo key");
  return path.join(/* turbopackIgnore: true */ storageRoot(), key);
}

export async function savePhoto(key: string, bytes: Uint8Array): Promise<void> {
  const target = resolveKey(key);
  await fs.mkdir(/* turbopackIgnore: true */ path.dirname(target), { recursive: true });
  await fs.writeFile(/* turbopackIgnore: true */ target, bytes);
}

export async function photoExists(key: string): Promise<boolean> {
  return fs.access(/* turbopackIgnore: true */ resolveKey(key)).then(
    () => true,
    () => false,
  );
}

export async function readPhoto(key: string): Promise<{ bytes: Uint8Array<ArrayBuffer>; contentType: string }> {
  const buffer = await fs.readFile(/* turbopackIgnore: true */ resolveKey(key));
  const extension = key.split(".").pop() as PhotoExtension;
  return { bytes: new Uint8Array(buffer), contentType: CONTENT_TYPES[extension] };
}
