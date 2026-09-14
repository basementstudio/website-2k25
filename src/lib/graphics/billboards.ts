import { InstancedBufferAttribute, InstancedMesh, PlaneGeometry } from "three"
import {
  cameraProjectionMatrix,
  instancedBufferAttribute,
  screenSize,
  vec2
} from "three/tsl"
import { SpriteNodeMaterial } from "three/webgpu"

export function createBillboards(positions: Float32Array, pixels: number) {
  const geometry = new PlaneGeometry(1, 1)
  const centers = instancedBufferAttribute<"vec3">(
    new InstancedBufferAttribute(positions, 3),
    "vec3"
  )
  const material = new SpriteNodeMaterial({
    transparent: true,
    depthWrite: false,
    sizeAttenuation: false
  })
  material.positionNode = centers
  material.scaleNode = vec2(pixels * 2).div(
    screenSize.y.mul((cameraProjectionMatrix as any).element(1).y)
  )
  const mesh = new InstancedMesh(geometry, material, positions.length / 3)
  mesh.frustumCulled = false
  return { mesh, material, centers }
}
