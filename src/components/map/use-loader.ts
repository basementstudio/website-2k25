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
// matches the existing self-hosted basis-transcoder (KTX2) pattern below and
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

  const { scene: office } = useKTX2GLTF<GLTFResult>(
    officeUrl,
    DRACO_DECODER_PATH
  )
  const { scene: officeItems } = useKTX2GLTF<GLTFResult>(
    officeItemsUrl,
    DRACO_DECODER_PATH
  )
  const { scene: outdoor } = useKTX2GLTF<GLTFResult>(
    outdoorUrl,
    DRACO_DECODER_PATH
  )
  const { scene: godrays } = useKTX2GLTF<GLTFResult>(
    godraysUrl,
    DRACO_DECODER_PATH
  )
  const { scene: outdoorCars } = useKTX2GLTF<GLTFResult>(
    outdoorCarsUrl,
    DRACO_DECODER_PATH
  )
  const { scene: basketballNet } = useKTX2GLTF<GLTFResult>(
    basketballNetUrl,
    DRACO_DECODER_PATH
  )
  const { scene: routingElements } = useKTX2GLTF<GLTFResult>(
    routingElementsUrl,
    DRACO_DECODER_PATH
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
