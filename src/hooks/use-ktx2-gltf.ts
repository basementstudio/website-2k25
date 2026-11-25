import { useGLTF } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import type { GLTF } from "three/examples/jsm/Addons.js"
import type { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js"

import { getKTX2Loader } from "./use-ktx2-loader"

type KTX2Capable = { setKTX2Loader: (loader: KTX2Loader) => unknown }

// Self-hosted Draco decoder (synced from `three` by `pnpm basis:sync`).
// Without an explicit path DRACOLoader fetches from www.gstatic.com, which
// fails in Safari when blocked or on flaky networks.
export const DRACO_DECODER_PATH = "/draco/"

export function useKTX2GLTF<T extends GLTF>(
  path: string,
  draco?: string,
  useCaching?: boolean
): T
// An array is one `Promise.all`; separate calls suspend serially.
export function useKTX2GLTF<T extends GLTF>(
  paths: string[],
  draco?: string,
  useCaching?: boolean
): T[]
export function useKTX2GLTF<T extends GLTF>(
  path: string | string[],
  draco?: string,
  useCaching = true
): T | T[] {
  const { gl } = useThree()

  return useGLTF(path, draco ?? DRACO_DECODER_PATH, useCaching, (loader) => {
    ;(loader as unknown as KTX2Capable).setKTX2Loader(getKTX2Loader(gl))
  }) as unknown as T | T[]
}
