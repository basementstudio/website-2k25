import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test, { before } from "node:test"
import { runInNewContext } from "node:vm"

import {
  BoxGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  Texture,
  Vector3
} from "three"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

import { ASSETS_BASE } from "@/lib/3d-config/asset-manifest"

import { createPumpkinExpression } from "./expression"

const sources = new Map<string, Group>()
before(async () => {
  // Use the shipped decoder in Node, without browser Workers. Textures are
  // stubbed below; geometry and every optimized morph target are real.
  const factory = runInNewContext(
    `${await readFile("public/draco/draco_decoder.js", "utf8")}\nDracoDecoderModule`,
    { console }
  )
  const decoderModule = await factory({})
  const draco = new DRACOLoader() as DRACOLoader & {
    decodeDracoFile: (
      buffer: ArrayBuffer,
      callback: (geometry: BufferGeometry) => void,
      attributes: Record<string, number>
    ) => void
  }
  draco.preload = () => draco
  draco.decodeDracoFile = (buffer, callback, attributes) => {
    const decoder = new decoderModule.Decoder()
    const input = new decoderModule.DecoderBuffer()
    const mesh = new decoderModule.Mesh()
    const values = new decoderModule.DracoFloat32Array()
    const face = new decoderModule.DracoInt32Array()
    try {
      input.Init(new Int8Array(buffer), buffer.byteLength)
      const status = decoder.DecodeBufferToMesh(input, mesh)
      assert.ok(status.ok(), status.error_msg())
      const geometry = new BufferGeometry()
      for (const [name, id] of Object.entries(attributes!)) {
        const attribute = decoder.GetAttributeByUniqueId(mesh, id)
        decoder.GetAttributeFloatForAllPoints(mesh, attribute, values)
        geometry.setAttribute(
          name,
          new Float32BufferAttribute(
            Float32Array.from(
              { length: mesh.num_points() * attribute.num_components() },
              (_, i) => values.GetValue(i)
            ),
            attribute.num_components()
          )
        )
      }
      const indices: number[] = []
      for (let i = 0; i < mesh.num_faces(); i++) {
        decoder.GetFaceFromMesh(mesh, i, face)
        indices.push(face.GetValue(0), face.GetValue(1), face.GetValue(2))
      }
      geometry.setIndex(indices)
      callback(geometry)
    } finally {
      for (const resource of [face, values, mesh, input, decoder])
        decoderModule.destroy(resource)
    }
  }
  await Promise.all(
    (["pumpkinC02", "pumpkinC03"] as const).map(async (variant) => {
      const loader = new GLTFLoader()
      loader.setDRACOLoader(draco)
      loader.register(() => ({
        name: "KHR_texture_basisu",
        loadTexture: async () => new Texture()
      }))
      const bytes = await readFile(
        `public${ASSETS_BASE.specialEvents.halloween[variant]}`
      )
      sources.set(
        variant,
        (await loader.parseAsync(Uint8Array.from(bytes).buffer, "")).scene
      )
    })
  )
})
const meshFrom = (group: Group) => {
  let mesh!: Mesh
  group.traverse((object) => {
    if (object instanceof Mesh) mesh = object
  })
  return mesh
}

for (const variant of ["pumpkinC02", "pumpkinC03"]) {
  test(`${variant}: the face chuckles independently while the body stays still`, () => {
    const source = sources.get(variant)!
    const cached = meshFrom(source)
    const originalWeights = cached.morphTargetInfluences!.slice()
    const first = meshFrom(source.clone(true))
    const second = meshFrom(source.clone(true))
    const expression = createPumpkinExpression(first)!
    createPumpkinExpression(second)
    assert.ok(expression)
    assert.ok(first.morphTargetInfluences!.every((weight) => weight === 0))
    assert.deepEqual(
      cached.morphTargetInfluences,
      originalWeights,
      "do not mutate the loader cache"
    )
    const restPosition = first.position.clone(),
      restRotation = first.quaternion.clone()
    const mouth = first.morphTargetDictionary!.Risa_Boca
    const smile = first.morphTargetDictionary!.Sonrisa
    let min = Infinity,
      max = -Infinity
    for (let frame = 0; frame < 180; frame++) {
      expression.update(1, 1 / 60, false)
      if (frame > 60) {
        min = Math.min(min, first.morphTargetInfluences![mouth])
        max = Math.max(max, first.morphTargetInfluences![mouth])
      }
      assert.ok(first.position.equals(restPosition))
      assert.ok(first.quaternion.equals(restRotation))
    }
    assert.ok(first.morphTargetInfluences![smile] > 0.8)
    assert.ok(max - min > 0.2, "the authored mouth should open and close")
    assert.ok(
      second.morphTargetInfluences!.every((weight) => weight === 0),
      "other C02 instances remain neutral"
    )
    const point = new Vector3(),
      rest = new Vector3()
    let maxMovement = 0
    for (let i = 0; i < first.geometry.attributes.position.count; i++) {
      first.getVertexPosition(i, point)
      rest.fromBufferAttribute(first.geometry.attributes.position, i)
      maxMovement = Math.max(maxMovement, point.distanceTo(rest))
    }
    assert.ok(maxMovement > 0.01, "the face must actually deform")
    for (let frame = 0; frame < 180; frame++)
      expression.update(0, 1 / 60, false)
    assert.ok(
      first.morphTargetInfluences!.every((weight) => weight < 0.001),
      "leave the face neutral after the pointer leaves"
    )
  })

  test(`${variant}: reduced motion uses a still expression and unrigged models stay static`, () => {
    const source = sources.get(variant)!
    const mesh = meshFrom(source.clone(true))
    const expression = createPumpkinExpression(mesh)!
    expression.update(1, 1 / 60, true)
    const pose = mesh.morphTargetInfluences!.slice()
    for (let frame = 0; frame < 120; frame++) expression.update(1, 1 / 60, true)
    assert.deepEqual(mesh.morphTargetInfluences, pose)
    expression.update(0, 1 / 60, true)
    assert.ok(mesh.morphTargetInfluences!.every((weight) => weight === 0))
    const geometry = new BoxGeometry()
    assert.equal(createPumpkinExpression(new Mesh(geometry)), null)
    geometry.dispose()
  })
}
