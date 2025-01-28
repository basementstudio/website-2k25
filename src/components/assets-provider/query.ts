import { fragmentOn } from "basehub"

import {
  arcadeFragment,
  cameraStateFragment,
  clickableFragment,
  inspectableFragment,
  mapFragment,
  modelsItemFragment,
  sfxFragment
} from "./fragments"

const assetsFragment = fragmentOn("ThreeDInteractions", {
  map: mapFragment,
  cameraStates: cameraStateFragment,
  clickables: clickableFragment,
  inspectables: inspectableFragment,
  sfx: sfxFragment,
  basketball: modelsItemFragment,
  basketballNet: modelsItemFragment,
  contactPhone: modelsItemFragment,
  arcade: arcadeFragment
})

interface Query {
  threeDInteractions: typeof assetsFragment
}

export const assetsQuery: Query = {
  threeDInteractions: assetsFragment
}
