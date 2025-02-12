import { fragmentOn } from "basehub"

import {
  arcadeFragment,
  carFragment,
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
        _title: true,
        mesh: true,
        specs: {
          items: {
            _id: true,
            _title: true,
            value: true
          }
        },
        description: {
          json: {
            content: true
          }
        },
        xOffset: true,
        sizeTarget: true
      }
    }
  }
})

const assetsFragment = fragmentOn("ThreeDInteractions", {
  map: mapFragment,
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
  pages: typeof pagesFragment
  threeDInteractions: typeof assetsFragment
}

export const assetsQuery: Query = {
  pages: pagesFragment,
  threeDInteractions: assetsFragment
}
