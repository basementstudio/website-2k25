import { useEffect, useMemo, useState } from "react"

import { useAudioUrls } from "@/hooks/use-audio-urls"
import { Playlist } from "@/lib/audio"
import { AMBIENT_VOLUME } from "@/lib/audio/constants"
import { onIdle } from "@/utils/idle"

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
        name: "Cassette Kong - Basement Jukebox 03:35",
        url: AMBIENCE.AMBIENCE_VHS,
        volume: AMBIENT_VOLUME
      },
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

    if (!isBackgroundInitialized) setBackgroundInitialized(true)

    if (globalPlaylistRef.isPlaying) return

    globalPlaylistRef.isPlaying = true
    // play() fetches + decodes the first MP3; the playlist appears right
    // after the unlocking tap, so keep that work off the interaction frame.
    let pending = true
    const cancel = onIdle(() => {
      pending = false
      ambiencePlaylist.play()
    }, 1000)

    return () => {
      // If we unmount (or re-run) before the idle callback fires, drop it and
      // release the flag so the next mount reschedules — otherwise ambience
      // would start playing after the user has left the layout.
      if (!pending) return
      cancel()
      globalPlaylistRef.isPlaying = false
    }
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
