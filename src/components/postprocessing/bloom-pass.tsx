import { OrthographicCamera } from "@react-three/drei"
import { memo } from "react"
import {
  OrthographicCamera as ThreeOrthographicCamera,
  ShaderMaterial
} from "three"

interface BloomPassProps {
  material: ShaderMaterial
  cameraRef: React.RefObject<ThreeOrthographicCamera | null>
}

const Inner = ({ material, cameraRef }: BloomPassProps) => (
  <>
    <OrthographicCamera
      manual
      ref={cameraRef}
      position={[0, 0, 1]}
      left={-0.5}
      right={0.5}
      top={0.5}
      bottom={-0.5}
      near={0.1}
      far={1000}
    />
    <mesh>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  </>
)

export const BloomPass = memo(Inner)
