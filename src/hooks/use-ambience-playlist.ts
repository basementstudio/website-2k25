import { useEffect, useMemo, useRef, useState } from "react"

import { AudioSource, Playlist } from "@/lib/audio"
import { useAudioUrls } from "@/lib/audio/audio-urls"
import { AMBIENT_VOLUME } from "@/lib/audio/constants"

import { BackgroundAudioType, useSiteAudioStore } from "./use-site-audio"
import { useSiteAudio } from "./use-site-audio"

// Create a singleton reference to store the active playlist instance across all hook instances
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

  // Local state for accessing the playlist
  const [ambiencePlaylist, setAmbiencePlaylist] = useState<Playlist | null>(
    globalPlaylistRef.instance
  )

  // Define the ambience tracks
  const ambienceTracks = useMemo(() => {
    return [
      {
        name: "Chrome Tiger - Basement Jukebox 02:40",
        url: AMBIENCE.AMBIENCE_TIGER,
        volume: AMBIENT_VOLUME
      },
      {
        name: "Perfect Waves - Basement Jukebox 00:59",
        url: AMBIENCE.AMBIENCE_AQUA,
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
    ]
  }, [AMBIENCE])

  // Initialize ambience playlist once when player is available
  useEffect(() => {
    // If we already have a global playlist instance, use it
    if (globalPlaylistRef.instance) {
      console.log("[AmbiencePlaylist] Using existing global playlist instance")
      setAmbiencePlaylist(globalPlaylistRef.instance)
      return
    }

    // Only create a new playlist if we have a player and no global instance exists
    if (!player) return

    console.log("[AmbiencePlaylist] Creating new global playlist instance")

    const ambience = player.createPlaylist(
      ambienceTracks.map((track) => ({
        url: track.url,
        volume: track.volume,
        metadata: { name: track.name }
      })),
      {
        loop: true,
        onTrackChange: (track, index) => {
          console.log(`[AmbiencePlaylist] Track changed to index: ${index}`)
          globalPlaylistRef.currentTrackIndex = index
          setCurrentAmbienceIndex(index)
        }
      }
    )

    // Store the playlist in the global ref
    globalPlaylistRef.instance = ambience
    setAmbiencePlaylist(ambience)

    // On unmount, we DON'T destroy the global playlist
    return () => {
      // Only do cleanup if the component being unmounted is the last one using the playlist
      // This prevents stopping playback during page transitions
    }
  }, [player, ambienceTracks, setCurrentAmbienceIndex])

  // Handle playback state changes based on activeTrackType
  useEffect(() => {
    if (!ambiencePlaylist) return

    // Always check against the global state to prevent multiple play/stop calls
    if (activeTrackType === BackgroundAudioType.AMBIENCE) {
      if (!globalPlaylistRef.isPlaying) {
        console.log("[AmbiencePlaylist] Starting ambience playback")
        ambiencePlaylist.play()
        globalPlaylistRef.isPlaying = true
      }

      if (!isBackgroundInitialized) {
        setBackgroundInitialized(true)
      }
    } else {
      if (globalPlaylistRef.isPlaying) {
        console.log("[AmbiencePlaylist] Stopping ambience playback")
        ambiencePlaylist.stop()
        globalPlaylistRef.isPlaying = false
      }
    }

    // Clean up function that runs on component unmount
    return () => {
      // We don't stop playback here to prevent interruption during page transitions
    }
  }, [
    activeTrackType,
    ambiencePlaylist,
    isBackgroundInitialized,
    setBackgroundInitialized
  ])

  // Jump to specific ambience track when currentAmbienceIndex changes externally
  useEffect(() => {
    if (!ambiencePlaylist || activeTrackType !== BackgroundAudioType.AMBIENCE)
      return

    // Check if the global track index is different to prevent unnecessary jumps
    if (globalPlaylistRef.currentTrackIndex !== currentAmbienceIndex) {
      console.log(
        `[AmbiencePlaylist] Jumping to track index: ${currentAmbienceIndex}`
      )
      ambiencePlaylist.jumpToTrack(currentAmbienceIndex)
      globalPlaylistRef.currentTrackIndex = currentAmbienceIndex
    }
  }, [currentAmbienceIndex, ambiencePlaylist, activeTrackType])

  // Handle page unload and cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (globalPlaylistRef.instance) {
        globalPlaylistRef.instance.stop()
        globalPlaylistRef.isPlaying = false
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  // Return controls for external components to use
  return {
    ambiencePlaylist,
    ambienceTracks,
    currentTrackName: ambienceTracks[currentAmbienceIndex]?.name,
    nextAmbienceTrack: () => {
      if (ambiencePlaylist) {
        console.log("[AmbiencePlaylist] User requested next track")
        ambiencePlaylist.next()
      }
    },
    jumpToAmbienceTrack: (index: number) => {
      if (ambiencePlaylist) {
        ambiencePlaylist.jumpToTrack(index)
      }
    }
  }
}
