import { CameraControls } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useGesture } from "@use-gesture/react"
import { animate } from "motion"
import { useMotionValue, useSpring } from "motion/react"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef } from "react"
import {
  LineSegments,
  Mesh,
  PerspectiveCamera,
  ShaderMaterial,
  Vector2,
  Vector3
} from "three"

import {
  CAMERA_STATES,
  PROJECTS_CAMERA_SENSITIVITY,
  PROJECTS_LEFT_LIM,
  PROJECTS_RIGHT_LIM
} from "@/constants/camera-states"
import { useMousePosition } from "@/hooks/use-mouse-position"
import { useStateToRef } from "@/hooks/use-state-to-ref"
import { GLOBAL_SHADER_MATERIAL_NAME } from "@/shaders/material-global-shader"
import { CameraState, CameraStateKeys, useCameraStore } from "@/store/app-store"
import { cameraAnimationConfig, easeInOutCubic } from "@/utils/animations"

import { useAssets } from "./assets-provider"
import { useInspectable } from "./inspectables/context"

const PATHNAME_MAP: Record<string, CameraStateKeys> = {
  "/": "home",
  "/arcade": "arcade",
  "/about": "stairs",
  "/basketball": "hoop",
  "/projects": "projects"
}

export const CustomCamera = () => {
  const pathname = usePathname()
  const scene = useThree((state) => state.scene)
  const { cameraConfig, cameraState } = useCameraStore()
  const { selected } = useInspectable()
  const cameraControlsRef = useRef<CameraControls>(null)
  const isInitializedRef = useRef(false)
  const previousCameraState = useRef<string | null>(null)
  const mouseInfluenceRef = useRef<number>(1)
  const gametargetFov = useRef<number>(60)
  const gameCurrentFov = useRef<number>(60)
  const fovTransitionProgress = useRef<number>(1)

  const currentPos = useMemo(() => new Vector3(), [])
  const currentTarget = useMemo(() => new Vector3(), [])
  const targetPosition = useMemo(() => new Vector3(), [])
  const targetLookAt = useMemo(() => new Vector3(), [])

  const offsetX = useMotionValue(0)
  const offsetY = useMotionValue(0)
  const offsetXSpring = useSpring(offsetX, {
    stiffness: 64,
    damping: 16,
    mass: 1
  })

  const mouseUV = useMousePosition((s) => s.uv)
  const smoothMouseUv = useMemo(() => new Vector2(0.5, 0.5), [])

  const sceneRef = useStateToRef(scene)

  const { cameraStates } = useAssets()

  const getCameraState = useCallback(
    (stateName: string) => {
      const state = cameraStates.find(
        (s) => s.title.toLowerCase() === stateName.toLowerCase()
      )
      if (!state) return CAMERA_STATES[stateName as keyof typeof CAMERA_STATES]

      return {
        name: stateName,
        position: [state.position.x, state.position.y, state.position.z] as [
          number,
          number,
          number
        ],
        target: [state.target.x, state.target.y, state.target.z] as [
          number,
          number,
          number
        ],
        rotationAngle: CAMERA_STATES[stateName as keyof typeof CAMERA_STATES]
          ?.rotationAngle ?? [0, 0],
        rotationLerp:
          CAMERA_STATES[stateName as keyof typeof CAMERA_STATES]
            ?.rotationLerp ?? 0.03,
        fov:
          state.fov ??
          CAMERA_STATES[stateName as keyof typeof CAMERA_STATES]?.fov ??
          60
      }
    },
    [cameraStates]
  )

  const animateShader = useCallback(
    (start: number, end: number) => {
      animate(start, end, {
        duration: 1.5,
        onUpdate: (latest) => {
          sceneRef.current.traverse((child) => {
            if (!("material" in child)) return

            const meshChild = child as Mesh | LineSegments
            if (Array.isArray(meshChild.material)) {
              meshChild.material.forEach((material) => {
                if (material.name !== GLOBAL_SHADER_MATERIAL_NAME) return
                ;(material as ShaderMaterial).uniforms.uProgress.value = latest
              })
            } else {
              if (meshChild.material.name !== GLOBAL_SHADER_MATERIAL_NAME)
                return
              ;(meshChild.material as ShaderMaterial).uniforms.uProgress.value =
                latest
            }
          })
        }
      })
    },
    [sceneRef]
  )

  const handleCameraStateChange = useCallback(
    (newState: string) => {
      const isMenuTransition =
        previousCameraState.current === "menu" || newState === "menu"

      if (isMenuTransition) {
        if (previousCameraState.current === "menu") {
          animateShader(1, 0)
        } else {
          animateShader(0, 1)
        }
      }

      const state = getCameraState(newState)
      gametargetFov.current = state?.fov ?? 60
      gameCurrentFov.current =
        cameraControlsRef.current?.camera instanceof PerspectiveCamera
          ? cameraControlsRef.current.camera.fov
          : 60
      fovTransitionProgress.current = 0

      previousCameraState.current = newState
    },
    [animateShader, getCameraState]
  )

  useEffect(() => {
    const controls = cameraControlsRef.current
    if (!controls) return

    controls.disconnect()

    if (!isInitializedRef.current) {
      const initialState = PATHNAME_MAP[pathname] || "home"
      const initialConfig = getCameraState(initialState)

      currentPos.set(...initialConfig.position)
      currentTarget.set(...initialConfig.target)

      controls.setPosition(...initialConfig.position)
      controls.setTarget(...initialConfig.target)

      isInitializedRef.current = true
    }

    useCameraStore.getState().setCamera(controls.camera as PerspectiveCamera)
  }, [pathname, currentPos, currentTarget, getCameraState])

  useEffect(() => {
    if (!isInitializedRef.current) return

    const config = getCameraState(cameraConfig.name)
    targetPosition.set(...config.position)
    targetLookAt.set(...config.target)
    gametargetFov.current = config.fov ?? 60
    fovTransitionProgress.current = 0

    cameraAnimationConfig.progress = 0
    mouseInfluenceRef.current = 1

    offsetX.set(0)
    offsetY.set(0)

    handleCameraStateChange(cameraConfig.name)
  }, [
    cameraConfig,
    targetPosition,
    targetLookAt,
    offsetX,
    offsetY,
    handleCameraStateChange,
    getCameraState
  ])

  useFrame((_, delta) => {
    const controls = cameraControlsRef.current
    if (!controls || !isInitializedRef.current) return

    if (controls.camera instanceof PerspectiveCamera) {
      fovTransitionProgress.current = Math.min(
        fovTransitionProgress.current + delta * 0.5,
        1
      )

      const easedProgress = easeInOutCubic(fovTransitionProgress.current)

      gameCurrentFov.current =
        gameCurrentFov.current +
        (gametargetFov.current - gameCurrentFov.current) * easedProgress
      controls.camera.fov = gameCurrentFov.current
      controls.camera.updateProjectionMatrix()
    }

    const rotationAngle = cameraConfig.rotationAngle || [0, 0]
    const rotationLerp = cameraConfig.rotationLerp || 0.03

    smoothMouseUv.lerp(mouseUV, Math.min(rotationLerp * delta * 100, 1))

    if (cameraAnimationConfig.progress < 1) {
      cameraAnimationConfig.progress = Math.min(
        cameraAnimationConfig.progress + delta / cameraAnimationConfig.duration,
        1
      )
      const easeValue = cameraAnimationConfig.easing(
        cameraAnimationConfig.progress
      )

      controls.getPosition(currentPos)
      controls.getTarget(currentTarget)

      currentPos.lerp(targetPosition, easeValue)
      currentTarget.lerp(targetLookAt, easeValue)

      const transitionScale = Math.pow(cameraAnimationConfig.progress, 3)
      const mouseSpringX = (smoothMouseUv.x - 0.5) * rotationAngle[0]
      const mouseSpringY = (smoothMouseUv.y - 0.5) * rotationAngle[1]

      currentTarget.z -= mouseSpringX * transitionScale
      currentTarget.y -= mouseSpringY * transitionScale

      controls.setPosition(currentPos.x, currentPos.y, currentPos.z)
      controls.setTarget(currentTarget.x, currentTarget.y, currentTarget.z)
    } else if (cameraState === "projects") {
      const springX = Math.max(
        PROJECTS_RIGHT_LIM,
        Math.min(PROJECTS_LEFT_LIM, offsetXSpring.get())
      )
      const baseTarget = CAMERA_STATES.projects.target
      const basePosition = CAMERA_STATES.projects.position

      const mouseSpringX =
        (smoothMouseUv.x - 0.5) * rotationAngle[0] * mouseInfluenceRef.current
      const mouseSpringY =
        (smoothMouseUv.y - 0.5) * rotationAngle[1] * mouseInfluenceRef.current

      if (!selected) {
        controls.setTarget(
          baseTarget[0],
          baseTarget[1] - mouseSpringY,
          baseTarget[2] + springX - mouseSpringX
        )

        controls.setPosition(
          basePosition[0],
          basePosition[1],
          basePosition[2] + springX
        )
      }
    } else {
      const springX = (smoothMouseUv.x - 0.5) * rotationAngle[0]
      const springY = (smoothMouseUv.y - 0.5) * rotationAngle[1]

      if (cameraState === "menu") {
        const baseTarget = CAMERA_STATES.menu.target
        const basePosition = CAMERA_STATES.menu.position

        controls.setTarget(
          baseTarget[0] + springX,
          baseTarget[1] - springY,
          baseTarget[2]
        )
        controls.setPosition(basePosition[0], basePosition[1], basePosition[2])
      } else {
        const baseTarget = CAMERA_STATES[cameraState].target
        const basePosition = CAMERA_STATES[cameraState].position

        controls.setTarget(
          baseTarget[0],
          baseTarget[1] - springY,
          baseTarget[2] - springX
        )

        controls.setPosition(basePosition[0], basePosition[1], basePosition[2])
      }
    }

    controls.update(delta)
  })

  useGesture(
    {
      onDrag: ({
        delta: [x],
        memo = [offsetX.get(), offsetY.get()],
        first
      }) => {
        if (cameraState !== "projects" || selected) return memo

        const newX = Math.max(
          PROJECTS_RIGHT_LIM,
          Math.min(PROJECTS_LEFT_LIM, memo[0] + x * PROJECTS_CAMERA_SENSITIVITY)
        )

        offsetX.set(newX)

        return [newX, memo[1]]
      }
    },
    {
      target: window,
      eventOptions: { passive: false }
    }
  )

  return <CameraControls makeDefault ref={cameraControlsRef} />
}
