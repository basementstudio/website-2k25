import { fragmentOn } from "basehub"

const assetsFragment = fragmentOn("ThreeDInteractions", {
  map: {
    model: {
      file: {
        url: true
      }
    },
    lightmaps: {
      items: {
        _title: true,
        exr: {
          url: true
        }
      }
    }
  },
  inspectables: {
    inspectableList: {
      items: {
        _id: true,
        model: {
          file: {
            url: true
          }
        }
      }
    }
  }
})

interface Query {
  threeDInteractions: typeof assetsFragment
}

export const assetsQuery: Query = {
  threeDInteractions: assetsFragment
}
