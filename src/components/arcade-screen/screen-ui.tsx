import { PerspectiveCamera } from "@react-three/drei"
import { Vector3 } from "three"

import { LabsUI } from "./labs-ui"

interface ScreenUIProps {
  screenScale?: Vector3 | null
}

export const COLORS_THEME = {
  primary: "#F68300",
  black: "#000"
}

export const ScreenUI = ({ screenScale }: ScreenUIProps) => {
  const aspect = screenScale ? screenScale.x / screenScale.y : 1

  return (
    <>
      <color attach="background" args={["#000"]} />
      <ambientLight intensity={1} />
      <directionalLight position={[0, 0, 5]} intensity={1} />
      <PerspectiveCamera
        manual
        makeDefault
        position={[0, 0.0, 14]}
        aspect={aspect}
      />

      <LabsUI />
    </>
  )
}
