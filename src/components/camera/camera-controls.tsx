import { PerspectiveCamera } from "@react-three/drei"
import { useRef, useState } from "react"
import * as THREE from "three"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

import {
  useBoundaries,
  useCameraMovement,
  useCameraSetup
} from "./camera-hooks"
import { calculatePlanePosition } from "./camera-utils"
import { XROrigin } from "@react-three/xr"

export const CustomCamera = () => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const planeRef = useRef<THREE.Mesh>(null)
  const planeBoundaryRef = useRef<THREE.Mesh>(null)
  const cameraConfig = useNavigationStore.getState().currentScene?.cameraConfig
  const [isInitialized, setIsInitialized] = useState(false)

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
      <XROrigin scale={1} position={cameraConfig?.position} />
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
