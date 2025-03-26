import { PerspectiveCamera } from "@react-three/drei"
import { XROrigin } from "@react-three/xr"
import { useMemo, useRef, useState } from "react"
import * as THREE from "three"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useCurrentScene } from "@/hooks/use-current-scene"

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
  const scene = useCurrentScene()

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

  const realPosition = useMemo(() => {
    const y = scene === "blog" || scene === "people" ? 3.724 : 0

    return new THREE.Vector3(
      cameraConfig?.position[0],
      y,
      cameraConfig?.position[2]
    )
  }, [cameraConfig, scene])

  return (
    <>
      <PerspectiveCamera makeDefault ref={cameraRef} />
      <XROrigin scale={1} position={realPosition} />
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
