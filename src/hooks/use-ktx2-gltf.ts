import { useGLTF } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import type { GLTF } from "three/examples/jsm/Addons.js"
import type { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js"

import { getKTX2Loader } from "./use-ktx2-loader"

type KTX2Capable = { setKTX2Loader: (loader: KTX2Loader) => unknown }

export const useKTX2GLTF = <T extends GLTF>(
  path: string,
  draco?: string,
  useCaching = true
): T => {
  const { gl } = useThree()

  return useGLTF(path, draco, useCaching, (loader) => {
    ;(loader as unknown as KTX2Capable).setKTX2Loader(getKTX2Loader(gl))
  }) as unknown as T
}
