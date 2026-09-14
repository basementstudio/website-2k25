import * as Sentry from "@sentry/nextjs"
import { NoToneMapping, SRGBColorSpace } from "three"
import { Node, WebGPURenderer } from "three/webgpu"

import { disposeKTX2Loader } from "@/hooks/use-ktx2-loader"

import { recordGraphicsTiming } from "./telemetry"

if (process.env.NODE_ENV !== "production")
  (Node as any).captureStackTrace = true

export type GraphicsBackend = "webgpu" | "webgl2"
export type RendererOptions = ConstructorParameters<typeof WebGPURenderer>[0]
// The release gate is deliberate: enable auto only after hardware validation.
export const preferredBackend =
  process.env.NEXT_PUBLIC_GRAPHICS_BACKEND === "auto" ? "auto" : "webgl2"

export async function createSiteRenderer(
  options: RendererOptions,
  onFailure: (error: Error) => void,
  forceWebGL = false
) {
  const started = performance.now()
  const renderer = new WebGPURenderer({
    ...options,
    antialias: false,
    alpha: options?.alpha ?? false,
    forceWebGL:
      forceWebGL ||
      preferredBackend === "webgl2" ||
      (process.env.NEXT_PUBLIC_GRAPHICS_BENCHMARK === "1" &&
        new URLSearchParams(location.search).get("backend") === "webgl2")
  })
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NoToneMapping
  let disposed = false
  let reported = false
  const fail = (reason: unknown) => {
    if (disposed || reported) return
    reported = true
    const error = reason instanceof Error ? reason : new Error(String(reason))
    Sentry.captureException(error, { tags: { graphics: "renderer" } })
    onFailure(error)
  }
  const dispose = renderer.dispose.bind(renderer)
  renderer.dispose = () => {
    if (disposed) return
    disposed = true
    disposeKTX2Loader(renderer)
    dispose()
  }
  renderer.onDeviceLost = (info) =>
    fail(new Error(`Graphics device lost: ${info.message}`))
  renderer.onError = (info) =>
    fail(
      new Error(
        `Graphics renderer: ${typeof info === "string" ? info : (info as { message: string }).message}`
      )
    )
  try {
    await renderer.init()
    // Three ignores explicit device destruction. Treat destruction outside our
    // own disposal as a loss too; the guard above suppresses normal teardown.
    const device = (
      renderer.backend as unknown as {
        device?: { lost: Promise<{ message: string }> }
      }
    ).device
    device?.lost.then((info) =>
      fail(new Error(`Graphics device lost: ${info.message}`))
    )
    performance.measure("graphics:initialize", {
      start: started,
      end: performance.now()
    })
    const backend: GraphicsBackend = (
      renderer.backend as unknown as { isWebGPUBackend?: boolean }
    ).isWebGPUBackend
      ? "webgpu"
      : "webgl2"
    renderer.domElement.dataset.backend = backend
    recordGraphicsTiming("initialize", performance.now() - started, { backend })
    return renderer
  } catch (error) {
    renderer.dispose()
    // Report directly: the failed instance is already disposed.
    onFailure(error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}
