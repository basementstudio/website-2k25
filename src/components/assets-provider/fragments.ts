import { fragmentOn } from "basehub"

export const modelsItemFragment = fragmentOn("ModelsItem", {
  file: {
    url: true
  }
})

export const characterFragment = fragmentOn("Characters", {
  model: {
    file: {
      url: true
    }
  },
  textureBody: {
    url: true
  },
  textureFaces: {
    url: true
  }
})

export const mapFragment = fragmentOn("Map", {
  officeV2: modelsItemFragment,
  outdoor: modelsItemFragment,
  godrays: modelsItemFragment,
  routingElements: modelsItemFragment,
  bakes: {
    items: {
      _title: true,
      lightmap: {
        url: true
      },
      ambientOcclusion: {
        url: true
      },
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
      file: {
        url: true
      },
      isGlass: true
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
  },
  glassMaterials: {
    items: {
      _title: true
    }
  },
  doubleSideElements: {
    items: {
      _title: true
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
      scenes: {
        _title: true
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
  },
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
    }
  },
  ambience: {
    url: true
  },
  outdoorCarsPassingBy: {
    url: true
  }
})

export const arcadeFragment = fragmentOn("Arcade", {
  idleScreen: {
    url: true
  },
  placeholderLab: {
    url: true
  },
  boot: {
    url: true
  },
  chronicles: {
    url: true
  },
  looper: {
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
      },
      fogConfig: {
        fogColor: {
          r: true,
          g: true,
          b: true
        },
        fogDensity: true,
        fogDepth: true
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
  model: {
    file: {
      url: true
    }
  }
})

export const lampFragment = fragmentOn("LampComponent", {
  extraLightmap: {
    url: true
  }
})
