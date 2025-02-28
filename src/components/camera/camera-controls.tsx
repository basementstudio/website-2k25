import { CameraControls } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
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
const ANIMATION_DURATION = 2
const NOT_FOUND_DURATION = 12

interface Props {
  transition404Progress?: number
}

export const CustomCamera = ({ transition404Progress = 0 }: Props) => {
  const { selected } = useInspectable()
  const [firstRender, setFirstRender] = useState(true)
  const [transitionPhase, setTransitionPhase] = useState<
    "to-origin" | "to-home" | null
  >(null)

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

  const initialY = cameraConfig?.position[1] ?? 0
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

  // Initialize camera position on mount for root route
  useEffect(() => {
    const controls = cameraControlsRef.current
    if (!controls || !cameraConfig) return

    // Set initial camera position and target based on cameraConfig
    if (firstRender) {
      currentPos.set(...cameraConfig.position)
      currentTarget.set(...cameraConfig.target)
      currentFov.current = cameraConfig.fov ?? 60

      controls.setPosition(
        cameraConfig.position[0],
        cameraConfig.position[1],
        cameraConfig.position[2],
        false
      )
      controls.setTarget(
        cameraConfig.target[0],
        cameraConfig.target[1],
        cameraConfig.target[2],
        false
      )

      if (controls.camera instanceof PerspectiveCamera) {
        controls.camera.fov = currentFov.current
        controls.camera.updateProjectionMatrix()
      }

      setFirstRender(false)
    }
  }, [cameraConfig, firstRender])

  // Update camera when scene changes
  useEffect(() => {
    const controls = cameraControlsRef.current
    if (!controls || !cameraConfig) return

    // Reset progress to trigger camera animation to new position
    progress.current = 0

    // Update target values
    targetPosition.set(...cameraConfig.position)
    targetLookAt.set(...cameraConfig.target)
    targetFov.current = cameraConfig.fov ?? 60
  }, [currentScene, cameraConfig])

  useEffect(() => {
    const controls = cameraControlsRef.current
    const camera = controls?.camera as PerspectiveCamera

    const [plane, boundary] = [planeRef.current, planeBoundaryRef.current]
    if (!controls || !plane || !boundary || !camera || !cameraConfig) return

    controls.disconnect()

    //TODO: remove this
    useNavigationStore.getState().setMainCamera(camera)

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
  }, [])

  useEffect(() => {
    if (!cameraConfig) return
    progress.current = 0
  }, [cameraConfig])

  const prevTargetY = useRef(0)
  const prevLookAtY = useRef(0)
  const prevFov = useRef(0)
  const controls = cameraControlsRef.current

  useFrame((_, dt) => {
    if (!controls) return

    prevTargetY.current = targetPosition.y
    prevLookAtY.current = targetLookAt.y
    prevFov.current = currentFov.current

    const is404ToHome = currentScene === "home" && previousScene === "404"

    if (is404ToHome) {
      if (!transitionPhase) {
        setTransitionPhase("to-home")
        progress.current = 0

        // tv viewing camera position
        currentPos.set(8.76, 1.13, -13)
        currentTarget.set(8.95, 1.12, -13.83)
        currentFov.current = 20

        // target: home camera
        if (cameraConfig) {
          targetPosition.set(...cameraConfig.position)
          targetLookAt.set(...cameraConfig.target)
          targetFov.current = cameraConfig.fov ?? 60
        }

        if (controls.camera instanceof PerspectiveCamera) {
          controls.camera.fov = currentFov.current
          controls.camera.updateProjectionMatrix()
        }
        return
      }

      progress.current = Math.min(progress.current + dt / NOT_FOUND_DURATION, 1)
      const easeValue = easeInOutCubic(progress.current)

      currentPos.lerp(targetPosition, easeValue)
      currentTarget.lerp(targetLookAt, easeValue)
      currentFov.current =
        currentFov.current +
        (targetFov.current - currentFov.current) * easeValue

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
      return
    }

    if (!cameraConfig) return

    targetPosition.set(...cameraConfig.position)
    targetLookAt.set(...cameraConfig.target)
    targetFov.current = cameraConfig.fov ?? 60

    if (lenis && !disableCameraTransition) {
      targetPosition.y +=
        (targetY - initialY) * Math.min(1, lenis.scroll / window.innerHeight)
      targetLookAt.y +=
        (targetY - initialY) * Math.min(1, lenis.scroll / window.innerHeight)
    }
    if (disableCameraTransition || firstRender) {
      progress.current = 1
      currentPos.copy(targetPosition)
      currentTarget.copy(targetLookAt)
      currentFov.current = targetFov.current

      finalPos.copy(currentPos).add(panTargetDelta)
      finalLookAt.copy(currentTarget).add(panLookAtDelta)
      controls.setPosition(finalPos.x, finalPos.y, finalPos.z, false)
      controls.setTarget(finalLookAt.x, finalLookAt.y, finalLookAt.z, false)

      setTimeout(() => setDisableCameraTransition(false), TRANSITION_DURATION)
    } else if (progress.current < 1) {
      progress.current = Math.min(progress.current + dt / ANIMATION_DURATION, 1)
      const easeValue = easeInOutCubic(progress.current)

      if (progress.current === dt / ANIMATION_DURATION) {
        currentPos.y = prevTargetY.current
        currentTarget.y = prevLookAtY.current
        currentFov.current = prevFov.current
      }

      currentPos.lerp(targetPosition, easeValue)
      currentTarget.lerp(targetLookAt, easeValue)
      currentFov.current =
        prevFov.current + (targetFov.current - prevFov.current) * easeValue

      finalPos.copy(currentPos).add(panTargetDelta)
      finalLookAt.copy(currentTarget).add(panLookAtDelta)
      controls.setPosition(finalPos.x, finalPos.y, finalPos.z, false)
      controls.setTarget(finalLookAt.x, finalLookAt.y, finalLookAt.z, false)

      finalLookAt.copy(currentTarget).add(panLookAtDelta)
      controls.setTarget(finalLookAt.x, finalLookAt.y, finalLookAt.z, false)
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
    if (!cameraConfig) return null
    return calculatePlanePosition(cameraConfig)
  }, [cameraConfig])

  const np = useMemo(() => {
    if (!basePosition) return null
    return calculateNewPosition(b.planePosition, b.targetPosition)
  }, [basePosition, b.planePosition, b.targetPosition])

  useFrame(({ pointer }, dt) => {
    if (!plane || !boundary || !cameraConfig || !basePosition || !np) return

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

  const planePosition = useCallback(
    () => (cameraConfig ? calculatePlanePosition(cameraConfig) : null),
    [cameraConfig]
  )

  return (
    <>
      <CameraControls makeDefault ref={cameraControlsRef} />
      <mesh ref={planeRef} position={planePosition() ?? [0, 0, 0]} />
      <mesh ref={planeBoundaryRef} position={planePosition() ?? [0, 0, 0]} />
    </>
  )
}
