/**
 * Hash + rename helper for 3D assets in /public/3d/.
 *
 * Usage:
 *   pnpm tsx scripts/3d-assets/hash.ts <path-to-file>
 *
 * Renames the file in place with a content-hash suffix matching the
 * convention used in src/lib/3d-config/asset-manifest.ts
 * (e.g. office.glb → office-077b4007.glb). Prints the resulting URL
 * path so you can copy/paste it into the manifest.
 *
 * After running this, update the relevant URL string in the manifest
 * to match, then `pnpm assets:verify` to confirm.
 */

import { createHash } from "node:crypto"
import { readFileSync, renameSync, statSync } from "node:fs"
import { basename, dirname, extname, join } from "node:path"

const arg = process.argv[2]
if (!arg) {
  console.error("Usage: pnpm tsx scripts/3d-assets/hash.ts <path-to-file>")
  process.exit(1)
}

try {
  statSync(arg)
} catch {
  console.error(`File not found: ${arg}`)
  process.exit(1)
}

const ext = extname(arg)
const stem = basename(arg, ext)

// Strip any existing -<sha8> suffix so re-running on an already-hashed file
// doesn't pile on extra hash segments.
const cleanStem = stem.replace(/-[a-f0-9]{8}$/, "")

// Wrap in Uint8Array to satisfy strict Node 24 / DOM type definitions —
// readFileSync returns a Buffer whose ArrayBufferLike type isn't directly
// assignable to crypto's BinaryLike.
const hash = createHash("sha256")
  .update(new Uint8Array(readFileSync(arg)))
  .digest("hex")
  .slice(0, 8)

const newName = `${cleanStem}-${hash}${ext}`
const newPath = join(dirname(arg), newName)

if (arg === newPath) {
  console.log(`✓ Already hashed: ${newName}`)
} else {
  renameSync(arg, newPath)
  console.log(`✓ Renamed: ${basename(arg)} → ${newName}`)
}

// Print public URL path if the file lives under public/
const publicMatch = newPath.match(/(?:^|\/)public\/(.+)$/)
if (publicMatch) {
  console.log(`  URL: /${publicMatch[1]}`)
}
