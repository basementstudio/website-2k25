import { useThree } from "@react-three/fiber"
import type { Texture } from "three"

import { getKTX2Loader } from "./use-ktx2-gltf"

/**
 * Loads a standalone KTX2 texture (not embedded in a glTF) — e.g. a
 * lightmap baked to KTX2 (Basis UASTC HDR: ASTC 4x4 SFLOAT, transcoded by
 * three.js's KTX2Loader to BC6H or an uncompressed half-float texture on
 * devices without native ASTC-HDR support — see KTX2Loader's own
 * `detectSupport`/`_createTexture`, no bespoke fallback needed here).
 *
 * Deliberately NOT using r3f's `useLoader(KTX2Loader, url)` — that instantiates
 * a fresh loader (and transcoder worker pool) per call, which is exactly what
 * KTX2Loader's own docs warn against ("Use a single KTX2Loader instance").
 * Reuses the same shared/cached instance as useKTX2GLTF via getKTX2Loader,
 * through a small manual suspense cache (equivalent to what useLoader does
 * internally, just keyed to our shared loader instead of a fresh one).
 */
const cache = new Map<string, Texture | Promise<Texture>>()

export const useKTX2Texture = (url: string): Texture => {
  const { gl } = useThree()

  const cached = cache.get(url)
  if (cached && !(cached instanceof Promise)) return cached

  if (!cached) {
    const loader = getKTX2Loader(gl)
    const promise = (loader.loadAsync(url) as Promise<Texture>).then(
      (texture) => {
        cache.set(url, texture)
        return texture
      }
    )
    cache.set(url, promise)
    throw promise
  }

  throw cached
}
