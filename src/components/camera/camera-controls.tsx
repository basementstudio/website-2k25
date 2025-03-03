import { PerspectiveCamera } from "@react-three/drei"
import { useRef, useState, useEffect } from "react"
import * as THREE from "three"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { calculatePlanePosition } from "./camera-utils"
import {
  useBoundaries,
  useCameraMovement,
  useCameraSetup,
  useCameraTransitionState
} from "./camera-hooks"

export const CustomCamera = () => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const planeRef = useRef<THREE.Mesh>(null)
  const planeBoundaryRef = useRef<THREE.Mesh>(null)
  const cameraConfig = useNavigationStore.getState().currentScene?.cameraConfig
  const [isInitialized, setIsInitialized] = useState(false)
  const isCameraTransitioning = useCameraTransitionState()

  useEffect(() => {
    console.log("Camera transition state:", isCameraTransitioning)
  }, [isCameraTransitioning])

  const boundaries = useBoundaries(cameraConfig)
  const { currentPos, currentTarget, targetPosition, targetLookAt } =
    useCameraMovement(
      cameraRef,
      planeRef,
      planeBoundaryRef,
      cameraConfig,
      boundaries,
      isInitialized
    )

  useCameraSetup(
    cameraRef,
    planeRef,
    planeBoundaryRef,
    cameraConfig,
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
      {cameraConfig && (
        <>
          <mesh
            ref={planeRef}
            position={calculatePlanePosition(cameraConfig)}
          />
          <mesh
            ref={planeBoundaryRef}
            position={calculatePlanePosition(cameraConfig)}
          />
        </>
      )}
    </>
  )
}
