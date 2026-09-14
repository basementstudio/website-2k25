import {
  BufferAttribute,
  Camera,
  InterleavedBufferAttribute,
  LinearSRGBColorSpace,
  Mesh,
  Object3D,
  RenderTarget,
  Scene,
  Texture
} from "three"
import type { WebGPURenderer } from "three/webgpu"

import { SiteMaterial } from "./material"
import { PreparationQueue } from "./preparation-queue"
import { yieldToBrowser } from "./scheduling"

export { yieldToBrowser } from "./scheduling"

const queues = new WeakMap<WebGPURenderer, PreparationQueue>()
const uploaded = new WeakMap<WebGPURenderer, WeakMap<Texture, number>>()
function preparationQueue(renderer: WebGPURenderer) {
  let queue = queues.get(renderer)
  if (!queue) {
    const context = (renderer.backend as { isWebGLBackend?: boolean })
      ?.isWebGLBackend
      ? (renderer.getContext() as WebGL2RenderingContext)
      : null
    let submissionFrame = 0
    const submit = () => {
      context!.flush()
      submissionFrame = requestAnimationFrame(submit)
    }
    queue = new PreparationQueue((active) => {
      if (!context) return
      // A static/reduced-motion loader may not draw while programs link.
      // Submit pending WebGL commands without waiting for another rendered frame.
      // Keep this scoped to preparation; WebGPU submits its own command buffers.
      if (active) submissionFrame = requestAnimationFrame(submit)
      else cancelAnimationFrame(submissionFrame)
    })
    queues.set(renderer, queue)
    uploaded.set(renderer, new WeakMap())
    const dispose = renderer.dispose.bind(renderer)
    renderer.dispose = () => {
      queue!.dispose()
      queues.delete(renderer)
      uploaded.delete(renderer)
      dispose()
    }
  }
  return queue
}

export const preparationStats = (renderer: WebGPURenderer) =>
  queues.get(renderer)?.stats

const targets = new WeakMap<
  WebGPURenderer,
  { target: RenderTarget; scene: Scene }
>()
export function registerSceneTarget(
  renderer: WebGPURenderer,
  target: RenderTarget,
  scene: Scene
) {
  targets.set(renderer, { target, scene })
  return () => {
    targets.delete(renderer)
  }
}
/** Pipeline formats and multisampling must match the actual render pass. */
export function prepareScene(
  renderer: WebGPURenderer,
  object: Object3D,
  camera: Camera,
  target?: RenderTarget
) {
  const registration = targets.get(renderer)
  const previous = renderer.getRenderTarget()
  const output = renderer.outputColorSpace
  renderer.setRenderTarget(target ?? registration?.target ?? null)
  renderer.outputColorSpace = LinearSRGBColorSpace
  try {
    return renderer.compileAsync(object, camera, registration?.scene)
  } finally {
    renderer.setRenderTarget(previous)
    renderer.outputColorSpace = output
  }
}

const identities = new WeakMap<object, number>()
let nextIdentity = 0
const identity = (object: object | null | undefined) => {
  if (!object) return 0
  if (!identities.has(object)) identities.set(object, ++nextIdentity)
  return identities.get(object)!
}
const materialTextures = (material: Mesh["material"]) => {
  const textures = new Set<Texture>()
  for (const item of Array.isArray(material) ? material : [material]) {
    const values =
      item instanceof SiteMaterial
        ? Object.values(item.uniforms).map((uniform) => uniform.value)
        : Object.values(item)
    for (const value of values)
      if (value instanceof Texture) textures.add(value)
  }
  return [...textures]
}
const dynamicTexture = (texture: Texture) =>
  texture.isRenderTargetTexture ||
  !!(texture as Texture & { isVideoTexture?: boolean; isDataTexture?: boolean })
    .isVideoTexture ||
  !!(texture as Texture & { isDataTexture?: boolean }).isDataTexture

