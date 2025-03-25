import { PerspectiveCamera } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef, useState, useEffect, useMemo } from "react"
import * as THREE from "three"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useDeviceDetect } from "@/hooks/use-device-detect"
import { ICameraConfig } from "@/components/navigation-handler/navigation.interface"

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
  const { isMobile } = useDeviceDetect()

  const finalCameraConfig = useMemo(() => {
    if (isMobile && currentScene?.name === "home" && cameraConfig) {
      return {
        ...cameraConfig,
        position: [8.38, 3, -11.5] as [number, number, number],
        target: [8.38, 2.75, -12] as [number, number, number]
      }
    }
    return cameraConfig
  }, [isMobile, currentScene, cameraConfig])

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
