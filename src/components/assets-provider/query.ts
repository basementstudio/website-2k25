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

const pagesFragment = fragmentOn("Pages", {
  inspectables: {
    inspectableList: {
      items: {
        _id: true,
        mesh: true
      }
    }
  }
})

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
  pages: typeof pagesFragment
  threeDInteractions: typeof assetsFragment
}

export const assetsQuery: Query = {
  pages: pagesFragment,
  threeDInteractions: assetsFragment
}
