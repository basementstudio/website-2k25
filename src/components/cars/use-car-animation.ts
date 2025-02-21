import { useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import type { SetStateAction } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { BufferAttribute, Mesh, Object3D, ShaderMaterial, Vector3 } from "three"

import { easeInOutCubic } from "@/utils/animations"

import {
  CAR_CONFIGS,
  type CarConfig,
  carState,
  type CMSTextures,
  CONSTANTS,
  TOTAL_DISTANCE,
  updateCarPositionProps,
  type UseCarAnimationProps
} from "./car.interfaces"
import {
  getRandomCarConfig,
  runFirstCarPass,
  setRandomTimeout,
  updateCarSpeed
} from "./car-utils"

// sets up car morphing targets and UV mapping for textures
const setupCarMorphAndUVs = (
  car: Mesh,
  mirroredCar: Mesh | undefined,
  config: CarConfig,
  originalUVRef: React.RefObject<Float32Array | null>,
  originalFrontWheelUVRef: React.RefObject<Float32Array | null>,
  originalBackWheelUVRef: React.RefObject<Float32Array | null>,
  frontWheel: Mesh | null,
  backWheel: Mesh | null
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

  // keeps uvs updated for each car shape key, adding new car shapekeys will require updating this function,
  // as uv names dont get exported from blender
  const updateUVs = (mesh: Mesh) => {
    if (!mesh.geometry.attributes.uv) return

    let newUVs: ArrayLike<number> | undefined
    const isWheel = mesh.name === "FRONT-WHEEL" || mesh.name === "BACK-WHEEL"

    switch (config.uvSource) {
      case "uv2":
        newUVs = mesh.geometry.attributes.uv2?.array
        break
      case "originalUV":
        if (isWheel) {
          newUVs =
            mesh.name === "FRONT-WHEEL"
              ? originalFrontWheelUVRef.current || undefined
              : originalBackWheelUVRef.current || undefined
        } else {
          newUVs = originalUVRef.current || undefined
        }
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
  if (frontWheel) {
    updateUVs(frontWheel)
  }
  if (backWheel) {
    updateUVs(backWheel)
  }
}

// core animation loop for car movement and position updates
const updateCarPosition = ({
  carPosition,
  progress,
  setTextureIndex,
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

export const animateCar = (
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

// main hook for the cars that handles:
// - texture loading and application
// - wheel rotation and positioning
// - car morphing and UV mapping
// - flying animation for DeLorean
export const useCarAnimation = ({
  car,
  frontWheel,
  backWheel,
  textures
}: UseCarAnimationProps) => {
  const carGroupRef = useRef<Object3D | null>(null)
  const originalUVRef = useRef<Float32Array | null>(null)
  const originalFrontWheelUVRef = useRef<Float32Array | null>(null)
  const originalBackWheelUVRef = useRef<Float32Array | null>(null)
  const [textureIndex, setTextureIndex] = useState(0)
  const flyingTime = useRef(0)
  const wheelRotation = useRef(0)
  const originalFrontWheelPos = useRef<Vector3 | null>(null)
  const originalBackWheelPos = useRef<Vector3 | null>(null)
  const originalFrontWheelScale = useRef<Vector3 | null>(null)
  const originalBackWheelScale = useRef<Vector3 | null>(null)

  const textureUrls = useMemo(() => Object.values(textures), [textures])

  const carTexture = useTexture(textureUrls[textureIndex])

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

    const textureKeys = Object.keys(textures) as (keyof CMSTextures)[]
    const currentTextureKey = textureKeys[textureIndex]
    const currentConfig = CAR_CONFIGS[currentTextureKey]

    if (!currentConfig) return

    if (carGroupRef.current) {
      const mirroredCar = carGroupRef.current.children[1] as Mesh
      setupCarMorphAndUVs(
        car,
        mirroredCar,
        currentConfig,
        originalUVRef,
        originalFrontWheelUVRef,
        originalBackWheelUVRef,
        frontWheel,
        backWheel
      )

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
    if (!carState.isWaiting && frontWheel && backWheel) {
      wheelRotation.current -= carState.currentSpeed
      frontWheel.rotation.z = wheelRotation.current
      backWheel.rotation.z = wheelRotation.current
    }

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
      animateCar(carGroupRef.current, setTextureIndex, textureUrls.length)
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

    // Store original wheel UVs
    if (
      frontWheel?.geometry.attributes.uv &&
      !originalFrontWheelUVRef.current
    ) {
      originalFrontWheelUVRef.current = new Float32Array(
        frontWheel.geometry.attributes.uv.array
      )
    }
    if (backWheel?.geometry.attributes.uv && !originalBackWheelUVRef.current) {
      originalBackWheelUVRef.current = new Float32Array(
        backWheel.geometry.attributes.uv.array
      )
    }

    // initialize with uv2 since its used for the default cars
    if (car.geometry.attributes.uv && car.geometry.attributes.uv2) {
      car.geometry.attributes.uv.array.set(car.geometry.attributes.uv2.array)
      car.geometry.attributes.uv.needsUpdate = true
    }
  }, [car, frontWheel, backWheel])

  useEffect(() => {
    if (!car) return

    const mirrorMaterial = new ShaderMaterial({
      uniforms: {
        map: { value: carTexture },
        mirrorLine: { value: 0.0 },
        morphTargetInfluences: { value: car.morphTargetInfluences },
        activeMorphIndex: { value: -1 },
        isUsingCorrectUV: { value: 0.0 },
        fogColor: { value: new Vector3(0.4, 0.4, 0.4) },
        fogDensity: { value: 0.05 },
        fogDepth: { value: 6.0 }
      },
      vertexShader: `
        #include <morphtarget_pars_vertex>
        #include <common>
        #include <uv_pars_vertex>
        
        varying vec2 vUv;
        varying vec3 vPosition;
        varying float vIsMirrored;
        varying vec3 vMvPosition;
        uniform float activeMorphIndex;
        uniform float isUsingCorrectUV;

        void main() {
          #include <begin_vertex>
          #include <morphtarget_vertex>
          #include <project_vertex>
          
          vUv = uv; 
          vIsMirrored = position.z < 0.0 ? 1.0 : 0.0;
          vPosition = transformed;
          vMvPosition = mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform float mirrorLine;
        uniform float isUsingCorrectUV;
        uniform vec3 fogColor;
        uniform float fogDensity;
        uniform float fogDepth;

        varying vec2 vUv;
        varying vec3 vPosition;
        varying float vIsMirrored;
        varying vec3 vMvPosition;

        void main() {
          vec2 finalUV = vUv;
          if(vPosition.z < mirrorLine) {
            finalUV.y = 1.0 - finalUV.y;
          }

          vec4 texColor = texture2D(map, finalUV);

          float fogDepthValue = min(vMvPosition.z + fogDepth, 0.0);
          float fogFactor = 1.0 - exp(-fogDensity * fogDensity * fogDepthValue * fogDepthValue);
          fogFactor = clamp(fogFactor, 0.0, 1.0);
          
          gl_FragColor = vec4(mix(texColor.rgb, fogColor, fogFactor), texColor.a);
        }
      `
    })

    car.material = mirrorMaterial

    if (frontWheel) {
      frontWheel.material = mirrorMaterial
    }
    if (backWheel) {
      backWheel.material = mirrorMaterial
    }

    carGroupRef.current = car.parent

    if (carGroupRef.current && carGroupRef.current.children.length > 1) {
      const mirroredCar = carGroupRef.current.children[1] as Mesh
      if (mirroredCar) {
        mirroredCar.material = mirrorMaterial
      }
    }
  }, [car, carTexture, frontWheel, backWheel])

  useEffect(() => {
    if (!car?.material) return

    const material = car.material as ShaderMaterial
    material.uniforms.map.value = carTexture

    if (frontWheel?.material) {
      ;(frontWheel.material as ShaderMaterial).uniforms.map.value = carTexture
    }
    if (backWheel?.material) {
      ;(backWheel.material as ShaderMaterial).uniforms.map.value = carTexture
    }

    // Update mirrored car
    if (carGroupRef.current) {
      const mirroredCar = carGroupRef.current.children[1] as Mesh
      if (mirroredCar?.material) {
        const mirrorMaterial = mirroredCar.material as ShaderMaterial
        mirrorMaterial.uniforms.map.value = carTexture
      }
    }
  }, [car, carTexture, textureIndex, textureUrls, frontWheel, backWheel])
}
