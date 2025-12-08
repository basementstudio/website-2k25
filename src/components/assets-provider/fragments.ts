import { fragmentOn } from "basehub"

export const modelsItemFragment = fragmentOn("ModelsItem", {
  file: {
    url: true
  }
})

const urlFragment = { url: true }

const titleFragment = { _title: true }

export const characterFragment = fragmentOn("Characters", {
  model: modelsItemFragment,
  textureBody: urlFragment,
  textureFaces: urlFragment,
  textureArms: {
    url: true
  },
  petModel: {
    file: {
      url: true
    }
  },
  pureTexture: {
    url: true
  },
  bostonTexture: {
    url: true
  },
  textureComic: {
    url: true
  }
})

export const mapFragment = fragmentOn("Map", {
  office: modelsItemFragment,
  officeItems: modelsItemFragment,
  outdoor: modelsItemFragment,
  godrays: modelsItemFragment,
  routingElements: modelsItemFragment,
  wireframeModel: modelsItemFragment,
  bakes: {
    items: {
      _title: true,
      lightmap: urlFragment,
      ambientOcclusion: urlFragment,
      meshes: {
        items: {
          _title: true
        }
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
  matcaps: {
    items: {
      _title: true,
      file: urlFragment,
      isGlass: true
    }
  },
  videos: {
    items: {
      _title: true,
      file: urlFragment,
      intensity: true
    }
  },
  glassMaterials: {
    items: titleFragment
  },
  doubleSideElements: {
    items: titleFragment
  },
  textures: {
    rain: {
      url: true
    },
    basketballVa: {
      url: true
    }
  }
})

export const inspectableFragment = fragmentOn("Inspectables", {
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
      yOffset: true,
      xRotationOffset: true,
      sizeTarget: true,
      scenes: titleFragment,
      fx: urlFragment
    }
  }
})

export const sfxFragment = fragmentOn("Sfx", {
  basketballTheme: urlFragment,
  basketballSwoosh: urlFragment,
  basketballNet: urlFragment,
  basketballThump: urlFragment,
  basketballBuzzer: urlFragment,
  basketballStreak: urlFragment,
  knobTurning: urlFragment,
  antenna: urlFragment,

  blog: {
    lockedDoor: {
      items: {
        sound: {
          url: true
        }
      }
    },
    door: {
      items: {
        open: {
          url: true
        },
        close: {
          url: true
        }
      }
    },
    lamp: {
      items: {
        pull: {
          url: true
        },
        release: {
          url: true
        }
      }
    }
  },
  arcade: {
    buttons: {
      items: {
        press: {
          url: true
        },
        release: {
          url: true
        }
      }
    },
    sticks: {
      items: {
        press: {
          url: true
        },
        release: {
          url: true
        }
      }
    },
    miamiHeatwave: {
      url: true
    }
  },
  music: {
    aqua: {
      url: true
    },
    rain: {
      url: true
    },
    tiger: {
      url: true
    },
    vhs: {
      url: true
    }
  },
  contact: {
    interference: {
      url: true
    }
  }
})

export const arcadeFragment = fragmentOn("Arcade", {
  idleScreen: urlFragment,
  placeholderLab: urlFragment,
  boot: urlFragment,
  chronicles: urlFragment,
  looper: urlFragment,
  palm: urlFragment,
  sky: urlFragment,
  cityscape: urlFragment,
  introScreen: {
    url: true
  }
})

export const specialEventsFragment = fragmentOn("SpecialEvents", {
  christmas: {
    tree: modelsItemFragment,
    ballMatcap: urlFragment,
    song: urlFragment
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
      },
      postprocessing: {
        contrast: true,
        brightness: true,
        exposure: true,
        gamma: true,
        vignetteRadius: true,
        vignetteSpread: true,
        bloomStrength: true,
        bloomRadius: true,
        bloomThreshold: true
      }
    }
  }
})

export const carFragment = fragmentOn("OutdoorCars", {
  model: modelsItemFragment
})

export const lampFragment = fragmentOn("LampComponent", {
  extraLightmap: urlFragment
})

export const physicsParamsFragment = fragmentOn("PhysicsParams", {
  items: {
    _title: true,
    value: true
  }
})
