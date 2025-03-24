import { MeshDiscardMaterial } from "@react-three/drei"
import { useCallback, useEffect, useState } from "react"

import { useAmbiencePlaylist } from "@/hooks/use-ambience-playlist"
import { useCursor } from "@/hooks/use-mouse"
import { useSiteAudio } from "@/hooks/use-site-audio"

export const SpeakerHover = () => {
  const setCursor = useCursor()
  const { currentTrackName, nextAmbienceTrack } = useAmbiencePlaylist()
  const { music, handleMute } = useSiteAudio()
  const [hover, setHover] = useState(false)

  useEffect(() => {
    music && hover && currentTrackName
      ? setCursor(
          "pointer",
          `${currentTrackName || "Unknown Track - Unknown Artist ??:??"}`,
          true
        )
      : hover && setCursor("pointer", "Turn on Music")
  }, [currentTrackName, music, hover, setCursor])

  const handlePointerLeave = useCallback(() => {
    setHover(false)
    setCursor("default", null, false)
  }, [setCursor])

  const handleClick = useCallback(() => {
    music ? nextAmbienceTrack() : handleMute()
  }, [nextAmbienceTrack, music, handleMute])

  return (
    <>
      <mesh
        onPointerEnter={(e) => {
          e.stopPropagation()
          setHover(true)
        }}
        onPointerLeave={(e) => {
          e.stopPropagation()
          handlePointerLeave()
        }}
        onClick={handleClick}
        rotation={[Math.PI / 2, 0, Math.PI * 0.25]}
        position={[3.6949, 3.52, -14.35]}
      >
        <boxGeometry args={[0.28, 0.24, 0.42]} />
        <MeshDiscardMaterial />
      </mesh>

      <mesh
        onPointerEnter={(e) => {
          e.stopPropagation()
          setHover(true)
        }}
        onPointerLeave={(e) => {
          e.stopPropagation()
          handlePointerLeave()
        }}
        onClick={handleClick}
        rotation={[-Math.PI / 2, 0, -Math.PI * 0.25]}
        position={[9.472, 3.52, -14.402]}
      >
        <boxGeometry args={[0.28, 0.24, 0.42]} />
        <MeshDiscardMaterial />
      </mesh>
    </>
  )
}
