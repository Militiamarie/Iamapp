import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public/favicon.svg"), "utf8");
const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

async function render(size, file, padRatio) {
  const pad = Math.round(size * padRatio);
  const inner = size - pad * 2;
  const browser = await chromium.launch({ args: ["--disable-web-security"] });
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:#0A0706;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">
      <img alt="" src="${dataUrl}" width="${inner}" height="${inner}" />
    </body></html>`,
    { waitUntil: "load" },
  );
  const buf = await page.screenshot({ type: "png", omitBackground: false });
  await writeFile(join(root, "public", file), buf);
  await browser.close();
}

await render(180, "icon-180.png", 0.08);
await render(192, "icon-192.png", 0.08);
await render(512, "icon-512.png", 0.08);
await render(512, "icon-512-maskable.png", 0.12);
console.log("icons written");
