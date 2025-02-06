import { CameraControls } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { easing } from "maath"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Mesh, PerspectiveCamera, Vector3 } from "three"

import { useInspectable } from "@/components/inspectables/context"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { TRANSITION_DURATION } from "@/constants/transitions"
import { useCurrentScene } from "@/hooks/use-current-scene"

import {
  calculateMovementVectors,
  calculateNewPosition,
  calculatePlanePosition,
  calculateViewDimensions,
  easeInOutCubic
} from "./camera-utils"

interface Props {
  transition404Progress?: number
}

export const CustomCamera = ({ transition404Progress = 0 }: Props) => {
  const currentScene = useCurrentScene()
  const { selected } = useInspectable()

  const [firstRender, setFirstRender] = useState(true)
  const [transitionPhase, setTransitionPhase] = useState<
    "to-origin" | "to-home" | null
  >(null)

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

  const progress = useRef(1)

  const panTargetDelta = useMemo(() => new Vector3(), [])
  const panLookAtDelta = useMemo(() => new Vector3(), [])

  const targetPosition = useMemo(() => new Vector3(), [])
  const targetLookAt = useMemo(() => new Vector3(), [])
  const targetFov = useRef<number>(60)

  const currentPos = useMemo(() => new Vector3(), [])
  const currentTarget = useMemo(() => new Vector3(), [])
  const currentFov = useRef<number>(60)

  const offsetY = useRef(0)

  const ANIMATION_DURATION = 2

  const stairVisibility = useNavigationStore((state) => state.stairVisibility)

  const previousScene = useNavigationStore.getState().previousScene

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

  useFrame(({ pointer, clock }, dt) => {
    const controls = cameraControlsRef.current
    const plane = planeRef.current
    const boundary = planeBoundaryRef.current

    if (!plane || !boundary || !controls || !cameraConfig) return

    const is404ToHome = currentScene === "home" && previousScene?.name === "404"

    if (is404ToHome) {
      if (!transitionPhase) {
        // Start first phase - teleport to origin
        setTransitionPhase("to-home")
        progress.current = 0

        // Instantly set current position to origin
        currentPos.set(8.8, 1.15, -13.6)
        currentTarget.set(8.96, 1.15, -14)
        // Set FOV to match target FOV initially - don't animate during first phase
        currentFov.current = 60

        // Set home as target
        targetPosition.set(...cameraConfig.position)
        targetLookAt.set(...cameraConfig.target)
        targetFov.current = cameraConfig.fov

        // Instantly update camera
        controls.setPosition(8.8, 1.15, -13.6, false)
        controls.setTarget(8.96, 1.15, -14, false)

        if (controls.camera instanceof PerspectiveCamera) {
          controls.camera.fov = currentFov.current
          controls.camera.updateProjectionMatrix()
        }
        return
      }

      // Handle the transition to home
      progress.current = Math.min(progress.current + dt / ANIMATION_DURATION, 1)
      const easeValue = easeInOutCubic(progress.current)

      currentPos.lerp(targetPosition, easeValue)
      currentTarget.lerp(targetLookAt, easeValue)

      // Only animate FOV during the transition to home
      currentFov.current =
        currentFov.current +
        (targetFov.current - currentFov.current) * easeValue

      // Update post-processing grayscale transition
      if (controls.camera instanceof PerspectiveCamera) {
        const material = controls.camera.userData.postProcessingMaterial
        if (material) {
          material.uniforms.u404Transition.value = 1 - easeValue
        }
      }

      // Update camera position
      const finalPos = currentPos.clone().add(panTargetDelta)
      const finalLookAt = currentTarget.clone().add(panLookAtDelta)
      controls.setPosition(finalPos.x, finalPos.y, finalPos.z, false)
      controls.setTarget(finalLookAt.x, finalLookAt.y, finalLookAt.z, false)

      setStairVisibility(false)
      return
    }

    // Handle manual 404 transition progress
    if (transition404Progress > 0) {
      if (!transitionPhase) {
        // Start transition from origin
        currentPos.set(8.8, 1.15, -13.2)
        currentTarget.set(9, 1.15, -14)
        currentFov.current = targetFov.current

        // Set home as target
        targetPosition.set(...cameraConfig.position)
        targetLookAt.set(...cameraConfig.target)
        targetFov.current = cameraConfig.fov

        // Instantly update camera
        controls.setPosition(8.8, 1.15, -13.2, false)
        controls.setTarget(9, 1.15, -14, false)
      }

      // Use the manual progress instead of animated progress
      const easeValue = easeInOutCubic(1 - transition404Progress)

      currentPos.lerp(targetPosition, easeValue)
      currentTarget.lerp(targetLookAt, easeValue)

      // Update post-processing grayscale transition
      if (controls.camera instanceof PerspectiveCamera) {
        const material = controls.camera.userData.postProcessingMaterial
        if (material) {
          material.uniforms.u404Transition.value = transition404Progress
        }
      }

      // Update camera position
      const finalPos = currentPos.clone().add(panTargetDelta)
      const finalLookAt = currentTarget.clone().add(panLookAtDelta)
      controls.setPosition(finalPos.x, finalPos.y, finalPos.z, false)
      controls.setTarget(finalLookAt.x, finalLookAt.y, finalLookAt.z, false)

      setStairVisibility(false)
      return
    }

    // Calculate targets
    targetPosition.set(...cameraConfig.position)
    targetLookAt.set(...cameraConfig.target)
    targetFov.current = cameraConfig.fov ?? 60
    targetPosition.y += offsetY.current
    targetLookAt.y += offsetY.current

    if (!selected) {
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

      const newDelta = new Vector3(xPos, 0, zPos)
      const newLookAtDelta = new Vector3(xPos / calculateDivisor(), 0, zPos)

      easing.damp3(panTargetDelta, newDelta, 0.5, dt)
      easing.damp3(panLookAtDelta, newLookAtDelta, 0.25, dt)
    }

    if (disableCameraTransition || firstRender) {
      progress.current = 1
      currentPos.set(...cameraConfig.position)
      currentTarget.set(...cameraConfig.target)
      currentFov.current = cameraConfig.fov ?? 60

      const finalPos = currentPos.clone().add(panTargetDelta)
      const finalLookAt = currentTarget.clone().add(panLookAtDelta)
      controls.setPosition(finalPos.x, finalPos.y, finalPos.z, false)
      controls.setTarget(finalLookAt.x, finalLookAt.y, finalLookAt.z, false)

      if (
        controls.camera instanceof PerspectiveCamera &&
        controls.camera.fov !== currentFov.current
      ) {
        controls.camera.fov = currentFov.current
        controls.camera.updateProjectionMatrix()
      }

      setStairVisibility(currentScene !== "home")

      setTimeout(() => setDisableCameraTransition(false), TRANSITION_DURATION)
    } else if (progress.current < 1) {
      progress.current = Math.min(progress.current + dt / ANIMATION_DURATION, 1)

      if (
        progress.current > 0.8 &&
        currentScene === "home" &&
        stairVisibility
      ) {
        setStairVisibility(false)
      } else if (
        // TODO: fix this behaviour
        progress.current > 0.2 &&
        currentScene !== "home" &&
        !stairVisibility
      ) {
        setStairVisibility(true)
      }

      const easeValue = easeInOutCubic(progress.current)

      currentPos.lerp(targetPosition, easeValue)
      currentTarget.lerp(targetLookAt, easeValue)

      const pos = currentPos.clone().add(panTargetDelta)
      controls.setPosition(pos.x, pos.y, pos.z, false)

      const lookAt = currentTarget.clone().add(panLookAtDelta)
      controls.setTarget(lookAt.x, lookAt.y, lookAt.z, false)

      currentFov.current =
        currentFov.current +
        (targetFov.current - currentFov.current) * easeValue
    } else {
      const pos = targetPosition.clone().add(panTargetDelta)
      controls.setPosition(pos.x, pos.y, pos.z, false)

      const lookAt = targetLookAt.clone().add(panLookAtDelta)
      controls.setTarget(lookAt.x, lookAt.y, lookAt.z, false)
    }

    if (
      controls.camera instanceof PerspectiveCamera &&
      controls.camera.fov !== currentFov.current
    ) {
      controls.camera.fov = currentFov.current
      controls.camera.updateProjectionMatrix()
    }

    if (firstRender) setFirstRender(false)
  })

  useEffect(() => {
    if (!cameraConfig) return
    progress.current = 0

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
