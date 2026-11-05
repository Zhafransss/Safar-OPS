import "server-only";

import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { AwsClient } from "aws4fetch";

// Photos live in Cloudflare R2 in production (decided 5 November) and on local disk in development.
// Callers never see which one: they only save, check, and answer a photo request.

export const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // Under the 4.5 MB Vercel function body limit.

// A signed R2 link lives this long. Short, because anyone holding the link can open the photo.
const SIGNED_URL_SECONDS = 300;

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

// --- Cloudflare R2 (S3 API). The bucket stays private; reads go through a short-lived signed link,
// so photo bytes never pass through the app server or use its transfer quota.
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
      const response = await client.fetch(urlOf(key), {
        method: "PUT",
        body: new Uint8Array(bytes),
        headers: { "content-type": contentType },
      });
      if (!response.ok) throw new Error(`R2 upload failed: ${response.status}`);
    },
    async exists(key) {
      const response = await client.fetch(urlOf(key), { method: "HEAD" });
      return response.ok;
    },
    async respond(key) {
      const signed = await client.sign(new Request(`${urlOf(key)}?X-Amz-Expires=${SIGNED_URL_SECONDS}`), {
        aws: { signQuery: true },
      });
      return new Response(null, {
        status: 302,
        headers: {
          location: signed.url,
          // Reuse the redirect only while the signed link is still valid.
          "cache-control": `private, max-age=${SIGNED_URL_SECONDS - 60}`,
        },
      });
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
        headers: { "content-type": contentType, "cache-control": "private, max-age=3600" },
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
