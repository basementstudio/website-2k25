import { Mesh } from "three"
import { GLTF } from "three/examples/jsm/Addons.js"

import { useAssets } from "@/components/assets-provider/use-assets"
import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"

type GLTFResult = GLTF & {
  nodes: { [key: string]: Mesh }
}

export const useLoader = () => {
  const assets = useAssets()

  const { scene: office } = useKTX2GLTF<GLTFResult>(assets?.office ?? "")
  const { scene: officeItems } = useKTX2GLTF<GLTFResult>(
    assets?.officeItems ?? ""
  )
  const { scene: outdoor } = useKTX2GLTF<GLTFResult>(assets?.outdoor ?? "")
  const { scene: godrays } = useKTX2GLTF<GLTFResult>(assets?.godrays ?? "")
  const { scene: outdoorCars } = useKTX2GLTF<GLTFResult>(
    assets?.outdoorCars ?? ""
  )
  const { scene: basketballNet } = useKTX2GLTF<GLTFResult>(
    assets?.basketballNet ?? ""
  )
  const { scene: routingElements } = useKTX2GLTF<GLTFResult>(
    assets?.routingElements ?? ""
  )

  return {
    office,
    officeItems,
    outdoor,
    godrays,
    outdoorCars,
    basketballNet,
    routingElements
  }
}
