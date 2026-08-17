import { easing } from "maath"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"

import { useInspectable } from "@/components/inspectables/context"
import { useAppLoadingStore } from "@/components/loading/app-loading-handler"
import type { ICameraConfig } from "@/components/navigation-handler/navigation.interface"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useMedia } from "@/hooks/use-media"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { easeInOutCubic } from "@/utils/animations"

import { buildTransitionCurve, getTransitionWaypoints } from "./camera-paths"
import {
  calculateMovementVectors,
  calculateNewPosition,
  calculatePlanePosition,
  calculateViewDimensions
} from "./camera-utils"

const ANIMATION_DURATION = 1
const ANIMATION_DURATION_FROM_404 = 4
// Curved flights cover much longer distances than straight hops; scale their
// duration to the curve length (≈ flight speed in m/s) within sane bounds.
const CURVE_FLIGHT_SPEED = 12
const CURVE_MAX_DURATION = 2.5

export type CameraRef = React.RefObject<THREE.PerspectiveCamera | null>
export type MeshRef = React.RefObject<THREE.Mesh | null>

export const useCameraTransitionState = () => {
  const isCameraTransitioning = useNavigationStore(
    (state) => state.isCameraTransitioning
  )
  return isCameraTransitioning
}

const getResponsiveDivisor = () => {
  const width = window.innerWidth
  if (width <= 1100) return 0.32
  if (width <= 1200) return 0.36
  if (width <= 1500) return 0.4
  return 0.8
}

