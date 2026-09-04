/**
 * Read-only diagnostic for a GLB sitting in the migration staging folder
 * (not yet content-hashed / not yet wired into asset-manifest.ts).
 *
 * Dumps, without touching the codebase:
 *   - node/mesh/primitive counts (draw-call estimate)
 *   - which TEXCOORD_n (UV) sets each mesh actually has, flagging meshes
 *     missing the lightmap UV we currently expect
 *   - every node/mesh that carries glTF `extras` (Blender custom properties),
 *     called out specifically when a "lightmap"-ish key is present
 *   - a cross-check of every mesh/material name this codebase currently
 *     depends on by exact string match (asset-manifest.ts + the hardcoded
 *     lookups in extract-meshes.ts, map/index.tsx, godrays, clock,
 *     arcade-board, arcade-screen, contact-scene) against what's actually
 *     in this file, so renamed/merged-away meshes show up as MISSING
 *     instead of failing silently at runtime later.
 *
 * Usage:
 *   pnpm tsx scripts/3d-assets/inspect-migration.ts <path-to-glb> [--uv-index=2]
 *
 * --uv-index picks which TEXCOORD_n is expected to be the lightmap UV for
 * this check (default 2, i.e. the 3rd UV set — matches the current
 * migration where models temporarily ship 3 UVs and the last one is the
 * lightmap; flip to 1 once models are trimmed back down to 2 UV sets).
 */

import { readFileSync } from "node:fs"

import {
  ASSETS_BASE,
  INSPECTABLES_META
} from "../../src/lib/3d-config/asset-manifest"

// --- names this codebase hardcodes outside the manifest (grep-verified) --- //
// See src/components/{map,godrays,clock,arcade-screen,arcade-board}/* and
// src/components/contact/contact-scene.tsx. Keep this list in sync if those
// files change.
const HARDCODED_MESH_NAMES = [
  "SM_Lobo",
  "SM_Rain",
  "SM_Controls",
  "SM_00_012",
  "SM_00_010",
  "SM_LightMeshBlog",
  "SM_06_01",
  "SM_06_02",
  "SM_06_03",
  "SM_06_04",
  "SM_06_05",
  "SM_06_06",
  "SM_06_07",
  "SM_KitCat",
  "SM_00a_01",
  "SM_BasketballHoop",
  "SM_BasketballGlass",
  "SM_TvScreen_4",
  "SM_ArcadeLab_Screen",
  "cloudy_01",
  "DL_ScreenB",
  "LaboratoryHome_HoverA",
  "LaboratoryHome_HoverB",
  "GR_About",
  "GR_Home",
  "SM_CatTail",
  "SM_EyeR",
  "SM_EyeL",
  "SM_HourHand",
  "SM_MinuterHand",
  "SM_Second",
  "SCREEN"
]

const HARDCODED_MORPH_NAMES = [
  ...Array.from({ length: 14 }, (_, i) => `02_BT_${i + 1}`),
  "02_JYTK_L",
  "02_JYTK_R",
  "02_JYTK_L_RotX",
  "02_JYTK_L_RotY",
  "02_JYTK_R_RotX",
  "02_JYTK_R_RotY"
]

const manifestMeshNames = new Set<string>()
for (const bake of ASSETS_BASE.bakes)
  for (const m of bake.meshes) manifestMeshNames.add(m)
for (const m of ASSETS_BASE.matcaps) manifestMeshNames.add(m.mesh)
for (const m of ASSETS_BASE.doubleSideElements) manifestMeshNames.add(m)
for (const m of ASSETS_BASE.glassReflexes) manifestMeshNames.add(m.mesh)
for (const m of ASSETS_BASE.videos) manifestMeshNames.add(m.mesh)
for (const m of INSPECTABLES_META) manifestMeshNames.add(m.mesh)
for (const m of HARDCODED_MESH_NAMES) manifestMeshNames.add(m)

const manifestMaterialNames = new Set<string>(ASSETS_BASE.glassMaterials)

// --- args --- //

const filePath = process.argv[2]
const uvIndexArg = process.argv.find((a) => a.startsWith("--uv-index="))
const lightmapUvIndex = uvIndexArg ? Number(uvIndexArg.split("=")[1]) : 2

if (!filePath) {
  console.error(
    "Usage: pnpm tsx scripts/3d-assets/inspect-migration.ts <path-to-glb> [--uv-index=2]"
  )
  process.exit(1)
}

// --- minimal GLB container parsing (JSON chunk only, no three.js needed) --- //

const buf = readFileSync(filePath)
if (buf.readUInt32LE(0) !== 0x46546c67) {
  console.error(
    "Not a .glb (bad magic) — this script doesn't handle .gltf + .bin pairs."
  )
  process.exit(1)
}

let offset = 12
let json: any = null
while (offset < buf.length) {
  const chunkLength = buf.readUInt32LE(offset)
  const chunkType = buf.readUInt32LE(offset + 4)
  const chunkStart = offset + 8
  if (chunkType === 0x4e4f534a /* 'JSON' */) {
    json = JSON.parse(
      buf.toString("utf8", chunkStart, chunkStart + chunkLength)
    )
    break
  }
  offset = chunkStart + chunkLength
}

if (!json) {
  console.error("No JSON chunk found.")
  process.exit(1)
}

