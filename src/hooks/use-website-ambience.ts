import { useCallback, useEffect, useRef } from "react"

import { useAudioUrls } from "@/lib/audio/audio-urls"
import { AMBIENT_VOLUME, FADE_DURATION } from "@/lib/audio/constants"

import { useCurrentScene } from "./use-current-scene"
import { useSiteAudioStore } from "./use-site-audio"

export function useWebsiteAmbience(isEnabled: boolean = false) {
  const scene = useCurrentScene()
  const player = useSiteAudioStore((s) => s.player)
  const ostSong = useSiteAudioStore((s) => s.ostSong)
  const { AMBIENCE } = useAudioUrls()
  const fadeOutTimeout = useRef<NodeJS.Timeout | null>(null)
  const isInitialized = useRef(false)
  const isBasketballPage = scene === "basketball"

  const cleanup = useCallback(() => {
    if (fadeOutTimeout.current) {
      clearTimeout(fadeOutTimeout.current)
      fadeOutTimeout.current = null
    }
    if (ostSong) {
      ostSong.stop()
      useSiteAudioStore.setState({ ostSong: null })
    }
    isInitialized.current = false
  }, [ostSong])

  useEffect(() => {
    if (!player || !isEnabled) return

    const loadAudioSource = async () => {
      try {
        if (!ostSong && !isInitialized.current) {
          isInitialized.current = true
          const newOstSong = await player.loadAudioFromURL(
            AMBIENCE.AMBIENCE_DEFAULT,
            false
          )
          newOstSong.loop = true
          newOstSong.setVolume(0)
          newOstSong.play()

          useSiteAudioStore.setState({
            ostSong: newOstSong
          })
        }
      } catch (error) {
        console.error("Error loading website ambience:", error)
        isInitialized.current = false
      }
    }

    loadAudioSource()

    return () => {
      if (!isEnabled && !fadeOutTimeout.current) {
        cleanup()
      }
    }
  }, [player, ostSong, isEnabled, cleanup, AMBIENCE])

  useEffect(() => {
    if (!ostSong || !player || !isEnabled) return

    const gainNode = ostSong.outputNode
    const currentTime = player.audioContext.currentTime

    if (isEnabled && !isBasketballPage) {
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
        if (!isEnabled || isBasketballPage) {
          cleanup()
        }
      }, FADE_DURATION * 1000)
    }

    return () => {
      if (fadeOutTimeout.current) {
        clearTimeout(fadeOutTimeout.current)
        fadeOutTimeout.current = null
      }
    }
  }, [isEnabled, isBasketballPage, ostSong, player, cleanup])
}
