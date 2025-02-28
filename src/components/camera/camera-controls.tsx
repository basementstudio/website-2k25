import { PerspectiveCamera } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { easing } from "maath"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { ICameraConfig } from "@/components/navigation-handler/navigation.interface"
import {
  calculateMovementVectors,
  calculateNewPosition,
  calculatePlanePosition,
  calculateViewDimensions,
  easeInOutCubic
} from "./camera-utils"

const ANIMATION_DURATION = 1

type CameraRef = React.RefObject<THREE.PerspectiveCamera | null>
type MeshRef = React.RefObject<THREE.Mesh | null>

const useResponsiveDivisor = () => {
  return useMemo(() => {
    const width = window.innerWidth
    if (width <= 1100) return 0.32
    if (width <= 1200) return 0.36
    if (width <= 1500) return 0.4
    if (width <= 1600) return 0.8
    return 0.8
  }, [])
}

const useCameraSetup = (
  cameraRef: CameraRef,
  planeRef: MeshRef,
  planeBoundaryRef: MeshRef,
  cameraConfig: ICameraConfig | undefined,
  isInitialized: boolean,
  setIsInitialized: (value: boolean) => void,
  currentPos: THREE.Vector3,
  currentTarget: THREE.Vector3,
  targetPosition: THREE.Vector3,
  targetLookAt: THREE.Vector3
) => {
  useEffect(() => {
    if (!cameraRef.current || !cameraConfig) return

    const position = cameraConfig.position as [number, number, number]
    const target = cameraConfig.target as [number, number, number]

    targetPosition.set(...position)
    targetLookAt.set(...target)

    if (!isInitialized) {
      currentPos.copy(targetPosition)
      currentTarget.copy(targetLookAt)

      cameraRef.current.position.copy(currentPos)
      cameraRef.current.lookAt(currentTarget)
      cameraRef.current.fov = cameraConfig.fov

      setIsInitialized(true)
    }

    const [plane, boundary] = [planeRef.current, planeBoundaryRef.current]
    if (!plane || !boundary || !cameraRef.current) return

    const planePos = calculatePlanePosition(cameraConfig)
    const distance = Math.hypot(
      ...position.map((p: number, i: number) => p - planePos[i])
    )
    const { width, height } = calculateViewDimensions(
      cameraRef.current,
      distance,
      cameraConfig
    )

    ;[plane, boundary].forEach((mesh) => {
      mesh.lookAt(...(cameraConfig.position as [number, number, number]))
    })
    boundary.scale.set(width * 0.6, height, 1)
    plane.scale.set(width * 0.4, height, 1)
  }, [
    cameraConfig,
    cameraRef,
    planeRef,
    planeBoundaryRef,
    isInitialized,
    setIsInitialized,
    currentPos,
    currentTarget,
    targetPosition,
    targetLookAt
  ])
}

const useBoundaries = (cameraConfig: ICameraConfig | undefined) => {
  const boundariesRef = useRef({
    maxOffset: 0,
    targetPosition: { x: 0, z: 0 },
    rightVector: { x: 0, z: 0 },
    planePosition: { x: 0, z: 0 },
    offset: 0,
    pos: { x: 0, z: 0 }
  })

  const basePosition = useMemo(() => {
    if (!cameraConfig) return [0, 0, 0] as [number, number, number]
    return calculatePlanePosition(cameraConfig)
  }, [cameraConfig])

  const np = useMemo(() => {
    const b = boundariesRef.current
    if (!basePosition) return null
    return calculateNewPosition(b.planePosition, b.targetPosition)
  }, [basePosition])

  return { boundariesRef, basePosition, np }
}

