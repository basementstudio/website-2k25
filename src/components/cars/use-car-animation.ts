import { useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import type { SetStateAction } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  BufferAttribute,
  ClampToEdgeWrapping,
  DataTexture,
  FloatType,
  LinearFilter,
  Mesh,
  Object3D,
  RGBAFormat,
  ShaderMaterial,
  Vector3
} from "three"

import { easeInOutCubic } from "@/utils/animations"

export type CarVariant =
  | "DeLorean"
  | "Nissan"
  | "Mistery"
  | "Simpsons"
  | "Kitt"
  | "DeLoreanFly"

const TEXTURE_TO_MORPH: Record<string, CarVariant | null> = {
  "/textures/cars/dodge-o.png": null,
  "/textures/cars/delorean.png": "DeLorean",
  "/textures/cars/kitt.png": "Kitt",
  "/textures/cars/fnf.png": "Nissan",
  "/textures/cars/homer.png": "Simpsons",
  "/textures/cars/dodge-b.png": null,
  "/textures/cars/mistery.png": "Mistery"
}

interface CarState {
  isWaiting: boolean
  waitTimeout: NodeJS.Timeout | null
  isSoundPlaying: boolean
  currentSpeed: number
  isSlowingDown: boolean
  isSpeedingUp: boolean
  hasInitialized: boolean
  isFlying: boolean
}

const CONSTANTS = {
  BASE_SPEED: 0.175 / 1.25,
  START_X: -9,
  END_X: 9.5,
  MIN_WAIT_TIME: 8000,
  ADDED_WAIT_TIME: 6000,
  SPEED_REDUCTION: 0.7,
  SPEED_VARIATION: 0.5,
  FLIGHT_PROBABILITY: 0.25
}

const TOTAL_DISTANCE = CONSTANTS.END_X - CONSTANTS.START_X

const carState: CarState = {
  isWaiting: false,
  waitTimeout: null,
  isSoundPlaying: false,
  currentSpeed: CONSTANTS.BASE_SPEED,
  isSlowingDown: false,
  isSpeedingUp: false,
  hasInitialized: false,
  isFlying: false
}

const setRandomTimeout = () => {
  const waitTime =
    CONSTANTS.MIN_WAIT_TIME + Math.random() * CONSTANTS.ADDED_WAIT_TIME
  carState.isWaiting = true
  carState.isSoundPlaying = false

  if (carState.waitTimeout) clearTimeout(carState.waitTimeout)

  carState.waitTimeout = setTimeout(() => (carState.isWaiting = false), 1000)
}

const updateCarSpeed = () => {
  carState.currentSpeed = CONSTANTS.BASE_SPEED

  const behavior = Math.random()

  if (behavior < 0.9) {
    carState.isSlowingDown = true
    carState.isSpeedingUp = false
  } else if (behavior < 0.5) {
    carState.isSpeedingUp = true
    carState.isSlowingDown = false
    carState.currentSpeed *= CONSTANTS.SPEED_REDUCTION
  } else {
    carState.isSlowingDown = false
    carState.isSpeedingUp = false
  }
}

interface updateCarPositionProps {
  carPosition: Vector3
  progress: number
  setTextureIndex: (value: SetStateAction<number>) => void
  texturesLength: number
  carGroup: Object3D
}

interface CarConfig {
  texture: string
  morphTarget: CarVariant | null
  uvSource: "uv2" | "originalUV" | "uv3" | "texcoord_4" | "texcoord_5"
  probability: number
  canFly?: boolean
  wheelSize?: number
  frontWheelOffset?: number
  backWheelOffset?: number
}

