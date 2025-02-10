import { useCallback, useEffect, useRef } from "react"

import { useAudioUrls } from "@/lib/audio/audio-urls"
import { FADE_DURATION, THEME_SONG_VOLUME } from "@/lib/audio/constants"

import { useCurrentScene } from "./use-current-scene"
import { useSiteAudioStore } from "./use-site-audio"

export function useBasketballThemeSong(isEnabled: boolean = true) {
  const scene = useCurrentScene()
  const player = useSiteAudioStore((s) => s.player)
  const themeSong = useSiteAudioStore((s) => s.themeSong)
  const { GAME_THEME_SONGS } = useAudioUrls()
  const isBasketballPage = scene === "basketball"
  const fadeOutTimeout = useRef<NodeJS.Timeout | null>(null)

  const cleanup = useCallback(() => {
    if (fadeOutTimeout.current) {
      clearTimeout(fadeOutTimeout.current)
      fadeOutTimeout.current = null
    }
    if (themeSong) {
      themeSong.stop()
      useSiteAudioStore.setState({ themeSong: null })
    }
  }, [themeSong])

  useEffect(() => {
    if (!player || !isEnabled) return

    const loadAudioSource = async () => {
      try {
        if (!themeSong && isBasketballPage) {
          const newThemeSong = await player.loadAudioFromURL(
            GAME_THEME_SONGS.BASKETBALL_AMBIENT
          )
          newThemeSong.loop = true
          newThemeSong.setVolume(0)
          newThemeSong.play()

          useSiteAudioStore.setState({
            themeSong: newThemeSong
          })
        }
      } catch (error) {
        console.error("Error loading basketball theme song:", error)
      }
    }

    loadAudioSource()

    return () => {
      if (!isBasketballPage) {
        cleanup()
      }
    }
  }, [
    player,
    themeSong,
    isEnabled,
    isBasketballPage,
    cleanup,
    GAME_THEME_SONGS
  ])

  useEffect(() => {
    if (!themeSong || !player || !isEnabled) return

    const gainNode = themeSong.outputNode
    const currentTime = player.audioContext.currentTime

    if (isBasketballPage) {
      gainNode.gain.cancelScheduledValues(currentTime)
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
      gainNode.gain.linearRampToValueAtTime(
        THEME_SONG_VOLUME,
        currentTime + FADE_DURATION
      )
    } else {
      gainNode.gain.cancelScheduledValues(currentTime)
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
      gainNode.gain.linearRampToValueAtTime(0, currentTime + FADE_DURATION)

      fadeOutTimeout.current = setTimeout(() => {
        cleanup()
      }, FADE_DURATION * 1000)
    }

    return () => {
      if (!isBasketballPage) cleanup()
    }
  }, [isBasketballPage, themeSong, player, isEnabled, cleanup])
}
