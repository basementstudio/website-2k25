/**
 * Keeps the runtime decoders served from public/ in lockstep with the
 * installed three version:
 *
 * - public/basis-transcoder/ — used by KTX2Loader
 * - public/draco/            — used by DRACOLoader (via drei's useGLTF)
 *
 * Both loaders fetch their decoder at runtime from a URL, so the copy we serve
 * is not resolved through node_modules and nothing links the two. A `three`
 * upgrade therefore leaves the served files untouched, and a mismatch is
 * invisible on any machine whose GPU skips the transcoder entirely — Apple GPUs
 * support the ASTC HDR profile, so KTX2Loader decodes UASTC HDR lightmaps
 * directly and never loads this file. Windows has no ASTC, goes through the
 * transcoder, and is where a stale copy surfaces as
 * `THREE.KTX2Loader: .transcodeImage failed.`
 *
 * The Draco decoder is self-hosted because DRACOLoader otherwise defaults to
 * www.gstatic.com, a third-party fetch that content blockers, iCloud Private
 * Relay and flaky mobile networks fail with `TypeError: Load failed`.
 *
 * Runs on build. `--check` verifies without writing (for CI).
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"

// Resolved through the exports map rather than by walking node_modules, so this
// still finds the files under pnpm's symlinked layout. `three/package.json` is
// not an exported path, hence resolving a decoder file directly.
const require = createRequire(import.meta.url)

const TARGETS = [
  {
    srcDir: dirname(
      require.resolve("three/examples/jsm/libs/basis/basis_transcoder.js")
    ),
    destDir: "public/basis-transcoder",
    files: ["basis_transcoder.js", "basis_transcoder.wasm"]
  },
  {
    srcDir: dirname(
      require.resolve("three/examples/jsm/libs/draco/gltf/draco_decoder.js")
    ),
    destDir: "public/draco",
    files: ["draco_decoder.js", "draco_wasm_wrapper.js", "draco_decoder.wasm"]
  }
]

const check = process.argv.includes("--check")
const stale: string[] = []

for (const { srcDir, destDir, files } of TARGETS) {
  if (!existsSync(srcDir)) {
    console.error(`three's decoder directory not found at ${srcDir}`)
    process.exit(1)
  }

  if (!check) mkdirSync(destDir, { recursive: true })

  for (const file of files) {
    const src = join(srcDir, file)
    const dest = join(destDir, file)

    const same =
      existsSync(dest) && readFileSync(dest).equals(readFileSync(src))
    if (same) continue

    if (check) {
      stale.push(dest)
    } else {
      copyFileSync(src, dest)
      console.log(`  synced ${dest}`)
    }
  }
}

if (stale.length > 0) {
  console.error(
    `\n✗ Served decoders are out of sync with the installed three:\n` +
      stale.map((f) => `  - ${f}`).join("\n") +
      `\nRun \`pnpm basis:sync\`.`
  )
  process.exit(1)
}
