import { useMemo } from "react"
import { Group, Mesh } from "three"
import { GLTF } from "three/examples/jsm/Addons.js"

import { useAssets } from "@/components/assets-provider"
import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"

type GLTFResult = GLTF & {
  nodes: { [key: string]: Mesh }
}

export const useLoader = () => {
  const {
    office: officeUrl,
    outdoor: outdoorUrl,
    godrays: godraysUrl,
    basketballNet: basketballNetUrl,
    routingElements: routingElementsUrl,
    outdoorCars: outdoorCarsUrl
  } = useAssets()

  const [
    office,
    outdoor,
    godrays,
    outdoorCars,
    basketballNet,
    routingElements
  ] = useKTX2GLTF<GLTFResult>([
    officeUrl,
    outdoorUrl,
    godraysUrl,
    outdoorCarsUrl,
    basketballNetUrl,
    routingElementsUrl
  ])

  const officeItems = useMemo(() => new Group(), [])

  return {
    office: office.scene,
    officeItems,
    outdoor: outdoor.scene,
    godrays: godrays.scene,
    outdoorCars: outdoorCars.scene,
    basketballNet: basketballNet.scene,
    routingElements: routingElements.scene
  }
}
