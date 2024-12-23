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
import { cameraAnimationConfig } from "@/utils/animations"

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

      previousCameraState.current = newState
    },
    [animateShader]
  )

  useEffect(() => {
    const controls = cameraControlsRef.current
    if (!controls) return

    controls.disconnect()

    if (!isInitializedRef.current) {
      const initialState = PATHNAME_MAP[pathname] || "home"
      const initialConfig =
        CAMERA_STATES[initialState as keyof typeof CAMERA_STATES]

      currentPos.set(...initialConfig.position)
      currentTarget.set(...initialConfig.target)

      controls.setPosition(...initialConfig.position)
      controls.setTarget(...initialConfig.target)

      if (initialConfig.fov && controls.camera instanceof PerspectiveCamera) {
        controls.camera.fov = initialConfig.fov
        controls.camera.updateProjectionMatrix()
      }

      isInitializedRef.current = true
    }

    useCameraStore.getState().setCamera(controls.camera as PerspectiveCamera)
  }, [pathname, currentPos, currentTarget])

  useEffect(() => {
    if (!isInitializedRef.current) return

    const { position, target, fov } = cameraConfig as unknown as CameraState
    targetPosition.set(...position)
    targetLookAt.set(...target)

    const controls = cameraControlsRef.current
    if (controls && fov && controls.camera instanceof PerspectiveCamera) {
      controls.camera.fov = fov
      controls.camera.updateProjectionMatrix()
    }

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
    handleCameraStateChange
  ])

  useFrame((_, delta) => {
    const controls = cameraControlsRef.current
    if (!controls || !isInitializedRef.current) return

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
