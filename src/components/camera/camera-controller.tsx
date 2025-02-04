import { OrbitControls } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { useControls } from "leva"
import { useEffect, useState } from "react"
import { PerspectiveCamera } from "three"

import { CustomCamera } from "./camera-controls"
import { useNavigationStore } from "../navigation-handler/navigation-store"

export const CameraController = () => {
  const [isOrbitMode, setIsOrbitMode] = useState(false)
  const { camera } = useThree()
  const setMainCamera = useNavigationStore((state) => state.setMainCamera)

  useControls("camera", {
    orbitMode: {
      value: false,
      onChange: (value) => {
        setIsOrbitMode(value)
      }
    }
  })

  useEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      setMainCamera(camera)
    }
  }, [camera, setMainCamera])

  return (
    <>
      {isOrbitMode ? (
        <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
      ) : (
        <CustomCamera />
      )}
    </>
  )
}
