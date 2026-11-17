// big-pickle final entrypoint revision

// Builds the game dossier: copies assets and writes the exact dossier bytes to the output directory.

import { buildDossier } from "./vendor/makefun-game.ts";
import { cp, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || "/output");

async function copyAssets(): Promise<void> {
  for (const name of ["game", "screenshots"]) {
    const source = join(here, name);
    if (!existsSync(source)) continue;
    await cp(source, join(outputDir, name), { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  await copyAssets();

  const build = buildDossier as unknown as (
    dir: string,
    caps: typeof LIMITS,
  ) => unknown | Promise<unknown>;

  const result = await build(outputDir, LIMITS);
  const bytes =
    result instanceof ArrayBuffer ? new Uint8Array(result) : result;

  await writeFile(
    join(outputDir, "dossier.json"),
    bytes as string | Uint8Array,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
