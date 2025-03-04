import { fragmentOn } from "basehub"

import {
  arcadeFragment,
  characterFragment,
  inspectableFragment,
  lampFragment,
  mapFragment,
  // carFragment,
  modelsItemFragment,
  sceneFragment,
  sfxFragment
} from "./fragments"

const pagesFragment = fragmentOn("Pages", {
  inspectables: inspectableFragment
})

const assetsFragment = fragmentOn("ThreeDInteractions", {
  map: mapFragment,
  sfx: sfxFragment,
  basketball: modelsItemFragment,
  basketballNet: modelsItemFragment,
  contactPhone: modelsItemFragment,
  arcade: arcadeFragment,
  scenes: sceneFragment,
  // car: carFragment,
  characters: characterFragment,
  lamp: lampFragment
})

interface Query {
  pages: typeof pagesFragment
  threeDInteractions: typeof assetsFragment
}

export const assetsQuery: Query = {
  pages: pagesFragment,
  threeDInteractions: assetsFragment
}
