import assert from "node:assert/strict"
import { test } from "node:test"

import {
  BoxGeometry,
  DepthTexture,
  FloatType,
  Mesh,
  MeshBasicMaterial,
  Texture
} from "three"

import { PreparationQueue } from "../../src/lib/graphics/preparation-queue"
import {
  preparationSignature,
  prepareSceneIncrementally,
  registerSceneTarget
} from "../../src/lib/graphics/preparation"
import { PerspectiveCamera, RenderTarget, Scene } from "three"
import type { WebGPURenderer } from "three/webgpu"

const live = () => false
const normal = () => 1

test("renderer activity stops when pending preparation is disposed", async () => {
  const activity: boolean[] = []
  const queue = new PreparationQueue((active) => activity.push(active))
  let finish!: () => void
  const request = queue.enqueue(
    {},
    "main",
    "v1",
    () => new Promise<void>((resolve) => (finish = resolve)),
    live,
    normal
  )
  await Promise.resolve()
  assert.deepEqual(activity, [true])
  queue.dispose()
  assert.deepEqual(activity, [true, false])
  finish()
  await request
  assert.deepEqual(activity, [true, false])
})

test("overlapping requests share work, successful work is reused, resource changes reprepare", async () => {
  const queue = new PreparationQueue(),
    mesh = {}
  let calls = 0
  const run = async () => {
    calls++
  }
  await Promise.all([
    queue.enqueue(mesh, "main", "v1", run, live, normal),
    queue.enqueue(mesh, "main", "v1", run, live, normal)
  ])
  await queue.enqueue(mesh, "main", "v1", run, live, normal)
  assert.equal(calls, 1)
  await queue.enqueue(mesh, "cctv", "v1", run, live, normal)
  await queue.enqueue(mesh, "main", "v2", run, live, normal)
  assert.equal(calls, 3)
  queue.dispose()
  await queue.enqueue(mesh, "main", "v3", run, live, normal)
  assert.equal(calls, 3)
})

test("navigation overtakes idle work and canceling one consumer does not cancel another", async () => {
  const queue = new PreparationQueue(),
    order: string[] = [],
    key = {}
  let canceled = false
  const first = queue.enqueue(
    key,
    "main",
    "v1",
    async () => {
      order.push("shared")
    },
    () => canceled,
    () => 0
  )
  const second = queue.enqueue(
    key,
    "main",
    "v1",
    async () => {
      throw Error("duplicate")
    },
    live,
    () => 2
  )
  const idle = queue.enqueue(
    {},
    "main",
    "v1",
    async () => {
      order.push("idle")
    },
    live,
    () => 0
  )
  const abandoned = queue.enqueue(
    {},
    "main",
    "v1",
    async () => {
      order.push("abandoned")
    },
    () => canceled,
    normal
  )
  canceled = true
  await Promise.all([first, second, idle, abandoned])
  assert.deepEqual(order, ["shared", "idle"])
})

test("a failed preparation can retry without poisoning the cache", async () => {
  const queue = new PreparationQueue(),
    key = {}
  await assert.rejects(
    queue.enqueue(
      key,
      "main",
      "v1",
      async () => {
        throw Error("pipeline")
      },
      live,
      normal
    )
  )
  let retried = false
  await queue.enqueue(
    key,
    "main",
    "v1",
    async () => {
      retried = true
    },
    live,
    normal
  )
  assert.ok(retried)
})

test(
  "an aborted host scheduling task cannot strand queued preparation",
  { timeout: 1000 },
  async () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "scheduler")
    let yields = 0
    Object.defineProperty(globalThis, "scheduler", {
      configurable: true,
      value: {
        yield: () => {
          yields++
          return Promise.reject(new Error("Host task aborted"))
        }
      }
    })
    try {
      const queue = new PreparationQueue(),
        completed: number[] = []
      await Promise.all([
        queue.enqueue(
          {},
          "main",
          "v1",
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 8))
            completed.push(1)
          },
          live,
          normal
        ),
        queue.enqueue(
          {},
          "main",
          "v1",
          async () => {
            completed.push(2)
          },
          live,
          normal
        )
      ])
      assert.ok(yields > 0)
      assert.deepEqual(completed, [1, 2])
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "scheduler", descriptor)
      else delete (globalThis as { scheduler?: unknown }).scheduler
    }
  }
)

test("actual preparation skips unchanged meshes but respects bindings, geometry, pass and device changes", async () => {
  let compiled = 0,
    uploads = 0
  const renderer = {
    getRenderTarget: () => null,
    setRenderTarget: () => {},
    outputColorSpace: "srgb",
    coordinateSystem: 2000,
    compileAsync: async () => {
      compiled++
    },
    initTexture: () => {
      uploads++
    },
    dispose: () => {}
  } as unknown as WebGPURenderer
  const scene = new Scene(),
    target = new RenderTarget(),
    camera = new PerspectiveCamera()
  const texture = new Texture({ width: 1, height: 1 } as HTMLImageElement)
  const material = new MeshBasicMaterial({ map: texture })
  const mesh = new Mesh(new BoxGeometry(), material)
  scene.add(mesh)
  registerSceneTarget(renderer, target, scene)
  await prepareSceneIncrementally(renderer, scene, camera, live)
  await prepareSceneIncrementally(renderer, scene, camera, live)
  assert.equal(compiled, 1)
  assert.equal(uploads, 1)
  const first = preparationSignature(mesh)
  texture.needsUpdate = true
  assert.notEqual(first, preparationSignature(mesh))
  await prepareSceneIncrementally(renderer, scene, camera, live)
  assert.equal(uploads, 2)
  material.map = texture.clone()
  await prepareSceneIncrementally(renderer, scene, camera, live)
  mesh.geometry.attributes.position.needsUpdate = true
  await prepareSceneIncrementally(renderer, scene, camera, live)
  material.needsUpdate = true
  await prepareSceneIncrementally(renderer, scene, camera, live)
  target.samples = 4
  await prepareSceneIncrementally(renderer, scene, camera, live)
  assert.equal(compiled, 6)
  target.depthTexture = new DepthTexture(1, 1)
  await prepareSceneIncrementally(renderer, scene, camera, live)
  target.depthTexture.type = FloatType
  await prepareSceneIncrementally(renderer, scene, camera, live)
  renderer.samples = 4
  await prepareSceneIncrementally(renderer, scene, camera, live)
  assert.equal(compiled, 9)
  assert.equal(mesh.frustumCulled, true)
  renderer.dispose()
  const fresh = { ...renderer, dispose: () => {} } as WebGPURenderer
  registerSceneTarget(fresh, target, scene)
  await prepareSceneIncrementally(fresh, scene, camera, live)
  assert.equal(compiled, 10)
})