const nodes: any[] = json.nodes ?? []
const meshes: any[] = json.meshes ?? []
const materials: any[] = json.materials ?? []

console.log(`\n=== ${filePath} ===`)
console.log(
  `nodes: ${nodes.length}, meshes: ${meshes.length}, materials: ${materials.length}`
)

// --- draw-call estimate + UV report --- //

let drawCalls = 0
const meshNodeNames: string[] = []
const missingLightmapUv: string[] = []
const uvSetHistogram: Record<string, number> = {}

for (const node of nodes) {
  if (node.mesh === undefined) continue
  const mesh = meshes[node.mesh]
  const name = node.name ?? `<unnamed node ${nodes.indexOf(node)}>`
  meshNodeNames.push(name)
  drawCalls += mesh.primitives.length

  for (const prim of mesh.primitives) {
    const texcoords = Object.keys(prim.attributes)
      .filter((k) => k.startsWith("TEXCOORD_"))
      .sort()
    const key = texcoords.join(",") || "(none)"
    uvSetHistogram[key] = (uvSetHistogram[key] ?? 0) + 1

    if (!prim.attributes[`TEXCOORD_${lightmapUvIndex}`]) {
      missingLightmapUv.push(name)
    }
  }
}

console.log(`\nestimated draw calls (mesh nodes × primitives): ${drawCalls}`)
console.log(`UV-set combinations found (TEXCOORD_n present per primitive):`)
for (const [key, count] of Object.entries(uvSetHistogram)) {
  console.log(`  ${key}: ${count} primitive(s)`)
}

if (missingLightmapUv.length) {
  console.log(
    `\n⚠ ${missingLightmapUv.length} mesh(es) missing TEXCOORD_${lightmapUvIndex} (expected lightmap UV):`
  )
  for (const n of [...new Set(missingLightmapUv)]) console.log(`  - ${n}`)
} else {
  console.log(`\n✓ every primitive has TEXCOORD_${lightmapUvIndex}.`)
}

// --- custom properties (extras) --- //

console.log(`\n--- extras (Blender custom properties) ---`)
let anyExtras = false
for (const node of nodes) {
  const extrasSources: [string, any][] = []
  if (node.extras) extrasSources.push(["node", node.extras])
  if (node.mesh !== undefined && meshes[node.mesh]?.extras) {
    extrasSources.push(["mesh", meshes[node.mesh].extras])
  }
  for (const [where, extras] of extrasSources) {
    const keys = Object.keys(extras)
    if (!keys.length) continue
    anyExtras = true
    const hasLightmapKey = keys.some((k) =>
      k.toLowerCase().includes("lightmap")
    )
    console.log(
      `  ${hasLightmapKey ? "★" : " "} ${node.name} [${where}.extras]: ${JSON.stringify(extras)}`
    )
  }
}
if (!anyExtras) {
  console.log(
    "  (none found — if you set a custom 'lightmap' property in Blender, check " +
      "the glTF export settings have 'Custom Properties' enabled under Data.)"
  )
}

// --- cross-check against what this codebase currently depends on --- //

console.log(`\n--- cross-check vs. code-referenced mesh/material names ---`)
const nodeNameSet = new Set(nodes.map((n) => n.name))
const materialNameSet = new Set(materials.map((m) => m.name))

const missingMeshes = [...manifestMeshNames].filter((n) => !nodeNameSet.has(n))
const foundMeshes = manifestMeshNames.size - missingMeshes.length
console.log(`mesh names: ${foundMeshes}/${manifestMeshNames.size} found`)
if (missingMeshes.length) {
  console.log(`  MISSING (renamed, merged away, or in a different file):`)
  for (const n of missingMeshes) console.log(`    - ${n}`)
}

const missingMaterials = [...manifestMaterialNames].filter(
  (n) => !materialNameSet.has(n)
)
console.log(
  `\nglassMaterials: ${manifestMaterialNames.size - missingMaterials.length}/${manifestMaterialNames.size} found`
)
if (missingMaterials.length) {
  console.log(`  MISSING:`)
  for (const n of missingMaterials) console.log(`    - ${n}`)
}

const morphSet = new Set<string>()
for (const node of nodes) {
  if (node.name === "SM_Controls" && node.mesh !== undefined) {
    // morph target names live in mesh.extras.targetNames per the glTF spec convention
    const targetNames: string[] = meshes[node.mesh]?.extras?.targetNames ?? []
    for (const t of targetNames) morphSet.add(t)
  }
}
if (morphSet.size) {
  const missingMorphs = HARDCODED_MORPH_NAMES.filter((n) => !morphSet.has(n))
  console.log(
    `\nSM_Controls morph targets: ${HARDCODED_MORPH_NAMES.length - missingMorphs.length}/${HARDCODED_MORPH_NAMES.length} found`
  )
  if (missingMorphs.length) {
    console.log(`  MISSING:`)
    for (const n of missingMorphs) console.log(`    - ${n}`)
  }
} else {
  console.log(
    `\nSM_Controls: not found in this file (skip morph check, or it lives in a different GLB).`
  )
}

console.log(
  `\n--- all mesh-node names in this file (${meshNodeNames.length}) ---`
)
for (const n of meshNodeNames.sort()) console.log(`  ${n}`)