const useCameraMovement = (
  cameraRef: CameraRef,
  planeRef: MeshRef,
  planeBoundaryRef: MeshRef,
  cameraConfig: ICameraConfig | undefined,
  boundaries: ReturnType<typeof useBoundaries>,
  isInitialized: boolean
) => {
  const divisor = useResponsiveDivisor()
  const offsetMultiplier = useMemo(() => {
    return cameraConfig?.offsetMultiplier ?? 2
  }, [cameraConfig])

  const panTargetDelta = useMemo(() => new THREE.Vector3(), [])
  const panLookAtDelta = useMemo(() => new THREE.Vector3(), [])
  const currentPos = useMemo(() => new THREE.Vector3(), [])
  const currentTarget = useMemo(() => new THREE.Vector3(), [])
  const targetPosition = useMemo(() => new THREE.Vector3(), [])
  const targetLookAt = useMemo(() => new THREE.Vector3(), [])
  const initialCurrentPos = useMemo(() => new THREE.Vector3(), [])
  const initialCurrentTarget = useMemo(() => new THREE.Vector3(), [])

  const currentFov = useRef(cameraConfig?.fov ?? 75)
  const targetFov = useRef(cameraConfig?.fov ?? 75)
  const initialFov = useRef(cameraConfig?.fov ?? 75)

  const progress = useRef(1)
  const isTransitioning = useRef(false)
  const prevCameraConfig = useRef(cameraConfig)

  useEffect(() => {
    if (cameraConfig && prevCameraConfig.current !== cameraConfig) {
      if (isInitialized && prevCameraConfig.current) {
        initialCurrentPos.copy(currentPos)
        initialCurrentTarget.copy(currentTarget)
        initialFov.current = currentFov.current
        targetFov.current = cameraConfig.fov
        progress.current = 0
        isTransitioning.current = true
      }
      prevCameraConfig.current = cameraConfig
    }
  }, [
    cameraConfig,
    isInitialized,
    currentPos,
    currentTarget,
    initialCurrentPos,
    initialCurrentTarget
  ])

  useFrame(({ pointer }, dt) => {
    const { boundariesRef, basePosition, np } = boundaries
    const b = boundariesRef.current
    const plane = planeRef.current
    const boundary = planeBoundaryRef.current

    if (!plane || !boundary || !basePosition || !np || !cameraConfig) return

    // boundaries
    b.maxOffset = (boundary.scale.x - plane.scale.x) / 2
    b.rightVector = calculateMovementVectors(basePosition, cameraConfig)
    b.offset = pointer.x * b.maxOffset * offsetMultiplier

    // plane positions
    b.pos.x = b.rightVector.x * b.offset
    b.pos.z = b.rightVector.z * b.offset
    b.targetPosition.x = basePosition[0] + b.pos.x
    b.targetPosition.z = basePosition[2] + b.pos.z
    b.planePosition.x = plane.position.x
    b.planePosition.z = plane.position.z

    // update plane position
    plane.position.setX(np.x)
    plane.position.setZ(np.z)

    // camera movement
    const newDelta = new THREE.Vector3(b.pos.x, 0, b.pos.z)
    const newLookAtDelta = new THREE.Vector3(b.pos.x / divisor, 0, b.pos.z)

    easing.damp3(panTargetDelta, newDelta, 0.5, dt)
    easing.damp3(panLookAtDelta, newLookAtDelta, 0.25, dt)

    // camera transition
    if (isTransitioning.current && progress.current < 1) {
      progress.current = Math.min(progress.current + dt / ANIMATION_DURATION, 1)
      const easeValue = easeInOutCubic(progress.current)

      currentPos.lerpVectors(initialCurrentPos, targetPosition, easeValue)
      currentTarget.lerpVectors(initialCurrentTarget, targetLookAt, easeValue)
      currentFov.current =
        initialFov.current +
        (targetFov.current - initialFov.current) * easeValue

      if (progress.current === 1) {
        isTransitioning.current = false
      }
    } else {
      currentPos.copy(targetPosition)
      currentTarget.copy(targetLookAt)
      currentFov.current = targetFov.current
    }

    // update camera
    if (cameraRef.current) {
      const finalPos = currentPos.clone().add(panTargetDelta)
      const finalLookAt = currentTarget.clone().add(panLookAtDelta)

      cameraRef.current.position.copy(finalPos)
      cameraRef.current.lookAt(finalLookAt)
      cameraRef.current.fov = currentFov.current
      cameraRef.current.updateProjectionMatrix()
    }
  })

  return { currentPos, currentTarget, targetPosition, targetLookAt }
}

export const CustomCamera = () => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const planeRef = useRef<THREE.Mesh>(null)
  const planeBoundaryRef = useRef<THREE.Mesh>(null)
  const cameraConfig = useNavigationStore.getState().currentScene?.cameraConfig
  const [isInitialized, setIsInitialized] = useState(false)

  const boundaries = useBoundaries(cameraConfig)
  const { currentPos, currentTarget, targetPosition, targetLookAt } =
    useCameraMovement(
      cameraRef,
      planeRef,
      planeBoundaryRef,
      cameraConfig,
      boundaries,
      isInitialized
    )

  useCameraSetup(
    cameraRef,
    planeRef,
    planeBoundaryRef,
    cameraConfig,
    isInitialized,
    setIsInitialized,
    currentPos,
    currentTarget,
    targetPosition,
    targetLookAt
  )

  return (
    <>
      <PerspectiveCamera makeDefault ref={cameraRef} />
      {cameraConfig && (
        <>
          <mesh
            ref={planeRef}
            position={calculatePlanePosition(cameraConfig)}
          />
          <mesh
            ref={planeBoundaryRef}
            position={calculatePlanePosition(cameraConfig)}
          />
        </>
      )}
    </>
  )
}
