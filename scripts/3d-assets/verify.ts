/**
 * Walks the generated manifest, checks every `/3d/...` URL resolves to a
 * file on disk under `public/`, and reports total size + any missing refs.
 *
 * Run with: pnpm tsx scripts/3d-assets/verify.ts
 */

import { statSync } from "node:fs"

import {
  ASSETS_BASE,
  INSPECTABLES_META
} from "../../src/lib/3d-config/asset-manifest"

function collectUrls(node: unknown, out: string[]): void {
  if (typeof node === "string") {
    if (node.startsWith("/3d/")) out.push(node)
    return
  }
  if (node === null || typeof node !== "object") return
  if (Array.isArray(node)) {
    for (const item of node) collectUrls(item, out)
    return
  }
  for (const value of Object.values(node)) collectUrls(value, out)
}

const urls: string[] = []
collectUrls(ASSETS_BASE, urls)
collectUrls(INSPECTABLES_META, urls)

const seen = new Set<string>()
const missing: string[] = []
let totalBytes = 0

for (const url of urls) {
  if (seen.has(url)) continue
  seen.add(url)
  try {
    totalBytes += statSync(`public${url}`).size
  } catch {
    missing.push(url)
  }
}

console.log(`Manifest references: ${urls.length} (${seen.size} unique)`)
console.log(`Resolved: ${seen.size - missing.length} files, ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)

if (missing.length > 0) {
  console.error(`\n✗ ${missing.length} missing files:`)
  for (const url of missing) console.error(`  - public${url}`)
  process.exit(1)
}

console.log("\n✓ All manifest references resolve to files on disk.")
