import { CameraControls } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { easing } from "maath"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mesh, PerspectiveCamera, Vector3 } from "three"

import { useInspectable } from "@/components/inspectables/context"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useCurrentScene } from "@/hooks/use-current-scene"

import {
  calculateMovementVectors,
  calculateNewPosition,
  calculatePlanePosition,
  calculateViewDimensions,
  easeInOutCubic
} from "./camera-utils"

export const CustomCamera = () => {
  const pathname = usePathname()

  const currentScene = useCurrentScene()
  const { selected } = useInspectable()

  const [firstRender, setFirstRender] = useState(true)

  const cameraControlsRef = useRef<CameraControls>(null)
  const planeRef = useRef<Mesh>(null)
  const planeBoundaryRef = useRef<Mesh>(null)

  const cameraConfig = useNavigationStore.getState().currentScene?.cameraConfig
  const setStairVisibility = useNavigationStore.getState().setStairVisibility
  const disableCameraTransition =
    useNavigationStore.getState().disableCameraTransition
  const setDisableCameraTransition =
    useNavigationStore.getState().setDisableCameraTransition

  const scene = useThree((state) => state.scene)

  const { debugBoundaries } = useControls({ debugBoundaries: false })

  const animationProgress = useRef(1)
  const offsetY = useRef(0)

  const panningTarget = useRef<Vector3>(new Vector3())
  const panningTargetLookAt = useRef<Vector3>(new Vector3())
  const panningOffset = useRef<Vector3>(new Vector3())
  const panningOffsetLookAt = useRef<Vector3>(new Vector3())

  const currentPos = useMemo(() => new Vector3(), [])
  const currentTarget = useMemo(() => new Vector3(), [])
  const currentFov = useRef<number>(60)

  const targetPosition = useMemo(() => new Vector3(), [])
  const targetLookAt = useMemo(() => new Vector3(), [])
  const targetFov = useRef<number>(60)

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

    return () => {
      controls.dispose()
    }
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
  }, [cameraConfig])

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

    // Calculate targets
    targetPosition.set(...cameraConfig.position)
    targetLookAt.set(...cameraConfig.target)
    targetFov.current = cameraConfig.fov ?? 60

    targetPosition.y += offsetY.current
    targetLookAt.y += offsetY.current

    if (!selected) {
      const maxOffset = (boundary.scale.x - plane.scale.x) / 2
      const basePosition = calculatePlanePosition(cameraConfig)
      const rightVector = calculateMovementVectors(basePosition, cameraConfig)

      const offsetMultiplier = cameraConfig.offsetMultiplier ?? 2
      const offset = pointer.x * maxOffset * offsetMultiplier

      const tp = {
        x: basePosition[0] + rightVector.x * offset,
        z: basePosition[2] + rightVector.z * offset
      }
      const np = calculateNewPosition(
        { x: plane.position.x, z: plane.position.z },
        tp
      )
      plane.position.setX(np.x)
      plane.position.setZ(np.z)

      const offsetP = new Vector3(
        targetPosition.x + rightVector.x * offset,
        targetPosition.y,
        targetPosition.z + rightVector.z * offset
      )

      const offsetLA = new Vector3(
        targetLookAt.x + (rightVector.x * offset) / calculateDivisor(),
        targetLookAt.y,
        targetLookAt.z + rightVector.z * offset
      )

      panningTarget.current.set(offsetP.x, offsetP.y, offsetP.z)
      panningTargetLookAt.current.set(offsetLA.x, offsetLA.y, offsetLA.z)

      const newPanningOffset = new Vector3(
        panningTarget.current.x - targetPosition.x,
        panningTarget.current.y - targetPosition.y,
        panningTarget.current.z - targetPosition.z
      )

      const newPanningOffsetLookAt = new Vector3(
        panningTargetLookAt.current.x - targetLookAt.x,
        panningTargetLookAt.current.y - targetLookAt.y,
        panningTargetLookAt.current.z - targetLookAt.z
      )

      easing.damp3(panningOffset.current, newPanningOffset, 0.5, dt)
      easing.damp3(
        panningOffsetLookAt.current,
        newPanningOffsetLookAt,
        0.25,
        dt
      )
    }

    if (disableCameraTransition || firstRender) {
      animationProgress.current = 1
      currentPos.set(...cameraConfig.position)
      currentTarget.set(...cameraConfig.target)
      currentFov.current = cameraConfig.fov ?? 60
      controls.setPosition(currentPos.x, currentPos.y, currentPos.z, false)
      controls.setTarget(
        currentTarget.x,
        currentTarget.y,
        currentTarget.z,
        false
      )
      if (controls.camera instanceof PerspectiveCamera) {
        controls.camera.fov = currentFov.current
        controls.camera.updateProjectionMatrix()
      }

      setStairVisibility(currentScene !== "home")

      setTimeout(() => setDisableCameraTransition(false), 750)
    } else if (animationProgress.current < 1) {
      // Handle camera transition animation
      animationProgress.current = Math.min(
        animationProgress.current + dt / ANIMATION_DURATION,
        1
      )

      if (
        animationProgress.current > 0.8 &&
        currentScene === "home" &&
        stairVisibility
      ) {
        setStairVisibility(false)
      } else if (
        // TODO: fix this behaviour
        animationProgress.current > 0.2 &&
        currentScene !== "home" &&
        !stairVisibility
      ) {
        setStairVisibility(true)
      }

      const easeValue = easeInOutCubic(animationProgress.current)

      controls.setPosition(
        currentPos.x + panningOffset.current.x,
        currentPos.y + panningOffset.current.y,
        currentPos.z + panningOffset.current.z,
        false
      )
      controls.setTarget(
        currentTarget.x + panningOffsetLookAt.current.x,
        currentTarget.y + panningOffsetLookAt.current.y,
        currentTarget.z + panningOffsetLookAt.current.z,
        false
      )

      // update current targets
      currentPos.lerp(targetPosition, easeValue)
      currentTarget.lerp(targetLookAt, easeValue)
      currentFov.current =
        currentFov.current +
        (targetFov.current - currentFov.current) * easeValue
    } else {
      controls.setPosition(
        targetPosition.x + panningOffset.current.x,
        targetPosition.y + panningOffset.current.y,
        targetPosition.z + panningOffset.current.z,
        false
      )
      controls.setTarget(
        targetLookAt.x + panningOffsetLookAt.current.x,
        targetLookAt.y + panningOffsetLookAt.current.y,
        targetLookAt.z + panningOffsetLookAt.current.z,
        false
      )
    }

    if (controls.camera instanceof PerspectiveCamera) {
      controls.camera.fov = currentFov.current
      controls.camera.updateProjectionMatrix()
    }

    if (firstRender) setFirstRender(false)
  })

  useEffect(() => {
    if (!cameraConfig) return
    animationProgress.current = 0

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraConfig])

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
