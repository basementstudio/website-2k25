import { useThree } from "@react-three/fiber"
import { useEffect } from "react"
import { PerspectiveCamera } from "three"

import { useDebugCameraStore } from "@/components/debug/debug-state"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

import { CustomCamera } from "./camera-controls"
import { WasdControls } from "./wasd-controls"

export const CameraController = () => {
  const isFlyMode = useDebugCameraStore((state) => state.flyMode)
  const { camera } = useThree()
  const setMainCamera = useNavigationStore((state) => state.setMainCamera)

  useEffect(() => {
    if (camera instanceof PerspectiveCamera) setMainCamera(camera)
  }, [camera, setMainCamera])

  if (isFlyMode) return <WasdControls />

  return <CustomCamera />
}
