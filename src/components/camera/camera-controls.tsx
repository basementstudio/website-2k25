import { CameraControls } from "@react-three/drei"
import { useEffect, useRef, useMemo } from "react"
import { PerspectiveCamera, Mesh, Vector3 } from "three"
import { useCameraStore } from "@/store/app-store"
import { useFrame } from "@react-three/fiber"
import {
  calculateMovementVectors,
  calculateNewPosition,
  calculatePlanePosition,
  calculateViewDimensions
} from "./camera-utils"
import { easing } from "maath"
import { useControls } from "leva"

export const easeInOutCubic = (x: number): number => {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

export const CustomCamera = () => {
  const cameraControlsRef = useRef<CameraControls>(null)
  const planeRef = useRef<Mesh>(null)
  const planeBoundaryRef = useRef<Mesh>(null)
  const cameraConfig = useCameraStore((state) => state.cameraConfig)

  const { debugBoundaries } = useControls({
    debugBoundaries: false
  })

  const currentPos = useMemo(() => new Vector3(), [])
  const currentTarget = useMemo(() => new Vector3(), [])
  const targetPosition = useMemo(() => new Vector3(), [])
  const targetLookAt = useMemo(() => new Vector3(), [])
  const animationProgress = useRef(1)
  const ANIMATION_DURATION = 1.5 //secs

  useEffect(() => {
    const controls = cameraControlsRef.current

    const camera = controls?.camera as PerspectiveCamera
    const [plane, boundary] = [planeRef.current, planeBoundaryRef.current]
    if (!controls || !plane || !boundary || !camera) return

    controls.disconnect()
    controls.setPosition(...cameraConfig.position)
    controls.setTarget(...cameraConfig.target)
    useCameraStore.getState().setCamera(camera)

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
    plane.scale.set(width * 0.4, height, 1) // adjust the scale of the plane so the animation is more prominent
  }, [])

  useFrame(({ pointer }, dt) => {
    const controls = cameraControlsRef.current
    const plane = planeRef.current
    const boundary = planeBoundaryRef.current
    if (!plane || !boundary || !controls) return

    if (animationProgress.current < 1) {
      // Handle camera transition animation
      animationProgress.current = Math.min(
        animationProgress.current + dt / ANIMATION_DURATION,
        1
      )

      controls.getPosition(currentPos)
      controls.getTarget(currentTarget)

      targetPosition.set(...cameraConfig.position)
      targetLookAt.set(...cameraConfig.target)

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
      // Your existing pointer-based camera movement code
      const maxOffset = (boundary.scale.x - plane.scale.x) / 2
      const basePosition = calculatePlanePosition(cameraConfig)
      const rightVector = calculateMovementVectors(basePosition, cameraConfig)
      const offset = pointer.x * maxOffset

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

      // Animate camera position to follow plane
      const currentPosition = controls.getPosition(new Vector3())
      const targetPosition = new Vector3(
        cameraConfig.position[0] + rightVector.x * offset,
        cameraConfig.position[1],
        cameraConfig.position[2] + rightVector.z * offset
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
        cameraConfig.target[0] + rightVector.x * offset,
        cameraConfig.target[1],
        cameraConfig.target[2] + rightVector.z * offset
      )
      easing.damp3(currentTarget, targetLookAt, 0.05, dt)
      controls.setTarget(
        currentTarget.x,
        currentTarget.y,
        currentTarget.z,
        false
      )
    }
  })

  useEffect(() => {
    animationProgress.current = 0
    targetPosition.set(...cameraConfig.position)
    targetLookAt.set(...cameraConfig.target)
  }, [cameraConfig, targetPosition, targetLookAt])

  const planePosition = calculatePlanePosition(cameraConfig)
  return (
    <>
      <CameraControls makeDefault ref={cameraControlsRef} />
      <mesh ref={planeRef} position={planePosition} visible={debugBoundaries}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="green" transparent wireframe />
      </mesh>
      <mesh
        ref={planeBoundaryRef}
        position={planePosition}
        visible={debugBoundaries}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="red" transparent wireframe opacity={0.5} />
      </mesh>
    </>
  )
}
