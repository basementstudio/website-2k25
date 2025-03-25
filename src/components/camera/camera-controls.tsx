import { PerspectiveCamera } from "@react-three/drei"
import { useRef, useState, useMemo } from "react"
import * as THREE from "three"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

import {
  useBoundaries,
  useCameraMovement,
  useCameraSetup
} from "./camera-hooks"
import { calculatePlanePosition } from "./camera-utils"

export const CustomCamera = () => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const planeRef = useRef<THREE.Mesh>(null)
  const planeBoundaryRef = useRef<THREE.Mesh>(null)
  const currentScene = useNavigationStore((state) => state.currentScene)
  const cameraConfig = currentScene?.cameraConfig
  const [isInitialized, setIsInitialized] = useState(false)

  const finalCameraConfig = useMemo(() => {
    return cameraConfig
  }, [cameraConfig])

  const boundaries = useBoundaries(finalCameraConfig)
  const { currentPos, currentTarget, targetPosition, targetLookAt } =
    useCameraMovement(
      cameraRef,
      planeRef,
      planeBoundaryRef,
      finalCameraConfig,
      boundaries,
      isInitialized
    )

  useCameraSetup(
    cameraRef,
    planeRef,
    planeBoundaryRef,
    finalCameraConfig,
    isInitialized,
    setIsInitialized,
    currentPos,
    currentTarget,
    targetPosition,
    targetLookAt
  )

  return (
    <>
      <PerspectiveCamera makeDefault ref={cameraRef} />
      {finalCameraConfig && (
        <>
          <mesh
            ref={planeRef}
            position={calculatePlanePosition(finalCameraConfig)}
          />
          <mesh
            ref={planeBoundaryRef}
            position={calculatePlanePosition(finalCameraConfig)}
          />
        </>
      )}
    </>
  )
}
