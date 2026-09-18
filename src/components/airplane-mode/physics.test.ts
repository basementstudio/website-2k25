import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import { BoxGeometry, Mesh, Vector3 } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

import { createFlightCollider, crossesGate, FLIGHT_GATES } from "./physics"

test("collisions retain world transforms and catch swept crossings", () => {
  const mesh = new Mesh(new BoxGeometry(2, 2, 2))
  mesh.position.set(5, 3, -10)
  const collider = createFlightCollider(mesh)
  assert.equal(
    collider.collides(new Vector3(5, 3, -10), new Vector3(5, 3, -10)),
    false
  )
  assert.equal(
    collider.collides(new Vector3(5, 3, -10), new Vector3(5.95, 3, -10)),
    true
  )
  assert.equal(
    collider.collides(new Vector3(3, 3, -10), new Vector3(5, 3, -10)),
    true
  )
  mesh.geometry.dispose()
})
test("gate detection handles fast passes and rejects misses", () => {
  assert.equal(
    crossesGate(new Vector3(0, 0, 2), new Vector3(0, 0, -2), new Vector3()),
    true
  )
  assert.equal(
    crossesGate(new Vector3(2, 0, 2), new Vector3(2, 0, -2), new Vector3()),
    false
  )
})
test("authored spawn and gate centers clear the actual office collider", async () => {
  const bytes = readFileSync("public/3d/models/airplane-collider-fd100c38.glb")
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    ""
  )
  const collider = createFlightCollider(gltf.scene)
  for (const position of [[5.833, 3.521, -9.477], ...FLIGHT_GATES]) {
    const point = new Vector3(...position)
    assert.equal(
      collider.collides(point, point),
      false,
      `blocked point: ${position}`
    )
  }
})
