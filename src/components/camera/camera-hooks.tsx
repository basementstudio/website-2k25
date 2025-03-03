import { useFrame } from "@react-three/fiber"
import { easing } from "maath"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { useLenis } from "lenis/react"

import { ICameraConfig } from "@/components/navigation-handler/navigation.interface"
import {
  calculateMovementVectors,
  calculateNewPosition,
  calculatePlanePosition,
  calculateViewDimensions,
  easeInOutCubic
} from "./camera-utils"
import { useNavigationStore } from "../navigation-handler/navigation-store"
import { useInspectable } from "../inspectables/context"

const ANIMATION_DURATION = 1

export type CameraRef = React.RefObject<THREE.PerspectiveCamera | null>
export type MeshRef = React.RefObject<THREE.Mesh | null>

export const useCameraTransitionState = () => {
  const isCameraTransitioning = useNavigationStore(
    (state) => state.isCameraTransitioning
  )
  return isCameraTransitioning
}

export const useResponsiveDivisor = () => {
  return useMemo(() => {
    const width = window.innerWidth
    if (width <= 1100) return 0.32
    if (width <= 1200) return 0.36
    if (width <= 1500) return 0.4
    if (width <= 1600) return 0.8
    return 0.8
  }, [])
}

export const useCameraSetup = (
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

export const useBoundaries = (cameraConfig: ICameraConfig | undefined) => {
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

export const useCameraMovement = (
  cameraRef: CameraRef,
  planeRef: MeshRef,
  planeBoundaryRef: MeshRef,
  cameraConfig: ICameraConfig | undefined,
  boundaries: ReturnType<typeof useBoundaries>,
  isInitialized: boolean
) => {
  const disableCameraTransition =
    useNavigationStore.getState().disableCameraTransition
  const setDisableCameraTransition =
    useNavigationStore.getState().setDisableCameraTransition
  const setIsCameraTransitioning =
    useNavigationStore.getState().setIsCameraTransitioning
  const { selected } = useInspectable()

  const divisor = useResponsiveDivisor()
  const offsetMultiplier = useMemo(() => {
    return cameraConfig?.offsetMultiplier ?? 2
  }, [cameraConfig])

  const lenis = useLenis()

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

  const initialY = cameraConfig?.position?.[1] ?? 0
  const targetY = cameraConfig?.targetScrollY ?? -initialY

  const newDelta = useMemo(() => new THREE.Vector3(), [])
  const newLookAtDelta = useMemo(() => new THREE.Vector3(), [])

  const progress = useRef(1)
  const isTransitioning = useRef(false)
  const prevCameraConfig = useRef(cameraConfig)
  const firstRender = useRef(true)

  useEffect(() => {
    if (cameraConfig && prevCameraConfig.current !== cameraConfig) {
      if (isInitialized && prevCameraConfig.current) {
        initialCurrentPos.copy(currentPos)
        initialCurrentTarget.copy(currentTarget)
        initialFov.current = currentFov.current
        targetFov.current = cameraConfig.fov

        if (!disableCameraTransition) {
          progress.current = 0
          isTransitioning.current = true
          setIsCameraTransitioning(true)
        } else {
          progress.current = 1
          isTransitioning.current = false
          setIsCameraTransitioning(false)

          setTimeout(
            () => setDisableCameraTransition(false),
            ANIMATION_DURATION * 1000
          )
        }
      }
      prevCameraConfig.current = cameraConfig
    }
  }, [
    cameraConfig,
    isInitialized,
    currentPos,
    currentTarget,
    initialCurrentPos,
    initialCurrentTarget,
    disableCameraTransition,
    setDisableCameraTransition,
    setIsCameraTransitioning
  ])

  useFrame(({ pointer }, dt) => {
    const { boundariesRef, basePosition, np } = boundaries
    const b = boundariesRef.current
    const plane = planeRef.current
    const boundary = planeBoundaryRef.current

    if (!plane || !boundary || !basePosition || !np || !cameraConfig) return

    b.maxOffset = (boundary.scale.x - plane.scale.x) / 2
    b.rightVector = calculateMovementVectors(basePosition, cameraConfig)
    b.offset = pointer.x * b.maxOffset * offsetMultiplier

    b.pos.x = b.rightVector.x * b.offset
    b.pos.z = b.rightVector.z * b.offset
    b.targetPosition.x = basePosition[0] + b.pos.x
    b.targetPosition.z = basePosition[2] + b.pos.z
    b.planePosition.x = plane.position.x
    b.planePosition.z = plane.position.z

    plane.position.setX(np.x)
    plane.position.setZ(np.z)

    if (!selected) {
      newDelta.set(b.pos.x, 0, b.pos.z)
      newLookAtDelta.set(b.pos.x / divisor, 0, b.pos.z)

      easing.damp3(panTargetDelta, newDelta, 0.5, dt)
      easing.damp3(panLookAtDelta, newLookAtDelta, 0.25, dt)
    } else {
      easing.damp3(panTargetDelta, 0, 0.5, dt)
      easing.damp3(panLookAtDelta, 0, 0.25, dt)
    }

    if (cameraConfig) {
      targetPosition.set(...cameraConfig.position)
      targetLookAt.set(...cameraConfig.target)
      targetFov.current = cameraConfig.fov
    }

    if (!disableCameraTransition && lenis) {
      targetPosition.y +=
        (targetY - initialY) * Math.min(1, lenis.scroll / window.innerHeight)
      targetLookAt.y +=
        (targetY - initialY) * Math.min(1, lenis.scroll / window.innerHeight)
    }

    if (disableCameraTransition || firstRender.current) {
      progress.current = 1
      currentPos.copy(targetPosition)
      currentTarget.copy(targetLookAt)
      currentFov.current = targetFov.current
      isTransitioning.current = false
      setIsCameraTransitioning(false)

      if (firstRender.current) {
        firstRender.current = false
      }
    } else if (isTransitioning.current && progress.current < 1) {
      progress.current = Math.min(progress.current + dt / ANIMATION_DURATION, 1)
      const easeValue = easeInOutCubic(progress.current)

      currentPos.lerpVectors(initialCurrentPos, targetPosition, easeValue)
      currentTarget.lerpVectors(initialCurrentTarget, targetLookAt, easeValue)
      currentFov.current =
        initialFov.current +
        (targetFov.current - initialFov.current) * easeValue

      if (progress.current === 1) {
        isTransitioning.current = false
        setIsCameraTransitioning(false)
      }
    } else {
      currentPos.copy(targetPosition)
      currentTarget.copy(targetLookAt)
      currentFov.current = targetFov.current
    }

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
