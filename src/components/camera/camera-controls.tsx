import { CameraControls } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { easing } from "maath"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { Mesh, PerspectiveCamera, Vector3 } from "three"

import { useCameraStore } from "@/store/app-store"

import {
  calculateMovementVectors,
  calculateNewPosition,
  calculatePlanePosition,
  calculateViewDimensions,
  easeInOutCubic
} from "./camera-utils"
import { useNavigationStore } from "../navigation-handler/navigation-store"

export const CustomCamera = () => {
  const cameraControlsRef = useRef<CameraControls>(null)
  const planeRef = useRef<Mesh>(null)
  const planeBoundaryRef = useRef<Mesh>(null)
  const navigationCameraConfig = useNavigationStore(
    (state) => state.currentScene?.cameraConfig
  )
  const pathname = usePathname()
  const scene = useThree((state) => state.scene)

  const { debugBoundaries } = useControls({
    debugBoundaries: false
  })

  const currentPos = useMemo(() => new Vector3(), [])
  const currentTarget = useMemo(() => new Vector3(), [])
  const targetPosition = useMemo(() => new Vector3(), [])
  const targetLookAt = useMemo(() => new Vector3(), [])
  const animationProgress = useRef(1)
  const ANIMATION_DURATION = 1.5 //secs

  const gametargetFov = useRef<number>(60)
  const gameCurrentFov = useRef<number>(60)
  const fovTransitionProgress = useRef<number>(1)

  useEffect(() => {
    const controls = cameraControlsRef.current
    const camera = controls?.camera as PerspectiveCamera

    const [plane, boundary] = [planeRef.current, planeBoundaryRef.current]
    if (!controls || !plane || !boundary || !camera || !navigationCameraConfig)
      return

    controls.disconnect()
    controls.setPosition(...navigationCameraConfig.position)
    controls.setTarget(...navigationCameraConfig.target)

    //TODO: remove this
    useCameraStore.getState().setCamera(camera)

    gameCurrentFov.current = camera.fov
    gametargetFov.current = navigationCameraConfig.fov ?? 60
    fovTransitionProgress.current = 0

    const planePos = calculatePlanePosition(navigationCameraConfig)
    const distance = Math.hypot(
      ...navigationCameraConfig.position.map((p, i) => p - planePos[i])
    )
    const { width, height } = calculateViewDimensions(
      camera,
      distance,
      navigationCameraConfig
    )

    ;[plane, boundary].forEach((mesh) =>
      mesh.lookAt(...navigationCameraConfig.position)
    )
    boundary.scale.set(width * 0.6, height, 1)
    plane.scale.set(width * 0.4, height, 1)
  }, [])

  useEffect(() => {
    if (!navigationCameraConfig) return

    const initialY = navigationCameraConfig.position[1]
    const targetY =
      navigationCameraConfig.targetScrollY ??
      -navigationCameraConfig.position[1]

    const handleScroll = () => {
      const rawScrollProgress = window.scrollY / window.innerHeight
      const scrollProgress = Math.min(1, rawScrollProgress * 1)

      const newY = initialY + (targetY - initialY) * scrollProgress
      const originalTargetY = navigationCameraConfig.target[1]
      const originalDelta = originalTargetY - initialY
      const newTargetY = newY + originalDelta

      if (cameraControlsRef.current) {
        const pos = cameraControlsRef.current.getPosition(new Vector3())
        const target = cameraControlsRef.current.getTarget(new Vector3())

        pos.y = newY
        target.y = newTargetY
        cameraControlsRef.current.setPosition(pos.x, pos.y, pos.z, false)
        cameraControlsRef.current.setTarget(target.x, target.y, target.z, false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [navigationCameraConfig, pathname])

  useFrame(({ pointer }, dt) => {
    const controls = cameraControlsRef.current
    const plane = planeRef.current
    const boundary = planeBoundaryRef.current
    if (!plane || !boundary || !controls || !navigationCameraConfig) return

    if (animationProgress.current < 1) {
      // Handle camera transition animation
      animationProgress.current = Math.min(
        animationProgress.current + dt / ANIMATION_DURATION,
        1
      )

      if (pathname === "/" && animationProgress.current === 1) {
        const stair3 = scene.getObjectByName("SM_Stair3") as Mesh
        stair3.visible = false
      }

      controls.getPosition(currentPos)
      controls.getTarget(currentTarget)

      targetPosition.set(...navigationCameraConfig.position)
      targetLookAt.set(...navigationCameraConfig.target)

      const easeValue = easeInOutCubic(animationProgress.current)
      currentPos.lerp(targetPosition, easeValue)
      currentTarget.lerp(targetLookAt, easeValue)

      controls.setPosition(currentPos.x, currentPos.y, currentPos.z, false)
      controls.setTarget(
        currentTarget.x,
        currentTarget.y,
        currentTarget.z,
        false
      )
    } else {
      if (pathname !== "/basketball") {
        const maxOffset = (boundary.scale.x - plane.scale.x) / 2
        const basePosition = calculatePlanePosition(navigationCameraConfig)
        const rightVector = calculateMovementVectors(
          basePosition,
          navigationCameraConfig
        )

        const offsetMultiplier = navigationCameraConfig.offsetMultiplier ?? 2
        const offset = pointer.x * maxOffset * offsetMultiplier

        // Update plane position
        const targetPos = {
          x: basePosition[0] + rightVector.x * offset,
          z: basePosition[2] + rightVector.z * offset
        }
        const newPos = calculateNewPosition(
          { x: plane.position.x, z: plane.position.z },
          targetPos
        )
        plane.position.setX(newPos.x)
        plane.position.setZ(newPos.z)

        // Set camera position directly for horizontal movement
        const currentPosition = controls.getPosition(new Vector3())
        const targetPosition = new Vector3(
          navigationCameraConfig.position[0] + rightVector.x * offset,
          currentPosition.y,
          navigationCameraConfig.position[2] + rightVector.z * offset
        )

        easing.damp3(currentPosition, targetPosition, 0.1, dt)
        controls.setPosition(
          currentPosition.x,
          currentPosition.y,
          currentPosition.z,
          false
        )

        const currentTarget = controls.getTarget(new Vector3())
        const targetLookAt = new Vector3(
          navigationCameraConfig.target[0] + rightVector.x * offset,
          currentTarget.y,
          navigationCameraConfig.target[2] + rightVector.z * offset
        )

        easing.damp3(currentTarget, targetLookAt, 0.05, dt)
        controls.setTarget(
          currentTarget.x,
          currentTarget.y,
          currentTarget.z,
          false
        )
      }
    }

    if (controls.camera instanceof PerspectiveCamera) {
      fovTransitionProgress.current = Math.min(
        fovTransitionProgress.current + dt * 0.5,
        1
      )

      const easedProgress = easeInOutCubic(fovTransitionProgress.current)

      gameCurrentFov.current =
        gameCurrentFov.current +
        (gametargetFov.current - gameCurrentFov.current) * easedProgress
      controls.camera.fov = gameCurrentFov.current
      controls.camera.updateProjectionMatrix()
    }
  })

  useEffect(() => {
    if (!navigationCameraConfig) return

    animationProgress.current = 0
    targetPosition.set(...navigationCameraConfig.position)
    targetLookAt.set(...navigationCameraConfig.target)

    gametargetFov.current = navigationCameraConfig.fov ?? 60
    fovTransitionProgress.current = 0
  }, [navigationCameraConfig, targetPosition, targetLookAt])

  const planePosition = useCallback(() => {
    if (!navigationCameraConfig) return
    return calculatePlanePosition(navigationCameraConfig)
  }, [navigationCameraConfig])

  return (
    <>
      <CameraControls makeDefault ref={cameraControlsRef} />
      <mesh
        ref={planeRef}
        position={planePosition() ?? [0, 0, 0]}
        visible={debugBoundaries}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="green" transparent wireframe />
      </mesh>
      <mesh
        ref={planeBoundaryRef}
        position={planePosition() ?? [0, 0, 0]}
        visible={debugBoundaries}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="red" transparent wireframe opacity={0.5} />
      </mesh>
    </>
  )
}
