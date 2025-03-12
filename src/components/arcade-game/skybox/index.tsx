import { useTexture } from "@react-three/drei"

import { useAssets } from "@/components/assets-provider"

import { CHUNK_SIZE, TOTAL_CHUNKS } from "../road/use-road"

export const Skybox = () => {
  const { arcade } = useAssets()
  const skyboxTexture = useTexture(arcade.skybox)

  return (
    <mesh rotation={[0, 0, 0]} position={[0, 45, -CHUNK_SIZE * TOTAL_CHUNKS]}>
      <planeGeometry args={[220, 100]} />
      <meshBasicMaterial map={skyboxTexture} />
    </mesh>
  )
}
