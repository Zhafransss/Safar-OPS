// Regenerates the app icons and the header lockup. Run with:
//   node scripts/generate-icons.mjs
// Sources (CHANGELOG 63, 64):
// - public/icons/Icon.png, the app icon artwork: a full-bleed orange square with "HR" above
//   "SAEFUL ASKAR". The installed icons are this image, resized.
// - public/icons/Icon-new.jpeg, the lockup artwork: the HR tile, HRIS and SAEFUL ASKAR on orange.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(path.resolve("node_modules/next/package.json"));
const sharp = require("sharp");

const ICON_SOURCE = "public/icons/Icon.png";
const WHITE = [255, 255, 255];
const DARK = [31, 27, 18];

// Each pixel is a blend of the logo's three colors (anti-aliased edges sit between two of them).
// Least squares on c - O = w * (W - O) + d * (D - O) gives the white and dark shares.
function shares([r, g, b], orange) {
  const c = [r - orange[0], g - orange[1], b - orange[2]];
  const u = WHITE.map((v, i) => v - orange[i]);
  const v = DARK.map((x, i) => x - orange[i]);
  const dot = (a, b2) => a[0] * b2[0] + a[1] * b2[1] + a[2] * b2[2];
  const [uu, uv, vv, cu, cv] = [dot(u, u), dot(u, v), dot(v, v), dot(c, u), dot(c, v)];
  const det = uu * vv - uv * uv;
  const clamp = (n) => Math.min(1, Math.max(0, n));
  return { white: clamp((cu * vv - cv * uv) / det), dark: clamp((cv * uu - cu * uv) / det) };
}

fs.mkdirSync("public/brand", { recursive: true });

// Header lockup (CHANGELOG 63): the "HR" tile, HRIS and SAEFUL ASKAR as drawn in the lockup artwork,
// cut from its orange background, which becomes transparent so the app's own orange shows through
// (also in the H, which the artwork leaves orange). White and the dark R keep their colors; JPEG
// noise is kept from drawing a halo around the letters.
{
  const LOCKUP_SOURCE = "public/icons/Icon-new.jpeg";
  const LOCKUP_ORANGE = [215, 120, 52];
  const { data: src, info: meta } = await sharp(LOCKUP_SOURCE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const at = (x, y) => src.subarray((y * meta.width + x) * 3, (y * meta.width + x) * 3 + 3);
  const inked = (x, y) => {
    const { white, dark } = shares(at(x, y), LOCKUP_ORANGE);
    return white + dark > 0.25;
  };
  let [left, right, top, bottom] = [meta.width, 0, meta.height, 0];
  for (let y = 0; y < meta.height; y++)
    for (let x = 0; x < meta.width; x++)
      if (inked(x, y)) [left, right, top, bottom] = [Math.min(left, x), Math.max(right, x), Math.min(top, y), Math.max(bottom, y)];
  const pad = 2;
  const w = right - left + 1 + pad * 2;
  const h = bottom - top + 1 + pad * 2;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const sx = left - pad + x;
      const sy = top - pad + y;
      if (sx < 0 || sy < 0 || sx >= meta.width || sy >= meta.height) continue;
      let { white, dark } = shares(at(sx, sy), LOCKUP_ORANGE);
      // Edges between white and orange pick up a little "dark" from JPEG ringing, which would draw
      // a grey fringe. Below 0.3 the pixel counts as white over orange only.
      if (dark < 0.3) {
        const c = at(sx, sy);
        const u = WHITE.map((v, k) => v - LOCKUP_ORANGE[k]);
        const projected = u.reduce((sum, v, k) => sum + v * (c[k] - LOCKUP_ORANGE[k]), 0) / u.reduce((sum, v) => sum + v * v, 0);
        white = Math.min(1, Math.max(0, projected));
        dark = 0;
      }
      if (white < 0.06) white = 0;
      const alpha = Math.min(1, white + dark);
      if (alpha === 0) continue;
      const i = (y * w + x) * 4;
      for (let k = 0; k < 3; k++) out[i + k] = Math.round((white * WHITE[k] + dark * DARK[k]) / alpha);
      out[i + 3] = Math.round(alpha * 255);
    }
  await sharp(out, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toFile("public/brand/lockup.png");
  console.log(`wrote public/brand/lockup.png (${w}x${h})`);
}

// App icons: the icon artwork as it is. Its own orange fills what the artwork does not cover.
const { dominant } = await sharp(ICON_SOURCE).stats();
const background = { r: dominant.r, g: dominant.g, b: dominant.b, alpha: 1 };
const icon = (size) => sharp(ICON_SOURCE).flatten({ background }).resize(size, size);
const rounded = (size) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${Math.round(size * 0.1875)}"/></svg>`);

const out = "public/icons";
for (const size of [192, 512]) {
  const square = await icon(size).png().toBuffer();
  await sharp(square).composite([{ input: rounded(size), blend: "dest-in" }]).png().toFile(path.join(out, `icon-${size}.png`));
  console.log(`wrote icon-${size}.png`);
}
// iOS rounds the corners itself and needs an opaque square.
await icon(180).png().toFile(path.join(out, "apple-touch-icon.png"));
console.log("wrote apple-touch-icon.png");
// Maskable: Android may cut the icon to a circle (the safe zone is the middle 80%). The artwork's
// corners reach that edge exactly, so it is drawn at 90% on its own orange to stay clear of it.
const inner = await icon(460).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background } })
  .composite([{ input: inner, left: 26, top: 26 }])
  .png()
  .toFile(path.join(out, "icon-maskable-512.png"));
console.log("wrote icon-maskable-512.png");
