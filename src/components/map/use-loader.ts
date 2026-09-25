import { Mesh } from "three"
import { GLTF } from "three/examples/jsm/Addons.js"

import { useAssets } from "@/components/assets-provider"
import { useKTX2GLTF } from "@/hooks/use-ktx2-gltf"

type GLTFResult = GLTF & {
  nodes: { [key: string]: Mesh }
}

// office/officeItems/outdoor/outdoorCars/routingElements are Draco-compressed
// (godrays/basketballNet aren't, but passing this is harmless for them — the
// decoder is only invoked if a mesh actually carries the extension). Without
// an explicit path, drei's useGLTF still enables Draco by default, but
// fetches the decoder from Google's CDN (gstatic.com) — self-hosting it here
// matches the existing self-hosted basis-transcoder (KTX2) pattern and
// drops an unnecessary third-party runtime dependency.
const DRACO_DECODER_PATH = "/draco/"

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

  const [
    office,
    officeItems,
    outdoor,
    godrays,
    outdoorCars,
    basketballNet,
    routingElements
  ] = useKTX2GLTF<GLTFResult>(
    [
      officeUrl,
      officeItemsUrl,
      outdoorUrl,
      godraysUrl,
      outdoorCarsUrl,
      basketballNetUrl,
      routingElementsUrl
    ],
    DRACO_DECODER_PATH
  )

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
