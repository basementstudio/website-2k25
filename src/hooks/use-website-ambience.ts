import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { AudioSource } from "@/lib/audio"
import { useAudioUrls } from "@/lib/audio/audio-urls"
import { AMBIENT_VOLUME, FADE_DURATION } from "@/lib/audio/constants"
import { useArcadeStore } from "@/store/arcade-store"

import { useCurrentScene } from "./use-current-scene"
import { useSiteAudioStore } from "./use-site-audio"

declare global {
  interface Window {
    __WEBSITE_AMBIENCE__?: {
      advanceToNextTrack: () => void
    }
  }
}

export function useWebsiteAmbience(isEnabled: boolean = false) {
  const scene = useCurrentScene()
  const player = useSiteAudioStore((s) => s.player)
  const ostSong = useSiteAudioStore((s) => s.ostSong)
  const { AMBIENCE } = useAudioUrls()
  const fadeOutTimeout = useRef<NodeJS.Timeout | null>(null)
  const isInitialized = useRef(false)
  const isBasketballPage = scene === "basketball"
  const isInGame = useArcadeStore((s) => s.isInGame)

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const loadedTracks = useRef<AudioSource[]>([])
  const currentTrack = useRef<AudioSource | null>(null)

  const ambiencePlaylist = useMemo(() => {
    return [
      {
        name: "Chrome Tiger - Basement Jukebox 02:40",
        url: AMBIENCE.AMBIENCE_TIGER
      },
      {
        name: "Perfect Waves - Basement Jukebox 00:59",
        url: AMBIENCE.AMBIENCE_AQUA
      },
      {
        name: "Tears In The Rain - Basement Jukebox 01:55",
        url: AMBIENCE.AMBIENCE_RAIN
      },
      {
        name: "Cassette Kong - Basement Jukebox 03:35",
        url: AMBIENCE.AMBIENCE_VHS
      }
    ]
  }, [AMBIENCE])

  const stopAllTracks = useCallback(() => {
    if (player) {
      player.stopAllMusicTracks()
      return
    }

    // Fallback if player is not available
    if (loadedTracks.current.length > 0) {
      loadedTracks.current.forEach((track) => {
        if (track.isPlaying) {
          track.clearOnEnded()
          track.stop()
        }
      })
    }
  }, [player])

  const cleanup = useCallback(() => {
    if (fadeOutTimeout.current) {
      clearTimeout(fadeOutTimeout.current)
      fadeOutTimeout.current = null
    }

    stopAllTracks()
    loadedTracks.current = []

    if (ostSong) {
      ostSong.stop()
      useSiteAudioStore.setState({ ostSong: null })
    }

    currentTrack.current = null
    isInitialized.current = false
  }, [ostSong, stopAllTracks])

  const advanceToNextTrack = useCallback(() => {
    if (!player || !isEnabled || loadedTracks.current.length === 0) return

    const nextIndex = (currentTrackIndex + 1) % ambiencePlaylist.length

    stopAllTracks()

    currentTrack.current = loadedTracks.current[nextIndex]

    if (currentTrack.current) {
      if (currentTrack.current.isPlaying) {
        currentTrack.current.clearOnEnded()
        currentTrack.current.stop()
      }

      currentTrack.current.setVolume(AMBIENT_VOLUME)
      currentTrack.current.play()

      useSiteAudioStore.setState({
        ostSong: currentTrack.current
      })

      setupTrackEndDetection(currentTrack.current)
    }

    setCurrentTrackIndex(nextIndex)
  }, [
    currentTrackIndex,
    ambiencePlaylist.length,
    player,
    isEnabled,
    stopAllTracks
  ])

  const setupTrackEndDetection = useCallback(
    (track: AudioSource) => {
      if (!player || !track) return

      track.clearOnEnded()

      track.onEnded(() => {
        advanceToNextTrack()
      })
    },
    [player, advanceToNextTrack]
  )

  useEffect(() => {
    if (!player || !isEnabled) return

    const loadPlaylist = async () => {
      try {
        if (!isInitialized.current) {
          isInitialized.current = true

          stopAllTracks()

          const tracks: AudioSource[] = []

          for (const track of ambiencePlaylist) {
            const audioSource = await player.loadAudioFromURL(
              track.url,
              false,
              false
            )
            audioSource.loop = false
            audioSource.setVolume(0)
            tracks.push(audioSource)
          }

          loadedTracks.current = tracks

          if (tracks.length > 0 && !isBasketballPage && !isInGame) {
            currentTrack.current = tracks[0]
            currentTrack.current.setVolume(AMBIENT_VOLUME)
            currentTrack.current.play()

            useSiteAudioStore.setState({
              ostSong: currentTrack.current
            })

            setupTrackEndDetection(currentTrack.current)
          }
        }
      } catch (error) {
        console.error("Error loading ambience playlist:", error)
        isInitialized.current = false
      }
    }

    loadPlaylist()

    return () => {
      if (!isEnabled && !fadeOutTimeout.current) {
        cleanup()
      }
    }
  }, [
    player,
    isEnabled,
    cleanup,
    AMBIENCE,
    ambiencePlaylist,
    setupTrackEndDetection,
    stopAllTracks,
    isBasketballPage,
    isInGame
  ])

  useEffect(() => {
    if (!player) return

    const gainNode = currentTrack.current?.outputNode
    const currentTime = player?.audioContext.currentTime

    if (!gainNode || !currentTime) return

    if (isBasketballPage || isInGame) {
      gainNode.gain.cancelScheduledValues(currentTime)
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
      gainNode.gain.linearRampToValueAtTime(0, currentTime + FADE_DURATION)
    } else if (isEnabled && currentTrack.current) {
      gainNode.gain.cancelScheduledValues(currentTime)
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
      gainNode.gain.linearRampToValueAtTime(
        AMBIENT_VOLUME,
        currentTime + FADE_DURATION
      )
    }

    return () => {
      if (fadeOutTimeout.current) {
        clearTimeout(fadeOutTimeout.current)
        fadeOutTimeout.current = null
      }
    }
  }, [isEnabled, isBasketballPage, isInGame, player, currentTrack])

  useEffect(() => {
    if (typeof window !== "undefined" && isEnabled) {
      window.__WEBSITE_AMBIENCE__ = {
        advanceToNextTrack
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        window.__WEBSITE_AMBIENCE__ = undefined
      }
    }
  }, [advanceToNextTrack, isEnabled])

  return {
    currentTrack:
      currentTrackIndex !== undefined
        ? ambiencePlaylist[currentTrackIndex]
        : null
  }
}

export function useCurrentTrackName(): string | null {
  const { currentTrack } = useWebsiteAmbience(true)
  return currentTrack?.name || null
}
