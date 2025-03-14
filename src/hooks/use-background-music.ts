import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { AudioSource } from "@/lib/audio"
import { useAudioUrls } from "@/lib/audio/audio-urls"
import {
  AMBIENT_VOLUME,
  FADE_DURATION,
  THEME_SONG_VOLUME
} from "@/lib/audio/constants"
import { useArcadeStore } from "@/store/arcade-store"

import { useCurrentScene } from "./use-current-scene"
import { useSiteAudioStore } from "./use-site-audio"

// Audio type enum to categorize different background music scenarios
export enum BackgroundAudioType {
  AMBIENCE = "ambience",
  BASKETBALL = "basketball",
  KONAMI = "konami"
}

// Track definition interface for managing audio sources
interface AudioTrack {
  name: string
  url: string
  type: BackgroundAudioType
  source: AudioSource | null
  volume: number
}

// Global declaration for accessing background music controls from outside React
declare global {
  interface Window {
    __WEBSITE_AMBIENCE__?: {
      advanceToNextTrack: () => void
    }
  }
}

/**
 * Hook to manage background music with scene-aware transitions
 * Handles loading, playback, fading, and switching between different audio tracks
 */
export function useBackgroundMusic(isEnabled: boolean = false) {
  const scene = useCurrentScene()
  const player = useSiteAudioStore((s) => s.player)
  const isInGame = useArcadeStore((s) => s.isInGame)
  const { AMBIENCE, GAME_THEME_SONGS, ARCADE_AUDIO_SFX } = useAudioUrls()

  const activeTrackType = useSiteAudioStore((s) => s.activeTrackType)
  const setActiveTrackType = useSiteAudioStore((s) => s.setActiveTrackType)
  const currentAmbienceIndex = useSiteAudioStore((s) => s.currentAmbienceIndex)
  const setCurrentAmbienceIndex = useSiteAudioStore(
    (s) => s.setCurrentAmbienceIndex
  )
  const isInitialized = useSiteAudioStore((s) => s.isBackgroundInitialized)
  const setInitialized = useSiteAudioStore((s) => s.setBackgroundInitialized)

  const isBasketballPage = scene === "basketball"

  // References to manage audio state across renders
  const fadeOutTimeout = useRef<NodeJS.Timeout | null>(null)
  const loadedTracks = useRef<Record<BackgroundAudioType, AudioSource[]>>({
    [BackgroundAudioType.AMBIENCE]: [],
    [BackgroundAudioType.BASKETBALL]: [],
    [BackgroundAudioType.KONAMI]: []
  })
  const currentActiveTrack = useRef<AudioSource | null>(null)

  // Define available audio tracks for each category
  const audioTracks = useMemo(() => {
    return {
      ambience: [
        {
          name: "Chrome Tiger - Basement Jukebox 02:40",
          url: AMBIENCE.AMBIENCE_TIGER,
          type: BackgroundAudioType.AMBIENCE,
          volume: AMBIENT_VOLUME
        },
        {
          name: "Perfect Waves - Basement Jukebox 00:59",
          url: AMBIENCE.AMBIENCE_AQUA,
          type: BackgroundAudioType.AMBIENCE,
          volume: AMBIENT_VOLUME
        },
        {
          name: "Tears In The Rain - Basement Jukebox 01:55",
          url: AMBIENCE.AMBIENCE_RAIN,
          type: BackgroundAudioType.AMBIENCE,
          volume: AMBIENT_VOLUME
        },
        {
          name: "Cassette Kong - Basement Jukebox 03:35",
          url: AMBIENCE.AMBIENCE_VHS,
          type: BackgroundAudioType.AMBIENCE,
          volume: AMBIENT_VOLUME
        }
      ],
      basketball: [
        {
          name: "Basketball Ambient",
          url: GAME_THEME_SONGS.BASKETBALL_AMBIENT,
          type: BackgroundAudioType.BASKETBALL,
          volume: THEME_SONG_VOLUME
        }
      ],
      konami: [
        {
          name: "Miami Heatwave",
          url: ARCADE_AUDIO_SFX.MIAMI_HEATWAVE,
          type: BackgroundAudioType.KONAMI,
          volume: 0.4
        }
      ]
    }
  }, [AMBIENCE, GAME_THEME_SONGS, ARCADE_AUDIO_SFX])

  // Stop all currently playing audio tracks
  const stopAllTracks = useCallback(() => {
    if (player) {
      player.stopAllMusicTracks()
      return
    }

    Object.values(loadedTracks.current).forEach((trackArray) => {
      trackArray.forEach((track) => {
        if (track.isPlaying) {
          track.clearOnEnded()
          track.stop()
        }
      })
    })
  }, [player])

  // Complete cleanup of all audio resources and state
  const cleanup = useCallback(() => {
    if (fadeOutTimeout.current) {
      clearTimeout(fadeOutTimeout.current)
      fadeOutTimeout.current = null
    }

    stopAllTracks()
    loadedTracks.current = {
      [BackgroundAudioType.AMBIENCE]: [],
      [BackgroundAudioType.BASKETBALL]: [],
      [BackgroundAudioType.KONAMI]: []
    }

    currentActiveTrack.current = null
    setInitialized(false)
  }, [stopAllTracks, setInitialized])

  // Transition to the next ambient track with smooth fading
  const advanceToNextTrack = useCallback(() => {
    if (
      !player ||
      !isEnabled ||
      loadedTracks.current[BackgroundAudioType.AMBIENCE].length === 0
    )
      return

    const ambienceTracks = loadedTracks.current[BackgroundAudioType.AMBIENCE]
    const nextIndex = (currentAmbienceIndex + 1) % ambienceTracks.length

    if (activeTrackType === BackgroundAudioType.AMBIENCE) {
      const gainNode = currentActiveTrack.current?.outputNode
      const currentTime = player?.audioContext.currentTime

      if (gainNode && currentTime) {
        // Fade out current track
        gainNode.gain.cancelScheduledValues(currentTime)
        gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
        gainNode.gain.linearRampToValueAtTime(
          0,
          currentTime + FADE_DURATION / 4
        )

        setTimeout(
          () => {
            if (currentActiveTrack.current) {
              currentActiveTrack.current.stop()
            }

            currentActiveTrack.current = ambienceTracks[nextIndex]

            if (currentActiveTrack.current) {
              // Start and fade in the next track
              currentActiveTrack.current.setVolume(0)
              currentActiveTrack.current.play()

              useSiteAudioStore.setState({
                ostSong: currentActiveTrack.current
              })

              const newGainNode = currentActiveTrack.current.outputNode
              const newCurrentTime = player.audioContext.currentTime

              newGainNode.gain.cancelScheduledValues(newCurrentTime)
              newGainNode.gain.setValueAtTime(0, newCurrentTime)
              newGainNode.gain.linearRampToValueAtTime(
                AMBIENT_VOLUME,
                newCurrentTime + FADE_DURATION / 4
              )

              setupTrackEndDetection(currentActiveTrack.current)
            }

            setCurrentAmbienceIndex(nextIndex)
          },
          (FADE_DURATION / 4) * 1000
        )
      }
    } else {
      setCurrentAmbienceIndex(nextIndex)
    }
  }, [
    player,
    isEnabled,
    currentAmbienceIndex,
    activeTrackType,
    stopAllTracks,
    setCurrentAmbienceIndex
  ])

  // Set up end-of-track detection to automatically advance to next track
  const setupTrackEndDetection = useCallback(
    (track: AudioSource) => {
      if (!player || !track) return

      track.clearOnEnded()

      track.onEnded(() => {
        if (activeTrackType === BackgroundAudioType.AMBIENCE) {
          advanceToNextTrack()
        }
      })
    },
    [player, advanceToNextTrack, activeTrackType]
  )

  // Initialize and load all audio tracks when enabled
  useEffect(() => {
    if (!player || !isEnabled) return

    const loadTracks = async () => {
      try {
        if (!isInitialized) {
          setInitialized(true)

          stopAllTracks()

          // Load all track types (ambience, basketball, konami)
          for (const type of Object.values(BackgroundAudioType)) {
            const tracksOfType = audioTracks[type as keyof typeof audioTracks]
            loadedTracks.current[type] = []

            for (const track of tracksOfType) {
              const audioSource = await player.loadAudioFromURL(
                track.url,
                false,
                type === BackgroundAudioType.KONAMI
              )
              audioSource.loop = true
              audioSource.setVolume(0)
              loadedTracks.current[type].push(audioSource)
            }
          }

          // Start ambient track by default if not on specialized pages
          if (!isBasketballPage && !isInGame) {
            currentActiveTrack.current =
              loadedTracks.current[BackgroundAudioType.AMBIENCE][0]
            if (currentActiveTrack.current) {
              currentActiveTrack.current.setVolume(AMBIENT_VOLUME)
              currentActiveTrack.current.play()

              useSiteAudioStore.setState({
                ostSong: currentActiveTrack.current
              })

              setupTrackEndDetection(currentActiveTrack.current)
            }
          }
        }
      } catch (error) {
        console.error("Error loading audio tracks:", error)
        setInitialized(false)
      }
    }

    loadTracks()

    return () => {
      if (!isEnabled && !fadeOutTimeout.current) {
        cleanup()
      }
    }
  }, [
    player,
    isEnabled,
    cleanup,
    audioTracks,
    setupTrackEndDetection,
    stopAllTracks,
    isBasketballPage,
    isInGame,
    isInitialized,
    setInitialized
  ])

  // Handle scene changes and switch audio tracks accordingly
  useEffect(() => {
    if (!player || !isInitialized) return

    let newActiveType = BackgroundAudioType.AMBIENCE

    // Determine appropriate audio type based on current scene
    if (isInGame) {
      newActiveType = BackgroundAudioType.KONAMI
    } else if (isBasketballPage) {
      newActiveType = BackgroundAudioType.BASKETBALL
    }

    if (newActiveType !== activeTrackType) {
      console.log(`Audio transition: ${activeTrackType} -> ${newActiveType}`)
      setActiveTrackType(newActiveType)

      // Fade out current track
      if (currentActiveTrack.current) {
        const gainNode = currentActiveTrack.current.outputNode
        const currentTime = player.audioContext.currentTime

        gainNode.gain.cancelScheduledValues(currentTime)
        gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
        gainNode.gain.linearRampToValueAtTime(
          0,
          currentTime + FADE_DURATION / 4
        )
      }

      setTimeout(
        () => {
          if (
            activeTrackType !== BackgroundAudioType.AMBIENCE &&
            currentActiveTrack.current
          ) {
            currentActiveTrack.current.stop()
          }

          // Select appropriate track for new scene
          let newTrack: AudioSource | null = null

          switch (newActiveType) {
            case BackgroundAudioType.AMBIENCE:
              newTrack =
                loadedTracks.current[BackgroundAudioType.AMBIENCE][
                  currentAmbienceIndex
                ]
              break
            case BackgroundAudioType.BASKETBALL:
              newTrack = loadedTracks.current[BackgroundAudioType.BASKETBALL][0]
              break
            case BackgroundAudioType.KONAMI:
              newTrack = loadedTracks.current[BackgroundAudioType.KONAMI][0]
              break
          }

          if (newTrack) {
            // Start and fade in new track
            if (!newTrack.isPlaying) {
              newTrack.play()
            }

            const gainNode = newTrack.outputNode
            const currentTime = player.audioContext.currentTime
            const targetVolume =
              audioTracks[newActiveType][
                newActiveType === BackgroundAudioType.AMBIENCE
                  ? currentAmbienceIndex
                  : 0
              ].volume

            gainNode.gain.cancelScheduledValues(currentTime)
            gainNode.gain.setValueAtTime(0, currentTime)
            gainNode.gain.linearRampToValueAtTime(
              targetVolume,
              currentTime + FADE_DURATION / 4
            )

            currentActiveTrack.current = newTrack

            useSiteAudioStore.setState({
              ostSong: newTrack
            })

            if (newActiveType === BackgroundAudioType.AMBIENCE) {
              setupTrackEndDetection(newTrack)
            }
          }
        },
        (FADE_DURATION / 4) * 1000
      )
    }
  }, [
    player,
    isBasketballPage,
    isInGame,
    activeTrackType,
    currentAmbienceIndex,
    audioTracks,
    setupTrackEndDetection,
    isInitialized,
    setActiveTrackType
  ])

  // Expose track advancement function to window for external control
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

  // Return current track info and controls
  return {
    currentTrack:
      activeTrackType === BackgroundAudioType.AMBIENCE
        ? audioTracks.ambience[currentAmbienceIndex].name
        : activeTrackType === BackgroundAudioType.BASKETBALL
          ? audioTracks.basketball[0].name
          : audioTracks.konami[0].name,
    activeTrackType,
    advanceToNextTrack
  }
}

/**
 * Utility hook to get the name of the currently playing track
 */
export function useCurrentTrackName(): string | null {
  const { currentTrack } = useBackgroundMusic(true)
  return currentTrack || null
}
