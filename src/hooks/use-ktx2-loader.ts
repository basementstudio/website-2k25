import { useThree } from "@react-three/fiber"
import { useMemo } from "react"
import type { Texture } from "three"
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js"
import type { WebGPURenderer } from "three/webgpu"

import { RendererKTX2Loader } from "@/lib/graphics/ktx2-loader"

// Served from public/, so it is fetched by URL and never resolved through
// node_modules — nothing makes it track the installed `three`. Keep the two in
// step with `pnpm basis:sync` (wired into `pnpm build`); `pnpm basis:check`
// asserts without writing.
//
// A mismatch here is invisible on a Mac: Apple GPUs expose the ASTC `hdr`
// profile, so KTX2Loader decodes the UASTC HDR lightmaps directly and never
// loads this transcoder. Windows has no ASTC and must transcode to BC6H, so a
// transcoder older than basis_universal 1.60 (no UASTC HDR) fails there and
// only there, as `THREE.KTX2Loader: .transcodeImage failed.`
const TRANSCODER_PATH = "/basis-transcoder/"

const loaders = new WeakMap<object, KTX2Loader>()
export const getKTX2Loader = (gl: WebGPURenderer): KTX2Loader => {
  let loader = loaders.get(gl)
  if (!loader) {
    loader = new RendererKTX2Loader()
      .setTranscoderPath(TRANSCODER_PATH)
      .setWorkerLimit(2)
    loader.detectSupport(gl)
    loaders.set(gl, loader)
  }
  return loader
}
export function disposeKTX2Loader(gl: WebGPURenderer) {
  loaders.get(gl)?.dispose()
  loaders.delete(gl)
  caches.get(gl)?.forEach((entry) => entry.texture?.dispose())
  caches.delete(gl)
}

interface Entry {
  promise: Promise<unknown>
  texture?: Texture
  error?: unknown
}

const caches = new WeakMap<object, Map<string, Entry>>()

export const useKTX2Textures = (urls: string[]): Texture[] => {
  const gl = useThree((state) => state.gl)
  const ktx2 = getKTX2Loader(gl as unknown as WebGPURenderer)
  let cache = caches.get(gl)
  if (!cache) {
    cache = new Map()
    caches.set(gl, cache)
  }

  const entries = urls.map((url) => {
    const existing = cache.get(url)
    if (existing) return existing

    const entry: Entry = { promise: Promise.resolve() }
    entry.promise = ktx2.loadAsync(url).then(
      (texture) => {
        if (loaders.get(gl) !== ktx2) {
          texture.dispose()
          entry.error = new Error("Texture resolved after renderer disposal")
          return
        }
        entry.texture = texture as Texture
      },
      (error) => {
        entry.error = error
      }
    )
    cache.set(url, entry)
    return entry
  })

  const pending = entries
    .filter((e) => !e.texture && !e.error)
    .map((e) => e.promise)
  if (pending.length > 0) throw Promise.all(pending)

  const failed = entries.find((e) => e.error)
  if (failed) throw failed.error

  // Stable resource identity prevents unrelated React renders from reattaching
  // bakes, invalidating textures, and preparing the same destination again.
  const textures = entries.map((e) => e.texture!)
  const urlsKey = JSON.stringify(urls)
  // The texture objects are renderer-owned and immutable for this cache entry.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => textures, [gl, urlsKey])
}
