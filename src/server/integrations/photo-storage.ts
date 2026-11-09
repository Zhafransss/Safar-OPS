import "server-only";

import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { AwsClient } from "aws4fetch";

// Photos live in Cloudflare R2 in production (decided 5 November) and on local disk in development.
// Callers never see which one: they only save, check, and answer a photo request.

export const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // Under the 4.5 MB Vercel function body limit.

// A key never points to different bytes, so the viewer's own browser may keep a photo for a day.
// Private: shared caches must not store it, because every read is access-checked.
const PHOTO_CACHE_CONTROL = "private, max-age=86400, immutable";

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

function assertKey(key: string): PhotoExtension {
  const match = KEY_PATTERN.exec(key);
  if (!match) throw new Error("Invalid photo key");
  return match[2]?.toLowerCase() as PhotoExtension;
}

type PhotoDriver = {
  save(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  respond(key: string, contentType: string): Promise<Response>;
};

// --- Cloudflare R2 (S3 API). The bucket stays private and the app streams photos to the browser.
// Browsers never contact R2 directly: Indonesian ISPs block the R2 domains, while the
// server reaches R2 from Singapore.
function r2Driver(): PhotoDriver {
  const accountId = process.env.R2_ACCOUNT_ID ?? "";
  const bucket = process.env.R2_BUCKET ?? "";
  const endpoint = process.env.R2_ENDPOINT ?? `https://${accountId}.r2.cloudflarestorage.com`;
  const client = new AwsClient({
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    service: "s3",
    region: "auto",
  });
  const urlOf = (key: string) => `${endpoint}/${bucket}/${key}`;

  return {
    async save(key, bytes, contentType) {
      // Not client.fetch: it hands fetch a Request, which Next.js rebuilds with the body as a stream.
      // The upload then goes out without Content-Length and R2 refuses it with 411. Plain bytes in
      // init keep the length. The S3 signature uses UNSIGNED-PAYLOAD, so the body is not signed.
      const signed = await client.sign(urlOf(key), { method: "PUT", headers: { "content-type": contentType } });
      const response = await fetch(signed.url, { method: "PUT", headers: signed.headers, body: new Uint8Array(bytes) });
      if (!response.ok) throw new Error(`R2 upload failed: ${response.status}`);
    },
    async exists(key) {
      const response = await client.fetch(urlOf(key), { method: "HEAD" });
      return response.ok;
    },
    async respond(key, contentType) {
      const stored = await client.fetch(urlOf(key));
      if (stored.status === 404) return new Response(null, { status: 404 });
      if (!stored.ok || !stored.body) throw new Error(`R2 read failed: ${stored.status}`);
      const headers = new Headers({ "content-type": contentType, "cache-control": PHOTO_CACHE_CONTROL });
      const length = stored.headers.get("content-length");
      if (length) headers.set("content-length", length);
      // Stream the body through instead of buffering the whole photo first.
      return new Response(stored.body, { headers });
    },
  };
}

// --- Local disk, for development. turbopackIgnore keeps the bundler from tracing the whole project.
function diskDriver(): PhotoDriver {
  const root = process.env.PHOTO_STORAGE_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), ".uploads");
  const fileOf = (key: string) => path.join(/* turbopackIgnore: true */ root, key);

  return {
    async save(key, bytes) {
      const target = fileOf(key);
      await fs.mkdir(/* turbopackIgnore: true */ path.dirname(target), { recursive: true });
      await fs.writeFile(/* turbopackIgnore: true */ target, bytes);
    },
    async exists(key) {
      return fs.access(/* turbopackIgnore: true */ fileOf(key)).then(
        () => true,
        () => false,
      );
    },
    async respond(key, contentType) {
      const buffer = await fs.readFile(/* turbopackIgnore: true */ fileOf(key));
      return new Response(new Uint8Array(buffer), {
        headers: { "content-type": contentType, "cache-control": PHOTO_CACHE_CONTROL },
      });
    },
  };
}

function driver(): PhotoDriver {
  if (process.env.R2_BUCKET) return r2Driver();
  // Vercel has no lasting disk: a photo written there would vanish, so refuse instead of losing it.
  if (process.env.VERCEL) throw new Error("Photo storage is not configured: set the R2_* variables");
  return diskDriver();
}

export async function savePhoto(key: string, bytes: Uint8Array): Promise<void> {
  await driver().save(key, bytes, CONTENT_TYPES[assertKey(key)]);
}

export async function photoExists(key: string): Promise<boolean> {
  assertKey(key);
  return driver().exists(key);
}

// Called only after the access check (NFR-04).
export async function photoResponse(key: string): Promise<Response> {
  const response = await driver().respond(key, CONTENT_TYPES[assertKey(key)]);
  response.headers.set("x-content-type-options", "nosniff");
  return response;
}
