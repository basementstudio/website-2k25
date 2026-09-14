/** Lossless static GLB partitioning: copies compressed buffer views verbatim. */
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"

import {
  ASSETS_BASE,
  INSPECTABLES_META
} from "../../src/lib/3d-config/asset-manifest"

const input = readFileSync(`public${ASSETS_BASE.officeItems}`)
const jsonLength = input.readUInt32LE(12)
const source = JSON.parse(input.subarray(20, 20 + jsonLength).toString())
const binary = input.subarray(28 + jsonLength)
if (source.skins?.length || source.animations?.length)
  throw new Error("Partition only static scenes")
const roots: number[] = source.scenes[source.scene ?? 0].nodes
const groups = new Map<string, number[]>()
for (const root of roots) {
  const name = source.nodes[root].name
  const meta = INSPECTABLES_META.find((item) => item.mesh === name)
  const key = meta?.scenes[0] ?? "shared"
  groups.set(key, [...(groups.get(key) ?? []), root])
}
const manifest: Record<string, { url: string; meshes: string[] }> = {}
for (const [group, selectedRoots] of groups) {
  const result: any = {
    asset: source.asset,
    scene: 0,
    scenes: [{ name: group, nodes: [] }],
    extensionsUsed: source.extensionsUsed,
    extensionsRequired: source.extensionsRequired
  }
  const maps = new Map<string, Map<number, number>>()
  const views: number[] = []
  function copy(kind: string, id: number): number {
    let mapping = maps.get(kind)
    if (!mapping) {
      mapping = new Map()
      maps.set(kind, mapping)
      result[kind] = []
    }
    if (mapping.has(id)) return mapping.get(id)!
    const index = result[kind].length
    mapping.set(id, index)
    const entry = structuredClone(source[kind][id])
    result[kind].push(entry)
    if (kind === "nodes") {
      if (entry.mesh !== undefined) entry.mesh = copy("meshes", entry.mesh)
      if (entry.children)
        entry.children = entry.children.map((n: number) => copy("nodes", n))
    } else if (kind === "meshes") {
      for (const p of entry.primitives) {
        if (p.material !== undefined) p.material = copy("materials", p.material)
        if (p.indices !== undefined) p.indices = copy("accessors", p.indices)
        for (const k of Object.keys(p.attributes))
          p.attributes[k] = copy("accessors", p.attributes[k])
        for (const target of p.targets ?? [])
          for (const k of Object.keys(target))
            target[k] = copy("accessors", target[k])
        const draco = p.extensions?.KHR_draco_mesh_compression
        if (draco) draco.bufferView = copy("bufferViews", draco.bufferView)
      }
    } else if (kind === "accessors") {
      if (entry.bufferView !== undefined)
        entry.bufferView = copy("bufferViews", entry.bufferView)
      if (entry.sparse)
        for (const part of [entry.sparse.indices, entry.sparse.values])
          part.bufferView = copy("bufferViews", part.bufferView)
    } else if (kind === "materials") {
      const visit = (object: any) => {
        for (const [key, value] of Object.entries(object)) {
          if (!value || typeof value !== "object") continue
          if (key.endsWith("Texture") && "index" in value)
            value.index = copy("textures", value.index as number)
          else visit(value)
        }
      }
      visit(entry)
    } else if (kind === "textures") {
      if (entry.source !== undefined)
        entry.source = copy("images", entry.source)
      if (entry.sampler !== undefined)
        entry.sampler = copy("samplers", entry.sampler)
      for (const extension of Object.values(entry.extensions ?? {}) as any[])
        if (extension.source !== undefined)
          extension.source = copy("images", extension.source)
    } else if (kind === "images") {
      if (entry.bufferView !== undefined)
        entry.bufferView = copy("bufferViews", entry.bufferView)
    } else if (kind === "bufferViews") {
      if (entry.extensions)
        throw new Error(
          "Unsupported compressed buffer view; extend the partitioner first"
        )
      views[index] = id
    }
    return index
  }
  result.scenes[0].nodes = selectedRoots.map((root) => copy("nodes", root))
  const chunks: Buffer[] = []
  let offset = 0
  for (let i = 0; i < views.length; i++) {
    const original = source.bufferViews[views[i]]
    const bytes = binary.subarray(
      original.byteOffset ?? 0,
      (original.byteOffset ?? 0) + original.byteLength
    )
    result.bufferViews[i].byteOffset = offset
    result.bufferViews[i].buffer = 0
    chunks.push(bytes, Buffer.alloc((4 - (bytes.length % 4)) % 4))
    offset += (bytes.length + 3) & ~3
  }
  result.buffers = [{ byteLength: offset }]
  const raw = Buffer.from(JSON.stringify(result))
  const json = Buffer.concat([
    raw,
    Buffer.alloc((4 - (raw.length % 4)) % 4, 32)
  ])
  const header = Buffer.alloc(20)
  header.writeUInt32LE(0x46546c67, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(28 + json.length + offset, 8)
  header.writeUInt32LE(json.length, 12)
  header.writeUInt32LE(0x4e4f534a, 16)
  const binHeader = Buffer.alloc(8)
  binHeader.writeUInt32LE(offset, 0)
  binHeader.writeUInt32LE(0x004e4942, 4)
  const output = Buffer.concat([header, json, binHeader, ...chunks])
  const hash = createHash("sha256").update(output).digest("hex").slice(0, 8)
  const url = `/3d/models/items-${group}-${hash}.glb`
  writeFileSync(`public${url}`, output)
  manifest[group] = {
    url,
    meshes: result.nodes.map((node: any) => node.name).filter(Boolean)
  }
  console.log(group, output.length)
}
writeFileSync(
  "src/lib/3d-config/scene-assets.json",
  JSON.stringify(manifest, null, 2) + "\n"
)
