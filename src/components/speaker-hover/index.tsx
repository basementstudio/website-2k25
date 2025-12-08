import { MeshDiscardMaterial } from "@react-three/drei"
import { track } from "@vercel/analytics"
import posthog from "posthog-js"
import { useCallback, useEffect, useState } from "react"

import { useAmbiencePlaylist } from "@/hooks/use-ambience-playlist"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useCursor } from "@/hooks/use-mouse"
import { useSiteAudio, useSiteAudioStore } from "@/hooks/use-site-audio"

export const SpeakerHover = () => {
  const setCursor = useCursor()
  const scene = useCurrentScene()
  const { currentTrackName, nextAmbienceTrack } = useAmbiencePlaylist()
  const isChristmasSeason = useSiteAudioStore((s) => s.isChristmasSeason)
  const setIsChristmasSeason = useSiteAudioStore((s) => s.setIsChristmasSeason)
  const { music, handleMute } = useSiteAudio()
  const [hover, setHover] = useState(false)

  useEffect(() => {
    music && hover && currentTrackName
      ? isChristmasSeason
        ? setCursor("pointer", "Switch to Jukebox")
        : setCursor(
            "pointer",
            `${currentTrackName || "Unknown Track - Unknown Artist ??:??"}`,
            true
          )
      : hover && setCursor("pointer", "Turn on Music")
  }, [currentTrackName, music, hover, setCursor, isChristmasSeason])

  const handlePointerLeave = useCallback(() => {
    setHover(false)
    setCursor("default", null, false)
  }, [setCursor])

  const handleClick = useCallback(() => {
    if (isChristmasSeason) {
      setIsChristmasSeason(false)
    } else if (music) {
      nextAmbienceTrack()
      track("switch_ambience")
      posthog.capture("switch_ambience")
    } else {
      handleMute()
    }
  }, [
    nextAmbienceTrack,
    music,
    handleMute,
    isChristmasSeason,
    setIsChristmasSeason
  ])

  return (
    <>
      <mesh
        onPointerEnter={(e) => {
          if (scene !== "home") return
          e.stopPropagation()
          setHover(true)
        }}
        onPointerLeave={(e) => {
          if (scene !== "home") return
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
