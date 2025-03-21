import { useGLTF } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { GLTF } from "three/examples/jsm/Addons.js"

type ExtendedGLTFLoader = {
  setKTX2Loader: (loader: any) => void
}

export function useKTX2GLTF<T extends GLTF>(
  path: string,
  draco?: string,
  useCaching = true,
  transcoderPath = "https://cdn.jsdelivr.net/gh/pmndrs/drei-assets/basis/" // instead of use the cdn transcoder, use a local one
): T {
  const { gl } = useThree()

  return useGLTF(path, draco, useCaching, (loader: ExtendedGLTFLoader) => {
    import("three/examples/jsm/loaders/KTX2Loader.js").then((module) => {
      const KTX2Loader = module.KTX2Loader
      const ktx2loader = new KTX2Loader()
      ktx2loader.setTranscoderPath(transcoderPath)
      ktx2loader.detectSupport(gl)
      loader.setKTX2Loader(ktx2loader)
    })
  }) as unknown as T
}
