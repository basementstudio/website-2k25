import { useCallback, useState } from "react"

import { useCursor } from "@/hooks/use-mouse"
import { useSkipTrack } from "@/hooks/use-skip-track"

import { routingMaterial } from "../routing-element/routing-element"

export const SpeakerHover = () => {
  const [hover, setHover] = useState(false)
  const setCursor = useCursor()
  const skipToNextTrack = useSkipTrack()

  const handlePointerEnter = useCallback(() => {
    setHover(true)
    setCursor("pointer", "Now Playing: Aquiescence - Oasis", true)
  }, [setCursor])

  const handlePointerLeave = useCallback(() => {
    setHover(false)
    setCursor("default", null)
  }, [setCursor])

  const handleClick = useCallback(() => {
    skipToNextTrack()
  }, [skipToNextTrack])

  return (
    <>
      <mesh
        visible={hover}
        material={routingMaterial}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        rotation={[Math.PI / 2, 0, Math.PI * 0.25]}
        position={[3.6949, 3.52, -14.35]}
      >
        <boxGeometry args={[0.28, 0.24, 0.42]} />
      </mesh>

      <mesh
        visible={hover}
        material={routingMaterial}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        rotation={[-Math.PI / 2, 0, -Math.PI * 0.25]}
        position={[9.472, 3.52, -14.402]}
      >
        <boxGeometry args={[0.28, 0.24, 0.42]} />
      </mesh>
    </>
  )
}
