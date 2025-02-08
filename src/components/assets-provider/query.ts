import { fragmentOn } from "basehub"

import {
  arcadeFragment,
  cameraStateFragment,
  characterFragment,
  inspectableFragment,
  mapFragment,
  modelsItemFragment,
  sceneFragment,
  sfxFragment
} from "./fragments"

const assetsFragment = fragmentOn("ThreeDInteractions", {
  map: mapFragment,
  cameraStates: cameraStateFragment,
  inspectables: inspectableFragment,
  sfx: sfxFragment,
  basketball: modelsItemFragment,
  basketballNet: modelsItemFragment,
  contactPhone: modelsItemFragment,
  arcade: arcadeFragment,
  scenes: sceneFragment,
  characters: characterFragment
})

interface Query {
  threeDInteractions: typeof assetsFragment
}

export const assetsQuery: Query = {
  threeDInteractions: assetsFragment
}
