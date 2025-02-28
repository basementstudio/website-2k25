import { OrbitControls } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { useEffect, useState } from "react"
import { PerspectiveCamera } from "three"

import { useNavigationStore } from "../navigation-handler/navigation-store"
import { CustomCamera } from "./camera-controls"
import { WasdControls } from "./wasd-controls"

export const CameraController = () => {
  const [isOrbitMode, setIsOrbitMode] = useState(false)
  const [isFlyMode, setIsFlyMode] = useState(true)
  const { camera } = useThree()
  const setMainCamera = useNavigationStore((state) => state.setMainCamera)
  const currentScene = useNavigationStore((state) => state.currentScene)

  useControls("camera", {
    orbitMode: {
      value: false,
      onChange: (value) => {
        setIsOrbitMode(value)
      }
    },
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

  if (isOrbitMode) {
    return <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
  }

  if (isFlyMode) {
    return <WasdControls />
  }

  if (!currentScene?.cameraConfig) {
    return null
  }

  return <CustomCamera />
}
