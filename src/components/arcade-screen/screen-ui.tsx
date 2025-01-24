import { PerspectiveCamera } from "@react-three/drei"
import dynamic from "next/dynamic"
import { Vector3 } from "three"

const DynamicLabsUI = dynamic(
  () => import("./labs-ui").then((mod) => mod.LabsUI),
  { ssr: false }
)

interface ScreenUIProps {
  screenScale?: Vector3 | null
}

export const COLORS_THEME = {
  primary: "#ffffff",
  black: "#000000"
}

export const ScreenUI = ({ screenScale }: ScreenUIProps) => {
  const aspect = screenScale ? screenScale.x / screenScale.y : 1

  return (
    <>
      <color attach="background" args={[COLORS_THEME.black]} />
      <ambientLight intensity={1} />
      <PerspectiveCamera
        manual
        makeDefault
        position={[0, 0.0, 16]}
        aspect={aspect}
      />
      <DynamicLabsUI />
    </>
  )
}
