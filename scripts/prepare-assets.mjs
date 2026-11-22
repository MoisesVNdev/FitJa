import sharp from "sharp";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const folder = path.join(root, "Docs", "Fotos do cardapio fisico");
const files = await readdir(folder);
const crops = [
  ["salada", "777260", 505, 45, 185, 185],
  ["marmita", "777260", 505, 549, 185, 188],
  ["marmitas", "777260", 505, 1047, 185, 186],
  ["escondidinho", "774886", 505, 47, 185, 187],
  ["lasanha", "774886", 505, 301, 185, 185],
  ["pizza", "774886", 505, 549, 185, 184],
  ["coxinha", "774886", 505, 797, 185, 185],
  ["tapioca", "775307", 505, 70, 185, 185],
  ["sanduiche", "775307", 505, 303, 185, 186],
  ["cuscuz", "775307", 505, 552, 185, 185],
  ["omelete", "775307", 505, 804, 185, 185],
  ["crepioca", "775307", 505, 1057, 185, 185],
  ["suco-uva", "774652", 539, 147, 149, 149],
  ["suco-laranja", "774652", 539, 315, 149, 149],
  ["sucos", "774652", 539, 485, 149, 149],
  ["vitamina", "774652", 539, 760, 149, 149],
  ["cafe", "774469", 505, 383, 185, 185],
  ["cafe-leite", "774469", 505, 597, 185, 183],
  ["cappuccino", "774469", 505, 794, 185, 183],
  ["brigadeiro", "774469", 505, 1051, 185, 185],
  ["frutinhas", "772868", 505, 50, 185, 184],
  ["tortilete", "772868", 505, 296, 185, 185],
  ["empada", "772868", 505, 550, 185, 184],
  ["bolo-banana", "772868", 505, 801, 185, 185],
  ["bolo-chocolate", "772868", 505, 1053, 185, 185],
  ["refrigerante", "774886", 505, 1052, 185, 180],
  ["toddynho", "775244", 542, 657, 150, 150],
  ["proteica", "775244", 542, 873, 150, 150],
  ["cafe-gelado", "775244", 542, 1068, 150, 167],
];
await mkdir(path.join(root, "public", "media"), { recursive: true });
for (const [name, prefix, left, top, width, height] of crops) {
  const file = files.find((f) => f.startsWith(prefix));
  const base = sharp(path.join(folder, file)).extract({
    left,
    top,
    width,
    height,
  });
  // Do not upscale small source photographs: replacement uploads will generate larger versions.
  for (const size of [320, 640, 1280])
    await base
      .clone()
      .resize(size, size, { withoutEnlargement: true })
      .webp({ quality: 84 })
      .toFile(path.join(root, "public", "media", `${name}-${size}.webp`));
  await base
    .clone()
    .jpeg({ quality: 88 })
    .toFile(path.join(root, "public", "media", `${name}.jpg`));
}
const brandFolder = path.join(root, "Docs", "Material de designer");
const brand = (await readdir(brandFolder)).find((f) => f.endsWith("-1.jpg"));
await sharp(path.join(brandFolder, brand))
  .resize(160)
  .webp({ quality: 90 })
  .toFile(path.join(root, "public", "media", "logo.webp"));
console.log(`Prepared ${crops.length} source photographs and brand logo.`);
