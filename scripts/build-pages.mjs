#!/usr/bin/env node
/**
 * Static GitHub Pages build. Nitro's github-pages preset prerenders every
 * crawled route, then the leftover SSR rollup step fails (static preset has
 * no server entry). If index.html landed, that is a successful temple.
 */
import { spawn } from "node:child_process";
import { access, copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, ".output/public");

function runVite() {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [join(root, "scripts/with-app-env.mjs"), "vite", "build"],
      {
        cwd: root,
        env: { ...process.env, NITRO_PRESET: "github-pages" },
        stdio: "inherit",
      },
    );
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function finish() {
  const index = join(out, "index.html");
  if (!(await exists(index))) {
    console.error("[pages] no index.html — build failed");
    process.exit(1);
  }

  await writeFile(join(out, ".nojekyll"), "");
  await copyFile(index, join(out, "404.html"));

  // Routes the crawler may miss still need a shell so the SPA can hydrate.
  for (const route of [
    "stage",
    "productions",
    "altar",
    "mint",
    "scan",
    "house",
    "feed",
    "market",
    "vault",
    "grimoire",
    "install",
    "privacy",
    "terms",
    "support",
  ]) {
    const dir = join(out, route);
    await mkdir(dir, { recursive: true });
    if (!(await exists(join(dir, "index.html")))) {
      await copyFile(index, join(dir, "index.html"));
    }
  }

  console.log("[pages] static temple ready in .output/public");
}

const code = await runVite();
try {
  await finish();
} catch (err) {
  console.error("[pages] finish failed", err);
  process.exit(code || 1);
}
process.exit(0);
