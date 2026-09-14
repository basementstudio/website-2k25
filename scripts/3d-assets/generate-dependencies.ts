/** Generate the base mesh inventory without decoding or changing geometry. */
import { readFileSync, writeFileSync } from "node:fs"

import { ASSETS_BASE } from "../../src/lib/3d-config/asset-manifest"

const names = new Set<string>()
for (const key of [
  "office",
  "outdoor",
  "godrays",
  "outdoorCars",
  "basketballNet",
  "routingElements"
] as const) {
  const bytes = readFileSync(`public${ASSETS_BASE[key]}`)
  const length = bytes.readUInt32LE(12)
  const gltf = JSON.parse(bytes.subarray(20, 20 + length).toString())
  for (const node of gltf.nodes ?? []) if (node.name) names.add(node.name)
}
const path = "src/lib/3d-config/base-meshes.json"
const output = JSON.stringify([...names].sort(), null, 2) + "\n"
if (process.argv.includes("--check")) {
  if (readFileSync(path, "utf8") !== output)
    throw new Error(
      "Base mesh inventory is stale; run pnpm assets:dependencies"
    )
} else writeFileSync(path, output)
