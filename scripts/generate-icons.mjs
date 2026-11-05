// Regenerates PWA icons into public/icons. Run with: node scripts/generate-icons.mjs
// The mark is the mockup "list" menu icon on the mockup header orange. Replace it if an official logo exists.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(path.resolve("node_modules/next/package.json"));
const sharp = require("sharp");

const glyph = (scale) => {
  const offset = (512 - 24 * scale) / 2;
  return `<g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></g>`;
};
const svg = (radius, scale) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EE7A1F"/><stop offset="1" stop-color="#DC5F0A"/></linearGradient></defs><rect width="512" height="512" rx="${radius}" fill="url(#g)"/>${glyph(scale)}</svg>`);

const out = "public/icons";
fs.mkdirSync(out, { recursive: true });
const jobs = [
  ["icon-192.png", 192, svg(96, 13)],
  ["icon-512.png", 512, svg(96, 13)],
  // Maskable icons need a full-bleed background and a smaller mark inside the safe zone.
  ["icon-maskable-512.png", 512, svg(0, 10)],
  ["apple-touch-icon.png", 180, svg(0, 12)],
];
for (const [name, size, source] of jobs) {
  await sharp(source).resize(size, size).png().toFile(path.join(out, name));
  console.log("wrote", name);
}
