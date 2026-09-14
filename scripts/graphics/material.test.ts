import assert from "node:assert/strict"
import { test } from "node:test"

import { DataTexture, Matrix3, MeshStandardMaterial, Vector2 } from "three"
import { uv } from "three/tsl"

import {
  bindUniform,
  type MaterialControls
} from "../../src/lib/graphics/material"
import { createGlobalShaderMaterial } from "../../src/shaders/material-global-shader"

test("late texture assignments are visible during compilation and after target swaps", () => {
  const controls: MaterialControls = { map: { value: null } }
  const node: any = bindUniform(controls, "map", "texture")
  const sample = node.sample(uv())
  const first = new DataTexture(),
    second = new DataTexture()
  controls.map.value = first
  assert.equal(node.value, first)
  assert.equal(sample.value, first)
  controls.map.value = second
  assert.equal(sample.value, second)
  first.dispose()
  second.dispose()
})

test("explicit UV sampling does not apply atlas transforms a second time", () => {
  const map = new DataTexture()
  map.repeat.set(1 / 8, 1 / 8)
  map.updateMatrix()
  const node: any = bindUniform({ map: { value: map } }, "map", "texture")
  assert.equal(node.updateMatrix, false)
  assert.equal(node.sample(uv()).updateMatrix, false)
  map.dispose()
})

test("animation control arrays normalize to native vectors and matrices", () => {
  const controls = {
    offset: { value: [0.25, 0.5] as unknown },
    matrix: { value: null as unknown }
  }
  bindUniform(controls, "offset", "vec2")
  bindUniform(controls, "matrix", "mat3")
  assert.ok(controls.offset.value instanceof Vector2)
  assert.deepEqual(controls.offset.value.toArray(), [0.25, 0.5])
  assert.ok(controls.matrix.value instanceof Matrix3)
})

test("material programs retain distinct node graph cache keys", () => {
  const a = createGlobalShaderMaterial(new MeshStandardMaterial(), {
    GLASS: true
  })
  const b = createGlobalShaderMaterial(new MeshStandardMaterial(), {
    GLASS: false
  })
  assert.notEqual(a.customProgramCacheKey(), b.customProgramCacheKey())
  a.dispose()
  b.dispose()
})
