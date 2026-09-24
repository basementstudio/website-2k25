import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import { BoxGeometry, MathUtils, Mesh, Vector3 } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

import {
  autopilotSteer,
  createFlightCollider,
  createFlightPath,
  crossesGate,
  FLIGHT_GATES
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
const loadGlb = (path: string) => {
  const bytes = readFileSync(path)
  return new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    ""
  )
}
test("autopilot flies full laps of path.glb without hitting walls", async () => {
  const collider = createFlightCollider(
    (await loadGlb("public/3d/models/airplane-collider-fd100c38.glb")).scene
  )
  const path = createFlightPath(
    (await loadGlb("public/3d/models/airplane-path-2539e215.glb")).scene
  )
  assert.ok(path, "path.glb has a usable line loop")
  // Same flight model + pure pursuit as flight.tsx (free flight, no boost),
  // starting from the desk plane's launch point.
  const position = new Vector3(5.0033, 4.9441, -27.8685)
  const direction = new Vector3()
  const next = new Vector3()
  const dt = 1 / 60
  let yaw = 0,
    pitch = 0,
    verticalVelocity = 0,
    blocked = 0,
    progress = 0
  let sample = path.nearest(position)
  const lookahead = (1.3 / path.length) * path.points.length
  for (let frame = 0; frame < 60 * 60; frame++) {
    const previousSample = sample
    sample = path.nearest(position, sample)
    const step = sample - previousSample
    progress += Math.abs(step) > path.points.length / 2 ? 0 : step
    const { horizontal, vertical } = autopilotSteer(
      position,
      yaw,
      path.at(sample + lookahead)
    )
    yaw -= horizontal * 1.65 * dt
    pitch = MathUtils.damp(pitch, vertical * 0.72, 4, dt)
    verticalVelocity = Math.max(verticalVelocity - 1.35 * dt, -1.7)
    direction.set(
      -Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch) + verticalVelocity * 0.08,
      -Math.cos(yaw) * Math.cos(pitch)
    )
    next.copy(position).addScaledVector(direction, 1.8 * dt)
    if (collider.collides(position, next)) blocked++
    else position.copy(next)
  }
  assert.equal(blocked, 0, `blocked for ${blocked} frames`)
  // 60 s at 1.8 m/s ≈ 108 m, the loop is ~50 m: expect at least 1.5 laps.
  const laps = progress / path.points.length
  assert.ok(laps > 1.5, `only ${laps.toFixed(2)} laps`)
})
