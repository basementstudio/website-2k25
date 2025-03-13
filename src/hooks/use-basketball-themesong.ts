import { useCallback, useEffect, useRef, useState } from "react"

import { AudioSource } from "@/lib/audio"
import { useAudioUrls } from "@/lib/audio/audio-urls"
import { FADE_DURATION, THEME_SONG_VOLUME } from "@/lib/audio/constants"

import { useCurrentScene } from "./use-current-scene"
import { useSiteAudioStore } from "./use-site-audio"

export function useBasketballThemeSong(isEnabled: boolean = true) {
  const scene = useCurrentScene()
  const player = useSiteAudioStore((s) => s.player)
  const { GAME_THEME_SONGS } = useAudioUrls()
  const isBasketballPage = scene === "basketball"
  const fadeOutTimeout = useRef<NodeJS.Timeout | null>(null)
  const isInitialized = useRef(false)
  const [basketballTheme, setBasketballTheme] = useState<AudioSource | null>(
    null
  )

  const cleanup = useCallback(() => {
    if (fadeOutTimeout.current) {
      clearTimeout(fadeOutTimeout.current)
      fadeOutTimeout.current = null
    }
    if (basketballTheme) {
      basketballTheme.stop()
      setBasketballTheme(null)
    }
    isInitialized.current = false
  }, [basketballTheme])

  useEffect(() => {
    if (!player || !isEnabled) return

    const loadAudioSource = async () => {
      try {
        if (isBasketballPage && !basketballTheme && !isInitialized.current) {
          isInitialized.current = true

          player.stopAllMusicTracks()

          const newBasketballTheme = await player.loadAudioFromURL(
            GAME_THEME_SONGS.BASKETBALL_AMBIENT,
            false, // not SFX
            true // game audio
          )
          newBasketballTheme.loop = true
          newBasketballTheme.setVolume(0)
          newBasketballTheme.play()

          setBasketballTheme(newBasketballTheme)
        }
      } catch (error) {
        console.error("Error loading basketball theme song:", error)
        isInitialized.current = false
      }
    }

    loadAudioSource()

    return () => {
      if (!isBasketballPage && !fadeOutTimeout.current) {
        cleanup()
      }
    }
  }, [
    player,
    basketballTheme,
    isEnabled,
    isBasketballPage,
    cleanup,
    GAME_THEME_SONGS
  ])

  useEffect(() => {
    if (!basketballTheme || !player || !isEnabled) return

    const gainNode = basketballTheme.outputNode
    const currentTime = player.audioContext.currentTime

    if (isBasketballPage) {
      gainNode.gain.cancelScheduledValues(currentTime)
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
      gainNode.gain.linearRampToValueAtTime(
        THEME_SONG_VOLUME,
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
  }, [isBasketballPage, basketballTheme, player, isEnabled, cleanup])
}
