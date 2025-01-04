"use client"

import { useCallback, useEffect, useState } from "react"
import { create } from "zustand"

import { AudioSource, WebAudioPlayer } from "@/lib/audio"
import {
  GAME_AUDIO_SFX,
  SFX_VOLUME,
  THEME_SONG_ASSET,
  THEME_SONG_VOLUME
} from "@/lib/audio/constants"

export type GameAudioSFXKey = keyof typeof GAME_AUDIO_SFX

interface GameAudioStore {
  player: WebAudioPlayer | null
  audioSfxSources: Record<GameAudioSFXKey, AudioSource> | null
  themeSong: AudioSource | null
  ostSong: AudioSource | null
}

interface GameAudioHook {
  player: WebAudioPlayer | null
  togglePlayMaster: () => void
  resumeMaster: () => void
  pauseMaster: () => void
  setVolumeMaster: (volume: number) => void
  volumeMaster: number
  playSoundFX: (sfx: GameAudioSFXKey, volume?: number) => void
  getSoundFXSource: (key: GameAudioSFXKey) => AudioSource | null
}

const useGameAudioStore = create<GameAudioStore>(() => ({
  player: null,
  audioSfxSources: null,
  themeSong: null,
  ostSong: null
}))

export { useGameAudioStore }

export function useInitializeAudioContext(element?: HTMLElement) {
  const player = useGameAudioStore((s) => s.player)

  useEffect(() => {
    const targetElement = element || document
    const unlock = () => {
      if (!player) {
        useGameAudioStore.setState({ player: new WebAudioPlayer() })
        console.log("=== 🔊 Audio Player Context is running ===")
      } else {
        targetElement.removeEventListener("click", unlock)
      }
    }
    targetElement.addEventListener("click", unlock)

    return () => {
      targetElement.removeEventListener("click", unlock)
    }
  }, [element, player])
}

export function GameSoundFXsLoader(): null {
  const player = useGameAudioStore((s) => s.player)

  useEffect(() => {
    if (!player) return

    const loadAudioSources = async () => {
      const newSources = {} as Record<GameAudioSFXKey, AudioSource>

      try {
        await Promise.all(
          Object.keys(GAME_AUDIO_SFX).map(async (key) => {
            const audioKey = key as GameAudioSFXKey
            const source = await player.loadAudioFromURL(
              GAME_AUDIO_SFX[audioKey as keyof typeof GAME_AUDIO_SFX]
            )
            source.setVolume(SFX_VOLUME)
            newSources[audioKey] = source
          })
        )

        useGameAudioStore.setState({
          audioSfxSources: newSources
        })
      } catch (error) {
        console.error("Error loading audio sources:", error)
      }
    }

    loadAudioSources()
  }, [player])

  return null
}

export function useGameThemeSong() {
  const player = useGameAudioStore((s) => s.player)

  useEffect(() => {
    if (!player) return

    const loadAudioSource = async () => {
      try {
        const themeSong = await Promise.resolve(
          player.loadAudioFromURL(THEME_SONG_ASSET)
        )

        themeSong.loop = true
        themeSong.setVolume(THEME_SONG_VOLUME)
        themeSong.play()

        useGameAudioStore.setState({
          themeSong
        })
      } catch (error) {
        console.error("Error loading audio sources:", error)
      }
    }

    loadAudioSource()
  }, [player])
}

export function useGameAudio(): GameAudioHook {
  //   const isDebug = useGame((s) => s.isDebug)
  const player = useGameAudioStore((s) => s.player)
  const audioSfxSources = useGameAudioStore((s) => s.audioSfxSources)
  const [volumeMaster, _setVolumeMaster] = useState(player ? player.volume : 1)

  //   useEffect(() => {
  //     if (!isDebug) return

  //     if (player) {
  //       console.log("=== 🔊 Audio Player Context is running ===")
  //     }
  //   }, [isDebug, player])

  const togglePlayMaster = useCallback(() => {
    if (!player) return
    player.isPlaying ? player.pause() : player.resume()
  }, [player])

  const setVolumeMaster = useCallback(
    (volume: number) => {
      if (!player) return
      player.setVolume(volume)
      _setVolumeMaster(volume)
    },
    [player]
  )

  const playSoundFX = useCallback(
    (sfx: GameAudioSFXKey, volume = SFX_VOLUME) => {
      if (!audioSfxSources) return

      audioSfxSources[sfx].stop()
      audioSfxSources[sfx].setVolume(volume)
      audioSfxSources[sfx].play()
    },
    [audioSfxSources]
  )

  const getSoundFXSource = useCallback(
    (key: GameAudioSFXKey): AudioSource | null =>
      audioSfxSources?.[key] ?? null,
    [audioSfxSources]
  )

  return {
    player,
    togglePlayMaster,
    resumeMaster: () => player?.resume(),
    pauseMaster: () => player?.pause(),
    setVolumeMaster,
    volumeMaster,
    playSoundFX,
    getSoundFXSource
  }
}
