/**
 * Walks the generated manifest, checks every `/3d/...` URL resolves to a
 * file on disk under `public/`, and reports total size + any missing refs.
 *
 * Run with: pnpm tsx scripts/3d-assets/verify.ts
 */

import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"

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

// Reverse check: every file under public/3d/ must (a) be referenced by the
// manifest and (b) have a content-hash suffix. (b) is the contract that makes
// the year-long immutable Cache-Control header at /3d/:path* safe.

function walkDisk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walkDisk(full, out)
    else out.push(full)
  }
}

const HASH_SUFFIX = /-[a-f0-9]{8}\.[a-z0-9]+$/i
const onDisk: string[] = []
walkDisk("public/3d", onDisk)
const referenced = new Set(urls.map((u) => `public${u}`))

const orphans = onDisk.filter((f) => !referenced.has(f))
if (orphans.length > 0) {
  console.warn(`\n⚠ ${orphans.length} orphan files (on disk, not in manifest):`)
  for (const f of orphans) console.warn(`  - ${f}`)
}

const unhashed = onDisk.filter((f) => !HASH_SUFFIX.test(f))
if (unhashed.length > 0) {
  console.error(
    `\n✗ ${unhashed.length} files under public/3d/ are not content-hashed:`
  )
  for (const f of unhashed) console.error(`  - ${f}`)
  console.error(
    "Run `pnpm assets:hash <path>` on each, then update the manifest."
  )
  process.exit(1)
}
