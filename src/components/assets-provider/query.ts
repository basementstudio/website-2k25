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
    },
    glassReflexes: {
      items: {
        _title: true,
        file: {
          url: true
        }
      }
    },
    videos: {
      items: {
        _title: true,
        file: {
          url: true
        }
      }
    }
  },
  arcade: {
    idleScreen: {
      url: true
    }
  },
  basketball: {
    file: {
      url: true
    }
  },
  basketballNet: {
    file: {
      url: true
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
  },
  cameraStates: {
    _title: true,
    cameraStates: {
      items: {
        _title: true,
        fov: true,
        posX: true,
        posY: true,
        posZ: true,
        tarX: true,
        tarY: true,
        tarZ: true,
        offsetMultiplier: true,
        scrollYMin: true
      }
    }
  },
  sfx: {
    basketballTheme: {
      url: true
    },
    basketballSwoosh: {
      url: true
    },
    basketballNet: {
      url: true
    },
    basketballThump: {
      url: true
    },
    basketballBuzzer: {
      url: true
    }
  }
})

interface Query {
  threeDInteractions: typeof assetsFragment
}

export const assetsQuery: Query = {
  threeDInteractions: assetsFragment
}
