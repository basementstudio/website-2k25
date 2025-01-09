import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"

import { THEME_SONG_ASSET, THEME_SONG_VOLUME } from "@/lib/audio/constants"

import { useGameAudioStore } from "./use-game-audio"

const FADE_DURATION = 2.5 // secs

export function useBasketballThemeSong(isEnabled: boolean = true) {
  const pathname = usePathname()
  const player = useGameAudioStore((s) => s.player)
  const themeSong = useGameAudioStore((s) => s.themeSong)
  const isBasketballPage = pathname === "/basketball"
  const fadeOutTimeout = useRef<NodeJS.Timeout | null>(null)

  const cleanup = useCallback(() => {
    if (fadeOutTimeout.current) {
      clearTimeout(fadeOutTimeout.current)
      fadeOutTimeout.current = null
    }
    if (themeSong) {

      themeSong.stop()
      useGameAudioStore.setState({ themeSong: null })
    }
  }, [themeSong])

  useEffect(() => {
    if (!player || !isEnabled) return

    const loadAudioSource = async () => {
      try {
        if (!themeSong && isBasketballPage) {
          const newThemeSong = await player.loadAudioFromURL(THEME_SONG_ASSET)
          newThemeSong.loop = true
          newThemeSong.setVolume(0)
          newThemeSong.play()

          useGameAudioStore.setState({
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
  }, [player, themeSong, isEnabled, isBasketballPage, cleanup])

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
      if (!isBasketballPage) {
        cleanup()
      }
    }
  }, [isBasketballPage, themeSong, player, isEnabled, cleanup])
}
