import { fragmentOn } from "basehub"

import {
  arcadeFragment,
  carFragment,
  carGameFragment,
  characterFragment,
  inspectableFragment,
  lampFragment,
  mapFragment,
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
  characters: characterFragment,
  carGame: carGameFragment,
  outdoorCars: carFragment,
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
