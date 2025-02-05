import { useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { DoubleSide, Mesh, Object3D, ShaderMaterial, Vector3 } from "three"

import { easeInOutCubic } from "@/utils/animations"

interface CarState {
  isWaiting: boolean
  waitTimeout: NodeJS.Timeout | null
  isSoundPlaying: boolean
  currentSpeed: number
  isSlowingDown: boolean
  isSpeedingUp: boolean
  hasInitialized: boolean
}

const CONSTANTS = {
  BASE_SPEED: 0.2,
  START_X: -8.7,
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
  hasInitialized: false
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
}

const updateCarPosition = ({
  carPosition,
  wheelMeshes,
  progress
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
  }
}

const runFirstCarPass = (carPosition: Vector3) => {
  carState.hasInitialized = true
  carPosition.x = CONSTANTS.START_X
  carState.isWaiting = true
  setRandomTimeout()
}

const animateCar = (car: Object3D, wheelMeshes: Mesh[]) => {
  const carPosition = car.position

  if (!carState.hasInitialized) {
    runFirstCarPass(carPosition)
    return
  }

  if (
    !carState.isWaiting &&
    carPosition.x >= CONSTANTS.START_X &&
    carPosition.x <= CONSTANTS.END_X
  ) {
    const progress = (carPosition.x - CONSTANTS.START_X) / TOTAL_DISTANCE
    updateCarPosition({ carPosition, wheelMeshes, progress })
  } else if (!carState.isWaiting) {
    carPosition.x = CONSTANTS.START_X
    updateCarSpeed()
  }
}

export const useCarAnimation = ({ car }: { car: Mesh | null }) => {
  const wheelMeshes = useRef<Mesh[]>([])
  const carTexture = useTexture("/textures/cars/delorean.png")

  useEffect(() => {
    if (!car) return

    const mirrorMaterial = new ShaderMaterial({
      uniforms: {
        map: { value: carTexture },
        mirrorLine: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform float mirrorLine;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vec4 texColor = texture2D(map, vUv);
          
          if(vPosition.z < mirrorLine) {
            texColor = texture2D(map, vec2(vUv.x, 1.0 - vUv.y));
          }
          
          gl_FragColor = texColor;
        }
      `,
      side: DoubleSide
    })

    car.material = mirrorMaterial

    const frontWheels = car.getObjectByName("SM_FWheels") as Mesh
    const backWheels = car.getObjectByName("SM_BWheels") as Mesh

    if (frontWheels) wheelMeshes.current.push(frontWheels)
    if (backWheels) wheelMeshes.current.push(backWheels)
  }, [car, carTexture])

  useFrame(() => {
    if (car) animateCar(car, wheelMeshes.current)
  })
}
