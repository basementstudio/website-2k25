import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { AudioSource } from "@/lib/audio"
import { useAudioUrls } from "@/lib/audio/audio-urls"
import { AMBIENT_VOLUME, FADE_DURATION } from "@/lib/audio/constants"
import { useArcadeStore } from "@/store/arcade-store"

import { useCurrentScene } from "../use-current-scene"
import { useSiteAudioStore } from "./use-site-audio"

const CROSSFADE_DURATION = 4

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
  const nextTrack = useRef<AudioSource | null>(null)
  const crossfadeTimeout = useRef<NodeJS.Timeout | null>(null)

  const ambiencePlaylist = useMemo(() => {
    return [
      {
        name: "tiger",
        url: AMBIENCE.AMBIENCE_TIGER
      },
      {
        name: "aqua",
        url: AMBIENCE.AMBIENCE_AQUA
      },
      {
        name: "rain",
        url: AMBIENCE.AMBIENCE_RAIN
      },
      {
        name: "vhs",
        url: AMBIENCE.AMBIENCE_VHS
      }
    ]
  }, [AMBIENCE])

  const cleanup = useCallback(() => {
    if (fadeOutTimeout.current) {
      clearTimeout(fadeOutTimeout.current)
      fadeOutTimeout.current = null
    }

    if (crossfadeTimeout.current) {
      clearTimeout(crossfadeTimeout.current)
      crossfadeTimeout.current = null
    }

    if (loadedTracks.current.length > 0) {
      loadedTracks.current.forEach((track) => {
        track.clearOnEnded()
        if (track.isPlaying) {
          track.stop()
        }
      })
      loadedTracks.current = []
    }

    if (ostSong) {
      ostSong.stop()
      useSiteAudioStore.setState({ ostSong: null })
    }

    currentTrack.current = null
    nextTrack.current = null
    isInitialized.current = false
  }, [ostSong])

  const advanceToNextTrack = useCallback(() => {
    if (!player || !isEnabled || loadedTracks.current.length === 0) return

    const nextIndex = (currentTrackIndex + 1) % ambiencePlaylist.length

    if (currentTrack.current && nextTrack.current) {
      const currentTime = player.audioContext.currentTime

      // console.log(`Now playing: "${ambiencePlaylist[nextIndex].name}"`)
      // const upcomingIndex = (nextIndex + 1) % ambiencePlaylist.length
      // console.log(`Next up: "${ambiencePlaylist[upcomingIndex].name}"`)

      currentTrack.current.outputNode.gain.cancelScheduledValues(currentTime)
      currentTrack.current.outputNode.gain.setValueAtTime(
        currentTrack.current.outputNode.gain.value,
        currentTime
      )
      currentTrack.current.outputNode.gain.linearRampToValueAtTime(
        0,
        currentTime + CROSSFADE_DURATION
      )

      nextTrack.current.setVolume(0)
      nextTrack.current.play()
      nextTrack.current.outputNode.gain.cancelScheduledValues(currentTime)
      nextTrack.current.outputNode.gain.setValueAtTime(0, currentTime)
      nextTrack.current.outputNode.gain.linearRampToValueAtTime(
        AMBIENT_VOLUME,
        currentTime + CROSSFADE_DURATION
      )

      if (crossfadeTimeout.current) {
        clearTimeout(crossfadeTimeout.current)
      }

      crossfadeTimeout.current = setTimeout(() => {
        if (currentTrack.current && currentTrack.current.isPlaying) {
          currentTrack.current.clearOnEnded()
          currentTrack.current.stop()
        }

        currentTrack.current = nextTrack.current

        if (currentTrack.current) {
          setupTrackEndDetection(currentTrack.current)
        }

        const upcomingIndex = (nextIndex + 1) % ambiencePlaylist.length
        nextTrack.current = loadedTracks.current[upcomingIndex]

        crossfadeTimeout.current = null
      }, CROSSFADE_DURATION * 1000)

      setCurrentTrackIndex(nextIndex)
    }
  }, [currentTrackIndex, ambiencePlaylist.length, player, isEnabled])

  const setupTrackEndDetection = useCallback(
    (track: AudioSource) => {
      if (!player || !track) return

      const duration = track.getDuration()
      const timeUntilCrossfade =
        Math.max(0, duration - CROSSFADE_DURATION) * 1000

      if (crossfadeTimeout.current) {
        clearTimeout(crossfadeTimeout.current)
      }

      track.onEnded(() => {
        advanceToNextTrack()
      })

      if (timeUntilCrossfade > 0) {
        crossfadeTimeout.current = setTimeout(() => {
          advanceToNextTrack()
        }, timeUntilCrossfade)
      }
    },
    [player, advanceToNextTrack]
  )

  useEffect(() => {
    if (!player || !isEnabled) return

    const loadPlaylist = async () => {
      try {
        if (!isInitialized.current) {
          isInitialized.current = true

          const tracks: AudioSource[] = []

          for (const track of ambiencePlaylist) {
            const audioSource = await player.loadAudioFromURL(track.url, false)
            audioSource.loop = false
            audioSource.setVolume(0)
            tracks.push(audioSource)
          }

          loadedTracks.current = tracks

          if (tracks.length > 0) {
            currentTrack.current = tracks[0]
            currentTrack.current.setVolume(AMBIENT_VOLUME)
            currentTrack.current.play()

            // console.log(`Now playing: "${ambiencePlaylist[0].name}"`)
            // console.log(
            //   `Next up: "${ambiencePlaylist[1 % ambiencePlaylist.length].name}"`
            // )

            nextTrack.current = tracks[1 % tracks.length]

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
    setupTrackEndDetection
  ])

  useEffect(() => {
    if (!player) return

    if (isBasketballPage || isInGame) {
      if (currentTrack.current && currentTrack.current.isPlaying) {
        const gainNode = currentTrack.current.outputNode
        const currentTime = player.audioContext.currentTime

        gainNode.gain.cancelScheduledValues(currentTime)
        gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
        gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.5)

        if (fadeOutTimeout.current) {
          clearTimeout(fadeOutTimeout.current)
        }

        fadeOutTimeout.current = setTimeout(() => {
          cleanup()
          fadeOutTimeout.current = null
        }, 600)
      } else {
        cleanup()
      }

      return () => {
        if (fadeOutTimeout.current) {
          clearTimeout(fadeOutTimeout.current)
          fadeOutTimeout.current = null
        }
      }
    }

    if (!currentTrack.current || !isEnabled) return

    const gainNode = currentTrack.current.outputNode
    const currentTime = player.audioContext.currentTime

    if (isEnabled) {
      gainNode.gain.cancelScheduledValues(currentTime)
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
      gainNode.gain.linearRampToValueAtTime(
        AMBIENT_VOLUME,
        currentTime + FADE_DURATION
      )

      if (fadeOutTimeout.current) {
        clearTimeout(fadeOutTimeout.current)
        fadeOutTimeout.current = null
      }
    } else {
      gainNode.gain.cancelScheduledValues(currentTime)
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
      gainNode.gain.linearRampToValueAtTime(0, currentTime + FADE_DURATION)

      if (fadeOutTimeout.current) {
        clearTimeout(fadeOutTimeout.current)
      }

      fadeOutTimeout.current = setTimeout(() => {
        cleanup()
      }, FADE_DURATION * 1000)
    }

    return () => {
      if (fadeOutTimeout.current) {
        clearTimeout(fadeOutTimeout.current)
        fadeOutTimeout.current = null
      }
    }
  }, [isEnabled, isBasketballPage, isInGame, player, cleanup])
}
