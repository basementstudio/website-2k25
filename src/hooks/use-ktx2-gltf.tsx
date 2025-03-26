import { useGLTF } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { GLTF } from "three/examples/jsm/Addons.js"

type ExtendedGLTFLoader = {
  setKTX2Loader: (loader: any) => void
}

let cachedKTX2Loader: any = null

export function useKTX2GLTF<T extends GLTF>(
  path: string,
  draco?: string,
  useCaching = true,
  transcoderPath = "/basis-transcoder/"
): T {
  const { gl } = useThree()

  return useGLTF(path, draco, useCaching, (loader: ExtendedGLTFLoader) => {
    if (!cachedKTX2Loader) {
      const ktx2LoaderModule = require("three/examples/jsm/loaders/KTX2Loader.js")
      const KTX2Loader = ktx2LoaderModule.KTX2Loader
      cachedKTX2Loader = new KTX2Loader()
      cachedKTX2Loader.setTranscoderPath(transcoderPath)
      cachedKTX2Loader.detectSupport(gl)
    }

    loader.setKTX2Loader(cachedKTX2Loader)
  }) as unknown as T
}
