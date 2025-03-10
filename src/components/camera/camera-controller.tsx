import { useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { useEffect, useState } from "react"
import { PerspectiveCamera } from "three"

import { useNavigationStore } from "../navigation-handler/navigation-store"
import { CustomCamera } from "./camera-controls"
import { WasdControls } from "./wasd-controls"

export const CameraController = () => {
  const [isFlyMode, setIsFlyMode] = useState(true)
  const { camera } = useThree()
  const setMainCamera = useNavigationStore((state) => state.setMainCamera)

  useControls("camera", {
    flyMode: {
      value: false,
      onChange: (value) => {
        setIsFlyMode(value)
      }
    }
  })

  useEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      setMainCamera(camera)
    }
  }, [camera, setMainCamera])

  if (isFlyMode) {
    return <WasdControls />
  }

  return <CustomCamera />
}
