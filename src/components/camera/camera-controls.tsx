import { CameraControls } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { easing } from "maath"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { Mesh, PerspectiveCamera, Vector3 } from "three"

import { useInspectable } from "../inspectables/context"
import { useNavigationStore } from "../navigation-handler/navigation-store"
import {
  calculateMovementVectors,
  calculateNewPosition,
  calculatePlanePosition,
  calculateViewDimensions,
  easeInOutCubic
} from "./camera-utils"

export const CustomCamera = () => {
  const pathname = usePathname()

  const { selected } = useInspectable()

  const cameraControlsRef = useRef<CameraControls>(null)
  const planeRef = useRef<Mesh>(null)
  const planeBoundaryRef = useRef<Mesh>(null)
  const animationProgress = useRef(1)
  const offsetY = useRef(0)
  const gametargetFov = useRef<number>(60)
  const gameCurrentFov = useRef<number>(60)
  const fovTransitionProgress = useRef<number>(1)

  const cameraConfig = useNavigationStore.getState().currentScene?.cameraConfig
  const setStairVisibility = useNavigationStore.getState().setStairVisibility

  const scene = useThree((state) => state.scene)

  const { debugBoundaries } = useControls({ debugBoundaries: false })

  const currentPos = useMemo(() => new Vector3(), [])
  const currentTarget = useMemo(() => new Vector3(), [])
  const targetPosition = useMemo(() => new Vector3(), [])
  const targetLookAt = useMemo(() => new Vector3(), [])

  const ANIMATION_DURATION = 1.5 //secs

  const stairVisibility = useNavigationStore((state) => state.stairVisibility)

  useEffect(() => {
    const controls = cameraControlsRef.current
    const camera = controls?.camera as PerspectiveCamera

    const [plane, boundary] = [planeRef.current, planeBoundaryRef.current]
    if (!controls || !plane || !boundary || !camera || !cameraConfig) return

    controls.disconnect()
    controls.setPosition(...cameraConfig.position)
    controls.setTarget(...cameraConfig.target)

    //TODO: remove this
    useNavigationStore.getState().setMainCamera(camera)

    gameCurrentFov.current = camera.fov
    gametargetFov.current = cameraConfig.fov ?? 60
    fovTransitionProgress.current = 0

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
  }, [])

  useEffect(() => {
    if (!cameraConfig) return

    const initialY = cameraConfig.position[1]
    const targetY = cameraConfig.targetScrollY ?? -cameraConfig.position[1]

    const handleScroll = () => {
      const scrollProgress = Math.min(1, window.scrollY / window.innerHeight)
      offsetY.current = (targetY - initialY) * scrollProgress
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [cameraConfig, pathname])

  const calculateDivisor = useCallback(() => {
    const width = window.innerWidth
    if (width <= 1100) return 0.32
    if (width <= 1200) return 0.36
    if (width <= 1500) return 0.4
    if (width <= 1600) return 0.8
    return 0.8
  }, [window.innerWidth])

  useFrame(({ pointer }, dt) => {
    const controls = cameraControlsRef.current
    const plane = planeRef.current
    const boundary = planeBoundaryRef.current
    if (!plane || !boundary || !controls || !cameraConfig) return

    if (animationProgress.current < 1) {
      // Handle camera transition animation
      animationProgress.current = Math.min(
        animationProgress.current + dt / ANIMATION_DURATION,
        1
      )

      if (pathname === "/" && animationProgress.current === 1)
        setStairVisibility(false)

      controls.getPosition(currentPos)
      controls.getTarget(currentTarget)

      targetPosition.set(...cameraConfig.position)
      targetLookAt.set(...cameraConfig.target)

      targetPosition.y = cameraConfig.position[1] + offsetY.current
      targetLookAt.y = cameraConfig.target[1] + offsetY.current

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
      // Only allow camera movement if no inspectable is selected
      // if (pathname !== "/basketball" && !selected) {
      //   const maxOffset = (boundary.scale.x - plane.scale.x) / 2
      //   const basePosition = calculatePlanePosition(cameraConfig)
      //   const rightVector = calculateMovementVectors(
      //     basePosition,
      //     cameraConfig
      //   )

      //   const offsetMultiplier = cameraConfig.offsetMultiplier ?? 2
      //   const offset = pointer.x * maxOffset * offsetMultiplier

      //   // Update plane position
      //   const targetPos = {
      //     x: basePosition[0] + rightVector.x * offset,
      //     z: basePosition[2] + rightVector.z * offset
      //   }
      //   const newPos = calculateNewPosition(
      //     { x: plane.position.x, z: plane.position.z },
      //     targetPos
      //   )
      //   plane.position.setX(newPos.x)
      //   plane.position.setZ(newPos.z)

      //   // Set camera position directly for horizontal movement
      //   const currentPosition = controls.getPosition(new Vector3())
      //   const targetPosition = new Vector3(
      //     cameraConfig.position[0] + rightVector.x * offset,
      //     currentPosition.y,
      //     cameraConfig.position[2] + rightVector.z * offset
      //   )

      //   easing.damp3(currentPosition, targetPosition, 0.1, dt)
      //   controls.setPosition(
      //     currentPosition.x,
      //     currentPosition.y,
      //     currentPosition.z,
      //     false
      //   )

      //   const currentTarget = controls.getTarget(new Vector3())
      //   const targetLookAt = new Vector3(
      //     cameraConfig.target[0] +
      //       (rightVector.x * offset) / calculateDivisor(),
      //     currentTarget.y,
      //     cameraConfig.target[2] + rightVector.z * offset
      //   )

      //   easing.damp3(currentTarget, targetLookAt, 0.05, dt)
      //   controls.setTarget(
      //     currentTarget.x,
      //     currentTarget.y,
      //     currentTarget.z,
      //     false
      //   )
      // }

      targetPosition.y = cameraConfig.position[1] + offsetY.current
      targetLookAt.y = cameraConfig.target[1] + offsetY.current
      currentPos.lerp(targetPosition, 0.5)
      currentTarget.lerp(targetLookAt, 0.5)

      controls.setPosition(currentPos.x, currentPos.y, currentPos.z, false)
      controls.setTarget(
        currentTarget.x,
        currentTarget.y,
        currentTarget.z,
        false
      )
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
    if (!cameraConfig) return

    animationProgress.current = 0
    targetPosition.set(...cameraConfig.position)
    targetLookAt.set(...cameraConfig.target)

    gametargetFov.current = cameraConfig.fov ?? 60
    fovTransitionProgress.current = 0
  }, [cameraConfig, targetPosition, targetLookAt])

  const planePosition = useCallback(
    () => (cameraConfig ? calculatePlanePosition(cameraConfig) : null),
    [cameraConfig]
  )

  useEffect(() => {
    const stair3 = scene.getObjectByName("SM_Stair3") as Mesh
    if (stair3) stair3.visible = stairVisibility
  }, [scene, stairVisibility])

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
