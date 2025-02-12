import { fragmentOn } from "basehub"

import {
  arcadeFragment,
  cameraStateFragment,
  carFragment,
  characterFragment,
  fogStateFragment,
  inspectableFragment,
  mapFragment,
  modelsItemFragment,
  sceneFragment,
  sfxFragment
} from "./fragments"

const assetsFragment = fragmentOn("ThreeDInteractions", {
  map: mapFragment,
  cameraStates: cameraStateFragment,
  fogStates: fogStateFragment,
  inspectables: inspectableFragment,
  sfx: sfxFragment,
  basketball: modelsItemFragment,
  basketballNet: modelsItemFragment,
  contactPhone: modelsItemFragment,
  arcade: arcadeFragment,
  scenes: sceneFragment,
  car: carFragment,
  characters: characterFragment
})

interface Query {
  threeDInteractions: typeof assetsFragment
}

export const assetsQuery: Query = {
  threeDInteractions: assetsFragment
}
