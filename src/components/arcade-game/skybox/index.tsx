import { useTexture } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import { Mesh } from "three"

import { useAssets } from "@/components/assets-provider"

import { normalizeDelta } from "../lib/math"
import { CHUNK_SIZE, TOTAL_CHUNKS } from "../road/use-road"

export const Skybox = () => {
  const skyPanelLeft = useRef<Mesh>(null)
  const skyPanelRight = useRef<Mesh>(null)
  const { arcade } = useAssets()
  const skyboxTexture = useTexture(arcade.skybox)
  const cityscapeTexture = useTexture(arcade.cityscape)

  const SKY_PANEL_WIDTH = 220

  useFrame((_, d) => {
    const delta = normalizeDelta(d)
    if (!skyPanelLeft.current || !skyPanelRight.current) return

    const speed = delta * 0.01
    skyPanelLeft.current.position.x += speed
    skyPanelRight.current.position.x += speed

    if (skyPanelLeft.current.position.x > SKY_PANEL_WIDTH) {
      skyPanelLeft.current.position.x =
        skyPanelRight.current.position.x - SKY_PANEL_WIDTH
    }

    if (skyPanelRight.current.position.x > SKY_PANEL_WIDTH) {
      skyPanelRight.current.position.x =
        skyPanelLeft.current.position.x - SKY_PANEL_WIDTH
    }
  })

  return (
    <>
      <mesh
        ref={skyPanelLeft}
        rotation={[0, 0, 0]}
        position={[0, 45, -CHUNK_SIZE * TOTAL_CHUNKS]}
      >
        <planeGeometry args={[SKY_PANEL_WIDTH, 100]} />
        <meshBasicMaterial map={skyboxTexture} />
      </mesh>

      <mesh
        ref={skyPanelRight}
        rotation={[0, 0, 0]}
        position={[-SKY_PANEL_WIDTH, 45, -CHUNK_SIZE * TOTAL_CHUNKS]}
      >
        <planeGeometry args={[SKY_PANEL_WIDTH, 100]} />
        <meshBasicMaterial map={skyboxTexture} />
      </mesh>

      <mesh
        rotation={[0, 0, 0]}
        position={[0, 19, -CHUNK_SIZE * TOTAL_CHUNKS + 10]}
      >
        <planeGeometry args={[195, 40]} />
        <meshBasicMaterial transparent map={cityscapeTexture} />
      </mesh>
    </>
  )
}