const CAR_CONFIGS: Record<string, CarConfig> = {
  "dodge-orange": {
    texture: "/textures/cars/dodge-o.png",
    morphTarget: null,
    uvSource: "uv2",
    probability: 0.25,
    canFly: false,
    wheelSize: 1,
    frontWheelOffset: 0.2,
    backWheelOffset: 0
  },
  delorean: {
    texture: "/textures/cars/delorean.png",
    morphTarget: "DeLorean",
    uvSource: "uv2",
    probability: 0.1,
    canFly: true,
    wheelSize: 1.1,
    frontWheelOffset: 0.15,
    backWheelOffset: -0.05
  },
  kitt: {
    texture: "/textures/cars/kitt.png",
    morphTarget: "Kitt",
    uvSource: "texcoord_5",
    probability: 0.1,
    canFly: false,
    wheelSize: 1,
    frontWheelOffset: -0.12,
    backWheelOffset: 0
  },
  nissan: {
    texture: "/textures/cars/fnf.png",
    morphTarget: "Nissan",
    uvSource: "originalUV",
    probability: 0.1,
    canFly: false,
    wheelSize: 1,
    frontWheelOffset: 0,
    backWheelOffset: -0.02
  },
  homer: {
    texture: "/textures/cars/homer.png",
    morphTarget: "Simpsons",
    uvSource: "texcoord_4",
    probability: 0.1,
    canFly: false,
    wheelSize: 1,
    frontWheelOffset: 0.27,
    backWheelOffset: 0
  },
  "dodge-black": {
    texture: "/textures/cars/dodge-b.png",
    morphTarget: null,
    uvSource: "uv2",
    probability: 0.25,
    canFly: false,
    wheelSize: 1,
    frontWheelOffset: 0.25,
    backWheelOffset: 0
  },
  mistery: {
    texture: "/textures/cars/mistery.png",
    morphTarget: "Mistery",
    uvSource: "uv3",
    probability: 0.1,
    canFly: false,
    wheelSize: 1,
    frontWheelOffset: 0,
    backWheelOffset: 0
  }
}

const getRandomCarConfig = (): CarConfig => {
  const random = Math.random()
  let cumulativeProbability = 0

  for (const config of Object.values(CAR_CONFIGS)) {
    cumulativeProbability += config.probability
    if (random <= cumulativeProbability) {
      return config
    }
  }

  return Object.values(CAR_CONFIGS)[0]
}

const GRADIENT_SIZE = 16

const setupCarMorphAndUVs = (
  car: Mesh,
  mirroredCar: Mesh | undefined,
  config: CarConfig,
  originalUVRef: React.RefObject<Float32Array | null>
) => {
  if (!car.morphTargetDictionary || !car.morphTargetInfluences) return

  car.morphTargetInfluences.fill(0)
  if (mirroredCar?.morphTargetInfluences) {
    mirroredCar.morphTargetInfluences.fill(0)
  }

  const material = car.material as ShaderMaterial

  if (
    config.morphTarget &&
    car.morphTargetDictionary[config.morphTarget] !== undefined
  ) {
    const targetIndex = car.morphTargetDictionary[config.morphTarget]
    car.morphTargetInfluences[targetIndex] = 1

    if (mirroredCar?.morphTargetInfluences) {
      mirroredCar.morphTargetInfluences[targetIndex] = 1
    }

    if (material?.uniforms) {
      material.uniforms.activeMorphIndex.value = targetIndex
      material.uniforms.isUsingCorrectUV.value = 1.0
    }

    // fly away little delorean
    if (
      config.canFly &&
      config.morphTarget === "DeLorean" &&
      Math.random() < CONSTANTS.FLIGHT_PROBABILITY
    ) {
      const flyIndex = car.morphTargetDictionary["DeLoreanFly"]
      if (flyIndex !== undefined) {
        car.morphTargetInfluences[flyIndex] = 1
        if (mirroredCar?.morphTargetInfluences) {
          mirroredCar.morphTargetInfluences[flyIndex] = 1
        }
        carState.isFlying = true
        if (material?.uniforms) {
          material.uniforms.activeMorphIndex.value = flyIndex
        }
      }
    }
  } else {
    carState.isFlying = false
    if (material?.uniforms) {
      material.uniforms.activeMorphIndex.value = -1
      material.uniforms.isUsingCorrectUV.value = 0.0
    }
  }

  // very specific dont touchy
  const updateUVs = (mesh: Mesh) => {
    if (!mesh.geometry.attributes.uv) return

    let newUVs: ArrayLike<number> | undefined

    switch (config.uvSource) {
      case "uv2":
        newUVs = mesh.geometry.attributes.uv2?.array
        break
      case "originalUV":
        newUVs = originalUVRef.current || undefined
        break
      case "uv3":
        newUVs = mesh.geometry.attributes.uv3?.array
        break
      case "texcoord_4":
        newUVs = mesh.geometry.attributes.texcoord_4?.array
        break
      case "texcoord_5":
        newUVs = mesh.geometry.attributes.texcoord_5?.array
        break
    }

    if (newUVs) {
      if (newUVs.length !== mesh.geometry.attributes.uv.array.length) {
        const uvArray = new Float32Array(newUVs)
        mesh.geometry.setAttribute("uv", new BufferAttribute(uvArray, 2))
      } else {
        mesh.geometry.attributes.uv.array.set(newUVs)
      }
      mesh.geometry.attributes.uv.needsUpdate = true
    }
  }

  updateUVs(car)
  if (mirroredCar) {
    updateUVs(mirroredCar)
  }
}

