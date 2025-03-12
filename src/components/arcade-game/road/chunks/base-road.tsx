import { useTexture } from "@react-three/drei"
import { useMemo } from "react"

import { useAssets } from "@/components/assets-provider"

import { CHUNK_SIZE, LINES, lineWidth } from "../use-road"

export const BaseRoad = () => {
  const showPalm = useMemo(() => {
    const r = Math.random() < 0.3

    if (!r) return null

    const side = Math.random() < 0.5 ? 1 : -1
    return side
  }, [])

  const { arcade } = useAssets()
  const palmTexture = useTexture(arcade.palm)

  return (
    <group position={[0, 0, 0]}>
      <mesh rotation={[-Math.PI * 0.5, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[CHUNK_SIZE, CHUNK_SIZE]} />
        <meshBasicMaterial color={"#585858"} />
      </mesh>
      <mesh rotation={[-Math.PI * 0.5, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[CHUNK_SIZE * 20, CHUNK_SIZE]} />
        <meshBasicMaterial color={"#eaeaea"} />
      </mesh>
      {Array.from({ length: LINES - 1 }).map((_, index) => (
        <mesh
          key={index}
          rotation={[-Math.PI * 0.5, 0.05, 0]}
          position={[(index + 1) * lineWidth - CHUNK_SIZE / 2, 0, 0]}
        >
          <planeGeometry args={[0.2, 10]} />
          <meshBasicMaterial color={"white"} />
        </mesh>
      ))}

      {typeof showPalm === "number" && (
        <mesh
          rotation={[0, 0, 0]}
          position={[(showPalm * CHUNK_SIZE) / 2 + 4 * showPalm, 4, 0]}
          scale={[showPalm > 0 ? -2 : 2, 2, 1]}
        >
          <planeGeometry args={[8, 8]} />
          <meshBasicMaterial map={palmTexture} transparent />
        </mesh>
      )}
    </group>
  )
}
