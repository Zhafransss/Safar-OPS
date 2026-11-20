// Regenerates the PWA icons and the header brand marks from the official logo. Run with:
//   node scripts/generate-icons.mjs
// Source: public/brand/logo.png, a full-bleed orange square with "HR" (white H, dark R) above
// "SAEFUL ASKAR" in white. Every output is cut from it, so the letterforms always match the logo.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(path.resolve("node_modules/next/package.json"));
const sharp = require("sharp");

const SOURCE = "public/brand/logo.png";
const ORANGE = [232, 101, 10];
const WHITE = [255, 255, 255];
const DARK = [31, 27, 18];

const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const pixel = (x, y) => data.subarray((y * width + x) * 4, (y * width + x) * 4 + 3);

// Each pixel is a blend of the logo's three colors (anti-aliased edges sit between two of them).
// Least squares on c - O = w * (W - O) + d * (D - O) gives the white and dark shares.
function shares([r, g, b]) {
  const c = [r - ORANGE[0], g - ORANGE[1], b - ORANGE[2]];
  const u = WHITE.map((v, i) => v - ORANGE[i]);
  const v = DARK.map((x, i) => x - ORANGE[i]);
  const dot = (a, b2) => a[0] * b2[0] + a[1] * b2[1] + a[2] * b2[2];
  const [uu, uv, vv, cu, cv] = [dot(u, u), dot(u, v), dot(v, v), dot(c, u), dot(c, v)];
  const det = uu * vv - uv * uv;
  const clamp = (n) => Math.min(1, Math.max(0, n));
  return { white: clamp((cu * vv - cv * uv) / det), dark: clamp((cv * uu - cu * uv) / det) };
}

// Rows of the two content bands: "HR", then "SAEFUL ASKAR".
const isInk = (x, y) => {
  const { white, dark } = shares(pixel(x, y));
  return white + dark > 0.25;
};
function bbox(top, bottom) {
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = top; y <= bottom; y++)
    for (let x = 0; x < width; x++)
      if (isInk(x, y)) [minX, maxX, minY, maxY] = [Math.min(minX, x), Math.max(maxX, x), Math.min(minY, y), Math.max(maxY, y)];
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}
const inkRows = [...Array(height).keys()].map((y) => [...Array(width).keys()].some((x) => isInk(x, y)));
const bands = [];
inkRows.forEach((ink, y) => {
  if (ink && (y === 0 || !inkRows[y - 1])) bands.push([y, y]);
  if (ink) bands[bands.length - 1][1] = y;
});
if (bands.length !== 2) throw new Error(`Expected 2 content bands in the logo, found ${bands.length}`);
const markBox = bbox(...bands[0]);
const textBox = bbox(...bands[1]);

// Recolors a region onto a transparent background with the given colors for white and dark ink.
async function recolor(box, colorOfWhite, colorOfDark, pad) {
  const w = box.width + pad * 2;
  const h = box.height + pad * 2;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < box.height; y++)
    for (let x = 0; x < box.width; x++) {
      const { white, dark } = shares(pixel(box.left + x, box.top + y));
      const alpha = Math.min(1, white + dark);
      if (alpha === 0) continue;
      const i = ((y + pad) * w + x + pad) * 4;
      for (let k = 0; k < 3; k++) out[i + k] = Math.round((white * colorOfWhite[k] + dark * colorOfDark[k]) / alpha);
      out[i + 3] = Math.round(alpha * 255);
    }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } }).png();
}

fs.mkdirSync("public/brand", { recursive: true });
// Header badge: "HR" on a white tile, so the white H becomes orange and the R stays dark.
await (await recolor(markBox, ORANGE, DARK, 0)).toFile("public/brand/hr-mark.png");
// Wordmark subtitle: "SAEFUL ASKAR" in white on the orange header.
await (await recolor(textBox, WHITE, WHITE, 0)).toFile("public/brand/saeful-askar.png");
console.log("wrote public/brand/hr-mark.png, public/brand/saeful-askar.png");

// App icons. The installed icon is cropped tighter than the logo so "HR" fills it, like a phone icon.
const content = {
  left: Math.min(markBox.left, textBox.left),
  top: markBox.top,
  right: Math.max(markBox.left + markBox.width, textBox.left + textBox.width),
  bottom: textBox.top + textBox.height,
};
const side = Math.round((content.right - content.left) * 1.2);
const crop = {
  left: Math.max(0, Math.round((content.left + content.right) / 2 - side / 2)),
  top: Math.max(0, Math.round((content.top + content.bottom) / 2 - side / 2)),
  width: side,
  height: side,
};
const cropped = () => sharp(SOURCE).extract(crop);
const rounded = (size) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${Math.round(size * 0.1875)}"/></svg>`);

const out = "public/icons";
fs.mkdirSync(out, { recursive: true });
for (const size of [192, 512]) {
  const square = await cropped().resize(size, size).png().toBuffer();
  await sharp(square).composite([{ input: rounded(size), blend: "dest-in" }]).png().toFile(path.join(out, `icon-${size}.png`));
  console.log(`wrote icon-${size}.png`);
}
// iOS rounds the corners itself and needs an opaque square.
await cropped().resize(180, 180).flatten({ background: { r: ORANGE[0], g: ORANGE[1], b: ORANGE[2] } }).png().toFile(path.join(out, "apple-touch-icon.png"));
console.log("wrote apple-touch-icon.png");
// Maskable: Android may cut the icon to a circle, so the whole logo sits inside the safe zone.
const inner = await sharp(SOURCE).resize(440, 440).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: { r: ORANGE[0], g: ORANGE[1], b: ORANGE[2], alpha: 1 } } })
  .composite([{ input: inner, left: 36, top: 36 }])
  .png()
  .toFile(path.join(out, "icon-maskable-512.png"));
console.log("wrote icon-maskable-512.png");
