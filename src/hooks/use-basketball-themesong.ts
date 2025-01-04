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
    console.log("🎵 Cleanup called, current pathname:", pathname)
    if (fadeOutTimeout.current) {
      console.log("🎵 Clearing fade timeout")
      clearTimeout(fadeOutTimeout.current)
      fadeOutTimeout.current = null
    }
    if (themeSong) {
      console.log("🎵 Stopping theme song")
      themeSong.stop()
      useGameAudioStore.setState({ themeSong: null })
    }
  }, [themeSong, pathname])

  useEffect(() => {
    if (!player || !isEnabled) return
    console.log("🎵 Audio load effect - isBasketballPage:", isBasketballPage)

    const loadAudioSource = async () => {
      try {
        if (!themeSong && isBasketballPage) {
          console.log("🎵 Loading new theme song")
          const newThemeSong = await player.loadAudioFromURL(THEME_SONG_ASSET)
          newThemeSong.loop = true
          newThemeSong.setVolume(0)
          newThemeSong.play()

          useGameAudioStore.setState({
            themeSong: newThemeSong
          })
          console.log("🎵 Theme song loaded and started playing")
        }
      } catch (error) {
        console.error("Error loading basketball theme song:", error)
      }
    }

    loadAudioSource()

    return () => {
      if (!isBasketballPage) {
        console.log("🎵 Cleanup on unmount - not basketball page")
        cleanup()
      }
    }
  }, [player, themeSong, isEnabled, isBasketballPage, cleanup])

  useEffect(() => {
    if (!themeSong || !player || !isEnabled) return
    console.log("🎵 Volume effect - isBasketballPage:", isBasketballPage)

    const gainNode = themeSong.outputNode
    const currentTime = player.audioContext.currentTime

    if (isBasketballPage) {
      console.log("🎵 Fading in theme song")
      gainNode.gain.cancelScheduledValues(currentTime)
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
      gainNode.gain.linearRampToValueAtTime(
        THEME_SONG_VOLUME,
        currentTime + FADE_DURATION
      )
    } else {
      console.log("🎵 Fading out theme song")
      gainNode.gain.cancelScheduledValues(currentTime)
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
      gainNode.gain.linearRampToValueAtTime(0, currentTime + FADE_DURATION)

      fadeOutTimeout.current = setTimeout(() => {
        console.log("🎵 Fade out complete, cleaning up")
        cleanup()
      }, FADE_DURATION * 1000)
    }

    return () => {
      if (!isBasketballPage) {
        console.log("🎵 Volume effect cleanup - not basketball page")
        cleanup()
      }
    }
  }, [isBasketballPage, themeSong, player, isEnabled, cleanup])
}
