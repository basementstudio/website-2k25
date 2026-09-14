import { useLoader, useThree } from "@react-three/fiber"
import { LoadingManager } from "three"
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js"
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js"
import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import type { WebGPURenderer } from "three/webgpu"

import { disposeParsedAssets } from "@/lib/graphics/dispose-assets"

import { getKTX2Loader } from "./use-ktx2-loader"

const parsed = new WeakMap<object, Set<GLTF>>()
const requests = new WeakMap<object, Map<string, string | string[]>>()
const loaders = new WeakMap<object, GLTFLoader>()
export function useKTX2GLTF<T extends GLTF>(
  path: string,
  draco?: string,
  useCaching?: boolean
): T
export function useKTX2GLTF<T extends GLTF>(
  path: string[],
  draco?: string,
  useCaching?: boolean
): T[]
export function useKTX2GLTF<T extends GLTF>(
  path: string | string[],
  draco?: string
): T | T[] {
  const gl = useThree((s) => s.gl) as unknown as WebGPURenderer
  let loader = loaders.get(gl)
  if (!loader) {
    const manager = new LoadingManager()
    const decoder = new DRACOLoader(manager)
      .setDecoderPath(
        draco || "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
      )
      .setWorkerLimit(2)
    loader = new GLTFLoader(manager)
      .setKTX2Loader(getKTX2Loader(gl))
      .setDRACOLoader(decoder)
      .setMeshoptDecoder(MeshoptDecoder)
    loaders.set(gl, loader)
    requests.set(gl, new Map())
    parsed.set(gl, new Set())
    let disposed = false
    const load = loader.load.bind(loader)
    loader.load = (url, onLoad, onProgress, onError) =>
      load(
        url,
        (asset) => {
          // A download can finish after recovery unmounts its Suspense reader.
          if (disposed) disposeParsedAssets([asset])
          else parsed.get(gl)!.add(asset)
          onLoad(asset)
        },
        onProgress,
        onError
      )
    const dispose = gl.dispose.bind(gl)
    gl.dispose = () => {
      if (disposed) return
      disposed = true
      manager.abort()
      decoder.dispose()
      disposeParsedAssets(parsed.get(gl) ?? [])
      parsed.delete(gl)
      requests.get(gl)?.forEach((path) => useLoader.clear(loader!, path))
      requests.delete(gl)
      loaders.delete(gl)
      dispose()
    }
  }
  requests.get(gl)!.set(JSON.stringify(path), path)
  const result = useLoader(loader, path) as unknown as T | T[]
  return result
}
