/**
 * Keeps public/basis-transcoder/ in lockstep with the installed three version.
 *
 * KTX2Loader fetches the transcoder at runtime from a URL, so the copy we serve
 * is not resolved through node_modules and nothing links the two. A `three`
 * upgrade therefore leaves the served transcoder untouched, and a mismatch is
 * invisible on any machine whose GPU skips the transcoder entirely — Apple GPUs
 * support the ASTC HDR profile, so KTX2Loader decodes UASTC HDR lightmaps
 * directly and never loads this file. Windows has no ASTC, goes through the
 * transcoder, and is where a stale copy surfaces as
 * `THREE.KTX2Loader: .transcodeImage failed.`
 *
 * Runs on postinstall. `--check` verifies without writing (for CI).
 */

import { copyFileSync, existsSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"

const FILES = ["basis_transcoder.js", "basis_transcoder.wasm"]
const DEST_DIR = "public/basis-transcoder"

// Resolved through the exports map rather than by walking node_modules, so this
// still finds the file under pnpm's symlinked layout. `three/package.json` is
// not an exported path, hence resolving a transcoder file directly.
const require = createRequire(import.meta.url)
const srcDir = dirname(
  require.resolve("three/examples/jsm/libs/basis/basis_transcoder.js")
)

if (!existsSync(srcDir)) {
  console.error(`three's basis transcoder not found at ${srcDir}`)
  process.exit(1)
}

const check = process.argv.includes("--check")
const stale: string[] = []

for (const file of FILES) {
  const src = join(srcDir, file)
  const dest = join(DEST_DIR, file)

  const same = existsSync(dest) && readFileSync(dest).equals(readFileSync(src))
  if (same) continue

  if (check) {
    stale.push(file)
  } else {
    copyFileSync(src, dest)
    console.log(`  synced ${dest}`)
  }
}

if (stale.length > 0) {
  console.error(
    `\n✗ ${DEST_DIR} is out of sync with the installed three:\n` +
      stale.map((f) => `  - ${f}`).join("\n") +
      `\nRun \`pnpm basis:sync\`.`
  )
  process.exit(1)
}
