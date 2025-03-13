import { useCallback, useEffect, useRef, useState } from "react"

import { AudioSource } from "@/lib/audio"
import { useAudioUrls } from "@/lib/audio/audio-urls"
import { FADE_DURATION } from "@/lib/audio/constants"
import { useArcadeStore } from "@/store/arcade-store"

import { useSiteAudioStore } from "./use-site-audio"

export function useKonamiSong() {
  const isInGame = useArcadeStore((s) => s.isInGame)
  const player = useSiteAudioStore((s) => s.player)
  const themeSong = useSiteAudioStore((s) => s.themeSong)
  const ostSong = useSiteAudioStore((s) => s.ostSong)
  const { ARCADE_AUDIO_SFX } = useAudioUrls()
  const [miamiHeatwaveSong, setMiamiHeatwaveSong] =
    useState<AudioSource | null>(null)
  const fadeOutTimeout = useRef<NodeJS.Timeout | null>(null)
  const isInitialized = useRef(false)

  const cleanup = useCallback(() => {
    if (fadeOutTimeout.current) {
      clearTimeout(fadeOutTimeout.current)
      fadeOutTimeout.current = null
    }
    if (miamiHeatwaveSong) {
      miamiHeatwaveSong.stop()
      setMiamiHeatwaveSong(null)
    }
    isInitialized.current = false
  }, [miamiHeatwaveSong])

  useEffect(() => {
    if (!player) return

    const loadMiamiHeatwave = async () => {
      try {
        if (isInGame && !miamiHeatwaveSong && !isInitialized.current) {
          isInitialized.current = true

          player.stopAllMusicTracks()

          if (themeSong && themeSong.isPlaying) {
            themeSong.pause()
          }

          if (ostSong && ostSong.isPlaying) {
            ostSong.stop()
            useSiteAudioStore.setState({ ostSong: null })
          }

          const newMiamiHeatwaveSong = await player.loadAudioFromURL(
            ARCADE_AUDIO_SFX.MIAMI_HEATWAVE,
            false, // not SFX
            true // is game audio
          )
          newMiamiHeatwaveSong.loop = true
          newMiamiHeatwaveSong.setVolume(0)
          newMiamiHeatwaveSong.play()
          setMiamiHeatwaveSong(newMiamiHeatwaveSong)
        }
      } catch (error) {
        console.error("Error loading Miami Heatwave:", error)
        isInitialized.current = false
      }
    }

    loadMiamiHeatwave()

    return () => {
      if (!isInGame && !fadeOutTimeout.current) {
        cleanup()
      }
    }
  }, [
    player,
    isInGame,
    miamiHeatwaveSong,
    themeSong,
    ostSong,
    cleanup,
    ARCADE_AUDIO_SFX
  ])

  useEffect(() => {
    if (!miamiHeatwaveSong || !player) return

    const gainNode = miamiHeatwaveSong.outputNode
    const currentTime = player.audioContext.currentTime
    const ARCADE_VOLUME = 0.4

    if (isInGame) {
      gainNode.gain.cancelScheduledValues(currentTime)
      gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
      gainNode.gain.linearRampToValueAtTime(
        ARCADE_VOLUME,
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

      fadeOutTimeout.current = setTimeout(
        () => {
          cleanup()

          if (themeSong && !themeSong.isPlaying) {
            themeSong.play()
          }

          if (ostSong && !ostSong.isPlaying) {
            ostSong.play()
          }
        },
        (FADE_DURATION * 1000) / 2
      )
    }

    return () => {
      if (fadeOutTimeout.current) {
        clearTimeout(fadeOutTimeout.current)
        fadeOutTimeout.current = null
      }
    }
  }, [isInGame, miamiHeatwaveSong, player, themeSong, ostSong, cleanup])
}
