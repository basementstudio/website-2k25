import { useGLTF } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { GLTF } from "three/examples/jsm/Addons.js"

type ExtendedGLTFLoader = {
  setKTX2Loader: (loader: any) => void
}

let cachedKTX2Loader: any = null

/**
 * Shared KTX2Loader instance/transcoder, lazily created on first use.
 * KTX2Loader's own docs warn against instantiating more than one ("Use a
 * single KTX2Loader instance, or call .dispose() on old instances.") — this
 * is also reused directly (not via GLTFLoader) for standalone KTX2 textures
 * like lightmaps, see useKTX2Texture below.
 */
export const getKTX2Loader = (
  gl: any,
  transcoderPath = "/basis-transcoder/"
) => {
  if (!cachedKTX2Loader) {
    const ktx2LoaderModule = require("three/examples/jsm/loaders/KTX2Loader.js")
    const KTX2Loader = ktx2LoaderModule.KTX2Loader
    cachedKTX2Loader = new KTX2Loader()
    cachedKTX2Loader.setTranscoderPath(transcoderPath)
    cachedKTX2Loader.detectSupport(gl)
  }
  return cachedKTX2Loader
}

export const useKTX2GLTF = <T extends GLTF>(
  path: string,
  draco?: string,
  useCaching = true,
  transcoderPath = "/basis-transcoder/"
): T => {
  const { gl } = useThree()

  return useGLTF(path, draco, useCaching, (loader: ExtendedGLTFLoader) => {
    loader.setKTX2Loader(getKTX2Loader(gl, transcoderPath))
  }) as unknown as T
}
