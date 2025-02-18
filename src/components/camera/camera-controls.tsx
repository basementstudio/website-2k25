import { CameraControls } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { easing } from "maath"
import { useLenis } from "lenis/react"
import { useCallback, useEffect, useRef, useState } from "react"
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
const ANIMATION_DURATION = 2

export const CustomCamera = () => {
  const { selected } = useInspectable()
  const [firstRender, setFirstRender] = useState(true)

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

  const calculateDivisor = useCallback(() => {
    const width = window.innerWidth
    if (width <= 1100) return 0.32
    if (width <= 1200) return 0.36
    if (width <= 1500) return 0.4
    if (width <= 1600) return 0.8
    return 0.8
  }, [window.innerWidth])

  // camera position and target handler
  useFrame((_, dt) => {
    const controls = cameraControlsRef.current
    if (!controls || !cameraConfig || !lenis) return

    const prevTargetY = targetPosition.y
    const prevLookAtY = targetLookAt.y
    const prevFov = currentFov.current

    targetPosition.set(...cameraConfig.position)
    targetLookAt.set(...cameraConfig.target)
    targetFov.current = cameraConfig.fov ?? 60

    const scrollFactor = Math.min(1, lenis.scroll / window.innerHeight)
    const yOffset = (targetY - initialY) * scrollFactor
    targetPosition.y += yOffset
    targetLookAt.y += yOffset

    if (disableCameraTransition || firstRender) {
      progress.current = 1
      currentPos.copy(targetPosition)
      currentTarget.copy(targetLookAt)
      currentFov.current = targetFov.current

      const finalPos = currentPos.clone().add(panTargetDelta)
      const finalLookAt = currentTarget.clone().add(panLookAtDelta)
      controls.setPosition(finalPos.x, finalPos.y, finalPos.z, false)
      controls.setTarget(finalLookAt.x, finalLookAt.y, finalLookAt.z, false)

      setTimeout(() => setDisableCameraTransition(false), TRANSITION_DURATION)
    } else if (progress.current < 1) {
      progress.current = Math.min(progress.current + dt / ANIMATION_DURATION, 1)
      const easeValue = easeInOutCubic(progress.current)

      if (progress.current === dt / ANIMATION_DURATION) {
        currentPos.y = prevTargetY
        currentTarget.y = prevLookAtY
        currentFov.current = prevFov
      }

      currentPos.lerp(targetPosition, easeValue)
      currentTarget.lerp(targetLookAt, easeValue)
      currentFov.current = prevFov + (targetFov.current - prevFov) * easeValue

      const pos = currentPos.clone().add(panTargetDelta)
      controls.setPosition(pos.x, pos.y, pos.z, false)

      const lookAt = currentTarget.clone().add(panLookAtDelta)
      controls.setTarget(lookAt.x, lookAt.y, lookAt.z, false)
    } else {
      const pos = targetPosition.clone().add(panTargetDelta)
      controls.setPosition(pos.x, pos.y, pos.z, false)

      const lookAt = targetLookAt.clone().add(panLookAtDelta)
      controls.setTarget(lookAt.x, lookAt.y, lookAt.z, false)
    }

    if (firstRender) setFirstRender(false)
  })

  // boundaries handler
  useFrame(({ pointer }, dt) => {
    const plane = planeRef.current
    const boundary = planeBoundaryRef.current
    if (!plane || !boundary || !cameraConfig || selected) return

    const maxOffset = (boundary.scale.x - plane.scale.x) / 2
    const basePosition = calculatePlanePosition(cameraConfig)
    const right = calculateMovementVectors(basePosition, cameraConfig)

    const offsetMultiplier = cameraConfig.offsetMultiplier ?? 2
    const offset = pointer.x * maxOffset * offsetMultiplier

    const xPos = right.x * offset
    const zPos = right.z * offset

    const tp = {
      x: basePosition[0] + xPos,
      z: basePosition[2] + zPos
    }
    const np = calculateNewPosition(
      { x: plane.position.x, z: plane.position.z },
      tp
    )
    plane.position.setX(np.x)
    plane.position.setZ(np.z)

    newDelta.set(xPos, 0, zPos)
    newLookAtDelta.set(xPos / calculateDivisor(), 0, zPos)

    easing.damp3(panTargetDelta, newDelta, 0.5, dt)
    easing.damp3(panLookAtDelta, newLookAtDelta, 0.25, dt)
  })

  // fov handler
  useFrame(() => {
    const controls = cameraControlsRef.current
    if (!controls || !(controls.camera instanceof PerspectiveCamera)) return

    if (controls.camera.fov !== currentFov.current) {
      controls.camera.fov = currentFov.current
      controls.camera.updateProjectionMatrix()
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