export const useResponsiveDivisor = () => {
  const [divisor, setDivisor] = useState(getResponsiveDivisor)

  useEffect(() => {
    const onResize = () => setDivisor(getResponsiveDivisor())
    window.addEventListener("resize", onResize, { passive: true })
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return divisor
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
  const setDisableCameraTransition =
    useNavigationStore.getState().setDisableCameraTransition
  const setIsCameraTransitioning =
    useNavigationStore.getState().setIsCameraTransitioning
  const { selected } = useInspectable()

  const isDesktop = useMedia("(min-width: 1024px)")

  const animationDuration = useRef(ANIMATION_DURATION)

  const divisor = useResponsiveDivisor()
  const offsetMultiplier = useMemo(() => {
    return cameraConfig?.offsetMultiplier ?? 0
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

  const initialY = cameraConfig?.position?.[1] ?? 0
  const targetY = cameraConfig?.targetScrollY ?? -initialY

  const newDelta = useMemo(() => new THREE.Vector3(), [])
  const newLookAtDelta = useMemo(() => new THREE.Vector3(), [])

  const progress = useRef(1)
  const isTransitioning = useRef(false)
  const prevCameraConfig = useRef(cameraConfig)
  const firstRender = useRef(true)

  const transitionCurve = useRef<THREE.CatmullRomCurve3 | null>(null)
  const curveEnd = useMemo(() => new THREE.Vector3(), [])
  const curveDelta = useMemo(() => new THREE.Vector3(), [])
  // Where the camera is flying from. Tracked here because the store's
  // previousScene is unreliable at effect time: NavigationHandler re-issues
  // setCurrentScene for the same navigation before this effect runs, which
  // overwrites previousScene with the destination scene.
  const fromSceneRef = useRef<string | null>(null)

  const loadingCanvasWorker = useAppLoadingStore((state) => state.worker)

  const scrollRatio = useRef(0)
  useEffect(() => {
    const updateScrollRatio = () => {
      scrollRatio.current = Math.min(1, window.scrollY / window.innerHeight)
    }
    updateScrollRatio()
    window.addEventListener("scroll", updateScrollRatio, { passive: true })
    window.addEventListener("resize", updateScrollRatio, { passive: true })
    return () => {
      window.removeEventListener("scroll", updateScrollRatio)
      window.removeEventListener("resize", updateScrollRatio)
    }
  }, [])

  useEffect(() => {
    if (!cameraConfig) return

    if (prevCameraConfig.current === cameraConfig) {
      // Mounted with a scene already active (no navigation yet).
      if (fromSceneRef.current === null) {
        fromSceneRef.current =
          useNavigationStore.getState().currentScene?.name ?? null
      }
      return
    }

    const toScene = useNavigationStore.getState().currentScene?.name ?? null
    const fromScene = fromSceneRef.current

    if (isInitialized && prevCameraConfig.current) {
      const { disableCameraTransition } = useNavigationStore.getState()

      animationDuration.current =
        fromScene === "404" ? ANIMATION_DURATION_FROM_404 : ANIMATION_DURATION

      initialCurrentPos.copy(currentPos)
      initialCurrentTarget.copy(currentTarget)
      initialFov.current = currentFov.current
      targetFov.current = cameraConfig.fov

      if (!disableCameraTransition) {
        curveEnd.set(...(cameraConfig.position as [number, number, number]))
        const waypoints =
          fromScene && toScene
            ? getTransitionWaypoints(fromScene, toScene)
            : null
        transitionCurve.current = waypoints
          ? buildTransitionCurve(initialCurrentPos, curveEnd, waypoints)
          : null
        if (transitionCurve.current && fromScene !== "404") {
          animationDuration.current = Math.min(
            CURVE_MAX_DURATION,
            Math.max(
              ANIMATION_DURATION,
              transitionCurve.current.getLength() / CURVE_FLIGHT_SPEED
            )
          )
        }

        progress.current = 0
        isTransitioning.current = true
        setIsCameraTransitioning(true)
      } else {
        transitionCurve.current = null
        progress.current = 1
        isTransitioning.current = false
        setIsCameraTransitioning(false)

        setTimeout(
          () => setDisableCameraTransition(false),
          animationDuration.current * 1000
        )
      }
    }
    fromSceneRef.current = toScene
    prevCameraConfig.current = cameraConfig
  }, [
    cameraConfig,
    isInitialized,
    currentPos,
    currentTarget,
    curveEnd,
    initialCurrentPos,
    initialCurrentTarget,
    setDisableCameraTransition,
    setIsCameraTransitioning
  ])

  const finalPos = useMemo(() => new THREE.Vector3(), [])
  const finalLookAt = useMemo(() => new THREE.Vector3(), [])

  useFrameCallback(({ pointer }, dt) => {
    const { disableCameraTransition } = useNavigationStore.getState()
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

    if (!selected && cameraConfig?.offsetMultiplier !== 0) {
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

    if (!disableCameraTransition && isDesktop) {
      const scrollOffset = (targetY - initialY) * scrollRatio.current
      targetPosition.y += scrollOffset
      targetLookAt.y += scrollOffset
    }

    if (disableCameraTransition || firstRender.current) {
      progress.current = 1
      transitionCurve.current = null
      currentPos.copy(targetPosition)
      currentTarget.copy(targetLookAt)
      currentFov.current = targetFov.current

      if (isTransitioning.current) {
        isTransitioning.current = false
        setIsCameraTransitioning(false)
      }

      if (firstRender.current) {
        firstRender.current = false
      }
    } else if (isTransitioning.current && progress.current < 1) {
      progress.current = Math.min(
        progress.current + dt / animationDuration.current,
        1
      )
      const easeValue = easeInOutCubic(progress.current)

      if (transitionCurve.current) {
        // Fly the authored curve (arc-length parameterized so the eased
        // speed is uniform along it), then blend in whatever the live
        // target has drifted from the snapshot the curve was built with
        // (scroll offset) so the flight still lands exactly on it.
        transitionCurve.current.getPointAt(easeValue, currentPos)
        curveDelta.subVectors(targetPosition, curveEnd)
        currentPos.addScaledVector(curveDelta, easeValue)
      } else {
        currentPos.lerpVectors(initialCurrentPos, targetPosition, easeValue)
      }
      currentTarget.lerpVectors(initialCurrentTarget, targetLookAt, easeValue)
      currentFov.current =
        initialFov.current +
        (targetFov.current - initialFov.current) * easeValue

      if (progress.current === 1) {
        isTransitioning.current = false
        transitionCurve.current = null
        setIsCameraTransitioning(false)
      }
    } else {
      currentPos.copy(targetPosition)
      currentTarget.copy(targetLookAt)
      currentFov.current = targetFov.current
    }

    if (cameraRef.current) {
      finalPos.copy(currentPos).add(panTargetDelta)
      finalLookAt.copy(currentTarget).add(panLookAtDelta)

      cameraRef.current.position.copy(finalPos)
      cameraRef.current.lookAt(finalLookAt)
      if (cameraRef.current.fov !== currentFov.current) {
        cameraRef.current.fov = currentFov.current
        cameraRef.current.updateProjectionMatrix()
      }

      if (loadingCanvasWorker) {
        loadingCanvasWorker.postMessage({
          type: "update-camera-config",
          actualCamera: {
            position: finalPos,
            target: finalLookAt,
            fov: currentFov.current
          }
        })
      }
    }
  })

  return { currentPos, currentTarget, targetPosition, targetLookAt }
}
