import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import { BoxGeometry, Mesh, Vector3 } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

import {
  createFlightCollider,
  crossesGate,
  FLIGHT_GATES,
  wallDeflection
} from "./physics"

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
test("spring-arm sweep stops short of walls and passes when clear", () => {
  const mesh = new Mesh(new BoxGeometry(10, 10, 10))
  const collider = createFlightCollider(mesh)
  const center = new Vector3()
  // Wall at x = 5 from the inside; sphere of 0.1 stops 0.1 before it.
  const blocked = collider.sweepDistance(center, new Vector3(8, 0, 0), 0.1)
  assert.ok(Math.abs(blocked - 4.9) < 1e-6, `blocked at ${blocked}`)
  const clear = collider.sweepDistance(center, new Vector3(2, 0, 0), 0.1)
  assert.equal(clear, 2)
  mesh.geometry.dispose()
})
test("gate detection handles fast passes in both directions and rejects misses", () => {
  const center = new Vector3()
  const normal = new Vector3(0, 0, 1)
  assert.equal(
    crossesGate(new Vector3(0, 0, 2), new Vector3(0, 0, -2), center, normal),
    true
  )
  assert.equal(
    crossesGate(new Vector3(0, 0, -2), new Vector3(0, 0, 2), center, normal),
    true
  )
  assert.equal(
    crossesGate(new Vector3(2, 0, 2), new Vector3(2, 0, -2), center, normal),
    false
  )
})
test("gate detection rejects nearby skims, approaches, and stationary motion", () => {
  const center = new Vector3()
  const normal = new Vector3(0, 0, 1)
  for (const [from, to] of [
    [new Vector3(-1, 0, 0.1), new Vector3(1, 0, 0.1)],
    [new Vector3(0, 0, 1), new Vector3(0, 0, 0.1)],
    [new Vector3(-1, 0, 0), new Vector3(1, 0, 0)],
    [new Vector3(), new Vector3()]
  ]) {
    assert.equal(crossesGate(from, to, center, normal), false)
  }
})
test("gate detection uses the ring orientation and radius at the plane intersection", () => {
  const center = new Vector3(5, 3, -10)
  const normal = new Vector3(1, 0, 0)
  assert.equal(
    crossesGate(
      new Vector3(7, 3.4, -10),
      new Vector3(3, 3.4, -10),
      center,
      normal
    ),
    true
  )
  assert.equal(
    crossesGate(
      new Vector3(5.1, 3, -12),
      new Vector3(5.1, 3, -8),
      center,
      normal
    ),
    false
  )
  // The segment starts inside the old spherical trigger but crosses the
  // actual plane outside the opening.
  assert.equal(
    crossesGate(
      new Vector3(5.1, 3, -10),
      new Vector3(4.9, 5, -10),
      center,
      normal
    ),
    false
  )
})
test("gate detection counts arrival at the plane without counting departure again", () => {
  const center = new Vector3()
  const normal = new Vector3(0, 0, 1)
  assert.equal(crossesGate(new Vector3(0, 0, 1), center, center, normal), true)
  assert.equal(
    crossesGate(center, new Vector3(0, 0, -1), center, normal),
    false
  )
})
test("authored spawn and gate centers clear the actual office collider", async () => {
  const bytes = readFileSync("public/3d/models/airplane-collider-5b3ba7a4.glb")
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
test("wall hits deflect along the wall instead of mirroring", () => {
  const wall = new Vector3(0, 0, 1) // wall facing +Z, plane flying -Z
  const headOn = wallDeflection(new Vector3(0, 0, -1), wall, 1)
  assert.ok(headOn.severity > 0.99)
  // Turns roughly 110° (never the old ~180°) and ends up leaving the wall.
  const turned = Math.abs(headOn.yaw!)
  assert.ok(turned > 1.7 && turned < 2.2, `turned ${turned}`)
  assert.ok(Math.sign(headOn.yaw!) === 1, "breaks toward the bank side")
  assert.ok(
    Math.sign(wallDeflection(new Vector3(0, 0, -1), wall, -1).yaw!) === -1
  )
  // A graze keeps nearly the same heading.
  const graze = wallDeflection(new Vector3(1, 0, -0.1).normalize(), wall)
  assert.ok(graze.severity < 0.15)
  assert.ok(Math.abs(graze.yaw! - -Math.PI / 2) < 0.5, `graze yaw ${graze.yaw}`)
  // Floors don't touch the heading.
  assert.equal(
    wallDeflection(new Vector3(0, -1, -1), new Vector3(0, 1, 0)).yaw,
    null
  )
})
