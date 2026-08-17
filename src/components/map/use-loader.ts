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

  // Single array call: one suspension for all seven, so they download in
  // parallel. Ordered to match the destructuring below.
  const [
    office,
    officeItems,
    outdoor,
    godrays,
    outdoorCars,
    basketballNet,
    routingElements
  ] = useKTX2GLTF<GLTFResult>([
    officeUrl,
    officeItemsUrl,
    outdoorUrl,
    godraysUrl,
    outdoorCarsUrl,
    basketballNetUrl,
    routingElementsUrl
  ])

  return {
    office: office.scene,
    officeItems: officeItems.scene,
    outdoor: outdoor.scene,
    godrays: godrays.scene,
    outdoorCars: outdoorCars.scene,
    basketballNet: basketballNet.scene,
    routingElements: routingElements.scene
  }
}
