import { useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { useEffect, useState } from "react"
import { PerspectiveCamera } from "three"

import { EditorOrbitCamera } from "@/components/editor/editor-orbit-camera"
import { useOrbitCameraActive } from "@/components/editor/editor-store"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

import { CustomCamera } from "./camera-controls"
import { WasdControls } from "./wasd-controls"

export const CameraController = () => {
  const [isFlyMode, setIsFlyMode] = useState(true)
  const { camera } = useThree()
  const setMainCamera = useNavigationStore((state) => state.setMainCamera)
  const orbitCamera = useOrbitCameraActive()

  useControls("camera", {
    flyMode: {
      value: false,
      onChange: (value) => {
        setIsFlyMode(value)
      }
    }
  })

  useEffect(() => {
    if (camera instanceof PerspectiveCamera) setMainCamera(camera)
  }, [camera, setMainCamera])

  // Exactly one camera owner at a time — each of these takes over the transform.
  // The editor's orbit cam wins so it isn't fought by the scripted camera.
  if (orbitCamera) return <EditorOrbitCamera />

  if (isFlyMode) return <WasdControls />

  return <CustomCamera />
}
