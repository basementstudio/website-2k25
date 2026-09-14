import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { test } from "node:test"

import { ASSETS_BASE } from "../../src/lib/3d-config/asset-manifest"
import manifest from "../../src/lib/3d-config/scene-assets.json"

function read(url: string) {
  const bytes = readFileSync(`public${url}`)
  const length = bytes.readUInt32LE(12)
  return {
    bytes,
    json: JSON.parse(bytes.subarray(20, 20 + length).toString()),
    binary: bytes.subarray(28 + length)
  }
}
test("scene partitions preserve hierarchy, transforms, and compressed geometry bytes", () => {
  const original = read(ASSETS_BASE.officeItems)
  const names = new Set<string>()
  for (const group of Object.values(manifest)) {
    const partition = read(group.url)
    assert.ok(
      group.url.includes(
        createHash("sha256").update(partition.bytes).digest("hex").slice(0, 8)
      )
    )
    for (const node of partition.json.nodes) {
      assert.ok(!names.has(node.name), `Duplicated node: ${node.name}`)
      names.add(node.name)
      const source = original.json.nodes.find(
        (item: any) => item.name === node.name
      )
      assert.ok(source, `Unexpected node: ${node.name}`)
      for (const key of ["translation", "rotation", "scale", "matrix"])
        assert.deepEqual(node[key], source[key], `${node.name}.${key}`)
      assert.deepEqual(
        (node.children ?? []).map((i: number) => partition.json.nodes[i].name),
        (source.children ?? []).map((i: number) => original.json.nodes[i].name)
      )
      if (node.mesh === undefined) continue
      const primitives = partition.json.meshes[node.mesh].primitives
      for (let i = 0; i < primitives.length; i++) {
        const sourcePrimitive = original.json.meshes[source.mesh].primitives[i]
        const compressed = primitives[i].extensions?.KHR_draco_mesh_compression
        const pairs = compressed
          ? [
              [
                compressed.bufferView,
                sourcePrimitive.extensions.KHR_draco_mesh_compression.bufferView
              ]
            ]
          : Object.entries(primitives[i].attributes).map(([name, id]) => [
              partition.json.accessors[id as number].bufferView,
              original.json.accessors[sourcePrimitive.attributes[name]]
                .bufferView
            ])
        for (const [outputId, inputId] of pairs) {
          const outputView = partition.json.bufferViews[outputId]
          const inputView = original.json.bufferViews[inputId]
          assert.deepEqual(
            partition.binary.subarray(
              outputView.byteOffset ?? 0,
              (outputView.byteOffset ?? 0) + outputView.byteLength
            ),
            original.binary.subarray(
              inputView.byteOffset ?? 0,
              (inputView.byteOffset ?? 0) + inputView.byteLength
            )
          )
        }
      }
    }
  }
  assert.equal(names.size, original.json.nodes.length)
})