/** Uniform animation does not invalidate a program; resources and pipeline state do. */
export function preparationSignature(mesh: Mesh) {
  const geometry = mesh.geometry
  const attribute = (
    value: BufferAttribute | InterleavedBufferAttribute | null
  ) =>
    value
      ? [identity(value), "data" in value ? value.data.version : value.version]
      : null
  return JSON.stringify([
    identity(geometry),
    geometry.drawRange,
    geometry.groups,
    Object.entries(geometry.attributes).map(([name, value]) => [
      name,
      attribute(value)
    ]),
    attribute(geometry.index),
    Object.entries(geometry.morphAttributes).map(([name, values]) => [
      name,
      values?.map(attribute)
    ]),
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map(
      (material) => {
        const nodes = material as SiteMaterial
        return [
          identity(material),
          material.version,
          identity(nodes.fragmentNode),
          identity(nodes.vertexNode),
          material.side,
          material.transparent,
          material.blending,
          material.blendSrc,
          material.blendDst,
          material.blendEquation,
          material.depthTest,
          material.depthWrite,
          material.colorWrite,
          material.alphaTest,
          material.stencilWrite
        ]
      }
    ),
    materialTextures(mesh.material).map((texture) => [
      texture.id,
      dynamicTexture(texture) ? 0 : texture.version,
      texture.format,
      texture.type,
      texture.colorSpace,
      texture.minFilter,
      texture.magFilter,
      texture.wrapS,
      texture.wrapT,
      texture.anisotropy,
      texture.flipY,
      texture.generateMipmaps,
      (texture.image as { width?: number } | null)?.width,
      (texture.image as { height?: number } | null)?.height
    ])
  ])
}

export async function prepareSceneIncrementally(
  renderer: WebGPURenderer,
  object: Object3D,
  camera: Camera,
  canceled: () => boolean,
  target?: RenderTarget,
  priority: () => number = () => 1
) {
  const queue = preparationQueue(renderer)
  const versions = uploaded.get(renderer)!
  const output = target ?? targets.get(renderer)?.target
  const pass = JSON.stringify([
    identity(output),
    output?.samples,
    renderer.samples,
    output?.depthBuffer,
    output?.stencilBuffer,
    output?.depthTexture && [
      output.depthTexture.format,
      output.depthTexture.type
    ],
    output?.textures.map((texture) => [
      texture.format,
      texture.type,
      texture.colorSpace
    ]),
    identity(targets.get(renderer)?.scene),
    camera.type,
    camera.layers.mask,
    renderer.coordinateSystem
  ])
  object.updateWorldMatrix(true, true)
  const objects: Mesh[] = []
  object.traverseVisible((child) => {
    if ((child as Object3D & { geometry?: unknown }).geometry)
      objects.push(child as Mesh)
  })
  await Promise.all(
    objects.map((child) =>
      queue.enqueue(
        child,
        pass,
        preparationSignature(child),
        async () => {
          let lastYield = performance.now()
          for (const texture of materialTextures(child.material)) {
            if (queues.get(renderer) !== queue) return
            if (
              dynamicTexture(texture) ||
              !texture.image ||
              versions.get(texture) === texture.version
            )
              continue
            renderer.initTexture(texture)
            versions.set(texture, texture.version)
            if (performance.now() - lastYield > 6) {
              await yieldToBrowser()
              lastYield = performance.now()
            }
          }
          if (queues.get(renderer) !== queue) return
          // Keep camera-path coverage, including objects outside the destination frustum.
          const culled = child.frustumCulled
          child.frustumCulled = false
          let promise: Promise<unknown>
          try {
            promise = prepareScene(renderer, child, camera, target)
          } finally {
            child.frustumCulled = culled
          }
          await promise
        },
        canceled,
        priority
      )
    )
  )
}

export const registeredScene = (renderer: WebGPURenderer) =>
  targets.get(renderer)?.scene
