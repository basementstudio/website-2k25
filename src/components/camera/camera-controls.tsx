import { PerspectiveCamera } from "@react-three/drei"
import { useMemo, useRef, useState } from "react"
import * as THREE from "three"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { isSceneReady, useSceneAssets } from "@/lib/graphics/scene-assets"

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
  const ready = useSceneAssets((state) =>
    isSceneReady(currentScene?.name ?? "home", state.ready)
  )
  const previousReady = useRef(currentScene?.cameraConfig)
  if (ready) previousReady.current = currentScene?.cameraConfig
  const cameraConfig = previousReady.current
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
            visible={false}
            ref={planeRef}
            position={calculatePlanePosition(finalCameraConfig)}
          />
          <mesh
            visible={false}
            ref={planeBoundaryRef}
            position={calculatePlanePosition(finalCameraConfig)}
          />
        </>
      )}
    </>
  )
}
