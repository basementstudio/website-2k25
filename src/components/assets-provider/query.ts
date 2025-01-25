import { fragmentOn } from "basehub"

const assetsFragment = fragmentOn("ThreeDInteractions", {
  map: {
    model: {
      file: {
        url: true
      }
    },
    maps: {
      items: {
        _title: true,
        lightmap: {
          url: true
        },
        lightmapIntensity: true,
        ambientOcclusion: {
          url: true
        },
        ambientOcclusionIntensity: true
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
        },
        intensity: true
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
        targetScrollY: true
      }
    }
  },
  clickables: {
    clickables: {
      items: {
        _title: true,
        framePositionX: true,
        framePositionY: true,
        framePositionZ: true,
        frameRotationX: true,
        frameRotationY: true,
        frameRotationZ: true,
        frameSizeX: true,
        frameSizeY: true,
        hoverName: true,
        arrowPositionX: true,
        arrowPositionY: true,
        arrowPositionZ: true,
        arrowScale: true,
        arrowRotationX: true,
        arrowRotationY: true,
        arrowRotationZ: true,
        route: true
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
  },
  scenes: {
    scenes: {
      items: {
        _title: true,
        tabs: {
          items: {
            _title: true,
            tabRoute: true,
            tabHoverName: true,
            tabClickableName: true
          }
        },
        cameraConfig: {
          posX: true,
          posY: true,
          posZ: true,
          tarX: true,
          tarY: true,
          tarZ: true,
          fov: true,
          targetScrollY: true,
          offsetMultiplier: true
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