const updateCarPosition = ({
  carPosition,
  progress,
  setTextureIndex,
  texturesLength,
  carGroup
}: updateCarPositionProps) => {
  if (carState.isSlowingDown) {
    const slowdownAmount = CONSTANTS.SPEED_VARIATION * easeInOutCubic(progress)
    carState.currentSpeed = CONSTANTS.BASE_SPEED * (1 - slowdownAmount)
  }

  if (carState.isSpeedingUp) {
    const speedupAmount = CONSTANTS.SPEED_VARIATION * easeInOutCubic(progress)
    carState.currentSpeed =
      CONSTANTS.BASE_SPEED * (CONSTANTS.SPEED_REDUCTION + speedupAmount)
  }

  carPosition.x += carState.currentSpeed

  if (carPosition.x > CONSTANTS.END_X) {
    carPosition.x = CONSTANTS.START_X
    updateCarSpeed()
    setRandomTimeout()

    const nextConfig = getRandomCarConfig()
    const nextTextureIndex = Object.values(CAR_CONFIGS).findIndex(
      (config) => config.texture === nextConfig.texture
    )
    setTextureIndex(nextTextureIndex)

    carGroup.visible = false
    carGroup.children.forEach((child) => {
      child.visible = false
    })
  }
}

const runFirstCarPass = (carPosition: Vector3, carGroup: Object3D) => {
  carState.hasInitialized = true
  carPosition.x = CONSTANTS.START_X
  carState.isWaiting = true
  setRandomTimeout()
  carGroup.visible = false
}

const animateCar = (
  car: Object3D,
  setTextureIndex: (value: SetStateAction<number>) => void,
  texturesLength: number
) => {
  const carPosition = car.position

  if (!carState.hasInitialized) {
    runFirstCarPass(carPosition, car)
    return
  }

  if (!carState.isWaiting && !car.visible) {
    car.visible = true
    car.children.forEach((child) => {
      child.visible = true
    })
  }

  if (!carState.isWaiting) {
    const progress = (carPosition.x - CONSTANTS.START_X) / TOTAL_DISTANCE
    updateCarPosition({
      carPosition,
      progress,
      setTextureIndex,
      texturesLength,
      carGroup: car
    })
  }
}

interface UseCarAnimationProps {
  car: Mesh | null
  frontWheel: Mesh | null
  backWheel: Mesh | null
}

