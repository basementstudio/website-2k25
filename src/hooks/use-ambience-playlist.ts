import { useEffect, useMemo, useState } from "react"

import { Playlist } from "@/lib/audio"
import { useAudioUrls } from "@/lib/audio/audio-urls"
import { AMBIENT_VOLUME } from "@/lib/audio/constants"

import { BackgroundAudioType, useSiteAudioStore } from "./use-site-audio"

const globalPlaylistRef: {
  instance: Playlist | null
  isPlaying: boolean
  currentTrackIndex: number
} = {
  instance: null,
  isPlaying: false,
  currentTrackIndex: 0
}

export function useAmbiencePlaylist() {
  const player = useSiteAudioStore((s) => s.player)
  const { AMBIENCE } = useAudioUrls()

  const activeTrackType = useSiteAudioStore((s) => s.activeTrackType)
  const isBackgroundInitialized = useSiteAudioStore(
    (s) => s.isBackgroundInitialized
  )
  const setBackgroundInitialized = useSiteAudioStore(
    (s) => s.setBackgroundInitialized
  )
  const currentAmbienceIndex = useSiteAudioStore((s) => s.currentAmbienceIndex)
  const setCurrentAmbienceIndex = useSiteAudioStore(
    (s) => s.setCurrentAmbienceIndex
  )

  const [ambiencePlaylist, setAmbiencePlaylist] = useState<Playlist | null>(
    globalPlaylistRef.instance
  )

  const ambienceTracks = useMemo(
    () => [
      {
        name: "Perfect Waves - Basement Jukebox 00:59",
        url: AMBIENCE.AMBIENCE_AQUA,
        volume: AMBIENT_VOLUME
      },
      {
        name: "Chrome Tiger - Basement Jukebox 02:40",
        url: AMBIENCE.AMBIENCE_TIGER,
        volume: AMBIENT_VOLUME
      },
      {
        name: "Tears In The Rain - Basement Jukebox 01:55",
        url: AMBIENCE.AMBIENCE_RAIN,
        volume: AMBIENT_VOLUME
      },
      {
        name: "Cassette Kong - Basement Jukebox 03:35",
        url: AMBIENCE.AMBIENCE_VHS,
        volume: AMBIENT_VOLUME
      }
    ],
    [AMBIENCE]
  )

  useEffect(() => {
    // If we already have a global playlist instance, use it
    if (globalPlaylistRef.instance) {
      setAmbiencePlaylist(globalPlaylistRef.instance)
      return
    }

    // Only create a new playlist if we have a player and no global instance exists
    if (!player) return

    const ambience = player.createPlaylist(
      ambienceTracks.map((track) => ({
        url: track.url,
        volume: track.volume,
        metadata: { name: track.name }
      })),
      {
        loop: true,
        onTrackChange: (track, index) => {
          globalPlaylistRef.currentTrackIndex = index
          setCurrentAmbienceIndex(index)
        }
      }
    )

    globalPlaylistRef.instance = ambience
    setAmbiencePlaylist(ambience)
  }, [player, ambienceTracks, setCurrentAmbienceIndex])

  useEffect(() => {
    if (!ambiencePlaylist) return

    if (!globalPlaylistRef.isPlaying) {
      ambiencePlaylist.play()
      globalPlaylistRef.isPlaying = true
    }

    if (!isBackgroundInitialized) setBackgroundInitialized(true)
  }, [
    activeTrackType,
    ambiencePlaylist,
    isBackgroundInitialized,
    setBackgroundInitialized
  ])

  useEffect(() => {
    if (!ambiencePlaylist || activeTrackType !== BackgroundAudioType.AMBIENCE)
      return

    if (globalPlaylistRef.currentTrackIndex !== currentAmbienceIndex) {
      ambiencePlaylist.jumpToTrack(currentAmbienceIndex)
      globalPlaylistRef.currentTrackIndex = currentAmbienceIndex
    }
  }, [currentAmbienceIndex, ambiencePlaylist, activeTrackType])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (globalPlaylistRef.instance) {
        globalPlaylistRef.instance.stop()
        globalPlaylistRef.isPlaying = false
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  return {
    ambiencePlaylist,
    ambienceTracks,
    currentTrackName: ambienceTracks[currentAmbienceIndex]?.name,
    nextAmbienceTrack: () => {
      if (ambiencePlaylist) {
        ambiencePlaylist.next()
      }
    }
  }
}
