import { fragmentOn } from "basehub"

export const modelsItemFragment = fragmentOn("ModelsItem", {
  file: {
    url: true
  }
})

export const mapFragment = fragmentOn("Map", {
  model: modelsItemFragment,
  office: modelsItemFragment,
  outdoor: modelsItemFragment,
  godrays: modelsItemFragment,
  routingElements: modelsItemFragment,
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
})

export const cameraStateFragment = fragmentOn("CameraStates", {
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
})

export const inspectableFragment = fragmentOn("Inspectables", {
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
})

export const sfxFragment = fragmentOn("Sfx", {
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
})

export const arcadeFragment = fragmentOn("Arcade", {
  idleScreen: {
    url: true
  }
})

export const sceneFragment = fragmentOn("Scenes", {
  scenes: {
    items: {
      _title: true,
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
      },
      tabs: {
        items: {
          _title: true,
          tabRoute: true,
          tabHoverName: true,
          tabClickableName: true,
          plusShapeScale: true
        }
      }
    }
  }
})
