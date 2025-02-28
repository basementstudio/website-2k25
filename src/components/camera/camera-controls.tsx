import { CameraControls } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useLenis } from "lenis/react"
import { easing } from "maath"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mesh, PerspectiveCamera, Vector3 } from "three"

import { useInspectable } from "@/components/inspectables/context"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { TRANSITION_DURATION } from "@/constants/transitions"

import {
  calculateMovementVectors,
  calculateNewPosition,
  calculatePlanePosition,
  calculateViewDimensions,
  easeInOutCubic
} from "./camera-utils"

const panTargetDelta = new Vector3()
const panLookAtDelta = new Vector3()
const targetPosition = new Vector3()
const targetLookAt = new Vector3()
const currentPos = new Vector3()
const currentTarget = new Vector3()
const newDelta = new Vector3()
const newLookAtDelta = new Vector3()
const finalPos = new Vector3()
const finalLookAt = new Vector3()
const initialCurrentPos = new Vector3()
const initialCurrentTarget = new Vector3()
const ANIMATION_DURATION = 1
const NOT_FOUND_DURATION = 12

export const CustomCamera = () => {
  const { selected } = useInspectable()
  const [firstRender, setFirstRender] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [transitionPhase, setTransitionPhase] = useState<
    "to-origin" | "to-home" | null
  >(null)

  const { camera: defaultCamera } = useThree()
  const currentScene = useNavigationStore((state) => state.currentScene?.name)
  const previousScene = useNavigationStore((state) => state.previousScene?.name)

  const cameraControlsRef = useRef<CameraControls>(null)
  const planeRef = useRef<Mesh>(null)
  const planeBoundaryRef = useRef<Mesh>(null)

  const cameraConfig = useNavigationStore.getState().currentScene?.cameraConfig
  const disableCameraTransition =
    useNavigationStore.getState().disableCameraTransition
  const setDisableCameraTransition =
    useNavigationStore.getState().setDisableCameraTransition

  const progress = useRef(1)
  const targetFov = useRef<number>(60)
  const currentFov = useRef<number>(60)
  const initialFov = useRef<number>(60)
  const prevCameraConfig = useRef(cameraConfig)
  const isTransitioning = useRef(false)

  const initialY = cameraConfig?.position?.[1] ?? 0
  const targetY = cameraConfig?.targetScrollY ?? -initialY

  const lenis = useLenis()

  const boundariesRef = useRef({
    maxOffset: 0,
    targetPosition: { x: 0, z: 0 },
    rightVector: { x: 0, z: 0 },
    planePosition: { x: 0, z: 0 },
    offset: 0,
    pos: { x: 0, z: 0 }
  })

  const divisor = useMemo(() => {
    const width = window.innerWidth
    if (width <= 1100) return 0.32
    if (width <= 1200) return 0.36
    if (width <= 1500) return 0.4
    if (width <= 1600) return 0.8
    return 0.8
  }, [])

  const offsetMultiplier = useMemo(() => {
    return cameraConfig?.offsetMultiplier ?? 2
  }, [cameraConfig])

  const isCameraReady = useMemo(() => {
    return (
      !!cameraConfig &&
      !!cameraConfig.position &&
      !!cameraConfig.target &&
      cameraConfig.position.length === 3 &&
      cameraConfig.target.length === 3
    )
  }, [cameraConfig])

  useEffect(() => {
    if (defaultCamera) {
      const originalVisibility = defaultCamera.visible
      defaultCamera.visible = false

      return () => {
        defaultCamera.visible = originalVisibility
      }
    }
  }, [defaultCamera])

  useEffect(() => {
    if (cameraConfig && prevCameraConfig.current !== cameraConfig) {
      if (isInitialized && prevCameraConfig.current) {
        initialCurrentPos.copy(currentPos)
        initialCurrentTarget.copy(currentTarget)
        initialFov.current = currentFov.current

        progress.current = 0
        isTransitioning.current = true
      }
      prevCameraConfig.current = cameraConfig
    }
  }, [cameraConfig, isInitialized])

  useEffect(() => {
    const controls = cameraControlsRef.current
    const camera = controls?.camera as PerspectiveCamera

    const [plane, boundary] = [planeRef.current, planeBoundaryRef.current]
    if (
      !controls ||
      !plane ||
      !boundary ||
      !camera ||
      !isCameraReady ||
      !cameraConfig
    )
      return

    controls.disconnect()

    //TODO: remove this
    useNavigationStore.getState().setMainCamera(camera)

    targetFov.current = cameraConfig.fov ?? 60

    targetPosition.set(...cameraConfig.position)
    targetLookAt.set(...cameraConfig.target)

    if (!isInitialized) {
      currentFov.current = cameraConfig.fov ?? 60
      currentPos.copy(targetPosition)
      currentTarget.copy(targetLookAt)

      controls.setPosition(
        targetPosition.x,
        targetPosition.y,
        targetPosition.z,
        false
      )
      controls.setTarget(targetLookAt.x, targetLookAt.y, targetLookAt.z, false)

      if (camera instanceof PerspectiveCamera) {
        camera.fov = currentFov.current
        camera.updateProjectionMatrix()
      }

      setIsInitialized(true)
    }

    const planePos = calculatePlanePosition(cameraConfig)
    const distance = Math.hypot(
      ...cameraConfig.position.map((p, i) => p - planePos[i])
    )
    const { width, height } = calculateViewDimensions(
      camera,
      distance,
      cameraConfig
    )

    ;[plane, boundary].forEach((mesh) => mesh.lookAt(...cameraConfig.position))
    boundary.scale.set(width * 0.6, height, 1)
    plane.scale.set(width * 0.4, height, 1)

    return () => controls.dispose()
  }, [cameraConfig, isCameraReady, isInitialized])

  useEffect(() => {
    if (!cameraConfig) return
    if (isInitialized) return
    progress.current = 0
  }, [cameraConfig, isInitialized])

  const controls = cameraControlsRef.current

  useFrame((_, dt) => {
    if (!controls || !isCameraReady || !cameraConfig) return

    const is404ToHome = currentScene === "home" && previousScene === "404"

    if (is404ToHome) {
      if (!transitionPhase) {
        setTransitionPhase("to-home")
        progress.current = 0
        isTransitioning.current = true

        // tv viewing camera position
        currentPos.set(8.76, 1.13, -13)
        currentTarget.set(8.95, 1.12, -13.83)
        currentFov.current = 20

        // store initial positions for interpolation
        initialCurrentPos.copy(currentPos)
        initialCurrentTarget.copy(currentTarget)
        initialFov.current = currentFov.current

        targetPosition.set(...cameraConfig.position)
        targetLookAt.set(...cameraConfig.target)
        targetFov.current = cameraConfig.fov ?? 60

        if (controls.camera instanceof PerspectiveCamera) {
          controls.camera.fov = currentFov.current
          controls.camera.updateProjectionMatrix()
        }
        return
      }

      progress.current = Math.min(progress.current + dt / NOT_FOUND_DURATION, 1)
      const easeValue = easeInOutCubic(progress.current)

      currentPos.lerpVectors(initialCurrentPos, targetPosition, easeValue)
      currentTarget.lerpVectors(initialCurrentTarget, targetLookAt, easeValue)
      currentFov.current =
        initialFov.current +
        (targetFov.current - initialFov.current) * easeValue

      if (controls.camera instanceof PerspectiveCamera) {
        const material = controls.camera.userData.postProcessingMaterial
        if (material) {
          material.uniforms.u404Transition.value = 1 - easeValue
        }
      }

      finalPos.copy(currentPos).add(panTargetDelta)
      finalLookAt.copy(currentTarget).add(panLookAtDelta)
      controls.setPosition(finalPos.x, finalPos.y, finalPos.z, false)
      controls.setTarget(finalLookAt.x, finalLookAt.y, finalLookAt.z, false)

      if (progress.current === 1) {
        isTransitioning.current = false
      }

      return
    }

    if (!lenis) return

    targetPosition.set(...cameraConfig.position)
    targetLookAt.set(...cameraConfig.target)
    targetFov.current = cameraConfig.fov ?? 60

    if (!disableCameraTransition) {
      targetPosition.y +=
        (targetY - initialY) * Math.min(1, lenis.scroll / window.innerHeight)
      targetLookAt.y +=
        (targetY - initialY) * Math.min(1, lenis.scroll / window.innerHeight)
    }

    if (disableCameraTransition || firstRender) {
      progress.current = 1
      isTransitioning.current = false
      currentPos.copy(targetPosition)
      currentTarget.copy(targetLookAt)
      currentFov.current = targetFov.current

      finalPos.copy(currentPos).add(panTargetDelta)
      finalLookAt.copy(currentTarget).add(panLookAtDelta)
      controls.setPosition(finalPos.x, finalPos.y, finalPos.z, false)
      controls.setTarget(finalLookAt.x, finalLookAt.y, finalLookAt.z, false)

      setTimeout(() => setDisableCameraTransition(false), TRANSITION_DURATION)
    } else if (isTransitioning.current && progress.current < 1) {
      progress.current = Math.min(progress.current + dt / ANIMATION_DURATION, 1)
      const easeValue = easeInOutCubic(progress.current)

      currentPos.lerpVectors(initialCurrentPos, targetPosition, easeValue)
      currentTarget.lerpVectors(initialCurrentTarget, targetLookAt, easeValue)
      currentFov.current =
        initialFov.current +
        (targetFov.current - initialFov.current) * easeValue

      finalPos.copy(currentPos).add(panTargetDelta)
      finalLookAt.copy(currentTarget).add(panLookAtDelta)
      controls.setPosition(finalPos.x, finalPos.y, finalPos.z, false)
      controls.setTarget(finalLookAt.x, finalLookAt.y, finalLookAt.z, false)

      if (progress.current === 1) {
        isTransitioning.current = false
      }
    } else {
      finalPos.copy(targetPosition).add(panTargetDelta)
      controls.setPosition(finalPos.x, finalPos.y, finalPos.z, false)

      finalLookAt.copy(targetLookAt).add(panLookAtDelta)
      controls.setTarget(finalLookAt.x, finalLookAt.y, finalLookAt.z, false)
    }

    if (firstRender) setFirstRender(false)
  })

  // boundaries handler
  const b = boundariesRef.current
  const plane = planeRef.current
  const boundary = planeBoundaryRef.current

  const basePosition = useMemo(() => {
    if (!cameraConfig) return [0, 0, 0] as [number, number, number]
    return calculatePlanePosition(cameraConfig)
  }, [cameraConfig])

  const np = useMemo(() => {
    if (!basePosition) return null
    return calculateNewPosition(b.planePosition, b.targetPosition)
  }, [basePosition, b.planePosition, b.targetPosition])

  useFrame(({ pointer }, dt) => {
    if (
      !plane ||
      !boundary ||
      !basePosition ||
      !np ||
      !cameraConfig ||
      !isCameraReady
    )
      return

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
  })

  // fov handler
  useFrame(() => {
    if (
      !cameraControlsRef.current ||
      !(cameraControlsRef.current.camera instanceof PerspectiveCamera)
    )
      return

    if (cameraControlsRef.current.camera.fov !== currentFov.current) {
      cameraControlsRef.current.camera.fov = currentFov.current
      cameraControlsRef.current.camera.updateProjectionMatrix()
    }
  })

  const planePosition = useCallback(() => basePosition, [basePosition])

  if (!isCameraReady) {
    return null
  }

  return (
    <>
      <CameraControls makeDefault ref={cameraControlsRef} />
      <mesh ref={planeRef} position={planePosition() ?? [0, 0, 0]} />
      <mesh ref={planeBoundaryRef} position={planePosition() ?? [0, 0, 0]} />
    </>
  )
}
