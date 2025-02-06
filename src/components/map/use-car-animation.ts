import { useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import type { SetStateAction } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Mesh, Object3D, ShaderMaterial, Vector3 } from "three"

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
  BASE_SPEED: 0.2,
  START_X: -8.8,
  END_X: 9.5,
  MIN_WAIT_TIME: 6000,
  ADDED_WAIT_TIME: 4000,
  SPEED_REDUCTION: 0.7,
  SPEED_VARIATION: 0.5
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
  // const waitTime =
  //   CONSTANTS.MIN_WAIT_TIME + Math.random() * CONSTANTS.ADDED_WAIT_TIME
  const waitTime = 1000
  carState.isWaiting = true
  carState.isSoundPlaying = false

  if (carState.waitTimeout) clearTimeout(carState.waitTimeout)

  carState.waitTimeout = setTimeout(
    () => (carState.isWaiting = false),
    waitTime
  )
}

const updateCarSpeed = () => {
  carState.currentSpeed = CONSTANTS.BASE_SPEED

  const behavior = Math.random()

  if (behavior < 0.25) {
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
  wheelMeshes: Mesh[]
  progress: number
  setTextureIndex: (value: SetStateAction<number>) => void
  texturesLength: number
  carGroup: Object3D
}

const updateCarPosition = ({
  carPosition,
  wheelMeshes,
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

  wheelMeshes.forEach((wheel) => (wheel.rotation.z -= carState.currentSpeed))

  carPosition.x += carState.currentSpeed

  if (carPosition.x > CONSTANTS.END_X) {
    carPosition.x = CONSTANTS.START_X
    updateCarSpeed()
    setRandomTimeout()
    setTextureIndex((prevIndex: number) => {
      const newIndex = (prevIndex + 1) % texturesLength
      return newIndex
    })
    carGroup.visible = false
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
  wheelMeshes: Mesh[],
  setTextureIndex: (value: SetStateAction<number>) => void,
  texturesLength: number
) => {
  const carPosition = car.position

  if (!carState.hasInitialized) {
    runFirstCarPass(carPosition, car)
    return
  }

  if (
    !carState.isWaiting &&
    carPosition.x >= CONSTANTS.START_X &&
    carPosition.x <= CONSTANTS.END_X
  ) {
    if (!car.visible) {
      car.visible = true
    }
    const progress = (carPosition.x - CONSTANTS.START_X) / TOTAL_DISTANCE
    updateCarPosition({
      carPosition,
      wheelMeshes,
      progress,
      setTextureIndex,
      texturesLength,
      carGroup: car
    })
  } else if (!carState.isWaiting) {
    carPosition.x = CONSTANTS.START_X
    updateCarSpeed()
  }
}

interface UseCarAnimationProps {
  car: Mesh | null
}

export const useCarAnimation = ({ car }: UseCarAnimationProps) => {
  const wheelMeshes = useRef<Mesh[]>([])
  const carGroupRef = useRef<Object3D | null>(null)
  const [textureIndex, setTextureIndex] = useState(0)
  const flyingTime = useRef(0)

  const textures = useMemo(() => Object.keys(TEXTURE_TO_MORPH), [])

  const carTexture = useTexture(textures[textureIndex])

  useEffect(() => {
    if (!car?.morphTargetDictionary || !car?.morphTargetInfluences) return

    car.morphTargetInfluences.fill(0)

    const currentMorphTarget = TEXTURE_TO_MORPH[textures[textureIndex]]

    const updateUVs = (mesh: Mesh) => {
      if (!mesh.geometry.attributes.uv) return

      let newUVs

      if (!currentMorphTarget) {
        newUVs = mesh.geometry.attributes.uv2?.array
        // default dodge uv
      } else if (car.morphTargetDictionary) {
        const targetIndex = car.morphTargetDictionary[currentMorphTarget]

        if (targetIndex === 0 || targetIndex === 5) {
          newUVs = mesh.geometry.attributes.uv2?.array
          // default delorean uv
        } else if (targetIndex === 1) {
          newUVs = mesh.userData.originalUV
          // default nissan uv
        } else if (targetIndex === 2) {
          newUVs = mesh.geometry.attributes.uv3?.array
          // default mistery uv
        } else if (targetIndex === 3) {
          newUVs = mesh.geometry.attributes.texcoord_4?.array
          // default simpsons uv
        } else if (targetIndex === 4) {
          newUVs = mesh.geometry.attributes.texcoord_5?.array
          // default kitt uv
        }
      }

      if (newUVs) {
        mesh.geometry.attributes.uv.array.set(newUVs)
        mesh.geometry.attributes.uv.needsUpdate = true
      }
    }

    if (!currentMorphTarget && carGroupRef.current) {
      const mirroredCar = carGroupRef.current.children[1] as Mesh
      if (mirroredCar.morphTargetInfluences) {
        mirroredCar.morphTargetInfluences.fill(0)
      }

      updateUVs(car)
      updateUVs(mirroredCar)
    }

    if (currentMorphTarget) {
      const targetIndex = car.morphTargetDictionary[currentMorphTarget]

      if (targetIndex !== undefined) {
        car.morphTargetInfluences[targetIndex] = 1
        const material = car.material as ShaderMaterial

        updateUVs(car)

        if (carGroupRef.current) {
          const mirroredCar = carGroupRef.current.children[1] as Mesh
          // Ensure morph targets are synced
          mirroredCar.morphTargetInfluences = [...car.morphTargetInfluences]
          mirroredCar.material = car.material
          updateUVs(mirroredCar)
        }

        if (material?.uniforms) {
          material.uniforms.activeMorphIndex.value = targetIndex
          material.uniforms.isUsingCorrectUV.value = 1.0
        }

        // fly away little delorean
        if (currentMorphTarget === "DeLorean" && Math.random() < 0.25) {
          const flyIndex = car.morphTargetDictionary["DeLoreanFly"]
          if (flyIndex !== undefined) {
            car.morphTargetInfluences[flyIndex] = 1
            if (carGroupRef.current) {
              const mirroredCar = carGroupRef.current.children[1] as Mesh
              if (mirroredCar.morphTargetInfluences) {
                mirroredCar.morphTargetInfluences[flyIndex] = 1
              }
            }
            carState.isFlying = true
            // flying state
            if (material?.uniforms) {
              material.uniforms.activeMorphIndex.value = flyIndex
            }
          }
        } else {
          carState.isFlying = false
          if (material?.uniforms) {
            material.uniforms.isUsingCorrectUV.value = 0.0
          }
        }
      }
    } else {
      carState.isFlying = false
      const material = car.material as ShaderMaterial
      if (material?.uniforms) {
        material.uniforms.activeMorphIndex.value = -1
        material.uniforms.isUsingCorrectUV.value = 0.0
      }
    }
  }, [car, textureIndex, textures])

  useFrame((_, delta) => {
    if (carGroupRef.current && carState.isFlying) {
      flyingTime.current += delta
      carGroupRef.current.position.y =
        Math.sin(flyingTime.current * 2) * 0.5 + 1.5
      carGroupRef.current.rotation.x = Math.sin(flyingTime.current) * 0.1
    } else if (carGroupRef.current) {
      carGroupRef.current.rotation.x = 0
      carGroupRef.current.position.y = 1.2
      flyingTime.current = 0
    }

    if (carGroupRef.current) {
      animateCar(
        carGroupRef.current,
        wheelMeshes.current,
        setTextureIndex,
        textures.length
      )
    }
  })

  useEffect(() => {
    if (!car) {
      console.log("No car mesh provided")
      return
    }

    if (!car.morphTargetDictionary || !car.morphTargetInfluences) {
      console.log("Car has no morph targets")
      return
    }

    car.morphTargetInfluences.fill(0)

    // storing this uv is vital for the nissan
    if (car.geometry.attributes.uv) {
      car.userData.originalUV = car.geometry.attributes.uv.array.slice()
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

          // Handle UV flipping for mirrored half
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

    if (carGroupRef.current) {
      const mirroredCar = carGroupRef.current.children[1] as Mesh
      mirroredCar.material = mirrorMaterial
    }

    const frontWheels = car.getObjectByName("SM_FWheels") as Mesh
    const backWheels = car.getObjectByName("SM_BWheels") as Mesh

    wheelMeshes.current = []
    if (frontWheels) wheelMeshes.current.push(frontWheels)
    if (backWheels) wheelMeshes.current.push(backWheels)

    if (carGroupRef.current) {
      const mirroredCar = carGroupRef.current.children[1] as Mesh
      const mirroredFrontWheels = mirroredCar.getObjectByName(
        "SM_FWheels"
      ) as Mesh
      const mirroredBackWheels = mirroredCar.getObjectByName(
        "SM_BWheels"
      ) as Mesh
      if (mirroredFrontWheels) wheelMeshes.current.push(mirroredFrontWheels)
      if (mirroredBackWheels) wheelMeshes.current.push(mirroredBackWheels)
    }
  }, [car, carTexture])
}
