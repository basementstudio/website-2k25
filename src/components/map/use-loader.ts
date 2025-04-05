import { Mesh } from "three"
import { GLTF } from "three/examples/jsm/Addons.js"

import { useAssets } from "@/components/assets-provider"
import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"

type GLTFResult = GLTF & {
  nodes: { [key: string]: Mesh }
}

export const useLoader = () => {
  const {
    officeItems: officeItemsUrl,
    office: officeUrl,
    outdoor: outdoorUrl,
    godrays: godraysUrl,
    basketballNet: basketballNetUrl,
    routingElements: routingElementsUrl,
    outdoorCars: outdoorCarsUrl
  } = useAssets()

  const { scene: office } = useKTX2GLTF<GLTFResult>(officeUrl)
  const { scene: officeItems } = useKTX2GLTF<GLTFResult>(officeItemsUrl)
  const { scene: outdoor } = useKTX2GLTF<GLTFResult>(outdoorUrl)
  const { scene: godrays } = useKTX2GLTF<GLTFResult>(godraysUrl)
  const { scene: outdoorCars } = useKTX2GLTF<GLTFResult>(outdoorCarsUrl)
  const { scene: basketballNet } = useKTX2GLTF<GLTFResult>(basketballNetUrl)
  const { scene: routingElements } = useKTX2GLTF<GLTFResult>(routingElementsUrl)

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