export const useCarAnimation = ({
  car,
  frontWheel,
  backWheel
}: UseCarAnimationProps) => {
  const carGroupRef = useRef<Object3D | null>(null)
  const originalUVRef = useRef<Float32Array | null>(null)
  const [textureIndex, setTextureIndex] = useState(0)
  const flyingTime = useRef(0)
  const originalFrontWheelPos = useRef<Vector3 | null>(null)
  const originalBackWheelPos = useRef<Vector3 | null>(null)
  const originalFrontWheelScale = useRef<Vector3 | null>(null)
  const originalBackWheelScale = useRef<Vector3 | null>(null)

  const textures = useMemo(() => Object.keys(TEXTURE_TO_MORPH), [])

  const carTexture = useTexture(textures[textureIndex])

  useEffect(() => {
    if (frontWheel && !originalFrontWheelPos.current) {
      originalFrontWheelPos.current = frontWheel.position.clone()
      originalFrontWheelScale.current = frontWheel.scale.clone()
    }
    if (backWheel && !originalBackWheelPos.current) {
      originalBackWheelPos.current = backWheel.position.clone()
      originalBackWheelScale.current = backWheel.scale.clone()
    }
  }, [frontWheel, backWheel])

  useEffect(() => {
    if (!car?.morphTargetDictionary || !car?.morphTargetInfluences) return

    const currentConfig = Object.values(CAR_CONFIGS).find(
      (config) => config.texture === textures[textureIndex]
    )

    if (!currentConfig) return

    if (carGroupRef.current) {
      const mirroredCar = carGroupRef.current.children[1] as Mesh
      setupCarMorphAndUVs(car, mirroredCar, currentConfig, originalUVRef)

      if (
        frontWheel &&
        backWheel &&
        originalBackWheelPos.current &&
        originalFrontWheelPos.current &&
        originalFrontWheelScale.current &&
        originalBackWheelScale.current
      ) {
        backWheel.position.copy(originalBackWheelPos.current)
        frontWheel.position.copy(originalFrontWheelPos.current)
        frontWheel.position.x *= 1 + currentConfig.frontWheelOffset!
        backWheel.position.x *= 1 - currentConfig.backWheelOffset!

        frontWheel.scale.copy(originalFrontWheelScale.current)
        backWheel.scale.copy(originalBackWheelScale.current)
        frontWheel.scale.multiplyScalar(currentConfig.wheelSize!)
        backWheel.scale.multiplyScalar(currentConfig.wheelSize!)
      }
    }
  }, [car, textureIndex, textures, frontWheel, backWheel])

  useFrame((_, delta) => {
    const flyIndex = car?.morphTargetDictionary?.["DeLoreanFly"]
    if (
      carGroupRef.current &&
      carState.isFlying &&
      typeof flyIndex === "number" &&
      car?.morphTargetInfluences?.[flyIndex] === 1
    ) {
      flyingTime.current += delta
      carGroupRef.current.position.y =
        Math.sin(flyingTime.current * 2) * 0.5 + 1.5
      carGroupRef.current.rotation.x = Math.sin(flyingTime.current) * 0.1
    } else if (carGroupRef.current) {
      carGroupRef.current.rotation.x = 0
      carGroupRef.current.position.y = 1.2
      flyingTime.current = 0

      if (carState.isFlying) {
        carState.isFlying = false
      }
    }

    if (carGroupRef.current) {
      animateCar(carGroupRef.current, setTextureIndex, textures.length)
    }
  })

  useEffect(() => {
    if (!car) {
      return
    }

    if (!car.morphTargetDictionary || !car.morphTargetInfluences) {
      return
    }

    car.morphTargetInfluences.fill(0)

    if (car.geometry.attributes.uv && !originalUVRef.current) {
      originalUVRef.current = new Float32Array(car.geometry.attributes.uv.array)
    }

    // initialize with uv2 since its used for the default cars
    if (car.geometry.attributes.uv && car.geometry.attributes.uv2) {
      car.geometry.attributes.uv.array.set(car.geometry.attributes.uv2.array)
      car.geometry.attributes.uv.needsUpdate = true
    }
  }, [car])

  useEffect(() => {
    if (!car) return

    const mirrorMaterial = new ShaderMaterial({
      uniforms: {
        map: { value: carTexture },
        mirrorLine: { value: 0.0 },
        morphTargetInfluences: { value: car.morphTargetInfluences },
        activeMorphIndex: { value: -1 },
        isUsingCorrectUV: { value: 0.0 }
      },
      vertexShader: `
        #include <morphtarget_pars_vertex>
        #include <common>
        #include <uv_pars_vertex>
        
        varying vec2 vUv;
        varying vec3 vPosition;
        varying float vIsMirrored;
        uniform float activeMorphIndex;
        uniform float isUsingCorrectUV;

        void main() {
          #include <begin_vertex>
          #include <morphtarget_vertex>
          #include <project_vertex>
          
          vUv = uv; 
          vIsMirrored = position.z < 0.0 ? 1.0 : 0.0;
          vPosition = transformed;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform float mirrorLine;
        uniform float isUsingCorrectUV;

        varying vec2 vUv;
        varying vec3 vPosition;
        varying float vIsMirrored;

        void main() {
          vec2 finalUV = vUv;
          if(vPosition.z < mirrorLine) {
            finalUV.y = 1.0 - finalUV.y;
          }

          vec4 texColor = texture2D(map, finalUV);
          gl_FragColor = texColor;
        }
      `
    })

    car.material = mirrorMaterial

    carGroupRef.current = car.parent

    if (carGroupRef.current && carGroupRef.current.children.length > 1) {
      const mirroredCar = carGroupRef.current.children[1] as Mesh
      if (mirroredCar) {
        mirroredCar.material = mirrorMaterial
      }
    }
  }, [car, carTexture])

  useEffect(() => {
    if (!car?.material) return

    const material = car.material as ShaderMaterial
    material.uniforms.map.value = carTexture

    // Update mirrored car
    if (carGroupRef.current) {
      const mirroredCar = carGroupRef.current.children[1] as Mesh
      if (mirroredCar?.material) {
        const mirrorMaterial = mirroredCar.material as ShaderMaterial
        mirrorMaterial.uniforms.map.value = carTexture
      }
    }
  }, [car, carTexture, textureIndex, textures])
}
